package main

import (
	"encoding/json"
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
	Name   string `json:"name"`
	Online bool   `json:"online"`
	Banned bool   `json:"banned"`
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
		app.SendNotification("RCON connection failed", err.Error(), "", "error")
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

	app.SendNotification("RCON connection established", "", "", "success")
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
	if strings.Contains(command, "banuser") && strings.Contains(res, "is now banned") {
		for i := range players {
			if players[i].Name == strings.Split(command, " ")[1] {
				players[i].Banned = true
				runtime.EventsEmit(app.ctx, "update-players", players)
				break
			}
		}
	} else if strings.Contains(command, "unbanuser") && strings.Contains(res, "is now un-banned") {
		for i := range players {
			if players[i].Name == strings.Split(command, " ")[1] {
				players[i].Banned = false
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
		app.SendNotification("Error encrypting credentials", err.Error(), "", "error")
		runtime.LogError(app.ctx, "Error encrypting credentials: "+err.Error())
		return false
	}

	err = writeJSON(credentialsPath, credentials)
	if err != nil {
		app.SendNotification("Error saving credentials", err.Error(), "", "error")
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
		app.SendNotification("Error decrypting credentials", err.Error(), "", "error")
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

	// Check if players have actually changed
	updatedPlayersJSON, _ := json.Marshal(updatedPlayers)
	currentPlayersJSON, _ := json.Marshal(players)

	if string(updatedPlayersJSON) == string(currentPlayersJSON) {
		// No changes detected; skip emitting event
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
		commandString := "banuser " + name
		if banIp {
			commandString += " -ip"
		}
		if reason != "" {
			commandString += " -r " + reason
		}
		res, err := conn.Execute(commandString)
		if err != nil {
			runtime.LogError(app.ctx, "Error banning user: "+err.Error())
			banCount--
		} else if res != "" && !strings.Contains(res, "is now banned") {
			runtime.LogError(app.ctx, "Error banning user: "+res)
			app.SendNotification("Error banning "+name, res, "", "error")
			banCount--
		} else if res != "" && strings.Contains(res, "is now banned") {
			player, ok := playerMap[name]
			if ok {
				player.Banned = true
			}
		}
	}
	connMutex.Unlock()

	if len(names) > 1 {
		app.SendNotification(fmt.Sprintf("Banned %d users", banCount), "", "", "success")
		if banCount < len(names) {
			app.SendNotification(fmt.Sprintf("Failed to ban %d users", len(names)-banCount), "", "", "error")
		}
	} else {
		if banCount == 0 {
			app.SendNotification("Failed to ban "+names[0], "", "", "error")
		} else {
			app.SendNotification("Banned "+names[0], "", "", "success")
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
		res, err := conn.Execute("unbanuser " + name)
		if err != nil {
			runtime.LogError(app.ctx, "Error unbanning user: "+err.Error())
			unbanCount--
		} else if res != "" && !strings.Contains(res, "is now un-banned") {
			runtime.LogError(app.ctx, "Error unbanning user: "+res)
			app.SendNotification("Error unbanning "+name, res, "", "error")
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
		app.SendNotification(fmt.Sprintf("Unbanned %d users", unbanCount), "", "", "success")
		if unbanCount < len(names) {
			app.SendNotification(fmt.Sprintf("Failed to unban %d users", len(names)-unbanCount), "", "", "error")
		}
	} else {
		if unbanCount == 0 {
			app.SendNotification("Failed to unban "+names[0], "", "", "error")
		} else {
			app.SendNotification("Unbanned "+names[0], "", "", "success")
		}
	}

	runtime.EventsEmit(app.ctx, "update-players", players)
}
