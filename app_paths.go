package main

import (
	"errors"
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

var appFolder string

var logsFolder string
var savedConfigFolder string
var tempFolder string
var externalFolder string
var configPath string
var appIconPath string
var credentialsPath string

func path_init() error {
	appData, err := os.UserConfigDir()
	if err != nil {
		return errors.New("Could not find user config directory: " + err.Error())
	}
	runtime.LogDebug(appContext, "Found user config directory: "+appData)

	appFolder = filepath.Join(appData, "pz-admin")

	logsFolder = filepath.Join(appFolder, "logs")
	savedConfigFolder = filepath.Join(appFolder, "savedconfigs")
	tempFolder = filepath.Join(appFolder, "temp")
	externalFolder = filepath.Join(appFolder, "external")

	configPath = filepath.Join(appFolder, "config.json")
	appIconPath = filepath.Join(appFolder, "appicon.png")
	credentialsPath = filepath.Join(appFolder, "credentials.json")

	runtime.LogTrace(appContext, "Attempting to create folders")
	err = create_folder(appFolder)
	if err != nil {
		return err
	}

	err = create_folder(logsFolder)
	if err != nil {
		return err
	}
	err = create_folder(savedConfigFolder)
	if err != nil {
		return err
	}
	err = create_folder(tempFolder)
	if err != nil {
		return err
	}
	err = create_folder(externalFolder)
	if err != nil {
		return err
	}

	runtime.LogTrace(appContext, "Creating folders complete")

	runtime.LogTrace(appContext, "Attempting to create appicon")

	// Create icon from embedded appIcon if it exists
	if _, err := os.Stat(appIconPath); os.IsNotExist(err) {
		runtime.LogTrace(appContext, "appicon not found, creating from embedded appIcon")
		err = os.WriteFile(appIconPath, appIcon, 0o644)
		if err != nil {
			return err
		}
	}
	runtime.LogTrace(appContext, "Creating appicon complete")

	runtime.LogTrace(appContext, "Path initialization complete")

	return nil
}

func get_logs_folder() (string, error) {
	appData, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	logsFolder = filepath.Join(appData, "pz-admin", "logs")

	// Create folder if it doesn't exist
	if _, err := os.Stat(logsFolder); os.IsNotExist(err) {
		err = os.MkdirAll(logsFolder, 0o755)
		if err != nil {
			return "", err
		}
	}
	return logsFolder, nil
}

func get_config_path() string {
	appData, err := os.UserConfigDir()
	if err != nil {
		return ""
	}
	configPath = filepath.Join(appData, "pz-admin", "config.json")

	return configPath
}
