package migration

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"github.com/beyenilmez/pz-admin/internal/config"
)

func TestImportConfig(t *testing.T) {
	for _, tc := range []struct {
		name, input, theme, language string
	}{
		{"English", `{"theme":"dark","language":"en-US","checkForUpdates":false}`, "dark", "en-US"},
		{"Turkish", `{"theme":"light","language":"tr-TR"}`, "light", "tr-TR"},
		{"Ukrainian", `{"theme":"system","language":"uk-UA"}`, "system", "uk-UA"},
		{"Russian", `{"language":"ru-RU"}`, "", "ru"},
		{"invalid values", `{"theme":"custom","language":"invalid"}`, "", ""},
		{"invalid theme type", `{"theme":42,"language":"tr-TR"}`, "", "tr-TR"},
		{"invalid language type", `{"theme":"dark","language":false}`, "dark", ""},
		{"null fields", `{"theme":null,"language":null}`, "", ""},
	} {
		t.Run(tc.name, func(t *testing.T) {
			legacy, destination := t.TempDir(), t.TempDir()
			path := filepath.Join(legacy, "config.json")
			if err := os.WriteFile(path, []byte(tc.input), 0o600); err != nil {
				t.Fatal(err)
			}
			// Settings import does not require saved credentials.
			if err := importV1(legacy, destination, t.TempDir()); err != nil {
				t.Fatal(err)
			}
			data, err := os.ReadFile(filepath.Join(destination, "config.json"))
			if err != nil {
				t.Fatal(err)
			}
			var settings map[string]string
			if err = json.Unmarshal(data, &settings); err != nil {
				t.Fatal(err)
			}
			if settings["theme"] != tc.theme || settings["language"] != tc.language {
				t.Fatalf("unexpected settings: %v", settings)
			}
			if _, exists := settings["downloadUpdatesOnStartup"]; exists {
				t.Fatal("update preference was imported")
			}
			// The config loader unmarshals over defaults rather than a zero-value config.
			loaded := config.Config{Theme: config.ThemeSystem, DownloadUpdatesOnStartup: true}
			if err = json.Unmarshal(data, &loaded); err != nil || loaded.Validate() != nil || !loaded.DownloadUpdatesOnStartup {
				t.Fatal("import does not preserve valid defaults")
			}
			if err = importConfig(legacy, destination); err != nil {
				t.Fatal(err)
			}
			original, err := os.ReadFile(path)
			if err != nil || string(original) != tc.input {
				t.Fatal("legacy config was changed")
			}
		})
	}
}

func TestImportConfigPreservesExistingFile(t *testing.T) {
	legacy, destination := t.TempDir(), t.TempDir()
	if err := writeJSON(filepath.Join(legacy, "config.json"), map[string]string{"theme": "light"}); err != nil {
		t.Fatal(err)
	}
	path := filepath.Join(destination, "config.json")
	original := []byte(`{"theme":"dark","downloadUpdatesOnStartup":false}`)
	if err := os.WriteFile(path, original, 0o600); err != nil {
		t.Fatal(err)
	}
	if err := importConfig(legacy, destination); err != nil {
		t.Fatal(err)
	}
	data, err := os.ReadFile(path)
	if err != nil || string(data) != string(original) {
		t.Fatal("existing config was changed")
	}
}
