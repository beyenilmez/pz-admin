package migration

import (
	"encoding/json"
	"errors"
	"os"
	"slices"
	"strings"

	"github.com/beyenilmez/pz-admin/internal/player"
	"github.com/google/uuid"
)

type legacyPlayer struct {
	Name        string `json:"name"`
	AccessLevel string `json:"accessLevel"`
	Banned      bool   `json:"banned"`
}

func readPlayers(path string) ([]player.Player, error) {
	players := []player.Player{}
	data, err := os.ReadFile(path)
	if errors.Is(err, os.ErrNotExist) {
		return players, nil
	}
	if err != nil {
		return nil, err
	}
	var legacyPlayers []legacyPlayer
	if err := json.Unmarshal(data, &legacyPlayers); err != nil {
		return nil, errors.New("invalid v1 player history JSON")
	}
	for _, entry := range legacyPlayers {
		if strings.TrimSpace(entry.Name) == "" {
			continue
		}
		if slices.ContainsFunc(players, func(existing player.Player) bool {
			return strings.EqualFold(existing.Username, entry.Name)
		}) {
			continue
		}
		players = append(players, convertPlayer(entry))
	}
	return players, nil
}

func convertPlayer(entry legacyPlayer) player.Player {
	converted := player.Player{ID: uuid.NewString(), Username: entry.Name}
	// Keep only staff roles shared by both builds; v1 did not record the build.
	level := strings.ToLower(entry.AccessLevel)
	switch level {
	case "observer", "gm", "moderator", "admin":
		converted.AccessLevel = &level
	}
	if entry.Banned {
		converted.Banned = &entry.Banned
	}
	return converted
}
