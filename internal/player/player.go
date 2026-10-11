// Package player stores known players for saved server profiles.
package player

import "time"

// Player is a player known to the application.
// Optional fields are nil when the active data source cannot observe them.
type Player struct {
	ID                 string    `json:"id"`
	Username           string    `json:"username"`
	AccessLevel        *string   `json:"accessLevel,omitempty"`
	GodMode            *bool     `json:"godMode,omitempty"`
	Invisible          *bool     `json:"invisible,omitempty"`
	NoClip             *bool     `json:"noClip,omitempty"`
	Banned             *bool     `json:"banned,omitempty"`
	VoiceBanned        *bool     `json:"voiceBanned,omitempty"`
	FirstSeenAt        time.Time `json:"firstSeenAt"`
	LastSeenOnlineAt   time.Time `json:"lastSeenOnlineAt"`
	LastKnownOfflineAt time.Time `json:"lastKnownOfflineAt"`
}

func (p *Player) isOnline() bool {
	return p != nil &&
		!p.LastSeenOnlineAt.IsZero() &&
		(p.LastKnownOfflineAt.IsZero() || p.LastSeenOnlineAt.After(p.LastKnownOfflineAt))
}

type observationOperation uint8

const (
	preserveObservation observationOperation = iota
	setObservation
	clearObservation
)

// ObservationValue describes how one stored value should change. Its zero
// value preserves existing state.
type ObservationValue[T any] struct {
	operation observationOperation
	value     T
}

// Known replaces a stored value with value.
func Known[T any](value T) ObservationValue[T] {
	return ObservationValue[T]{operation: setObservation, value: value}
}

// Unknown clears a stored value when it can no longer be observed reliably.
func Unknown[T any]() ObservationValue[T] {
	return ObservationValue[T]{operation: clearObservation}
}

// Observation contains changes reported by a player data source. Omitted
// values preserve existing state.
type Observation struct {
	ID          string
	Username    string
	Online      ObservationValue[bool]
	AccessLevel ObservationValue[string]
	GodMode     ObservationValue[bool]
	Invisible   ObservationValue[bool]
	NoClip      ObservationValue[bool]
	Banned      ObservationValue[bool]
	VoiceBanned ObservationValue[bool]
	Delete      bool
}

// ActionResult reports the outcome of a player action for each requested ID.
type ActionResult struct {
	Succeeded []string        `json:"succeeded"`
	Failed    []ActionFailure `json:"failed"`
}

// ActionFailure identifies a player action that could not be completed.
type ActionFailure struct {
	PlayerID string `json:"playerId"`
	Message  string `json:"message"`
}

// ItemGrant describes an item and quantity to give to a player.
type ItemGrant struct {
	Item  string `json:"item"`
	Count int    `json:"count"`
}

// XPGrant describes an amount of XP to give in one perk.
type XPGrant struct {
	Perk   string `json:"perk"`
	Amount int    `json:"amount"`
}

// Update is emitted when the stored players for a server profile change.
type Update struct {
	ProfileID string   `json:"profileId"`
	Players   []Player `json:"players"`
}
