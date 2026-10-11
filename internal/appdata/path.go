// Package appdata resolves the application's persistent data locations.
package appdata

import (
	"path/filepath"

	"github.com/adrg/xdg"
)

const directoryName = "com.bedirhanyenilmez.pzadmin"

// ConfigDir returns the application's platform-specific configuration directory.
func ConfigDir() string {
	return filepath.Join(xdg.ConfigHome, directoryName)
}

// DataDir returns the application's platform-specific data directory.
func DataDir() string {
	return filepath.Join(xdg.DataHome, directoryName)
}

// StateDir returns the application's platform-specific state directory.
func StateDir() string {
	return filepath.Join(xdg.StateHome, directoryName)
}
