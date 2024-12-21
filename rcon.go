package main

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
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
	Name    string `json:"name"`
	Online  bool   `json:"online"`
	Banned  bool   `json:"banned"`
	Godmode bool   `json:"godmode"`
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
				runtime.WindowExecJS(app.ctx, "window.rconDisconnected();")
				isWatching = false
				return
			}

			// Check if the connection is still valid by sending a ping command
			err := players_update()
			if err != nil {
				runtime.LogError(app.ctx, "Error updating players: "+err.Error())
				runtime.LogError(app.ctx, "RCON connection lost: "+err.Error())
				runtime.WindowExecJS(app.ctx, "window.rconDisconnected();")
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
			existingPlayer.Banned = false
			updatedPlayers = append(updatedPlayers, *existingPlayer)
			seenPlayers[name] = true
		} else {
			updatedPlayers = append(updatedPlayers, Player{Name: name, Online: online, Banned: false})
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

func (app *App) BanUsers(names []string, reason string, banIp bool) {
	banCount := len(names)

	playerMap := make(map[string]*Player, len(players))
	for i := range players {
		playerMap[players[i].Name] = &players[i]
	}

	connMutex.Lock()
	for _, name := range names {
		commandString := "banuser \"" + name + "\""
		if banIp {
			commandString += " -ip"
		}
		if reason != "" {
			commandString += " -r \"" + strings.TrimSpace(reason) + "\""
		}
		res, err := conn.Execute(commandString)
		if err != nil {
			runtime.LogError(app.ctx, "Error banning user: "+err.Error())
			app.SendNotification(Notification{
				Title:   "Error banning " + name,
				Message: err.Error(),
				Variant: "error",
			})
			banCount--
		} else if res != "" && !strings.Contains(res, "is now banned") {
			runtime.LogError(app.ctx, "Error banning user: "+res)
			app.SendNotification(Notification{
				Title:   "Error banning " + name,
				Message: res,
				Variant: "error",
			})
			banCount--
		} else if res != "" && strings.Contains(res, "is now banned") {
			player, ok := playerMap[name]
			if ok {
				player.Banned = true
				player.Online = false
			}
		}
	}
	connMutex.Unlock()

	if len(names) > 1 {
		if banCount != 0 {
			app.SendNotification(Notification{
				Title:   fmt.Sprintf("Banned %d users", banCount),
				Variant: "success",
			})
		}
		if banCount < len(names) {
			app.SendNotification(Notification{
				Title:   fmt.Sprintf("Failed to ban %d users", len(names)-banCount),
				Variant: "error",
			})
		}
	} else {
		if banCount != 0 {
			app.SendNotification(Notification{
				Title:   "Banned " + names[0],
				Variant: "success",
			})
		}
	}

	runtime.EventsEmit(app.ctx, "update-players", players)
}

func (app *App) UnbanUsers(names []string) {
	unbanCount := len(names)

	playerMap := make(map[string]*Player, len(players))
	for i := range players {
		playerMap[players[i].Name] = &players[i]
	}

	connMutex.Lock()
	for _, name := range names {
		res, err := conn.Execute("unbanuser \"" + name + "\"")
		if err != nil {
			runtime.LogError(app.ctx, "Error unbanning user: "+err.Error())
			app.SendNotification(Notification{
				Title:   "Error unbanning " + name,
				Message: err.Error(),
				Variant: "error",
			})
			unbanCount--
		} else if res != "" && !strings.Contains(res, "is now un-banned") {
			runtime.LogError(app.ctx, "Error unbanning user: "+res)
			app.SendNotification(Notification{
				Title:   "Error unbanning " + name,
				Message: res,
				Variant: "error",
			})
			unbanCount--
		} else if res != "" && strings.Contains(res, "is now un-banned") {
			player, ok := playerMap[name]
			if ok {
				player.Banned = false
			}
		}
	}
	connMutex.Unlock()

	if len(names) > 1 {
		if unbanCount != 0 {
			app.SendNotification(Notification{
				Title:   fmt.Sprintf("Unbanned %d users", unbanCount),
				Variant: "success",
			})
		}
		if unbanCount < len(names) {
			app.SendNotification(Notification{
				Title:   fmt.Sprintf("Failed to unban %d users", len(names)-unbanCount),
				Variant: "error",
			})
		}
	} else {
		if unbanCount != 0 {
			app.SendNotification(Notification{
				Title:   "Unbanned " + names[0],
				Variant: "success",
			})
		}
	}

	runtime.EventsEmit(app.ctx, "update-players", players)
}

func (app *App) KickUsers(names []string, reason string) {
	defer players_update()

	kickCount := len(names)

	connMutex.Lock()
	for _, name := range names {
		commandString := "kick \"" + name + "\""
		if reason != "" {
			commandString += " -r \"" + strings.TrimSpace(reason) + "\""
		}
		res, err := conn.Execute(commandString)
		if err != nil {
			runtime.LogError(app.ctx, "Error kicking user: "+err.Error())
			app.SendNotification(Notification{
				Title:   "Error kicking " + name,
				Message: err.Error(),
				Variant: "error",
			})
			kickCount--
		} else if res != "" && !strings.Contains(res, " kicked.") {
			runtime.LogError(app.ctx, "Error kicking user: "+res)
			app.SendNotification(Notification{
				Title:   "Error kicking " + name,
				Message: res,
				Variant: "error",
			})
			kickCount--
		}
	}
	connMutex.Unlock()

	if len(names) > 1 {
		if kickCount != 0 {
			app.SendNotification(Notification{
				Title:   fmt.Sprintf("Kicked %d users", kickCount),
				Variant: "success",
			})
		}
		if kickCount < len(names) {
			app.SendNotification(Notification{
				Title:   fmt.Sprintf("Failed to kick %d users", len(names)-kickCount),
				Variant: "error",
			})
		}
	} else {
		if kickCount != 0 {
			app.SendNotification(Notification{
				Title:   "Kicked " + names[0],
				Variant: "success",
			})
		}
	}
}

func (app *App) CheatPower(names []string, power string, value bool) {
	cheatCount := len(names)

	if cheatCount == 0 || power != "godmode" {
		return
	}

	playerMap := make(map[string]*Player, len(players))
	for i := range players {
		playerMap[players[i].Name] = &players[i]
	}

	connMutex.Lock()
	for _, name := range names {
		res, err := conn.Execute(power + " \"" + name + "\" -" + strconv.FormatBool(value))
		if err != nil {
			runtime.LogErrorf(app.ctx, "Error %s user: %s", power, err.Error())
			app.SendNotification(Notification{
				Title:   "Error " + power + " " + name,
				Message: err.Error(),
				Variant: "error",
			})
			cheatCount--
		} else if res != "" && !strings.Contains(res, " invincible.") {
			runtime.LogErrorf(app.ctx, "Error %s user: %s", power, res)
			app.SendNotification(Notification{
				Title:   "Error " + power + " " + name,
				Message: res,
				Variant: "error",
			})
			cheatCount--
		} else if res != "" {
			if strings.Contains(res, " is now invincible.") || strings.Contains(res, " is no more invincible.") {
				player, ok := playerMap[name]
				if ok {
					player.Godmode = value
				}
			}
		}
	}
	connMutex.Unlock()

	if len(names) > 1 {
		//app.SendNotification(fmt.Sprintf("%s %d users", power, cheatCount), "", "", "success")
		if cheatCount < len(names) {
			app.SendNotification(Notification{
				Title:   fmt.Sprintf("Failed to %s %d users", power, len(names)-cheatCount),
				Variant: "error",
			})
		}
	} //else {
	//if cheatCount != 0 {
	//	app.SendNotification(power+" "+names[0], "", "", "success")
	//}
	//}

	runtime.EventsEmit(app.ctx, "update-players", players)
}

func (app *App) TeleportToCoordinates(names []string, coordinates Coordinates) {
	teleportCount := len(names)

	connMutex.Lock()
	for _, name := range names {
		res, err := conn.Execute(fmt.Sprintf("teleport \"%s\" %d,%d,%d", name, coordinates.X, coordinates.Y, coordinates.Z))
		if err != nil {
			runtime.LogError(app.ctx, "Error teleporting user: "+err.Error())
			app.SendNotification(Notification{
				Title:   "Error teleporting " + name,
				Message: err.Error(),
				Variant: "error",
			})
			teleportCount--
		} else if res != "" && !strings.Contains(res, fmt.Sprintf("%s teleported to %d,%d,%d", name, coordinates.X, coordinates.Y, coordinates.Z)) {
			runtime.LogError(app.ctx, "Error teleporting user: "+res)
			app.SendNotification(Notification{
				Title:   "Error teleporting " + name,
				Message: res,
				Variant: "error",
			})
			teleportCount--
		}
	}
	connMutex.Unlock()

	if len(names) > 1 {
		if teleportCount != 0 {
			app.SendNotification(Notification{
				Title:   fmt.Sprintf("Teleported %d users", teleportCount),
				Variant: "success",
			})
		}
		if teleportCount < len(names) {
			app.SendNotification(Notification{
				Title:   fmt.Sprintf("Failed to teleport %d users", len(names)-teleportCount),
				Variant: "error",
			})
		}
	} else {
		if teleportCount != 0 {
			app.SendNotification(Notification{
				Title:   "Teleported " + names[0],
				Variant: "success",
			})
		}
	}
}

func (app *App) TeleportToUser(names []string, targetUser string) {
	teleportCount := len(names)

	connMutex.Lock()
	for _, name := range names {
		res, err := conn.Execute(fmt.Sprintf("teleport \"%s\" \"%s\"", name, targetUser))
		if err != nil {
			runtime.LogError(app.ctx, "Error teleporting user: "+err.Error())
			app.SendNotification(Notification{
				Title:   "Error teleporting " + name,
				Message: err.Error(),
				Variant: "error",
			})
			teleportCount--
		} else if res != "" && res != fmt.Sprintf("teleported %s to %s", name, targetUser) {
			runtime.LogError(app.ctx, "Error teleporting user: "+res)
			app.SendNotification(Notification{
				Title:   "Error teleporting " + name,
				Message: res,
				Variant: "error",
			})
			teleportCount--
		}
	}
	connMutex.Unlock()

	if len(names) > 1 {
		if teleportCount != 0 {
			app.SendNotification(Notification{
				Title:   fmt.Sprintf("Teleported %d users", teleportCount),
				Variant: "success",
			})
		}
		if teleportCount < len(names) {
			app.SendNotification(Notification{
				Title:   fmt.Sprintf("Failed to teleport %d users", len(names)-teleportCount),
				Variant: "error",
			})
		}
	} else {
		if teleportCount != 0 {
			app.SendNotification(Notification{
				Title:   "Teleported " + names[0],
				Variant: "success",
			})
		}
	}
}
