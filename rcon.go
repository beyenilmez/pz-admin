package main

import (
	"strings"

	"github.com/gorcon/rcon"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

var conn *rcon.Conn

func (app *App) ConnectRcon(ip, port, password string) bool {
	if (ip == "") || (port == "") || (password == "") {
		return false
	}

	var err error
	conn, err = rcon.Dial(ip+":"+port, password)
	if err != nil {
		runtime.LogError(app.ctx, "Error connecting to RCON: "+err.Error())
	}

	return err == nil
}

func (app *App) IsRconConnected() bool {
	return conn != nil
}

func (app *App) DisconnectRcon() bool {
	err := conn.Close()
	return err == nil
}

func (app *App) SendRconCommand(command string) (res string) {
	res, err := conn.Execute(command)
	if err != nil {
		runtime.LogError(app.ctx, "Error executing RCON command: "+err.Error())
		return ""
	}

	return res
}

func (app *App) GetAvailableCommands() []string {
	for conn == nil {
	}

	res, err := conn.Execute("help")
	if err != nil {
		runtime.LogError(app.ctx, "Error executing RCON command: "+err.Error())
		return nil
	}

	lines := strings.Split(res, "\n")
	var commands []string

	for _, line := range lines {
		if strings.HasPrefix(strings.TrimSpace(line), "* ") {
			parts := strings.SplitN(line, ":", 2)
			if len(parts) > 0 {
				command := strings.TrimSpace(strings.TrimPrefix(parts[0], "* "))
				commands = append(commands, command)
			}
		}
	}

	commands = append(commands, "removeadmin")

	return commands
}
