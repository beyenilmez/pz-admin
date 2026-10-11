package update

import (
	"context"
	"crypto/ed25519"
	"crypto/sha512"
	_ "embed"
	"errors"
	"fmt"
	"net/http"
	"runtime"
	"time"

	"github.com/beyenilmez/pz-admin/internal/config"
	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
	"github.com/wailsapp/wails/v3/pkg/updater"
	"github.com/wailsapp/wails/v3/pkg/updater/providers/endpoint"
)

const manifestURL = "https://github.com/beyenilmez/pz-admin/releases/latest/download/manifest.json"

//go:embed updater.pub
var publicKey []byte

// Setup checks for updates once after startup on Windows and macOS.
func Setup(app *application.App, version string, configSvc *config.Service) error {
	if runtime.GOOS != "windows" && runtime.GOOS != "darwin" {
		app.Logger.Debug("startup update skipped", "reason", "unsupported platform", "os", runtime.GOOS)
		return nil
	}
	if app.Env.Info().Debug {
		app.Logger.Debug("startup update skipped", "reason", "development build")
		return nil
	}
	provider, err := endpoint.New(endpoint.Config{
		URL:        manifestURL,
		Channel:    "stable",
		HTTPClient: &http.Client{Timeout: 10 * time.Minute},
	})
	if err != nil {
		return err
	}
	if err := app.Updater.Init(updater.Config{
		CurrentVersion: version,
		PublicKey:      publicKey,
		Providers:      []updater.Provider{verifiedProvider{provider}},
	}); err != nil {
		return err
	}
	app.Event.OnApplicationEvent(events.Common.ApplicationStarted, func(_ *application.ApplicationEvent) {
		if !configSvc.Config().DownloadUpdatesOnStartup {
			app.Logger.Debug("startup update skipped", "reason", "disabled in settings")
			return
		}
		ctx := app.Context()
		go func() {
			if err := downloadOnStartup(ctx, app); err != nil && ctx.Err() == nil {
				app.Logger.Error("update failed", "error", err)
			}
		}()
	})
	return nil
}

// Check silently first; Wails' full flow opens a window even when already up to date.
func downloadOnStartup(ctx context.Context, app *application.App) error {
	app.Logger.Info("checking for updates")
	release, err := app.Updater.Check(ctx)
	if err != nil {
		return fmt.Errorf("check for updates: %w", err)
	}
	if ctx.Err() != nil {
		return ctx.Err()
	}
	if release == nil {
		app.Logger.Info("no update available")
		return nil
	}
	app.Logger.Info("update available; opening updater", "version", release.Version)
	if err := app.Updater.CheckAndInstall(ctx); err != nil {
		return fmt.Errorf("run updater: %w", err)
	}
	return nil
}

// Reject unsigned updates; Wails verifies the signature against our embedded key.
type verifiedProvider struct{ updater.Provider }

func (p verifiedProvider) Check(ctx context.Context, req updater.CheckRequest) (*updater.Release, error) {
	release, err := p.Provider.Check(ctx, req)
	if err != nil || release == nil {
		return release, err
	}
	v := release.Verification
	if v == nil || v.DigestAlgo != "sha512" || len(v.Digest) != sha512.Size {
		return nil, errors.New("release is missing its SHA-512 checksum")
	}
	if v.SignatureAlgo != "ed25519ph" || len(v.Signature) != ed25519.SignatureSize {
		return nil, errors.New("release is missing its Ed25519ph signature")
	}
	return release, nil
}
