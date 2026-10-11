// Package config loads, validates, and persists the application's user
// configuration.
package config

import (
	"errors"
	"fmt"
	"slices"
	"strings"
)

// Config holds all user-facing application settings.
type Config struct {
	Theme                    string `json:"theme"`
	Language                 string `json:"language"`
	DownloadUpdatesOnStartup bool   `json:"downloadUpdatesOnStartup"`
}

// Theme values.
const (
	ThemeSystem = "system"
	ThemeDark   = "dark"
	ThemeLight  = "light"
)

var (
	themeNames = []string{ThemeSystem, ThemeDark, ThemeLight}

	// ErrInvalidTheme identifies an unsupported theme value.
	ErrInvalidTheme = errors.New("config: invalid theme")
)

// defaults returns the baseline configuration used at startup and during
// recovery.
func defaults() Config {
	return Config{
		Theme:                    ThemeSystem,
		Language:                 "",
		DownloadUpdatesOnStartup: true,
	}
}

// Validate checks that all fields contain supported values. It wraps the
// appropriate sentinel error for the first invalid field.
func (c Config) Validate() error {
	if !slices.Contains(themeNames, c.Theme) {
		return fmt.Errorf("%w: %q must be one of [%s]",
			ErrInvalidTheme, c.Theme, strings.Join(themeNames, ", "))
	}
	return nil
}
