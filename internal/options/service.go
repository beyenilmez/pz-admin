// Package options reads and updates server options through the active session.
package options

import (
	"context"
	"errors"
	"log/slog"
	"sync"

	"github.com/beyenilmez/pz-admin/internal/command"
	"github.com/beyenilmez/pz-admin/internal/session"
)

// UpdateResult describes every outcome of a batch update. Command failures are
// returned per option so one rejected value does not hide successful changes.
type UpdateResult struct {
	Updated []string          `json:"updated"`
	Failed  map[string]string `json:"failed"`
}

// Service is the Wails boundary for options on the active server.
type Service struct {
	mu     sync.RWMutex
	active session.State
}

// NewService creates an options service that starts disconnected.
func NewService() *Service {
	return &Service{}
}

// SessionChanged follows the command capability of the active session.
//
//wails:ignore
func (s *Service) SessionChanged(state session.State) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.active = state
}

// List returns the current server option values.
func (s *Service) List(ctx context.Context) (map[string]string, error) {
	client, err := s.activeClient()
	if err != nil {
		return nil, err
	}
	return client.ShowOptions(ctx)
}

// Update attempts every requested change and reports failures by option name.
// Call List afterward to reconcile with the authoritative server state.
func (s *Service) Update(ctx context.Context, changes map[string]string) (UpdateResult, error) {
	client, err := s.activeClient()
	if err != nil {
		return UpdateResult{}, err
	}

	result := UpdateResult{
		Updated: []string{},
		Failed:  make(map[string]string),
	}
	for name, value := range changes {
		if _, err := client.ChangeOption(ctx, name, value); err != nil {
			result.Failed[name] = err.Error()
			continue
		}
		result.Updated = append(result.Updated, name)
	}
	slog.Debug(
		"server options update completed",
		"updated_count", len(result.Updated),
		"failed_count", len(result.Failed),
	)
	return result, nil
}

func (s *Service) activeClient() (*command.Client, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if s.active.CommandClient == nil {
		return nil, errors.New("options: connection does not support server options")
	}
	return s.active.CommandClient, nil
}
