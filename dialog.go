package main

import (
	"os/exec"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type ServerMessage struct {
	Message    string         `json:"message"`
	LineColors map[int]string `json:"lineColors"`
}

type ImportOptionsResponse struct {
	Options PzOptions `json:"options"`
	Success bool      `json:"success"`
}

func (a *App) SaveConfigDialog() {
	path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:                "Save configuration",
		DefaultDirectory:     savedConfigFolder,
		DefaultFilename:      "config.json",
		CanCreateDirectories: true,
		Filters: []runtime.FileFilter{
			{
				DisplayName: "JSON",
				Pattern:     "*.json",
			},
		},
	})

	if err != nil {
		runtime.LogWarning(a.ctx, err.Error())
		return
	}

	err = WriteConfig(path)

	if err != nil {
		if path == "" {
			runtime.LogInfo(a.ctx, "No path given, not saving config")
			return
		}
		runtime.LogWarning(a.ctx, err.Error())
		app.SendNotification(Notification{
			Message: "settings.there_was_an_error_saving_the_config",
			Variant: "error",
		})
		return
	}

	runtime.LogInfo(a.ctx, "Config saved to "+path)
	app.SendNotification(Notification{
		Message: "settings.config_saved",
		Path:    path,
		Variant: "success",
	})
}

func (a *App) GetLoadConfigPath() string {
	path, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title:                "Load configuration",
		DefaultDirectory:     savedConfigFolder,
		CanCreateDirectories: true,
		Filters: []runtime.FileFilter{
			{
				DisplayName: "JSON",
				Pattern:     "*.json",
			},
		},
	})

	if err != nil {
		runtime.LogWarning(a.ctx, err.Error())
		return ""
	}

	return path
}

func (a *App) SaveItemsDialog(items []ItemRecord) {
	path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:                "Save items",
		DefaultDirectory:     savedItemsFolder,
		DefaultFilename:      "items.json",
		CanCreateDirectories: true,
		Filters: []runtime.FileFilter{
			{
				DisplayName: "JSON",
				Pattern:     "*.json",
			},
		},
	})

	if err != nil {
		runtime.LogWarning(a.ctx, err.Error())
		return
	}

	err = writeJSON(path, items)

	if err != nil {
		if path == "" {
			runtime.LogInfo(a.ctx, "No path given, not saving items")
			return
		}
		runtime.LogWarning(a.ctx, err.Error())
		app.SendNotification(Notification{
			Message: "There was an error saving the items",
			Variant: "error",
		})
		return
	}

	runtime.LogInfo(a.ctx, "Items saved to "+path)
	app.SendNotification(Notification{
		Message: "Items saved",
		Path:    path,
		Variant: "success",
	})
}

func (a *App) LoadItemsDialog() []ItemRecord {
	path, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title:                "Load items",
		DefaultDirectory:     savedItemsFolder,
		CanCreateDirectories: true,
		Filters: []runtime.FileFilter{
			{
				DisplayName: "JSON",
				Pattern:     "*.json",
			},
		},
	})

	if path == "" {
		runtime.LogInfo(a.ctx, "No path given, not loading the items")
		return nil
	}

	if err != nil {
		runtime.LogWarning(a.ctx, err.Error())
		app.SendNotification(Notification{
			Message: "There was an error loading the items",
			Variant: "error",
		})
		return nil
	}

	var items []ItemRecord
	err = readJSON(path, &items)
	if err != nil {
		runtime.LogWarning(a.ctx, err.Error())
		app.SendNotification(Notification{
			Message: "There was an error loading the items",
			Variant: "error",
		})
		return nil
	}

	return items
}

func (a *App) SaveMessagesDialog(message ServerMessage) {
	path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:                "Save message",
		DefaultDirectory:     savedMessagesFolder,
		DefaultFilename:      "message.json",
		CanCreateDirectories: true,
		Filters: []runtime.FileFilter{
			{
				DisplayName: "JSON",
				Pattern:     "*.json",
			},
		},
	})

	if err != nil {
		runtime.LogWarning(a.ctx, err.Error())
		return
	}

	err = writeJSON(path, message)

	if err != nil {
		if path == "" {
			runtime.LogInfo(a.ctx, "No path given, not saving the message")
			return
		}
		runtime.LogWarning(a.ctx, err.Error())
		app.SendNotification(Notification{
			Message: "There was an error saving the message",
			Variant: "error",
		})
		return
	}

	runtime.LogInfo(a.ctx, "Message saved to "+path)
	app.SendNotification(Notification{
		Message: "Message saved",
		Path:    path,
		Variant: "success",
	})
}

func (a *App) LoadMessageDialog() ServerMessage {
	path, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title:                "Load message",
		DefaultDirectory:     savedMessagesFolder,
		CanCreateDirectories: true,
		Filters: []runtime.FileFilter{
			{
				DisplayName: "JSON",
				Pattern:     "*.json",
			},
		},
	})

	if path == "" {
		runtime.LogInfo(a.ctx, "No path given, not loading the message")
		return ServerMessage{}
	}

	if err != nil {
		runtime.LogWarning(a.ctx, err.Error())
		app.SendNotification(Notification{
			Message: "There was an error loading the message",
			Variant: "error",
		})
		return ServerMessage{}
	}

	var message ServerMessage
	err = readJSON(path, &message)
	if err != nil {
		runtime.LogWarning(a.ctx, err.Error())
		app.SendNotification(Notification{
			Message: "There was an error loading the message",
			Variant: "error",
		})
		return ServerMessage{}
	}

	return message
}

func (a *App) ExportOptionsDialog(options PzOptions) {
	path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:                "Export options",
		DefaultDirectory:     savedOptionsFolder,
		DefaultFilename:      "options.json",
		CanCreateDirectories: true,
		Filters: []runtime.FileFilter{
			{
				DisplayName: "JSON",
				Pattern:     "*.json",
			},
		},
	})

	if err != nil {
		runtime.LogWarning(a.ctx, err.Error())
		return
	}

	err = writeJSON(path, options)

	if err != nil {
		if path == "" {
			runtime.LogInfo(a.ctx, "No path given, not saving the options")
			return
		}
		runtime.LogWarning(a.ctx, err.Error())
		app.SendNotification(Notification{
			Message: "There was an error exporting the options",
			Variant: "error",
		})
		return
	}

	runtime.LogInfo(a.ctx, "Options saved to "+path)
	app.SendNotification(Notification{
		Message: "Options exported",
		Path:    path,
		Variant: "success",
	})
}

func (a *App) ImportOptionsDialog() ImportOptionsResponse {
	path, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title:                "Import options",
		DefaultDirectory:     savedOptionsFolder,
		CanCreateDirectories: true,
		Filters: []runtime.FileFilter{
			{
				DisplayName: "JSON",
				Pattern:     "*.json",
			},
		},
	})

	if path == "" {
		runtime.LogInfo(a.ctx, "No path given, not loading the options")
		return ImportOptionsResponse{Success: false}
	}

	if err != nil {
		runtime.LogWarning(a.ctx, err.Error())
		app.SendNotification(Notification{
			Message: "There was an error importing the options",
			Variant: "error",
		})
		return ImportOptionsResponse{Success: false}

	}

	var options PzOptions
	err = readJSON(path, &options)
	if err != nil {
		runtime.LogWarning(a.ctx, err.Error())
		app.SendNotification(Notification{
			Message: "There was an error importing the options",
			Variant: "error",
		})
		return ImportOptionsResponse{Success: false}
	}

	return ImportOptionsResponse{Options: options, Success: true}
}

func (a *App) OpenFileInExplorer(path string) {
	runtime.LogInfo(a.ctx, "Opening file in explorer: "+path)

	cmd := exec.Command(`explorer`, `/select,`, path)
	cmd.Run()
}
