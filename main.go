package main

import (
	"embed"
	"log"
	"os"
	"path"
	"time"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/logger"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/linux"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed build/appicon.png
var appIcon []byte

//go:embed wails.json
var wailsJSON []byte

var version string
var args []string

func main() {
	// Create an instance of the app structure
	app := NewApp()

	// Config
	err := config_init()
	if err != nil {
		log.Println(err)
	}

	// Logger
	var fileLogger Logger

	if *config.EnableLogging {
		logsFolder, err = get_logs_folder()
		if err != nil {
			log.Println(err)
		}

		logFile := path.Join(logsFolder, time.Now().Format("2006-01-02_15-04-05")+".log")
		fileLogger = NewLogger(logFile)
	}

	// Window State
	windowsStateInt := *config.WindowStartState
	windowState := options.Normal

	switch windowsStateInt {
	case 1:
		windowState = options.Minimised
	case 2:
		windowState = options.Maximised
	case 3:
		windowState = options.Fullscreen
	}

	// Window Effect
	windowEffectInt := *config.WindowEffect
	windowEffect := windows.Auto
	windowTransparent := true

	switch windowEffectInt {
	case 1:
		windowEffect = windows.None
		windowTransparent = false
	case 2:
		windowEffect = windows.Mica
	case 3:
		windowEffect = windows.Acrylic
	case 4:
		windowEffect = windows.Tabbed
	}

	// Find user config dir
	appData, err := os.UserConfigDir()
	if err != nil {
		log.Println(err)
	}

	// Create application with options
	err = wails.Run(&options.App{
		Title:             "PZ Admin",
		Width:             1280,
		Height:            800,
		MinWidth:          1023,
		MinHeight:         768,
		DisableResize:     false,
		Frameless:         !*config.UseSystemTitleBar,
		StartHidden:       true,
		HideWindowOnClose: false,
		BackgroundColour:  &options.RGBA{R: 255, G: 255, B: 255, A: 255},
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		Menu:               nil,
		Logger:             fileLogger,
		LogLevel:           logger.TRACE,
		LogLevelProduction: logger.TRACE,
		OnStartup:          app.startup,
		OnDomReady:         app.domReady,
		OnBeforeClose:      app.beforeClose,
		OnShutdown:         app.shutdown,
		WindowStartState:   windowState,
		SingleInstanceLock: &options.SingleInstanceLock{
			UniqueId:               "95c3e445-825c-4e4b-9b48-2ef44dd45583",
			OnSecondInstanceLaunch: app.onSecondInstanceLaunch,
		},
		Bind: []interface{}{
			app,
		},
		// Windows platform specific options
		Windows: &windows.Options{
			WebviewIsTransparent: windowTransparent,
			WindowIsTranslucent:  windowTransparent,
			DisableWindowIcon:    false,
			BackdropType:         windowEffect,
			// DisableFramelessWindowDecorations: false,
			WebviewUserDataPath: path.Join(appData, "pz-admin"),
			ZoomFactor:          1.0,
			DisablePinchZoom:    true,
		},
		Mac: &mac.Options{
			TitleBar: &mac.TitleBar{
				TitlebarAppearsTransparent: true,
				HideTitle:                  true,
				HideTitleBar:               true,
				FullSizeContent:            true,
				UseToolbar:                 false,
				HideToolbarSeparator:       true,
			},
			Appearance:           mac.DefaultAppearance,
			WebviewIsTransparent: windowTransparent,
			WindowIsTranslucent:  windowTransparent,
			Preferences: &mac.Preferences{
				FullscreenEnabled: mac.Enabled,
			},
		},
		Linux: &linux.Options{
			WindowIsTranslucent: windowTransparent,
			WebviewGpuPolicy:    linux.WebviewGpuPolicyAlways,
			ProgramName:         "pz-admin",
		},
	})

	if err != nil {
		log.Fatal(err)
	}
}
