//go:build !windows
// +build !windows

package main

func notification_init() error {
	return nil
}

func SendSystemNotification(notification Notification) error {
	return nil
}
