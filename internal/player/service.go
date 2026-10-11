package player

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/beyenilmez/pz-admin/internal/appdata"
	"github.com/beyenilmez/pz-admin/internal/session"
	"github.com/wailsapp/wails/v3/pkg/application"
)

const (
	changedEvent = "players:changed"
	pollInterval = 15 * time.Second
)

func init() {
	application.RegisterEvent[Update](changedEvent)
}

// Service exposes stored player data and owns the player store lifecycle.
type Service struct {
	store *Store
	dir   string

	mu         sync.Mutex
	pollCancel context.CancelFunc
	pollWG     sync.WaitGroup
	active     session.State
	closed     bool
}

// NewService creates a player service ready to be registered with Wails.
func NewService() *Service {
	return &Service{}
}

func newService(dir string) *Service {
	return &Service{dir: dir}
}

// ServiceStartup opens the player store.
func (s *Service) ServiceStartup(ctx context.Context, options application.ServiceOptions) error {
	store, err := Open(filepath.Join(s.resolveDir(), "players"))
	if err != nil {
		return err
	}
	s.store = store
	return nil
}

// ServiceShutdown stops active player polling.
func (s *Service) ServiceShutdown() error {
	s.mu.Lock()
	s.closed = true
	s.stopPollingLocked()
	s.active = session.State{}
	s.mu.Unlock()
	s.pollWG.Wait()
	return nil
}

// SessionChanged starts or stops polling to match the active session.
//
//wails:ignore
func (s *Service) SessionChanged(state session.State) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.stopPollingLocked()
	s.active = session.State{}
	if s.closed || !state.IsConnected() {
		return
	}
	s.active = state

	ctx, cancel := context.WithCancel(context.Background())
	s.pollCancel = cancel
	s.pollWG.Add(1)
	go s.poll(ctx, state)
}

// List returns all known players for a server profile.
func (s *Service) List(profileID string) ([]Player, error) {
	if s.store == nil {
		return nil, fmt.Errorf("player: service not started")
	}
	return s.store.List(profileID)
}

// Observe records player state confirmed by another backend feature, such as
// the console.
//
//wails:ignore
func (s *Service) Observe(profileID string, observation Observation) error {
	if s.store == nil {
		return fmt.Errorf("player: service not started")
	}
	if _, err := s.merge(profileID, []Observation{observation}, time.Now().UTC()); err != nil {
		return fmt.Errorf("player: record observation: %w", err)
	}
	return nil
}

// DeleteByProfile removes the player data owned by a server profile.
//
//wails:ignore
func (s *Service) DeleteByProfile(profileID string) error {
	if s.store == nil {
		return fmt.Errorf("player: service not started")
	}
	if err := s.store.DeleteByProfile(profileID); err != nil {
		return err
	}
	s.emitUpdate(profileID, []Player{})
	return nil
}

func (s *Service) resolveDir() string {
	if s.dir != "" {
		return s.dir
	}
	return appdata.DataDir()
}

func (s *Service) stopPollingLocked() {
	if s.pollCancel != nil {
		s.pollCancel()
		s.pollCancel = nil
	}
}

func (s *Service) poll(ctx context.Context, state session.State) {
	defer s.pollWG.Done()

	s.refresh(ctx, state)
	ticker := time.NewTicker(pollInterval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			s.refresh(ctx, state)
		}
	}
}

func (s *Service) refresh(ctx context.Context, state session.State) {
	observations, err := observePlayers(ctx, state)
	if err != nil {
		if !errors.Is(err, context.Canceled) {
			slog.Warn("online player query failed", "profile_id", state.Profile.ID, "err", err)
		}
		return
	}
	if ctx.Err() != nil {
		return
	}
	players, err := s.store.List(state.Profile.ID)
	if err != nil {
		slog.Warn("stored player lookup failed", "profile_id", state.Profile.ID, "err", err)
		return
	}
	online := make(map[string]struct{}, len(observations))
	for _, observation := range observations {
		online[strings.ToLower(observation.Username)] = struct{}{}
	}
	for _, player := range players {
		if _, found := online[strings.ToLower(player.Username)]; found {
			continue
		}
		offline := offlineObservation(state.Profile.Version, player.AccessLevel)
		offline.ID = player.ID
		observations = append(observations, offline)
	}
	if _, err := s.merge(state.Profile.ID, observations, time.Now().UTC()); err != nil {
		slog.Warn("player refresh merge failed", "profile_id", state.Profile.ID, "err", err)
	}
}

func (s *Service) merge(profileID string, observations []Observation, observedAt time.Time) ([]Player, error) {
	players, err := s.store.Merge(profileID, observations, observedAt)
	if err != nil {
		return nil, err
	}
	s.emitUpdate(profileID, players)
	return players, nil
}

func (s *Service) emitUpdate(profileID string, players []Player) {
	if app := application.Get(); app != nil {
		app.Event.Emit(changedEvent, Update{ProfileID: profileID, Players: players})
	}
}

func observePlayers(ctx context.Context, state session.State) ([]Observation, error) {
	if state.CommandClient == nil {
		return nil, errors.New("player: active session cannot provide players")
	}

	names, err := state.CommandClient.Players(ctx)
	if err != nil {
		return nil, err
	}
	observations := make([]Observation, 0, len(names))
	for _, username := range names {
		online := onlineObservation()
		online.Username = username
		observations = append(observations, online)
	}
	return observations, nil
}
