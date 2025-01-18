package main

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"math/rand"

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

type ItemRecord struct {
	ItemId string `json:"itemId"`
	Count  int    `json:"count"`
}

type RconResponse struct {
	Response string `json:"response"`
	Error    string `json:"error"`
}

var connectionCredentials Credentials
var players []Player

func (app *App) Players() []Player {
	return players
}

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
			Title:   "rcon.rcon_connection_failed",
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
	err = pzOptions_update()
	if err != nil {
		runtime.LogError(app.ctx, "Error updating pzOptions: "+err.Error())
	}

	app.SendNotification(Notification{
		Title:   "rcon.rcon_connection_established",
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

func (app *App) SendRconCommand(command string) RconResponse {
	connMutex.Lock()
	defer connMutex.Unlock()

	runtime.EventsEmit(app.ctx, "setProgress", 50)
	defer runtime.EventsEmit(app.ctx, "setProgress", 0)

	if conn == nil {
		runtime.LogError(app.ctx, "RCON is not connected")
		return RconResponse{
			Response: "",
			Error:    "RCON is not connected",
		}
	}

	if len([]byte(command)) > 1000 {
		runtime.LogError(app.ctx, "RCON command size exceeds 1000 bytes")
		return RconResponse{
			Response: "",
			Error:    "RCON command size exceeds 1000 bytes",
		}
	}

	res, err := conn.Execute(command)

	runtime.EventsEmit(app.ctx, "setProgress", 100)

	if err != nil {
		runtime.LogError(app.ctx, "Error executing RCON command: "+err.Error())
		return RconResponse{
			Response: "",
			Error:    "Error executing RCON command: " + err.Error(),
		}
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
	} else if strings.Contains(command, "adduser ") && strings.Contains(res, fmt.Sprintf(" created with the password ")) {
		name := strings.Split(command, " ")[1]
		nameExists := false
		for i := range players {
			if players[i].Name == name {
				nameExists = true
				break
			}
		}

		if !nameExists {
			players = append(players, Player{Name: name, Banned: false, AccessLevel: "player"})
			runtime.EventsEmit(app.ctx, "update-players", players)
		}
	} else if strings.Contains(command, "removeuserfromwhitelist ") && strings.Contains(res, " removed from white list") {
		name := strings.Split(command, " ")[1]
		nameExists := false
		for i := range players {
			if players[i].Name == name {
				players[i].Godmode = false
				players[i].AccessLevel = "player"
				nameExists = true
				break
			}
		}

		if nameExists {
			runtime.EventsEmit(app.ctx, "update-players", players)
		}
	} else if strings.Contains(command, "changeoption ") {
		err = pzOptions_update()
		if err != nil {
			runtime.LogError(app.ctx, "Error updating PZ options: "+err.Error())
		}
	}

	return RconResponse{
		Response: res,
		Error:    "",
	}
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
			players = nil
			pzOptions = PzOptions{}
			lastOptionsHash = ""
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
			Title:   "rcon.error_encrypting_credentials",
			Message: err.Error(),
			Variant: "error",
		})
		runtime.LogError(app.ctx, "Error encrypting credentials: "+err.Error())
		return false
	}

	err = writeJSON(credentialsPath, credentials)
	if err != nil {
		app.SendNotification(Notification{
			Title:   "rcon.error_saving_credentials",
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
		app.SendNotification(Notification{
			Title:   "rcon.error_loading_credentials",
			Message: err.Error(),
			Variant: "error",
		})
		runtime.LogError(app.ctx, "Error loading credentials: "+err.Error())
		return Credentials{}
	}

	credentials.Password, err = Decrypt(credentials.Password, "6f6c11c2-1dc8-417d-a68e-0e487629")
	if err != nil {
		app.SendNotification(Notification{
			Title:   "rcon.error_decrypting_credentials",
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
		if players == nil {
			players = []Player{}
		}
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
		runtime.LogTracef(app.ctx, "No changes in players, skipping event emission")
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

func (app *App) AddPlayerToWhitelist(username string, password string) {
	username = strings.TrimSpace(username)
	password = strings.TrimSpace(password)

	command := RCONCommand{
		CommandTemplate: "adduser {username} {password}",
		Args: []RCONCommandParam{
			{
				Name: "username",
				Value: func() interface{} {
					if username != "" {
						return fmt.Sprintf("\"%s\"", username)
					}
					return nil
				}(),
				Mandatory: true,
			},
			{
				Name: "password",
				Value: func() interface{} {
					if password != "" {
						return fmt.Sprintf("\"%s\"", password)
					}
					return nil
				}(),
				Mandatory: true,
			},
		},
		SuccessCheck: func(name string, response string) bool {
			return strings.Contains(response, fmt.Sprintf("User %s created with the password ", username))
		},
		ErrorCheck: func(name string, response string) bool {
			isErr := response == "A user with this name already exists"
			if isErr {
				runtime.LogWarningf(app.ctx, "User %s already exists", username)
			}
			return isErr
		},
		UpdateFunc: func(name string, response string) {
			for i := range players {
				if players[i].Name == username {
					return
				}
			}

			players = append(players, Player{Name: username, Online: false, AccessLevel: "player"})
		},
		EmitUpdatePlayers: true,
		Notifications: RCONCommandNotifications{
			SingleSuccess: "Successfully added player",
			SingleFail:    "Failed to add player",
		},
	}

	command.execute()
}

func (app *App) RemovePlayersFromWhitelist(names []string, removeFromList bool) int {
	command := RCONCommand{
		CommandTemplate: "removeuserfromwhitelist {name}",
		PlayerNames:     names,
		SuccessCheck: func(name string, response string) bool {
			return response == fmt.Sprintf("User %s removed from white list", name)
		},
		ErrorCheck: func(name string, response string) bool {
			return response == "Remove a user from the whitelist. Use: /removeuserfromwhitelist \"username\""
		},
		UpdateFunc: func(name string, response string) {
			if removeFromList {
				success := false

				for i := range players {
					if players[i].Name == name {
						players = append(players[:i], players[i+1:]...)
						success = true
						break
					}
				}

				if !success {
					runtime.LogWarningf(app.ctx, "Player %s not found in the list", name)
					app.SendNotification(Notification{
						Title:   "Can't remove player",
						Message: "Player " + name + " not found in the list",
						Variant: "warning",
					})
				}
			} else {
				for i := range players {
					if players[i].Name == name {
						players[i].AccessLevel = "player"
						players[i].Godmode = false
						break
					}
				}
			}
		},
		EmitUpdatePlayers: true,
		Notifications: RCONCommandNotifications{
			SingleSuccess: "Successfully removed player %s",
			SingleFail:    "Failed to remove player %s",
			Partial:       "Successfully removed %d players, failed to remove %d players",
			AllSuccess:    "Successfully removed %d players",
			AllFail:       "Failed to remove %d players",
		},
	}

	return command.execute()
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
	CommandTemplate   string                      // Command template with placeholders
	PlayerNames       []string                    // List of player names
	Args              []RCONCommandParam          // List of arguments
	ResponseUpdate    func(string, string) string // Function to update response
	SuccessCheck      func(string, string) bool   // Function to check success in response
	ErrorCheck        func(string, string) bool   // Function to check errors in response
	UpdateFunc        func(string, string)        // Function to update player state
	EmitUpdatePlayers bool                        // Whether to emit "update-players"
	Notifications     RCONCommandNotifications    // Notifications for outcomes
}

func (params *RCONCommand) execute() int {
	connMutex.Lock()
	defer connMutex.Unlock()

	defer runtime.EventsEmit(app.ctx, "setProgress", 0)
	runtime.EventsEmit(app.ctx, "setProgress", 10)

	names := params.PlayerNames
	successCount := 0
	total := 1 // Default to 1 for commands without names
	if len(names) > 0 {
		total = len(names)
	} else if len(names) == 0 {
		names = nil
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

	var res string
	var err error
	var lastErrRes string

	for i := 0; i < total; i++ {
		runtime.EventsEmit(app.ctx, "setProgress", int(float64(i+1)/float64(total)*100))

		var command string
		if names == nil {
			command = baseCommand
		} else {
			command = strings.Replace(baseCommand, "{name}", "\""+names[i]+"\"", 1)
		}

		command = strings.Join(strings.Fields(command), " ") // Collapse spaces

		if len([]byte(command)) > 1000 {
			runtime.LogError(app.ctx, "RCON command size exceeds 1000 bytes")
			lastErrRes = "RCON command size exceeds 1000 bytes"
			continue
		}

		res, err = conn.Execute(command)

		if err != nil {
			lastErrRes = res
			continue
		}

		if params.ResponseUpdate != nil {
			res = params.ResponseUpdate(names[i], res)
		}

		if names == nil {
			if params.ErrorCheck != nil && params.ErrorCheck("", res) {
				lastErrRes = res
				continue
			}
		} else {
			if params.ErrorCheck != nil && params.ErrorCheck(names[i], res) {
				lastErrRes = res
				continue
			}
		}

		if names == nil {
			if params.SuccessCheck != nil && params.SuccessCheck("", res) {
				successCount++
				if params.UpdateFunc != nil {
					params.UpdateFunc("", res)
				}
			} else {
				lastErrRes = res
			}
		} else {
			if params.SuccessCheck != nil && params.SuccessCheck(names[i], res) {
				successCount++
				if params.UpdateFunc != nil {
					if len(names) > 0 {
						params.UpdateFunc(names[i], res)
					} else {
						params.UpdateFunc("", res)
					}
				}
			} else {
				lastErrRes = res
			}
		}
	}

	runtime.EventsEmit(app.ctx, "setProgress", 100)

	if params.Notifications != (RCONCommandNotifications{}) {
		if total > 1 {
			if successCount == total {
				// All Success (Multiple)
				app.SendNotification(Notification{
					Title:   fmt.Sprintf(params.Notifications.AllSuccess, successCount),
					Variant: "success",
					Parameters: map[string]string{
						"s": fmt.Sprintf("%d", total),
					},
				})
			} else if successCount == 0 {
				// All Fail (Multiple)
				app.SendNotification(Notification{
					Title:   fmt.Sprintf(params.Notifications.AllFail, total),
					Message: lastErrRes,
					Variant: "error",
					Parameters: map[string]string{
						"f": fmt.Sprintf("%d", total),
					},
				})
			} else {
				// Partial Success
				app.SendNotification(Notification{
					Title:   fmt.Sprintf(params.Notifications.Partial, successCount, total-successCount),
					Message: lastErrRes,
					Variant: "warning",
					Parameters: map[string]string{
						"s": fmt.Sprintf("%d", successCount),
						"f": fmt.Sprintf("%d", total-successCount),
					},
				})
			}
		} else if len(names) == 1 {
			if successCount == 1 {
				// Single Success
				app.SendNotification(Notification{
					Title:   fmt.Sprintf(params.Notifications.SingleSuccess, names[0]),
					Variant: "success",
					Parameters: map[string]string{
						"name": names[0],
					},
				})
			} else {
				// Single Fail
				app.SendNotification(Notification{
					Title:   fmt.Sprintf(params.Notifications.SingleFail, names[0]),
					Message: lastErrRes,
					Variant: "error",
					Parameters: map[string]string{
						"name": names[0],
					},
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
					Message: lastErrRes,
					Variant: "error",
				})
			}
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
				if accessLevel == "player" {
					player.Godmode = false
				} else {
					player.Godmode = true
				}
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

func (app *App) AddXp(names []string, perks []string, amount int) {
	successCount := 0

	for _, perk := range perks {
		command := RCONCommand{
			CommandTemplate: "addxp {name} {perk}",
			PlayerNames:     names,
			Args: []RCONCommandParam{
				{
					Name: "perk",
					Value: func() interface{} {
						return fmt.Sprintf("%s=%d", perk, amount)
					}(),
					Mandatory: true,
				},
			},
			SuccessCheck: func(name string, response string) bool {
				return response == fmt.Sprintf("Added %d %s xp's to %s", amount, perk, name)
			},
			ErrorCheck: func(_ string, response string) bool {
				return response == "No such user"
			},
		}

		successCount += command.execute()
	}

	if successCount > 0 {
		runtime.LogInfof(app.ctx, "Added %d xp's to %d skills", amount, successCount)
		app.SendNotification(Notification{
			Title:   fmt.Sprintf("Added %d xp's to %d skills", amount, successCount),
			Variant: "success",
		})
	} else {
		runtime.LogInfo(app.ctx, "Failed to add xp")
		app.SendNotification(Notification{
			Title:   "Failed to add xp",
			Variant: "error",
		})
	}
}

func (app *App) AddVehicle(vehicleId string, names []string, coordinates Coordinates) {
	command := RCONCommand{
		CommandTemplate: "addvehicle {vehicleId} {name}",
		PlayerNames:     names,
		Args: []RCONCommandParam{
			{
				Name: "vehicleId",
				Value: func() interface{} {
					return fmt.Sprintf("\"%s\"", vehicleId)
				}(),
				Mandatory: true,
			},
		},
		SuccessCheck: func(name string, response string) bool {
			return response == "Vehicle spawned"
		},
		ErrorCheck: func(name string, response string) bool {
			return response == fmt.Sprintf("Unknown vehicle script \"%s\"", vehicleId) || response == fmt.Sprintf("User \"%s\" not found", name) || response == "Z coordinate must be 0 for now" || response == fmt.Sprintf("Invalid location %d,%d,%d", coordinates.X, coordinates.Y, coordinates.Z)
		},
		Notifications: RCONCommandNotifications{
			AllSuccess:    "Added %d vehicles",
			AllFail:       "Failed to add %d vehicles",
			Partial:       "Added %d vehicles, failed to add %d vehicles",
			SingleSuccess: "Successfully added a vehicle to %s",
			SingleFail:    "Failed to add a vehicle to %s",
		},
	}

	if len(names) == 0 {
		command.PlayerNames = []string{fmt.Sprintf("%d,%d,%d", coordinates.X, coordinates.Y, coordinates.Z)}
	}

	command.execute()
}

func (app *App) AddItems(names []string, itemRecords []ItemRecord) {
	successCount := 0

	for _, itemRecord := range itemRecords {
		command := RCONCommand{
			CommandTemplate: "additem {name} {item}",
			PlayerNames:     names,
			Args: []RCONCommandParam{
				{
					Name: "item",
					Value: func() interface{} {
						return fmt.Sprintf("\"%s\" %d", itemRecord.ItemId, itemRecord.Count)
					}(),
					Mandatory: true,
				},
			},
			SuccessCheck: func(name string, response string) bool {
				return response == fmt.Sprintf("Item %s Added in %s's inventory.", itemRecord.ItemId, name)
			},
			ErrorCheck: func(_ string, response string) bool {
				return response == "No such user"
			},
		}

		successCount += command.execute()
	}

	if successCount > 0 {
		runtime.LogInfof(app.ctx, "Added items")
		app.SendNotification(Notification{
			Title:   "Added items",
			Variant: "success",
		})
	} else {
		runtime.LogInfo(app.ctx, "Failed to add items")
		app.SendNotification(Notification{
			Title:   "Failed to add items",
			Variant: "error",
		})
	}
}

func (app *App) SaveWorld() {
	command := RCONCommand{
		CommandTemplate: "save",
		SuccessCheck: func(name string, response string) bool {
			return response == "World saved"
		},
		Notifications: RCONCommandNotifications{
			SingleSuccess: "Successfully saved the world",
			SingleFail:    "Failed to save the world",
		},
	}

	command.execute()
}

func (app *App) StopServer() bool {
	command := RCONCommand{
		CommandTemplate: "quit",
		SuccessCheck: func(name string, response string) bool {
			return response == "Quit"
		},
		Notifications: RCONCommandNotifications{
			SingleSuccess: "Stopping the server",
			SingleFail:    "Failed to stop the server",
		},
	}

	return command.execute() == 1
}

func (app *App) CheckModsNeedUpdate() {
	command := RCONCommand{
		CommandTemplate: "checkModsNeedUpdate",
		SuccessCheck: func(name string, response string) bool {
			return response == "Checking started. The answer will be written in the log file and in the chat"
		},
		Notifications: RCONCommandNotifications{
			SingleSuccess: "Checking started. The answer will be written in the log file and in the chat",
			SingleFail:    "Failed to check mods that need update",
		},
	}

	command.execute()
}

func (app *App) ServerMsg(message string) {
	command := RCONCommand{
		CommandTemplate: "servermsg {message}",
		Args: []RCONCommandParam{
			{
				Name:      "message",
				Value:     fmt.Sprintf("\"%s\"", message),
				Mandatory: true,
			},
		},
		SuccessCheck: func(name string, response string) bool {
			return response == "Message sent."
		},
		Notifications: RCONCommandNotifications{
			SingleSuccess: "Successfully sent server message",
			SingleFail:    "Failed to send server message",
		},
	}

	command.execute()
}

func (app *App) StartRain(intensity int) {
	command := RCONCommand{
		CommandTemplate: "startrain {intensity}",
		Args: []RCONCommandParam{
			{
				Name: "intensity",
				Value: func() interface{} {
					if intensity == -1 {
						return nil
					}
					return fmt.Sprintf("%d", intensity)
				}(),
				Mandatory: false,
			},
		},
		SuccessCheck: func(name string, response string) bool {
			return response == "Rain started"
		},
		Notifications: RCONCommandNotifications{
			SingleSuccess: "Successfully started rain",
			SingleFail:    "Failed to start rain",
		},
	}

	command.execute()
}

func (app *App) StartStorm(duration int) {
	command := RCONCommand{
		CommandTemplate: "startstorm {duration}",
		Args: []RCONCommandParam{
			{
				Name: "duration",
				Value: func() interface{} {
					if duration == -1 {
						return nil
					}
					return fmt.Sprintf("%d", duration)
				}(),
				Mandatory: false,
			},
		},
		SuccessCheck: func(name string, response string) bool {
			return response == "Thunderstorm started"
		},
		Notifications: RCONCommandNotifications{
			SingleSuccess: "Successfully started storm",
			SingleFail:    "Failed to start storm",
		},
	}

	command.execute()
}

func (app *App) StopRain() {
	command := RCONCommand{
		CommandTemplate: "stoprain",
		SuccessCheck: func(name string, response string) bool {
			return response == "Rain stopped"
		},
		Notifications: RCONCommandNotifications{
			SingleSuccess: "Successfully stopped rain",
			SingleFail:    "Failed to stop rain",
		},
	}

	command.execute()
}

func (app *App) StopWeather() {
	command := RCONCommand{
		CommandTemplate: "stopweather",
		SuccessCheck: func(name string, response string) bool {
			return response == "Weather stopped"
		},
		Notifications: RCONCommandNotifications{
			SingleSuccess: "Successfully stopped weather",
			SingleFail:    "Failed to stop weather",
		},
	}

	command.execute()
}

func (app *App) Chopper() {
	command := RCONCommand{
		CommandTemplate: "chopper",
		SuccessCheck: func(name string, response string) bool {
			return response == "Chopper launched"
		},
		Notifications: RCONCommandNotifications{
			SingleSuccess: "Successfully launched chopper",
			SingleFail:    "Failed to launch chopper",
		},
	}

	command.execute()
}

func (app *App) Gunshot() {
	command := RCONCommand{
		CommandTemplate: "gunshot",
		SuccessCheck: func(name string, response string) bool {
			return response == "Gunshot fired"
		},
		Notifications: RCONCommandNotifications{
			SingleSuccess: "Successfully fired gunshot",
			SingleFail:    "Failed to fire gunshot",
		},
	}

	command.execute()
}

func getRandomOnlinePlayer() (string, bool) {
	onlinePlayers := make([]string, 0)

	for _, player := range players {
		if player.Online && player.Name != "" {
			onlinePlayers = append(onlinePlayers, player.Name)
		}
	}

	if len(onlinePlayers) == 0 {
		return "", false // No online players
	}

	randomPlayer := onlinePlayers[rand.Intn(len(onlinePlayers))]
	return randomPlayer, true
}

func (app *App) RandomLightning() {
	randomPlayer, found := getRandomOnlinePlayer()
	if !found {
		runtime.LogDebugf(app.ctx, "No players online")
		return
	}

	app.Lightning([]string{randomPlayer})
}

func (app *App) RandomThunder() {
	randomPlayer, found := getRandomOnlinePlayer()
	if !found {
		runtime.LogDebugf(app.ctx, "No players online")
		return
	}

	app.Thunder([]string{randomPlayer})
}

func (app *App) Alarm() {
	command := RCONCommand{
		CommandTemplate: "alarm",
		SuccessCheck: func(name string, response string) bool {
			return response == "Alarm triggered"
		},
		ErrorCheck: func(name string, response string) bool {
			return response == "Not in a room"
		},
		Notifications: RCONCommandNotifications{
			SingleSuccess: "Successfully triggered alarm",
			SingleFail:    "Failed to trigger alarm",
		},
	}

	command.execute()
}

func (app *App) ReloadOptions() {
	command := RCONCommand{
		CommandTemplate: "reloadoptions",
		SuccessCheck: func(name string, response string) bool {
			return response == "Options reloaded"
		},
		Notifications: RCONCommandNotifications{
			SingleSuccess: "Successfully reloaded options",
			SingleFail:    "Failed to reload options",
		},
	}

	command.execute()
}
