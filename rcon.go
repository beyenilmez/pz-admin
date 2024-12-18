package main

import (
	"os"
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

	return res
}

// watchConnection monitors the RCON connection and logs if it is lost
func (app *App) watchConnection() {
	for {
		select {
		case <-stopWatching:
			// Stop signal received, exit the goroutine
			runtime.LogInfo(app.ctx, "Stopping RCON connection watcher")
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
			_, err := conn.Execute("watch")
			if err != nil {
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
