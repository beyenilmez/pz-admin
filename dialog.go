package main

import (
	"os/exec"
	"strings"

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
		a.SendNotification("", "settings.there_was_an_error_saving_the_config", "", "error")
		return
	}

	runtime.LogInfo(a.ctx, "Config saved to "+path)
	path = strings.ReplaceAll(path, "\\", "\\\\")
	a.SendNotification("", "settings.config_saved", path, "success")
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

func (a *App) OpenFileInExplorer(path string) {
	runtime.LogInfo(a.ctx, "Opening file in explorer: "+path)

	cmd := exec.Command(`explorer`, `/select,`, path)
	cmd.Run()
}
