package config

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"sync"

	"github.com/beyenilmez/pz-admin/internal/appdata"
	"github.com/beyenilmez/pz-admin/internal/third_party/tailscale.com/atomicfile"
	"github.com/wailsapp/wails/v3/pkg/application"
)

const (
	configFileName = "config.json"
	configBakExt   = ".bak"
)

// Service is the Wails v3 service for application configuration. It loads the
// configuration at startup and persists every update atomically.
type Service struct {
	mu  sync.RWMutex
	cfg Config
	dir string
}

// NewService returns a config service ready to be registered with Wails.
func NewService() *Service {
	return &Service{}
}

// newService creates a service with an explicit config directory.
func newService(dir string) *Service {
	return &Service{dir: dir}
}

// Config returns a copy of the current configuration.
func (s *Service) Config() Config {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.cfg
}

// SetTheme sets the theme to ThemeSystem, ThemeDark, or ThemeLight.
func (s *Service) SetTheme(theme string) error {
	return s.update(func(c *Config) { c.Theme = theme })
}

// SetLanguage validates and persists the selected application language.
func (s *Service) SetLanguage(language string) error {
	return s.update(func(c *Config) { c.Language = language })
}

// SetDownloadUpdatesOnStartup controls automatic update downloads at startup.
func (s *Service) SetDownloadUpdatesOnStartup(enabled bool) error {
	return s.update(func(c *Config) { c.DownloadUpdatesOnStartup = enabled })
}

// update validates and persists a copy before committing it to memory. A
// failed write restores the previous state so Config never reports unpersisted
// data.
func (s *Service) update(mutate func(*Config)) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.dir == "" {
		return fmt.Errorf("config: service not started")
	}
	next := s.cfg
	mutate(&next)
	if err := next.Validate(); err != nil {
		return err
	}
	prev := s.cfg
	s.cfg = next
	if err := s.save(); err != nil {
		s.cfg = prev
		return err
	}
	return nil
}

// ServiceStartup loads the configuration, creating it with defaults when it is
// missing. It backs up corrupt or invalid data before replacing it.
func (s *Service) ServiceStartup(ctx context.Context, options application.ServiceOptions) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.dir = s.resolveDir()

	s.cfg = defaults()
	data, err := os.ReadFile(filepath.Join(s.dir, configFileName))
	if errors.Is(err, os.ErrNotExist) {
		if err := s.save(); err != nil {
			return err
		}
		slog.Info("default config created")
		return nil
	}
	if err != nil {
		slog.Warn("config unreadable; using defaults", "err", err)
		return nil
	}
	if err := json.Unmarshal(data, &s.cfg); err != nil {
		return s.recoverBadConfig(data, err, "unparseable")
	}
	if err := s.cfg.Validate(); err != nil {
		return s.recoverBadConfig(data, err, "invalid")
	}
	slog.Debug("config loaded", "theme", s.cfg.Theme, "language", s.cfg.Language)
	return nil
}

// recoverBadConfig backs up readable data and replaces the configuration with
// defaults. A backup failure is fatal because the original must be preserved.
func (s *Service) recoverBadConfig(data []byte, cause error, reason string) error {
	path := filepath.Join(s.dir, configFileName)
	bak := path + configBakExt
	if data != nil {
		if err := atomicfile.WriteFile(bak, data, 0o600); err != nil {
			return fmt.Errorf("config: backup: %w", err)
		}
	}
	s.cfg = defaults()
	if err := s.save(); err != nil {
		return err
	}
	if data != nil {
		slog.Warn("config recovered with defaults", "reason", reason, "err", cause, "backup", bak)
	} else {
		slog.Warn("config recovered with defaults", "reason", reason, "err", cause)
	}
	return nil
}

// resolveDir returns the configured directory or the platform configuration
// directory when no override is set.
func (s *Service) resolveDir() string {
	if s.dir != "" {
		return s.dir
	}
	return appdata.ConfigDir()
}

// save writes the current configuration atomically. The caller must hold s.mu.
func (s *Service) save() error {
	data, err := json.MarshalIndent(s.cfg, "", "  ")
	if err != nil {
		return fmt.Errorf("config: marshal: %w", err)
	}
	data = append(data, '\n')
	return atomicfile.WriteFile(filepath.Join(s.dir, configFileName), data, 0o600)
}
