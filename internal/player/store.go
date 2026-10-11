package player

import (
	"errors"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"sync"
	"time"

	"github.com/beyenilmez/pz-admin/internal/third_party/tailscale.com/jsondb"
	"github.com/google/uuid"
)

// Store persists one player collection per server profile. Safe for
// concurrent use.
type Store struct {
	dir string
	mu  sync.Mutex
}

// Open creates a player store rooted at dir.
func Open(dir string) (*Store, error) {
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return nil, fmt.Errorf("player: create data directory: %w", err)
	}
	return &Store{dir: dir}, nil
}

// List returns a copy of all players known for profileID.
func (s *Store) List(profileID string) ([]Player, error) {
	if err := validateProfileID(profileID); err != nil {
		return nil, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	db, err := s.openProfile(profileID)
	if err != nil {
		return nil, err
	}
	return slices.Clone(*db.Data), nil
}

// Merge records partial player observations at observedAt. Existing players
// can be targeted by application ID. Newly discovered players are matched by
// username and receive a provisional ID until a stable external identity is
// available. An observation that cannot identify a player is skipped without
// discarding the rest of the batch.
func (s *Store) Merge(profileID string, observations []Observation, observedAt time.Time) ([]Player, error) {
	if err := validateProfileID(profileID); err != nil {
		return nil, err
	}
	if observedAt.IsZero() {
		return nil, errors.New("player: observation time is required")
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	db, err := s.openProfile(profileID)
	if err != nil {
		return nil, err
	}
	updated := slices.Clone(*db.Data)
	changed := false
	for _, observation := range observations {
		if observation.ID == "" && observation.Username == "" {
			slog.Debug("skipping observation without identity")
			continue
		}

		index := -1
		if observation.ID != "" {
			index = findByID(updated, observation.ID)
		}
		if index == -1 && observation.Username != "" {
			index = findByUsername(updated, observation.Username)
			if index != -1 && observation.ID != "" {
				// A stable source identity replaces the provisional ID while
				// preserving the existing player record.
				updated[index].ID = observation.ID
			}
		}
		if observation.Delete {
			if index != -1 {
				updated = slices.Delete(updated, index, index+1)
				changed = true
			}
			continue
		}
		if index == -1 {
			if observation.Username == "" {
				// An ID alone cannot create a usable player record because the
				// username is required for subsequent server commands.
				slog.Debug("skipping unknown observation", "player_id", observation.ID)
				continue
			}
			updated = appendObservation(updated, observation, observedAt)
			changed = true
			continue
		}

		mergeObservation(&updated[index], observation, observedAt)
		changed = true
	}

	if changed {
		previous := *db.Data
		*db.Data = updated
		if err := db.Save(); err != nil {
			*db.Data = previous
			return nil, fmt.Errorf("player: save profile %q: %w", profileID, err)
		}
	}
	return slices.Clone(updated), nil
}

// DeletePlayers removes the players with the given application IDs and
// returns the remaining collection.
func (s *Store) DeletePlayers(profileID string, playerIDs []string) ([]Player, error) {
	if err := validateProfileID(profileID); err != nil {
		return nil, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	db, err := s.openProfile(profileID)
	if err != nil {
		return nil, err
	}
	ids := make(map[string]struct{}, len(playerIDs))
	for _, id := range playerIDs {
		ids[id] = struct{}{}
	}
	updated := slices.DeleteFunc(slices.Clone(*db.Data), func(player Player) bool {
		_, remove := ids[player.ID]
		return remove
	})
	if len(updated) == len(*db.Data) {
		return slices.Clone(updated), nil
	}

	previous := *db.Data
	*db.Data = updated
	if err := db.Save(); err != nil {
		*db.Data = previous
		return nil, fmt.Errorf("player: save profile %q: %w", profileID, err)
	}
	return slices.Clone(updated), nil
}

// DeleteByProfile removes all persisted players owned by profileID. It is
// idempotent so a partially completed server deletion can be retried safely.
func (s *Store) DeleteByProfile(profileID string) error {
	if err := validateProfileID(profileID); err != nil {
		return err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if err := os.Remove(s.profilePath(profileID)); err != nil && !errors.Is(err, os.ErrNotExist) {
		return fmt.Errorf("player: delete profile %q: %w", profileID, err)
	}
	return nil
}

func (s *Store) openProfile(profileID string) (*jsondb.DB[[]Player], error) {
	db, err := jsondb.OpenRecovering(s.profilePath(profileID), []Player{})
	if err != nil {
		return nil, fmt.Errorf("player: open profile %q: %w", profileID, err)
	}
	if *db.Data == nil {
		*db.Data = []Player{}
	}
	return db, nil
}

func (s *Store) profilePath(profileID string) string {
	return filepath.Join(s.dir, profileID+".json")
}

func validateProfileID(profileID string) error {
	if _, err := uuid.Parse(profileID); err != nil {
		return fmt.Errorf("player: invalid profile ID %q", profileID)
	}
	return nil
}

func findByID(players []Player, id string) int {
	return slices.IndexFunc(players, func(existing Player) bool {
		return existing.ID == id
	})
}

func findByUsername(players []Player, username string) int {
	return slices.IndexFunc(players, func(existing Player) bool {
		return strings.EqualFold(existing.Username, username)
	})
}

// A provisional ID keeps a newly observed player addressable until a stable
// source identity becomes available.
func appendObservation(players []Player, observation Observation, observedAt time.Time) []Player {
	id := observation.ID
	if id == "" {
		id = uuid.NewString()
	}
	player := Player{
		ID:          id,
		Username:    observation.Username,
		FirstSeenAt: observedAt,
	}
	mergeObservation(&player, observation, observedAt)
	return append(players, player)
}

func mergeObservation(player *Player, observation Observation, observedAt time.Time) {
	// Propagating a rename ensures that later username-only observations match
	// this record instead of creating a duplicate.
	if observation.Username != "" {
		player.Username = observation.Username
	}
	if observation.Online.operation == setObservation {
		if observation.Online.value {
			player.LastSeenOnlineAt = observedAt
		} else if player.LastKnownOfflineAt.IsZero() || player.LastSeenOnlineAt.After(player.LastKnownOfflineAt) {
			player.LastKnownOfflineAt = observedAt
		}
	}

	mergeKnown(&player.AccessLevel, observation.AccessLevel)
	mergeKnown(&player.GodMode, observation.GodMode)
	mergeKnown(&player.Invisible, observation.Invisible)
	mergeKnown(&player.NoClip, observation.NoClip)
	mergeKnown(&player.Banned, observation.Banned)
	mergeKnown(&player.VoiceBanned, observation.VoiceBanned)
}

func mergeKnown[T any](current **T, observed ObservationValue[T]) {
	switch observed.operation {
	case setObservation:
		value := observed.value
		*current = &value
	case clearObservation:
		*current = nil
	}
}
