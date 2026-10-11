// Package migration imports settings, the saved server and player history from PZ Admin v1.
package migration

import (
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"

	"github.com/beyenilmez/pz-admin/internal/appdata"
	"github.com/beyenilmez/pz-admin/internal/third_party/tailscale.com/atomicfile"
)

const markerName = ".migrated-to-v2"

// V1 attempts migration once, preserving existing data and marking the legacy directory.
func V1() error {
	legacyRoot, err := os.UserConfigDir()
	if err != nil {
		return err
	}
	return importV1(filepath.Join(legacyRoot, "pz-admin"), appdata.ConfigDir(), appdata.DataDir())
}

func importV1(legacyDir, configDir, dataDir string) (err error) {
	markerPath := filepath.Join(legacyDir, markerName)
	if _, err := os.Lstat(markerPath); !errors.Is(err, os.ErrNotExist) {
		if err == nil {
			slog.Debug("v1 migration skipped", "reason", "already attempted")
		}
		return err
	}
	if _, err := os.Stat(legacyDir); errors.Is(err, os.ErrNotExist) {
		slog.Debug("v1 migration skipped", "reason", "no v1 directory")
		return nil
	} else if err != nil {
		return err
	}
	// Record the attempt even if an import fails, but do not create a v1 directory.
	defer func() {
		if markerErr := os.WriteFile(markerPath, nil, 0o600); markerErr != nil {
			err = errors.Join(err, fmt.Errorf("mark v1 migration attempted: %w", markerErr))
		}
	}()
	configErr := importConfig(legacyDir, configDir)
	if configErr != nil {
		configErr = fmt.Errorf("import v1 settings: %w", configErr)
	}
	serverErr := importServer(legacyDir, configDir, dataDir)
	if serverErr != nil {
		serverErr = fmt.Errorf("import v1 server and player history: %w", serverErr)
	}
	return errors.Join(configErr, serverErr)
}

func writeJSON(path string, value any) error {
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return atomicfile.WriteFile(path, data, 0o600)
}
