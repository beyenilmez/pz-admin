package main

import (
	"embed"
	"fmt"
	"log/slog"
	"os"
	"strings"
	"sync/atomic"

	"github.com/beyenilmez/pz-admin/internal/config"
	"github.com/beyenilmez/pz-admin/internal/console"
	"github.com/beyenilmez/pz-admin/internal/diagnostics"
	"github.com/beyenilmez/pz-admin/internal/logger"
	"github.com/beyenilmez/pz-admin/internal/migration"
	"github.com/beyenilmez/pz-admin/internal/notices"
	"github.com/beyenilmez/pz-admin/internal/options"
	"github.com/beyenilmez/pz-admin/internal/player"
	"github.com/beyenilmez/pz-admin/internal/profile"
	"github.com/beyenilmez/pz-admin/internal/serveraction"
	"github.com/beyenilmez/pz-admin/internal/session"
	"github.com/beyenilmez/pz-admin/internal/update"
	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
)

//go:embed VERSION
var rawVersion string

//go:embed LICENSE
var applicationLicense string

//go:embed .generated/licenses/THIRD-PARTY-NOTICES.json
var thirdPartyNotices string

// buildVersion returns the embedded application version.
func buildVersion() string {
	return strings.TrimSpace(rawVersion)
}

// Embed the built frontend for Wails' asset server.
//
//go:embed all:frontend/dist
var assets embed.FS

const mainWindowName = "main"

// main reports startup or runtime failures and exits with a nonzero status.
func main() {
	if err := run(); err != nil {
		fmt.Fprintf(os.Stderr, "pz-admin exited with error: %v\n", err)
		os.Exit(1)
	}
}

func run() error {
	lg, err := logger.New(logger.Options{})
	if err != nil {
		return fmt.Errorf("initialize logger: %w", err)
	}
	defer lg.Close()
	slog.SetDefault(lg.Logger)

	if lvl := os.Getenv("PZ_ADMIN_LOG"); lvl != "" {
		var level slog.Level
		if err := level.UnmarshalText([]byte(lvl)); err != nil {
			lg.Logger.Warn("invalid file log level", "setting", "PZ_ADMIN_LOG", "value", lvl, "err", err)
		} else {
			lg.LevelVar.Set(level)
			lg.Logger.Info("file log level overridden", "level", level)
		}
	}

	lg.Logger.Info("pz-admin starting",
		"version", buildVersion(),
	)

	if err := migration.V1(); err != nil {
		slog.Warn("could not import some v1 data", "err", err)
	}

	// Service instances
	configSvc := config.NewService()
	frontendLogSvc := logger.NewService()
	noticesSvc := notices.NewService(applicationLicense, thirdPartyNotices)
	playerSvc := player.NewService()
	profileSvc := profile.NewService(playerSvc)
	consoleSvc := console.NewService(playerSvc.ObserveConsoleCommand)
	optionsSvc := options.NewService()
	serverActionSvc := serveraction.NewService()
	sessionSvc := session.NewService(profileSvc, playerSvc, consoleSvc, optionsSvc, serverActionSvc)

	// Keep one instance per app identity; subsequent launches focus its main window.
	var started atomic.Bool
	app := application.New(application.Options{
		Name:        "PZ Admin",
		Description: "Project Zomboid server administration tool",
		Logger:      lg.Logger,
		SingleInstance: &application.SingleInstanceOptions{
			UniqueID: "com.bedirhanyenilmez.pzadmin",
			OnSecondInstanceLaunch: func(_ application.SecondInstanceData) {
				// During startup the first instance will show its window normally.
				if !started.Load() {
					return
				}
				application.InvokeAsync(func() {
					if window, ok := application.Get().Window.GetByName(mainWindowName); ok {
						window.UnMinimise()
						window.Show()
						window.Focus()
					}
				})
			},
		},
		Services: []application.Service{
			application.NewService(&diagnostics.Service{}),
			application.NewService(configSvc),
			application.NewService(frontendLogSvc),
			application.NewService(noticesSvc),
			application.NewService(playerSvc),
			application.NewService(profileSvc),
			application.NewService(consoleSvc),
			application.NewService(optionsSvc),
			application.NewService(serverActionSvc),
			application.NewService(sessionSvc),
		},
		Assets: application.AssetOptions{
			Handler:        application.AssetFileServerFS(assets),
			DisableLogging: true,
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
		Linux: application.LinuxOptions{
			// Match the desktop file; Wails also uses this as the Wayland program name.
			ApplicationID: "com.bedirhanyenilmez.pzadmin",
		},
	})
	if err := update.Setup(app, buildVersion(), configSvc); err != nil {
		return fmt.Errorf("updater setup: %w", err)
	}
	app.Event.OnApplicationEvent(events.Common.ApplicationStarted, func(_ *application.ApplicationEvent) {
		application.InvokeAsync(func() {
			envInfo := app.Env.Info()
			attributes := []any{
				"os", envInfo.OS,
				"arch", envInfo.Arch,
				"debug", envInfo.Debug,
			}
			if envInfo.OSInfo != nil {
				attributes = append(attributes, slog.Group("os_details",
					"name", envInfo.OSInfo.Name,
					"version", envInfo.OSInfo.Version,
				))
			}
			if len(envInfo.PlatformInfo) > 0 {
				attributes = append(attributes, "platform", envInfo.PlatformInfo)
			}
			app.Logger.Info("environment information", attributes...)

			// Native theme detection and saved settings are ready only after startup.
			theme := configSvc.Config().Theme
			background := application.NewRGB(255, 255, 255)
			if theme == config.ThemeDark || (theme == config.ThemeSystem && app.Env.IsDarkMode()) {
				// Mantine's default dark body background; the frontend keeps it in sync.
				background = application.NewRGB(36, 36, 36)
			}

			// Use a named, resizable main window with native window decorations.
			app.Window.NewWithOptions(application.WebviewWindowOptions{
				Name:      mainWindowName,
				Title:     "PZ Admin",
				Width:     1200,
				Height:    757,
				MinWidth:  992,
				MinHeight: 568,
				Mac: application.MacWindow{
					Backdrop: application.MacBackdropNormal,
					TitleBar: application.MacTitleBarDefault,
				},
				BackgroundColour: background,
				URL:              "/",
				Permissions: map[application.PermissionType]application.Permission{
					application.PermissionMicrophone:    application.PermissionDeny,
					application.PermissionCamera:        application.PermissionDeny,
					application.PermissionGeolocation:   application.PermissionDeny,
					application.PermissionNotifications: application.PermissionDeny,
					application.PermissionClipboardRead: application.PermissionDeny,
				},
			})
			started.Store(true)
		})
	})

	// Run until the app exits; Wails invokes service shutdown hooks on exit.
	if err := app.Run(); err != nil {
		return fmt.Errorf("app run: %w", err)
	}
	lg.Logger.Info("pz-admin stopped")
	return nil
}
