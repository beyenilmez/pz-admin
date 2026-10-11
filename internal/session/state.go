package session

import (
	"github.com/beyenilmez/pz-admin/internal/command"
	"github.com/beyenilmez/pz-admin/internal/connection"
	"github.com/beyenilmez/pz-admin/internal/feature"
	"github.com/beyenilmez/pz-admin/internal/profile"
)

// Snapshot is the serializable public state of the active session.
type Snapshot struct {
	Profile   profile.Profile `json:"profile"`
	Features  []feature.ID    `json:"features"`
	Connected bool            `json:"connected"`
}

// State is the immutable command context for the active server session.
// The zero value represents a disconnected session.
type State struct {
	Snapshot
	Channel       connection.Channel
	CommandClient *command.Client
}

// NewState derives command capabilities once for the lifetime of a session.
func NewState(p profile.Profile, channel connection.Channel) State {
	state := State{
		Snapshot: Snapshot{
			Profile:  p,
			Features: resolveFeatures(p, channel).Values(),
		},
		Channel: channel,
	}
	if channel == nil {
		return State{}
	}
	executor, ok := channel.(connection.CommandExecutor)
	if ok {
		state.CommandClient = command.NewClient(executor, p.Version)
		state.Connected = true
	}
	return state
}

// IsConnected reports whether the snapshot has an executable server session.
func (s State) IsConnected() bool {
	return s.Connected && s.CommandClient != nil
}
