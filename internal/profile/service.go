package profile

import (
	"context"
	"errors"
	"fmt"
	"path/filepath"
	"sync"

	"github.com/beyenilmez/pz-admin/internal/appdata"
	"github.com/wailsapp/wails/v3/pkg/application"
)

// Service is the Wails v3 service for managing profiles and passwords.
type Service struct {
	store      *Store
	playerData playerDataStore
	dir        string
	mu         sync.Mutex
}

type playerDataStore interface {
	DeleteByProfile(profileID string) error
}

// NewService creates a profile service ready to be registered with Wails.
func NewService(playerData playerDataStore) *Service {
	return &Service{playerData: playerData}
}

// newService creates a service with an explicit configuration directory.
func newService(dir string) *Service {
	return &Service{dir: dir}
}

// ServiceStartup loads or creates the profile store.
func (s *Service) ServiceStartup(ctx context.Context, options application.ServiceOptions) error {
	store, err := Open(filepath.Join(s.resolveDir(), "profiles.json"))
	if err != nil {
		return err
	}
	s.store = store
	return nil
}

func (s *Service) resolveDir() string {
	if s.dir != "" {
		return s.dir
	}
	return appdata.ConfigDir()
}

// List returns all saved profiles.
func (s *Service) List() ([]Profile, error) {
	if s.store == nil {
		return nil, fmt.Errorf("profile: service not started")
	}
	return s.store.List(), nil
}

// Save creates or updates a profile and stores a supplied password. An empty
// password preserves the existing password when updating a profile.
func (s *Service) Save(p Profile, password string) (Profile, error) {
	if s.store == nil {
		return Profile{}, fmt.Errorf("profile: service not started")
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	creating := p.ID == ""
	if creating && password == "" {
		return Profile{}, errors.New("profile: password is required")
	}

	var previous Profile
	if !creating {
		found := false
		for _, existing := range s.store.List() {
			if existing.ID == p.ID {
				previous = existing
				found = true
				break
			}
		}
		if !found {
			return Profile{}, fmt.Errorf("%w: %s", ErrNotFound, p.ID)
		}
	}

	saved, err := s.store.Save(p)
	if err != nil {
		return Profile{}, err
	}
	if password == "" {
		return saved, nil
	}
	if err := s.store.SetPassword(saved.ID, password); err != nil {
		var rollbackErr error
		if creating {
			rollbackErr = s.store.Delete(saved.ID)
		} else {
			_, rollbackErr = s.store.Save(previous)
		}
		if rollbackErr != nil {
			return Profile{}, fmt.Errorf(
				"profile: store password: %w; rollback profile: %v",
				err,
				rollbackErr,
			)
		}
		return Profile{}, fmt.Errorf("profile: store password: %w", err)
	}
	return saved, nil
}

// Delete removes a profile, its password, and its associated player data.
func (s *Service) Delete(id string) error {
	if s.store == nil {
		return fmt.Errorf("profile: service not started")
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if err := s.store.Delete(id); err != nil {
		return err
	}
	if s.playerData == nil {
		return nil
	}
	if err := s.playerData.DeleteByProfile(id); err != nil {
		return fmt.Errorf("profile: server deleted; delete player data: %w", err)
	}
	return nil
}

// Credentials returns the profile and its password from the keyring.
//
//wails:ignore
func (s *Service) Credentials(id string) (Profile, string, error) {
	if s.store == nil {
		return Profile{}, "", fmt.Errorf("profile: service not started")
	}
	return s.store.Credentials(id)
}
