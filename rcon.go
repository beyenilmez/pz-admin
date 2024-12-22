package main

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/gorcon/rcon"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

var (
	conn         *rcon.Conn
	connMutex    sync.Mutex
	isWatching   bool
	stopWatching chan struct{}
)

type Credentials struct {
	IP       string `json:"ip"`
	Port     string `json:"port"`
	Password string `json:"password"` // Encrypted
}

type Player struct {
	Name        string `json:"name"`
	Online      bool   `json:"online"`
	AccessLevel string `json:"accessLevel"`
	Banned      bool   `json:"banned"`
	Godmode     bool   `json:"godmode"`
}

type Coordinates struct {
	X int `json:"x"`
	Y int `json:"y"`
	Z int `json:"z"`
}

var connectionCredentials Credentials
var players []Player

func (app *App) ConnectRcon(credentials Credentials) bool {
	if credentials.IP == "" || credentials.Port == "" || credentials.Password == "" {
		return false
	}
	if conn != nil {
		app.DisconnectRcon()
	}

	connMutex.Lock()
	defer connMutex.Unlock()

	var err error
	conn, err = rcon.Dial(credentials.IP+":"+credentials.Port, credentials.Password)
	if err != nil {
		runtime.LogError(app.ctx, "Error connecting to RCON: "+err.Error())
		app.SendNotification(Notification{
			Title:   "RCON connection failed",
			Message: err.Error(),
			Variant: "error",
		})
		return false
	}

	// Start the connection watcher
	if !isWatching {
		stopWatching = make(chan struct{}) // Create a new channel
		isWatching = true
		go app.watchConnection()
	}

	connectionCredentials = credentials
	err = players_init()
	if err != nil {
		runtime.LogError(app.ctx, "Error initializing players: "+err.Error())
	}
	err = players_update()
	if err != nil {
		runtime.LogError(app.ctx, "Error updating players: "+err.Error())
	}

	app.SendNotification(Notification{
		Title:   "RCON connection established",
		Variant: "success",
	})
	return true
}

func (app *App) IsRconConnected() bool {
	connMutex.Lock()
	defer connMutex.Unlock()

	return conn != nil
}

func (app *App) DisconnectRcon() bool {
	connMutex.Lock()
	defer connMutex.Unlock()

	if conn == nil {
		return false
	}

	// Stop the watcher
	if isWatching {
		close(stopWatching) // Signal the watcher to stop
		isWatching = false
	}

	err := conn.Close()
	conn = nil
	return err == nil
}

func (app *App) SendRconCommand(command string) string {
	connMutex.Lock()
	defer connMutex.Unlock()

	if conn == nil {
		runtime.LogError(app.ctx, "RCON is not connected")
		return ""
	}

	res, err := conn.Execute(command)
	if err != nil {
		runtime.LogError(app.ctx, "Error executing RCON command: "+err.Error())
		return ""
	}
	if strings.Contains(command, "banuser ") && strings.Contains(res, "is now banned") {
		for i := range players {
			if players[i].Name == strings.Split(command, " ")[1] {
				players[i].Banned = true
				runtime.EventsEmit(app.ctx, "update-players", players)
				break
			}
		}
	} else if strings.Contains(command, "unbanuser ") && strings.Contains(res, "is now un-banned") {
		for i := range players {
			if players[i].Name == strings.Split(command, " ")[1] {
				players[i].Banned = false
				runtime.EventsEmit(app.ctx, "update-players", players)
				break
			}
		}
	} else if strings.Contains(command, "kick ") && strings.Contains(res, " kicked.") {
		runtime.EventsEmit(app.ctx, "update-players", players)
	} else if strings.Contains(command, "godmode ") || strings.Contains(command, "godmod ") {
		if strings.Contains(res, " is now invincible.") {
			for i := range players {
				if players[i].Name == strings.Split(command, " ")[1] {
					players[i].Godmode = true
					runtime.EventsEmit(app.ctx, "update-players", players)
					break
				}
			}
		} else if strings.Contains(res, " is no more invincible.") {
			for i := range players {
				if players[i].Name == strings.Split(command, " ")[1] {
					players[i].Godmode = false
					runtime.EventsEmit(app.ctx, "update-players", players)
					break
				}
			}
		}
	} else if strings.Contains(command, "setaccesslevel ") {
		if strings.Contains(res, " no longer has access level") {
			for i := range players {
				if players[i].Name == strings.Split(command, " ")[1] {
					players[i].AccessLevel = "player"
					runtime.EventsEmit(app.ctx, "update-players", players)
					break
				}
			}
		} else if strings.Contains(res, " is now ") {
			// Split and get last word
			accessLevel := strings.Split(res, " ")[len(strings.Split(res, " "))-1]
			if accessLevel == "observer" || accessLevel == "gm" || accessLevel == "overseer" || accessLevel == "moderator" || accessLevel == "admin" {
				for i := range players {
					if players[i].Name == strings.Split(command, " ")[1] {
						players[i].AccessLevel = accessLevel
						runtime.EventsEmit(app.ctx, "update-players", players)
						break
					}
				}
			}
		}
	} else if strings.Contains(command, "grantadmin ") && strings.Contains(res, " is now admin") {
		for i := range players {
			if players[i].Name == strings.Split(command, " ")[1] {
				players[i].AccessLevel = "admin"
				runtime.EventsEmit(app.ctx, "update-players", players)
				break
			}
		}
	} else if strings.Contains(command, "removeadmin ") && strings.Contains(res, " no longer has access level") {
		for i := range players {
			if players[i].Name == strings.Split(command, " ")[1] {
				players[i].AccessLevel = "player"
				runtime.EventsEmit(app.ctx, "update-players", players)
				break
			}
		}
	}

	return res
}

// watchConnection monitors the RCON connection and logs if it is lost
func (app *App) watchConnection() {
	for {
		select {
		case <-stopWatching:
			// Stop signal received, exit the goroutine
			runtime.LogInfo(app.ctx, "Stopping RCON connection watcher")
			err := players_save()
			if err != nil {
				runtime.LogError(app.ctx, "Error saving players: "+err.Error())
			}
			return
		case <-time.After(time.Duration(*config.RconCheckInterval) * time.Second):
			connMutex.Lock()
			if conn == nil {
				connMutex.Unlock()
				runtime.LogInfo(app.ctx, "RCON connection lost")
				runtime.EventsEmit(app.ctx, "rconDisconnected", players)
				isWatching = false
				return
			}

			// Check if the connection is still valid by sending a ping command
			err := players_update()
			if err != nil {
				runtime.LogError(app.ctx, "Error updating players: "+err.Error())
				runtime.LogError(app.ctx, "RCON connection lost: "+err.Error())
				runtime.EventsEmit(app.ctx, "rconDisconnected", players)
				conn.Close()
				conn = nil
				connMutex.Unlock()
				isWatching = false
				return
			}
			connMutex.Unlock()
		}
	}
}

func (app *App) SaveCredentials(credentials Credentials) bool {
	var err error
	credentials.Password, err = Encrypt(credentials.Password, "6f6c11c2-1dc8-417d-a68e-0e487629")
	if err != nil {
		app.SendNotification(Notification{
			Title:   "Error encrypting credentials",
			Message: err.Error(),
			Variant: "error",
		})
		runtime.LogError(app.ctx, "Error encrypting credentials: "+err.Error())
		return false
	}

	err = writeJSON(credentialsPath, credentials)
	if err != nil {
		app.SendNotification(Notification{
			Title:   "Error saving credentials",
			Message: err.Error(),
			Variant: "error",
		})
		runtime.LogError(app.ctx, "Error saving credentials: "+err.Error())
		return false
	}

	return true
}

func (app *App) LoadCredentials() Credentials {
	var credentials Credentials
	err := readJSON(credentialsPath, &credentials)
	if err != nil {
		runtime.LogError(app.ctx, "Error loading credentials: "+err.Error())
		return Credentials{}
	}

	credentials.Password, err = Decrypt(credentials.Password, "6f6c11c2-1dc8-417d-a68e-0e487629")
	if err != nil {
		app.SendNotification(Notification{
			Title:   "Error decrypting credentials",
			Message: err.Error(),
			Variant: "error",
		})
		runtime.LogError(app.ctx, "Error decrypting credentials: "+err.Error())
		return Credentials{}
	}

	return credentials
}

func (app *App) DeleteCredentials() bool {
	err := os.Remove(credentialsPath)
	if err != nil {
		runtime.LogError(app.ctx, "Error deleting credentials: "+err.Error())
		return false
	}

	return true
}

func (app *App) GetPlayers() []Player {
	return players
}

func players_init() error {
	players = []Player{}

	playersFilePath := filepath.Join(appFolder, connectionCredentials.IP+"-"+connectionCredentials.Port, "players.json")
	if !file_exists(playersFilePath) {
		err := create_folder(filepath.Join(appFolder, connectionCredentials.IP+"-"+connectionCredentials.Port))
		if err != nil {
			return errors.New("Error creating server folder: " + err.Error())
		}

		// If not, create it
		var newPlayers []string
		err = writeJSON(playersFilePath, newPlayers)
		if err != nil {
			runtime.LogError(app.ctx, "Error creating players file: "+err.Error())
		}
	} else {
		err := readJSON(playersFilePath, &players)
		runtime.LogDebugf(app.ctx, "Players readed: %v", players)
		runtime.EventsEmit(app.ctx, "update-players", players)
		if err != nil {
			return errors.New("Error reading players file: " + err.Error())
		}
	}

	return nil
}

func players_update() error {
	res, err := conn.Execute("players")
	if err != nil {
		return errors.New("Error getting players: " + err.Error())
	}

	oldPlayers := make([]Player, len(players))
	copy(oldPlayers, players)

	lines := strings.Split(res, "\n")
	if len(lines) < 1 {
		return nil
	}

	onlinePlayerNames := lines[1:]
	onlinePlayers := make(map[string]bool)

	for _, playerName := range onlinePlayerNames {
		playerName = strings.TrimSpace(playerName)
		if len(playerName) > 1 {
			onlinePlayers[playerName[1:]] = true
		}
	}

	playerMap := make(map[string]*Player, len(players))
	for i := range players {
		playerMap[players[i].Name] = &players[i]
	}

	updatedPlayers := make([]Player, 0, len(players)+len(onlinePlayers))
	seenPlayers := make(map[string]bool)

	for name, online := range onlinePlayers {
		if existingPlayer, ok := playerMap[name]; ok {
			existingPlayer.Online = online
			existingPlayer.Godmode = existingPlayer.AccessLevel == "observer" || existingPlayer.AccessLevel == "gm" || existingPlayer.AccessLevel == "overseer" || existingPlayer.AccessLevel == "moderator" || existingPlayer.AccessLevel == "admin"
			existingPlayer.Banned = false
			updatedPlayers = append(updatedPlayers, *existingPlayer)
			seenPlayers[name] = true
		} else {
			updatedPlayers = append(updatedPlayers, Player{Name: name, Online: online, AccessLevel: ""})
		}
	}

	// Add offline players who were previously online
	for _, player := range players {
		if !seenPlayers[player.Name] {
			player.Online = false
			updatedPlayers = append(updatedPlayers, player)
		}
	}

	// Check for any changes in player states
	playersChanged := len(oldPlayers) != len(updatedPlayers)
	if !playersChanged {
		for i := range oldPlayers {
			if oldPlayers[i].Name != updatedPlayers[i].Name ||
				oldPlayers[i].Online != updatedPlayers[i].Online ||
				oldPlayers[i].Banned != updatedPlayers[i].Banned {
				playersChanged = true
				break
			}
		}
	}

	if !playersChanged {
		runtime.LogDebugf(app.ctx, "No changes in players, skipping event emission")
		return nil
	}

	// Update players and emit event
	players = updatedPlayers
	runtime.EventsEmit(app.ctx, "update-players", players)
	runtime.LogDebugf(app.ctx, "Players updated: %v", players)

	return nil
}

func players_save() error {
	err := writeJSON(filepath.Join(appFolder, connectionCredentials.IP+"-"+connectionCredentials.Port, "players.json"), players)
	if err != nil {
		return errors.New("Error saving players: " + err.Error())
	}

	return nil
}

func (app *App) AddPlayer(name string) {
	connMutex.Lock()
	defer connMutex.Unlock()

	// Check if the player is already in the list
	for _, player := range players {
		if player.Name == name {
			connMutex.Unlock()
			runtime.LogWarningf(app.ctx, "Player %s is already in the list", name)
			app.SendNotification(Notification{
				Title:   "Can't add player",
				Message: "Player " + name + " is already in the list",
				Variant: "warning",
			})
			return
		}
	}

	// Add the player to the list
	players = append(players, Player{Name: name, Online: false, AccessLevel: ""})
	runtime.EventsEmit(app.ctx, "update-players", players)
	runtime.LogDebugf(app.ctx, "Players updated: %v", players)
}

type RCONCommandParam struct {
	Name      string      // Command argument name, e.g., "name"
	Key       string      // Command argument key, e.g., "-r" or "{name}"
	Value     interface{} // Value for the argument
	Mandatory bool        // If true, the argument is required
}

type RCONCommandNotifications struct {
	AllSuccess    string // Notification for complete success (all names)
	AllFail       string // Notification for complete failure (all names)
	Partial       string // Notification for partial success (some succeed, some fail)
	SingleSuccess string // Notification for single name success
	SingleFail    string // Notification for single name failure
}

type RCONCommand struct {
	CommandTemplate   string                    // Command template with placeholders
	PlayerNames       []string                  // List of player names
	Args              []RCONCommandParam        // List of arguments
	SuccessCheck      func(string, string) bool // Function to check success in response
	ErrorCheck        func(string, string) bool // Function to check errors in response
	UpdateFunc        func(string, string)      // Function to update player state
	EmitUpdatePlayers bool                      // Whether to emit "update-players"
	Notifications     RCONCommandNotifications  // Notifications for outcomes
}

func (params *RCONCommand) execute() int {
	connMutex.Lock()
	defer connMutex.Unlock()

	names := params.PlayerNames
	successCount := 0
	total := 1 // Default to 1 for commands without names
	if len(names) > 0 {
		total = len(names)
	}

	baseCommand := params.CommandTemplate

	for _, arg := range params.Args {
		if arg.Value == nil {
			if arg.Mandatory {
				runtime.LogError(app.ctx, fmt.Sprintf("Missing mandatory argument: %s", arg.Key))
				return 0
			} else {
				runtime.LogDebugf(app.ctx, "Skipping optional argument: %s", arg.Key)
				baseCommand = strings.Replace(baseCommand, fmt.Sprintf("{%s}", arg.Name), "", 1)
				continue
			}
		}

		if arg.Key != "" {
			baseCommand = strings.Replace(baseCommand, fmt.Sprintf("{%s}", arg.Name), fmt.Sprintf("%s %v", arg.Key, arg.Value), 1)
		} else {
			baseCommand = strings.Replace(baseCommand, fmt.Sprintf("{%s}", arg.Name), fmt.Sprintf("%v", arg.Value), 1)
		}

	}

	for i := 0; i < total; i++ {
		var command string
		if names == nil {
			command = baseCommand
		} else {
			command = strings.Replace(baseCommand, "{name}", names[i], 1)
		}

		command = strings.Join(strings.Fields(command), " ") // Collapse spaces
		res, err := conn.Execute(command)

		if err != nil || (params.ErrorCheck != nil && params.ErrorCheck(names[i], res)) {
			continue
		}

		if params.SuccessCheck != nil && params.SuccessCheck(names[i], res) {
			successCount++
			if params.UpdateFunc != nil {
				if len(names) > 0 {
					params.UpdateFunc(names[i], res)
				} else {
					params.UpdateFunc("", res)
				}
			}
		}
	}

	if total > 1 {
		if successCount == total {
			// All Success (Multiple)
			app.SendNotification(Notification{
				Title:   fmt.Sprintf(params.Notifications.AllSuccess, successCount),
				Variant: "success",
			})
		} else if successCount == 0 {
			// All Fail (Multiple)
			app.SendNotification(Notification{
				Title:   fmt.Sprintf(params.Notifications.AllFail, total),
				Variant: "error",
			})
		} else {
			// Partial Success
			app.SendNotification(Notification{
				Title:   fmt.Sprintf(params.Notifications.Partial, successCount, total-successCount),
				Variant: "warning",
			})
		}
	} else if len(names) == 1 {
		if successCount == 1 {
			// Single Success
			app.SendNotification(Notification{
				Title:   fmt.Sprintf(params.Notifications.SingleSuccess, names[0]),
				Variant: "success",
			})
		} else {
			// Single Fail
			app.SendNotification(Notification{
				Title:   fmt.Sprintf(params.Notifications.SingleFail, names[0]),
				Variant: "error",
			})
		}
	} else if names == nil {
		// Commands Without Names
		if successCount == total {
			app.SendNotification(Notification{
				Title:   params.Notifications.SingleSuccess,
				Variant: "success",
			})
		} else {
			app.SendNotification(Notification{
				Title:   params.Notifications.SingleFail,
				Variant: "error",
			})
		}
	}

	// Emit player updates if needed
	if params.EmitUpdatePlayers {
		runtime.EventsEmit(app.ctx, "update-players", players)
	}

	return successCount
}

func (app *App) BanUsers(names []string, reason string, banIp bool) {
	playerMap := make(map[string]*Player, len(players))
	for i := range players {
		playerMap[players[i].Name] = &players[i]
	}

	command := RCONCommand{
		CommandTemplate: "banuser {name} {ip} {reason}",
		PlayerNames:     names,
		Args: []RCONCommandParam{
			{
				Name: "reason",
				Key:  "-r",
				Value: func() interface{} {
					if reason != "" {
						return fmt.Sprintf("\"%s\"", reason)
					}
					return nil
				}(),
				Mandatory: false,
			},
			{
				Name: "ip",
				Value: func() interface{} {
					if banIp {
						return "-ip"
					}
					return nil
				}(),
				Mandatory: false,
			},
		},
		SuccessCheck: func(name string, response string) bool {
			return response == fmt.Sprintf("User %s is now banned", name)
		},
		ErrorCheck: func(name string, response string) bool {
			return response == "Unban a player. Use /unbanuser \"username\""
		},
		UpdateFunc: func(name string, response string) {
			player, ok := playerMap[name]
			if ok {
				player.Banned = true
				player.Online = false
			}
		},
		EmitUpdatePlayers: true,
		Notifications: RCONCommandNotifications{
			AllSuccess:    "Banned %d users",
			AllFail:       "Failed to ban %d users",
			Partial:       "Banned %d users, failed to ban %d users",
			SingleSuccess: "Successfully banned %s",
			SingleFail:    "Failed to ban %s",
		},
	}

	command.execute()
}

func (app *App) UnbanUsers(names []string) {
	playerMap := make(map[string]*Player, len(players))
	for i := range players {
		playerMap[players[i].Name] = &players[i]
	}

	command := RCONCommand{
		CommandTemplate: "unbanuser {name}",
		PlayerNames:     names,
		SuccessCheck: func(name string, response string) bool {
			return response == fmt.Sprintf("User %s is now un-banned", name)
		},
		ErrorCheck: func(name string, response string) bool {
			return response == "Unban a player. Use /unbanuser \"username\""
		},
		UpdateFunc: func(name string, response string) {
			player, ok := playerMap[name]
			if ok {
				player.Banned = false
			}
		},
		EmitUpdatePlayers: true,
		Notifications: RCONCommandNotifications{
			AllSuccess:    "Unbanned %d users",
			AllFail:       "Failed to unban %d users",
			Partial:       "Unbanned %d users, failed to unban %d users",
			SingleSuccess: "Successfully unbanned %s",
			SingleFail:    "Failed to unban %s",
		},
	}

	command.execute()
}

func (app *App) KickUsers(names []string, reason string) {
	defer players_update()

	playerMap := make(map[string]*Player, len(players))
	for i := range players {
		playerMap[players[i].Name] = &players[i]
	}

	command := RCONCommand{
		CommandTemplate: "kick {name} {reason}",
		PlayerNames:     names,
		Args: []RCONCommandParam{
			{
				Name: "reason",
				Key:  "-r",
				Value: func() interface{} {
					if reason != "" {
						return fmt.Sprintf("\"%s\"", reason)
					}
					return nil
				}(),
				Mandatory: false,
			},
		},
		SuccessCheck: func(name string, response string) bool {
			return strings.Contains(response, " kicked.")
		},
		Notifications: RCONCommandNotifications{
			AllSuccess:    "Kicked %d users",
			AllFail:       "Failed to kick %d users",
			Partial:       "Kicked %d users, failed to kick %d users",
			SingleSuccess: "Successfully kicked %s",
			SingleFail:    "Failed to kick %s",
		},
	}

	command.execute()
}

func (app *App) GodMode(names []string, value bool) {
	defer players_update()

	playerMap := make(map[string]*Player, len(players))
	for i := range players {
		playerMap[players[i].Name] = &players[i]
	}

	command := RCONCommand{
		CommandTemplate: "godmode {name} {value}",
		PlayerNames:     names,
		Args: []RCONCommandParam{
			{
				Name: "value",
				Value: func() interface{} {
					if value {
						return "-true"
					}
					return "-false"

				}(),
				Mandatory: true,
			},
		},
		SuccessCheck: func(name string, response string) bool {
			return strings.Contains(response, " is now invincible.") || strings.Contains(response, " is no more invincible.")
		},
		ErrorCheck: func(name string, response string) bool {
			return response == fmt.Sprintf("User %s not found.", name)
		},
		UpdateFunc: func(name string, response string) {
			player, ok := playerMap[name]
			if ok {
				player.Godmode = value
			}
		},
		EmitUpdatePlayers: true,
		Notifications: RCONCommandNotifications{
			AllSuccess:    "Set godmode for %d users",
			AllFail:       "Failed to set godmode for %d users",
			Partial:       "Set godmode for %d users, failed to set godmode for %d users",
			SingleSuccess: "Successfully set godmode for %s",
			SingleFail:    "Failed to set godmode for %s",
		},
	}

	command.execute()
}

func (app *App) TeleportToCoordinates(names []string, coordinates Coordinates) {
	command := RCONCommand{
		CommandTemplate: "teleportto {name} {coordinates}",
		PlayerNames:     names,
		Args: []RCONCommandParam{
			{
				Name: "coordinates",
				Value: func() interface{} {
					return fmt.Sprintf("%d,%d,%d", coordinates.X, coordinates.Y, coordinates.Z)
				}(),
				Mandatory: true,
			},
		},
		SuccessCheck: func(name string, response string) bool {
			return response == fmt.Sprintf("%s teleported to %d,%d,%d please wait two seconds to show the map around you.", name, coordinates.X, coordinates.Y, coordinates.Z)
		},
		ErrorCheck: func(name string, response string) bool {
			return response == fmt.Sprintf("Can't find player %s", name)
		},
		Notifications: RCONCommandNotifications{
			AllSuccess:    "Teleported %d users",
			AllFail:       "Failed to teleport %d users",
			Partial:       "Teleported %d users, failed to teleport %d users",
			SingleSuccess: "Successfully teleported %s",
			SingleFail:    "Failed to teleport %s",
		},
	}

	command.execute()
}

func (app *App) TeleportToUser(names []string, targetUser string) {
	command := RCONCommand{
		CommandTemplate: "teleport {name} {target}",
		PlayerNames:     names,
		Args: []RCONCommandParam{
			{
				Name: "target",
				Value: func() interface{} {
					return fmt.Sprintf("\"%s\"", targetUser)
				}(),
				Mandatory: true,
			},
		},
		SuccessCheck: func(name string, response string) bool {
			return response == fmt.Sprintf("teleported %s to %s", name, targetUser)
		},
		ErrorCheck: func(name string, response string) bool {
			return response == fmt.Sprintf("Can't find player %s", name)
		},
		Notifications: RCONCommandNotifications{
			AllSuccess:    "Teleported %d users",
			AllFail:       "Failed to teleport %d users",
			Partial:       "Teleported %d users, failed to teleport %d users",
			SingleSuccess: "Successfully teleported %s",
			SingleFail:    "Failed to teleport %s",
		},
	}

	command.execute()
}

func (app *App) SetAccessLevel(names []string, accessLevel string) {
	playerMap := make(map[string]*Player, len(players))
	for i := range players {
		playerMap[players[i].Name] = &players[i]
	}

	command := RCONCommand{
		CommandTemplate: "setaccesslevel {name} {accessLevel}",
		PlayerNames:     names,
		Args: []RCONCommandParam{
			{
				Name: "accessLevel",
				Value: func() interface{} {
					if !(accessLevel == "player" || accessLevel == "observer" || accessLevel == "gm" || accessLevel == "overseer" || accessLevel == "moderator" || accessLevel == "admin") {
						return nil
					}
					return fmt.Sprintf("\"%s\"", accessLevel)
				}(),
				Mandatory: true,
			},
		},
		SuccessCheck: func(name string, response string) bool {
			return response == fmt.Sprintf("User %s is now %s", name, accessLevel) || response == fmt.Sprintf("User %s no longer has access level", name)
		},
		UpdateFunc: func(name string, response string) {
			if player, ok := playerMap[name]; ok {
				player.AccessLevel = accessLevel
			}
		},
		EmitUpdatePlayers: true,
		Notifications: RCONCommandNotifications{
			AllSuccess:    "Set access level for %d users",
			AllFail:       "Failed to set access level for %d users",
			Partial:       "Set access level for %d users, failed to set access level for %d users",
			SingleSuccess: "Successfully set access level for %s",
			SingleFail:    "Failed to set access level for %s",
		},
	}

	command.execute()
}

func (app *App) CreateHorde(names []string, count int) {
	command := RCONCommand{
		CommandTemplate: "createhorde {count} {name}",
		PlayerNames:     names,
		Args: []RCONCommandParam{
			{
				Name: "count",
				Value: func() interface{} {
					if count < 0 {
						return nil
					}
					return count
				}(),
				Mandatory: true,
			},
		},
		SuccessCheck: func(name string, response string) bool {
			return response == "Horde spawned."
		},
		Notifications: RCONCommandNotifications{
			AllSuccess:    "Created a horde near %d users",
			AllFail:       "Failed to create a horde near %d users",
			Partial:       "Created a horde near %d users, failed to create a horde near %d users",
			SingleSuccess: "Successfully created a horde near %s",
			SingleFail:    "Failed to create a horde near %s",
		},
	}

	command.execute()
}

func (app *App) Lightning(names []string) {
	command := RCONCommand{
		CommandTemplate: "lightning {name}",
		PlayerNames:     names,
		SuccessCheck: func(name string, response string) bool {
			return response == "Lightning triggered"
		},
		Notifications: RCONCommandNotifications{
			AllSuccess:    "Triggered lightning near %d users",
			AllFail:       "Failed to trigger lightning near %d users",
			Partial:       "Triggered lightning near %d users, failed to trigger lightning near %d users",
			SingleSuccess: "Successfully triggered lightning near %s",
			SingleFail:    "Failed to trigger lightning near %s",
		},
	}

	command.execute()
}

func (app *App) Thunder(names []string) {
	command := RCONCommand{
		CommandTemplate: "thunder {name}",
		PlayerNames:     names,
		SuccessCheck: func(name string, response string) bool {
			return response == "Thunder triggered"
		},
		Notifications: RCONCommandNotifications{
			AllSuccess:    "Triggered thunder near %d users",
			AllFail:       "Failed to trigger thunder near %d users",
			Partial:       "Triggered thunder near %d users, failed to trigger thunder near %d users",
			SingleSuccess: "Successfully triggered thunder near %s",
			SingleFail:    "Failed to trigger thunder near %s",
		},
	}

	command.execute()
}
