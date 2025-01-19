//go:build windows
// +build windows

package main

import (
	"github.com/daifiyum/wintray"
	W "github.com/daifiyum/wintray/windows"

	r "runtime"
)

var w *wintray.App

func notification_init() error {
	// Register AUMID in the registry
	W.RegisterAUMID("pz-admin", "PZ Admin", appIconPath)
	// Bind the current process to the registered AUMID
	W.SetAUMID("pz-admin")

	r.LockOSThread()
	defer r.UnlockOSThread()
	w = wintray.New("pz-admin", appIconPath)
	return w.Run()
}

func SendSystemNotification(notification Notification) error {
	return w.ShowTrayNotification(notification.Title, notification.Message)
}
