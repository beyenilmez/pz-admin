// Package console executes raw commands on the active server channel.
package console

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"strings"
	"sync"

	"github.com/beyenilmez/pz-admin/internal/profile"
	"github.com/beyenilmez/pz-admin/internal/session"
)

// Service is the Wails boundary for raw server command execution.
type Service struct {
	observer CommandObserver

	mu     sync.Mutex
	active session.State
}

// CommandObserver records facts confirmed by raw console responses.
type CommandObserver func(p profile.Profile, input, output string) error

// NewService creates a console service. A nil observer disables observation.
func NewService(observer CommandObserver) *Service {
	return &Service{observer: observer}
}

// SessionChanged follows the command capability of the active session.
//
//wails:ignore
func (s *Service) SessionChanged(state session.State) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.active = state
}

// Execute runs one raw command through the active server channel.
func (s *Service) Execute(ctx context.Context, command string) (string, error) {
	command = strings.TrimSpace(command)
	if command == "" {
		return "", errors.New("console: command is required")
	}

	s.mu.Lock()
	p := s.active.Profile
	client := s.active.CommandClient
	s.mu.Unlock()
	if client == nil {
		return "", errors.New("console: connection does not support executing commands")
	}

	result, err := client.Execute(ctx, command)
	if err != nil {
		return "", fmt.Errorf("console: execute command: %w", err)
	}
	if s.observer != nil {
		if err := s.observer(p, command, result); err != nil {
			// The remote command succeeded; local observation must not turn it
			// into a misleading console failure.
			slog.Warn(
				"console command observation failed",
				"profile_id", p.ID,
				"command", strings.Fields(command)[0],
				"err", err,
			)
		}
	}
	return result, nil
}
