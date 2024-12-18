package main

import (
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
