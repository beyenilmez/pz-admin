package main

import (
	"os/exec"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

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

func (a *App) OpenFileInExplorer(path string) {
	runtime.LogInfo(a.ctx, "Opening file in explorer: "+path)

	cmd := exec.Command(`explorer`, `/select,`, path)
	cmd.Run()
}
