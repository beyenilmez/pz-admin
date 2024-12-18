package main

import (
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

func (app *App) ConnectRcon(ip, port, password string) bool {
	if ip == "" || port == "" || password == "" {
		return false
	}

	connMutex.Lock()
	defer connMutex.Unlock()

	var err error
	conn, err = rcon.Dial(ip+":"+port, password)
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
		case <-time.After(5 * time.Second):
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
