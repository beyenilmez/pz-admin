package config

import (
	"bytes"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"sync"
	"testing"

	"github.com/wailsapp/wails/v3/pkg/application"
)

func TestService_SetTheme(t *testing.T) {
	t.Run("persists valid value", func(t *testing.T) {
		service := newStartedConfigService(t)
		if err := service.SetTheme(ThemeDark); err != nil {
			t.Fatalf("SetTheme() error = %v", err)
		}
		want := defaults()
		want.Theme = ThemeDark
		assertConfigState(t, service, want)
	})
	t.Run("rejects invalid value without modifying state", func(t *testing.T) {
		service := newStartedConfigService(t)
		before := readConfigFile(t, configPath(service))
		if err := service.SetTheme("blue"); !errors.Is(err, ErrInvalidTheme) {
			t.Fatalf("SetTheme() error = %v, want error matching %v", err, ErrInvalidTheme)
		}
		assertConfigState(t, service, defaults())
		if after := readConfigFile(t, configPath(service)); !bytes.Equal(after, before) {
			t.Errorf("config file = %q, want unchanged %q", after, before)
		}
	})
}

func TestService_SetLanguage(t *testing.T) {
	t.Run("persists value", func(t *testing.T) {
		service := newStartedConfigService(t)
		if err := service.SetLanguage("tr-TR"); err != nil {
			t.Fatalf("SetLanguage() error = %v", err)
		}
		want := defaults()
		want.Language = "tr-TR"
		assertConfigState(t, service, want)
	})
	t.Run("rolls back after write failure", func(t *testing.T) {
		service := newStartedConfigService(t)
		originalPath := configPath(service)
		before := readConfigFile(t, originalPath)
		service.dir = filepath.Join(t.TempDir(), "blocker")
		if err := os.WriteFile(service.dir, nil, 0o600); err != nil {
			t.Fatalf("create directory blocker: %v", err)
		}
		if err := service.SetLanguage("tr-TR"); err == nil {
			t.Fatal("SetLanguage() error = nil, want write error")
		}
		if got, want := service.Config(), defaults(); got != want {
			t.Errorf("Config() = %+v, want rolled back %+v", got, want)
		}
		if after := readConfigFile(t, originalPath); !bytes.Equal(after, before) {
			t.Errorf("config file = %q, want unchanged %q", after, before)
		}
	})
}

func TestService_SetDownloadUpdatesOnStartup(t *testing.T) {
	service := newStartedConfigService(t)
	if !service.Config().DownloadUpdatesOnStartup {
		t.Fatal("update checks should default to enabled")
	}
	for _, enabled := range []bool{false, true} {
		if err := service.SetDownloadUpdatesOnStartup(enabled); err != nil {
			t.Fatal(err)
		}
		reloaded := newService(service.dir)
		startConfigService(t, reloaded)
		want := defaults()
		want.DownloadUpdatesOnStartup = enabled
		assertConfigState(t, reloaded, want)
	}
}

func TestService_Update(t *testing.T) {
	service := newStartedConfigService(t)
	var waitGroup sync.WaitGroup
	errs := make([]error, 20)
	for i := range errs {
		waitGroup.Add(1)
		go func(index int) {
			defer waitGroup.Done()
			if index%2 == 0 {
				errs[index] = service.SetTheme(ThemeDark)
			} else {
				errs[index] = service.SetLanguage("tr-TR")
			}
		}(i)
	}
	waitGroup.Wait()
	for i, err := range errs {
		if err != nil {
			t.Errorf("update %d error = %v", i, err)
		}
	}
	assertConfigState(t, service, Config{Theme: ThemeDark, Language: "tr-TR", DownloadUpdatesOnStartup: true})
}

func TestService_ServiceStartup(t *testing.T) {
	t.Run("leaves initial language unset for missing file", func(t *testing.T) {
		service := newStartedConfigService(t)
		assertConfigState(t, service, defaults())
	})
	t.Run("preserves existing English settings", func(t *testing.T) {
		service := newConfigServiceWithFile(t, []byte(`{"theme":"system","language":"en-US"}`))
		startConfigService(t, service)
		assertConfigState(t, service, Config{Theme: ThemeSystem, Language: "en-US", DownloadUpdatesOnStartup: true})
	})
	t.Run("loads valid file", func(t *testing.T) {
		want := Config{Theme: ThemeDark, Language: "tr-TR"}
		data, err := json.Marshal(want)
		if err != nil {
			t.Fatalf("Marshal() error = %v", err)
		}
		service := newConfigServiceWithFile(t, data)
		startConfigService(t, service)
		if got := service.Config(); got != want {
			t.Errorf("Config() = %+v, want %+v", got, want)
		}
	})
	for _, test := range []struct {
		name string
		data []byte
	}{
		{name: "recovers corrupt JSON", data: []byte("not json")},
		{name: "recovers invalid values", data: []byte(`{"theme":"blue","language":"en-US"}`)},
	} {
		t.Run(test.name, func(t *testing.T) {
			service := newConfigServiceWithFile(t, test.data)
			startConfigService(t, service)
			assertConfigState(t, service, defaults())
			if got := readConfigFile(t, configPath(service)+configBakExt); !bytes.Equal(got, test.data) {
				t.Errorf("backup = %q, want %q", got, test.data)
			}
		})
	}
	t.Run("uses defaults for unreadable file", func(t *testing.T) {
		dir := t.TempDir()
		if err := os.MkdirAll(filepath.Join(dir, configFileName), 0o700); err != nil {
			t.Fatalf("create unreadable config fixture: %v", err)
		}
		service := newService(dir)
		startConfigService(t, service)
		if got, want := service.Config(), defaults(); got != want {
			t.Errorf("Config() = %+v, want %+v", got, want)
		}
		if _, err := os.Stat(configPath(service) + configBakExt); !os.IsNotExist(err) {
			t.Errorf("backup stat error = %v, want not exist", err)
		}
	})
}

func configPath(service *Service) string { return filepath.Join(service.dir, configFileName) }

func startConfigService(t *testing.T, service *Service) {
	t.Helper()
	if err := service.ServiceStartup(t.Context(), application.ServiceOptions{}); err != nil {
		t.Fatalf("ServiceStartup() error = %v", err)
	}
}

func newStartedConfigService(t *testing.T) *Service {
	t.Helper()
	service := newService(t.TempDir())
	startConfigService(t, service)
	return service
}

func newConfigServiceWithFile(t *testing.T, data []byte) *Service {
	t.Helper()
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, configFileName), data, 0o600); err != nil {
		t.Fatalf("write config fixture: %v", err)
	}
	return newService(dir)
}

func assertConfigState(t *testing.T, service *Service, want Config) {
	t.Helper()
	if got := service.Config(); got != want {
		t.Errorf("Config() = %+v, want %+v", got, want)
	}
	if got := readDiskConfig(t, configPath(service)); got != want {
		t.Errorf("persisted config = %+v, want %+v", got, want)
	}
}

func readDiskConfig(t *testing.T, path string) Config {
	t.Helper()
	config := defaults()
	if err := json.Unmarshal(readConfigFile(t, path), &config); err != nil {
		t.Fatalf("Unmarshal() error = %v", err)
	}
	return config
}

func readConfigFile(t *testing.T, path string) []byte {
	t.Helper()
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("ReadFile() error = %v", err)
	}
	return data
}
