// Package serveraction exposes immediate actions for the active server.
package serveraction

import (
	"context"
	"errors"
	"math/rand/v2"
	"sync"

	"github.com/beyenilmez/pz-admin/internal/command"
	"github.com/beyenilmez/pz-admin/internal/session"
)

// Service is the Wails boundary for actions on the active server.
type Service struct {
	mu     sync.RWMutex
	active session.State
}

// EventResult identifies the randomly selected target of a world event.
type EventResult struct {
	Target string `json:"target"`
}

// NewService creates a server action service that starts disconnected.
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

// SaveWorld saves the current world.
func (s *Service) SaveWorld(ctx context.Context) error {
	client, err := s.activeClient()
	if err != nil {
		return err
	}
	_, err = client.Save(ctx)
	return err
}

// SendMessage broadcasts a message to all connected players.
func (s *Service) SendMessage(ctx context.Context, message string) error {
	client, err := s.activeClient()
	if err != nil {
		return err
	}
	_, err = client.ServerMsg(ctx, message)
	return err
}

// StartRain starts rain. An intensity of zero lets the server choose it.
func (s *Service) StartRain(ctx context.Context, intensity int) error {
	client, err := s.activeClient()
	if err != nil {
		return err
	}
	_, err = client.StartRain(ctx, intensity)
	return err
}

// StartStorm starts a storm. A duration of zero lets the server choose it.
func (s *Service) StartStorm(ctx context.Context, duration int) error {
	client, err := s.activeClient()
	if err != nil {
		return err
	}
	_, err = client.StartStorm(ctx, duration)
	return err
}

// StopRain stops rain on the server.
func (s *Service) StopRain(ctx context.Context) error {
	client, err := s.activeClient()
	if err != nil {
		return err
	}
	_, err = client.StopRain(ctx)
	return err
}

// StopWeather stops all weather on the server.
func (s *Service) StopWeather(ctx context.Context) error {
	client, err := s.activeClient()
	if err != nil {
		return err
	}
	_, err = client.StopWeather(ctx)
	return err
}

// TriggerHelicopter starts a helicopter event near a random player.
func (s *Service) TriggerHelicopter(ctx context.Context) error {
	client, err := s.activeClient()
	if err != nil {
		return err
	}
	_, err = client.Chopper(ctx)
	return err
}

// TriggerGunshot creates a gunshot sound near a random player.
func (s *Service) TriggerGunshot(ctx context.Context) error {
	client, err := s.activeClient()
	if err != nil {
		return err
	}
	_, err = client.Gunshot(ctx)
	return err
}

// TriggerLightning strikes a randomly selected online player with lightning.
func (s *Service) TriggerLightning(ctx context.Context) (EventResult, error) {
	client, err := s.activeClient()
	if err != nil {
		return EventResult{}, err
	}
	target, err := randomOnlinePlayer(ctx, client)
	if err != nil {
		return EventResult{}, err
	}
	if _, err := client.Lightning(ctx, target); err != nil {
		return EventResult{}, err
	}
	return EventResult{Target: target}, nil
}

// TriggerThunder triggers thunder at a randomly selected online player.
func (s *Service) TriggerThunder(ctx context.Context) (EventResult, error) {
	client, err := s.activeClient()
	if err != nil {
		return EventResult{}, err
	}
	target, err := randomOnlinePlayer(ctx, client)
	if err != nil {
		return EventResult{}, err
	}
	if _, err := client.Thunder(ctx, target); err != nil {
		return EventResult{}, err
	}
	return EventResult{Target: target}, nil
}

// ReloadOptions reloads server options from ServerOptions.ini.
func (s *Service) ReloadOptions(ctx context.Context) error {
	client, err := s.activeClient()
	if err != nil {
		return err
	}
	_, err = client.ReloadOptions(ctx)
	return err
}

// ReloadLua reloads a loaded Lua file matching the supplied path suffix.
func (s *Service) ReloadLua(ctx context.Context, file string) error {
	client, err := s.activeClient()
	if err != nil {
		return err
	}
	_, err = client.ReloadLua(ctx, file)
	return err
}

// ReloadAllLua reloads all loaded Lua files on a Build 42 server.
func (s *Service) ReloadAllLua(ctx context.Context) error {
	client, err := s.activeClient()
	if err != nil {
		return err
	}
	_, err = client.ReloadAllLua(ctx)
	return err
}

// StopServer saves the world and stops the server.
func (s *Service) StopServer(ctx context.Context) error {
	client, err := s.activeClient()
	if err != nil {
		return err
	}
	_, err = client.Quit(ctx)
	return err
}

func (s *Service) activeClient() (*command.Client, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if s.active.CommandClient == nil {
		return nil, errors.New("serveraction: connection does not support server actions")
	}
	return s.active.CommandClient, nil
}

func randomOnlinePlayer(ctx context.Context, client *command.Client) (string, error) {
	players, err := client.Players(ctx)
	if err != nil {
		return "", err
	}
	if len(players) == 0 {
		return "", errors.New("serveraction: no players are online")
	}
	return players[rand.IntN(len(players))], nil
}
