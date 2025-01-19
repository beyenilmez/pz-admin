package main

import (
	"fmt"
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
			Message: "admin_panel.tabs.players.dialogs.additem.notifications.error_saving_items",
			Variant: "error",
		})
		return
	}

	runtime.LogInfo(a.ctx, "Items saved to "+path)
	app.SendNotification(Notification{
		Message: "admin_panel.tabs.players.dialogs.additem.notifications.items_saved",
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
			Message: "admin_panel.tabs.players.dialogs.additem.notifications.error_loading_items",
			Variant: "error",
		})
		return nil
	}

	var items []ItemRecord
	err = readJSON(path, &items)
	if err != nil {
		runtime.LogWarning(a.ctx, err.Error())
		app.SendNotification(Notification{
			Message: "admin_panel.tabs.players.dialogs.additem.notifications.error_loading_items",
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
			Message: "tools.message_editor.notifications.error_saving_message",
			Variant: "error",
		})
		return
	}

	runtime.LogInfo(a.ctx, "Message saved to "+path)
	app.SendNotification(Notification{
		Message: "tools.message_editor.notifications.message_saved",
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
			Message: "tools.message_editor.notifications.error_loading_message",
			Variant: "error",
		})
		return ServerMessage{}
	}

	var message ServerMessage
	err = readJSON(path, &message)
	if err != nil {
		runtime.LogWarning(a.ctx, err.Error())
		app.SendNotification(Notification{
			Message: "tools.message_editor.notifications.error_loading_message",
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
			Message: "admin_panel.tabs.options.notifications.error_exporting_options",
			Variant: "error",
		})
		return
	}

	runtime.LogInfo(a.ctx, "Options saved to "+path)
	app.SendNotification(Notification{
		Message: "admin_panel.tabs.options.notifications.options_exported",
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
			Message: "admin_panel.tabs.options.notifications.error_importing_options",
			Variant: "error",
		})
		return ImportOptionsResponse{Success: false}

	}

	var options PzOptions
	err = readJSON(path, &options)
	if err != nil {
		runtime.LogWarning(a.ctx, err.Error())
		app.SendNotification(Notification{
			Message: "admin_panel.tabs.options.notifications.error_importing_options",
			Variant: "error",
		})
		return ImportOptionsResponse{Success: false}
	}

	return ImportOptionsResponse{Options: options, Success: true}
}

func (a *App) OpenFileInExplorer(path string) {
	os := a.GetOs()
	if os == "windows" {
		runtime.LogInfo(a.ctx, "Opening file in explorer: "+path)

		cmd := exec.Command(`explorer`, `/select,`, path)
		cmd.Run()
	} else if os == "darwin" {
		runtime.LogInfo(a.ctx, "Opening file in finder: "+path)

		cmd := exec.Command(`open`, `-R`, path)
		cmd.Run()
	} else if os == "linux" {
		runtime.LogInfo(a.ctx, "Opening file with dbus: "+path)
		cmd := exec.Command("bash", "-c", fmt.Sprintf(`dbus-send --print-reply --dest=org.freedesktop.FileManager1 /org/freedesktop/FileManager1 org.freedesktop.FileManager1.ShowItems array:string:"file://%s" string:""`, path))
		err := cmd.Run()
		if err == nil {
			return
		}

		runtime.LogInfo(a.ctx, "Opening file in nautilus: "+path)
		cmd = exec.Command(`nautilus`, path)
		err = cmd.Run()
		if err == nil {
			return
		}

		runtime.LogInfo(a.ctx, "Opening file in xdg-open: "+path)
		cmd = exec.Command(`xdg-open`, path)
		err = cmd.Run()
		if err == nil {
			return
		}

		runtime.LogInfo(a.ctx, "Opening file in gnome-open: "+path)
		cmd = exec.Command(`gnome-open`, path)
		err = cmd.Run()

	}
}
