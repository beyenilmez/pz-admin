package migration

import (
	"encoding/json"
	"errors"
	"log/slog"
	"os"
	"path/filepath"

	"github.com/beyenilmez/pz-admin/internal/config"
)

func importConfig(legacyDir, configDir string) error {
	path := filepath.Join(configDir, "config.json")
	if _, err := os.Lstat(path); !errors.Is(err, os.ErrNotExist) {
		if err == nil {
			slog.Debug("v1 settings import skipped", "reason", "v2 config exists")
		}
		return err
	}
	data, err := os.ReadFile(filepath.Join(legacyDir, "config.json"))
	if errors.Is(err, os.ErrNotExist) {
		slog.Debug("v1 settings import skipped", "reason", "no v1 config")
		return nil
	}
	if err != nil {
		return err
	}
	var old map[string]json.RawMessage
	if err := json.Unmarshal(data, &old); err != nil {
		return errors.New("invalid v1 configuration JSON")
	}
	// Omitted fields retain the defaults applied by the v2 config loader.
	settings := map[string]string{}
	var theme, language string
	if json.Unmarshal(old["theme"], &theme) == nil {
		switch theme {
		case config.ThemeSystem, config.ThemeLight, config.ThemeDark:
			settings["theme"] = theme
		}
	}
	if json.Unmarshal(old["language"], &language) == nil {
		switch language {
		case "en-US", "tr-TR", "uk-UA":
			settings["language"] = language
		case "ru-RU":
			settings["language"] = "ru"
		}
	}
	if err := writeJSON(path, settings); err != nil {
		return err
	}
	slog.Info("v1 settings import completed", "fields_imported", len(settings))
	return nil
}
