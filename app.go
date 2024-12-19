package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"strings"

	"github.com/gen2brain/beeep"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
}

var appContext context.Context
var app *App

// NewApp creates a new App application struct
func NewApp() *App {
	app = &App{}
	return app
}

// startup is called at application startup
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	appContext = ctx

	runtime.LogInfo(appContext, "Starting application")

	// Set window position
	if *config.WindowStartPositionX >= 0 && *config.WindowStartPositionY >= 0 {
		runtime.LogInfo(appContext, "Setting window position")
		runtime.WindowSetPosition(appContext, *config.WindowStartPositionX, *config.WindowStartPositionY)
	}

	// Set window size
	if *config.WindowStartSizeX >= 0 && *config.WindowStartSizeY >= 0 && runtime.WindowIsNormal(appContext) {
		runtime.LogInfo(appContext, "Setting window size")
		runtime.WindowSetSize(appContext, *config.WindowStartSizeX, *config.WindowStartSizeY)
	}

	// Initiate paths
	runtime.LogInfo(appContext, "Initiating paths")
	err := path_init()

	if err != nil {
		runtime.LogError(appContext, err.Error())
	}

	// Delete old log files
	runtime.LogInfo(appContext, "Deleting old log files")
	delete_old_logs()

	// Check if configPath exists
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		onFirstRun()
	}
}

// domReady is called after front-end resources have been loaded
func (a *App) domReady(ctx context.Context) {
	// Get version from wails.json
	var wailsDeccodedJSON map[string]interface{}
	err := json.Unmarshal(wailsJSON, &wailsDeccodedJSON)
	if err != nil {
		runtime.LogError(appContext, "Failed to decode wails.json: "+err.Error())
	}
	version = wailsDeccodedJSON["info"].(map[string]interface{})["productVersion"].(string)

	// Get launch args
	args = os.Args[1:]
	runtime.LogInfo(appContext, "Launch args: "+strings.Join(args, " "))

	// Show window
	runtime.WindowShow(appContext)
	runtime.Show(appContext)

	// Check updates
	if *config.CheckForUpdates {
		updateInfo := a.CheckForUpdate()

		if updateInfo.UpdateAvailable {
			a.SendNotification("settings.setting.update.update_available", "v"+updateInfo.CurrentVersion+" ⭢ "+updateInfo.LatestVersion, "__settings__update", "info")
		}
	}

	for i := 0; i < len(args); i++ {
		switch args[i] {
		case "--goto":
			if i+1 < len(args) {
				runtime.LogInfo(a.ctx, fmt.Sprintf("Goto: %s", args[i+1]))
				runtime.WindowExecJS(a.ctx, fmt.Sprintf(`window.goto("%s");`, args[i+1]))
				i++
			}
		case "--notify":
			if i+4 < len(args) {
				runtime.LogInfo(a.ctx, "Notify: "+args[i+1]+" "+args[i+2]+" "+args[i+3]+" "+args[i+4])
				a.SendNotification(args[i+1], args[i+2], args[i+3], args[i+4])
				i += 4
			}
		default:
			runtime.LogInfo(a.ctx, fmt.Sprintf("Pack path: %s", args[i]))
		}
	}
}

// beforeClose is called when the application is about to quit,
// either by clicking the window close button or calling runtime.Quit.
// Returning true will cause the application to continue, false will continue shutdown as normal.
func (a *App) beforeClose(ctx context.Context) (prevent bool) {
	if *config.SaveWindowStatus {
		if runtime.WindowIsMaximised(a.ctx) {
			var windowState = 2
			config.WindowStartState = &windowState
			runtime.LogInfo(a.ctx, "Setting window state to maximized")
		} else {
			var windowState = 0
			config.WindowStartState = &windowState
			runtime.LogInfo(a.ctx, "Setting window state to normal")
		}

		windowPositionX, windowPositionY := runtime.WindowGetPosition(a.ctx)
		if windowPositionX < 0 {
			windowPositionX = 0
		}
		if windowPositionY < 0 {
			windowPositionY = 0
		}
		config.WindowStartPositionX, config.WindowStartPositionY = &windowPositionX, &windowPositionY
		runtime.LogInfo(a.ctx, fmt.Sprintf("Setting window position to %d,%d", windowPositionX, windowPositionY))

		windowSizeX, windowSizeY := runtime.WindowGetSize(a.ctx)
		config.WindowStartSizeX, config.WindowStartSizeY = &windowSizeX, &windowSizeY
		runtime.LogInfo(a.ctx, fmt.Sprintf("Setting window size to %d,%d", windowSizeX, windowSizeY))
	}

	runtime.LogInfo(a.ctx, "Saving config")
	err := WriteConfig(configPath)

	if err != nil {
		runtime.LogError(a.ctx, err.Error())
		return false
	}

	runtime.LogInfo(a.ctx, "Saving config complete")

	// Disconnect
	app.DisconnectRcon()

	return false
}

// shutdown is called at application termination
func (a *App) shutdown(ctx context.Context) {
	// Perform your teardown here
}

// onSecondInstanceLaunch is called when the application is launched from a second instance
func (a *App) onSecondInstanceLaunch(secondInstanceData options.SecondInstanceData) {
	secondInstanceArgs := secondInstanceData.Args

	runtime.LogDebug(a.ctx, "User opened a second instance "+strings.Join(secondInstanceArgs, ","))
	runtime.LogDebug(a.ctx, "User opened a second instance from "+secondInstanceData.WorkingDirectory)

	runtime.WindowUnminimise(a.ctx)
	runtime.Show(a.ctx)
	go runtime.EventsEmit(a.ctx, "launchArgs", secondInstanceArgs)
}

func onFirstRun() {
	runtime.LogInfo(appContext, "First run detected")

	runtime.LogInfo(appContext, "Setting default system language")
	set_system_language()
}

func (a *App) GetVersion() string {
	return version
}

// Send notification
func (a *App) SendNotification(title string, message string, path string, variant string) {
	runtime.LogInfo(a.ctx, "Sending notification")

	if runtime.WindowIsNormal(a.ctx) || runtime.WindowIsMaximised(a.ctx) || runtime.WindowIsFullscreen(a.ctx) {
		if path != "" {
			runtime.WindowExecJS(a.ctx, `window.toast({
				title: "`+title+`", 
				description: "`+message+`",
				path: "`+path+`",
				variant: "`+variant+`"
				});`)
		} else {
			runtime.WindowExecJS(a.ctx, `window.toast({
				title: "`+title+`", 
				description: "`+message+`",
				variant: "`+variant+`"
				});`)
		}
	} else {
		runtime.WindowExecJS(a.ctx, `window.sendNotification("`+title+`", "`+message+`", "`+path+`", "`+variant+`")`)
	}
}

func (a *App) SendWindowsNotification(title string, message string, path string, variant string) {
	err := beeep.Notify(title, message, appIconPath)
	if err != nil {
		runtime.LogError(a.ctx, "Error sending notification: "+err.Error())
	}
}

func (a *App) RestartApplication(args []string) error {
	// Get the path to the current executable
	executable, err := os.Executable()
	if err != nil {
		runtime.LogError(a.ctx, "failed to get executable path: "+err.Error())
		return err
	}

	// Create the new process with the same arguments as the current process
	cmd := exec.Command(executable)
	cmd.Args = append(cmd.Args, args...)
	cmd.Env = os.Environ()
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	runtime.LogDebug(a.ctx, "Attempting to restart")

	// Start the new process
	if err := cmd.Start(); err != nil {
		runtime.LogError(a.ctx, "failed to start new process: "+err.Error())
		return err
	}

	runtime.LogDebug(a.ctx, "Successfully started new process")
	a.beforeClose(a.ctx)

	// Exit the current process
	os.Exit(0)
	return nil
}
