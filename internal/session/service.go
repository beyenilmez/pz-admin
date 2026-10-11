// Package session manages the active server connection. It resolves saved
// profiles and credentials and selects the channel used by the frontend.
package session

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"sync"

	"github.com/beyenilmez/pz-admin/internal/connection"
	"github.com/beyenilmez/pz-admin/internal/feature"
	"github.com/beyenilmez/pz-admin/internal/profile"
	"github.com/wailsapp/wails/v3/pkg/application"
)

const changedEvent = "session:changed"

func init() {
	application.RegisterEvent[Snapshot](changedEvent)
}

// Service is the Wails v3 boundary for the active server session.
type Service struct {
	profiles  *profile.Service
	observers []Observer

	mu     sync.Mutex
	active State
}

// Observer receives active-session changes. A zero State represents a
// disconnection. Implementations must return quickly because notifications are
// delivered synchronously.
type Observer interface {
	SessionChanged(State)
}

// NewService creates a session service wired to the given profile service and
// session lifecycle observers.
func NewService(profiles *profile.Service, observers ...Observer) *Service {
	return &Service{profiles: profiles, observers: observers}
}

// ServiceStartup leaves the session disconnected until Connect is called.
func (s *Service) ServiceStartup(ctx context.Context, options application.ServiceOptions) error {
	return nil
}

// ServiceShutdown closes the active channel when the application quits.
func (s *Service) ServiceShutdown() error {
	return s.Disconnect()
}

// Connect resolves the profile and credentials, then opens the configured
// channel. It serializes the complete connection transition so no caller can
// observe a partially initialized session.
func (s *Service) Connect(ctx context.Context, profileID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.active.Channel != nil {
		return errors.New("session: already connected")
	}

	p, password, err := s.profiles.Credentials(profileID)
	if err != nil {
		return fmt.Errorf("session: %w", err)
	}

	var channel connection.Channel
	channel, err = openChannel(ctx, p, password, func() {
		s.handleDisconnect(p.ID, channel)
	})
	if err != nil {
		return fmt.Errorf("session: %w", err)
	}
	if p.Version == "auto" {
		version, detectErr := detectGameVersion(ctx, channel)
		if detectErr != nil {
			channel.Close()
			return fmt.Errorf("session: %w", detectErr)
		}
		p.Version = version
	}

	s.active = NewState(p, channel)
	slog.Info(
		"session connected",
		"profile_id", p.ID,
		"build", p.Version,
		"connection_type", p.ConnectionType,
	)
	s.notify(s.active)
	return nil
}

// Disconnect closes the active channel. It is safe to call while disconnected.
func (s *Service) Disconnect() error {
	s.mu.Lock()
	if s.active.Channel == nil {
		s.mu.Unlock()
		return nil
	}
	profileID := s.active.Profile.ID
	s.active.Channel.Close()
	s.active = State{}
	s.mu.Unlock()
	slog.Info("session disconnected", "profile_id", profileID)
	s.notify(State{})
	return nil
}

// Profile returns the profile associated with the active connection.
func (s *Service) Profile() (profile.Profile, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.active.Channel == nil {
		return profile.Profile{}, false
	}
	return s.active.Profile, true
}

// Features returns the application features available through the active
// connection. It returns an empty array while disconnected.
func (s *Service) Features() []feature.ID {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.active.Channel == nil {
		return []feature.ID{}
	}

	return append([]feature.ID(nil), s.active.Features...)
}

// Snapshot returns the complete serializable state of the active session.
func (s *Service) Snapshot() Snapshot {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.active.Snapshot
}

func (s *Service) handleDisconnect(profileID string, channel connection.Channel) {
	s.mu.Lock()
	if s.active.Channel == nil || s.active.Channel != channel || s.active.Profile.ID != profileID {
		s.mu.Unlock()
		return
	}
	s.active = State{}
	s.mu.Unlock()
	slog.Warn("session connection lost", "profile_id", profileID)
	s.notify(State{})
}

func (s *Service) notify(state State) {
	for _, observer := range s.observers {
		if observer != nil {
			observer.SessionChanged(state)
		}
	}

	app := application.Get()
	app.Event.Emit(changedEvent, state.Snapshot)
}
