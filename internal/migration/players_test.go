package migration

import (
	"path/filepath"
	"testing"
)

func TestReadPlayersOnlyKeepsSharedStaffRoles(t *testing.T) {
	for _, role := range []string{"admin", "moderator", "gm", "observer", "overseer", "player", "none", "user", "priority", ""} {
		t.Run(role, func(t *testing.T) {
			path := filepath.Join(t.TempDir(), "players.json")
			if err := writeJSON(path, []map[string]string{{"name": "Alice", "accessLevel": role}}); err != nil {
				t.Fatal(err)
			}
			players, err := readPlayers(path)
			if err != nil || len(players) != 1 {
				t.Fatalf("readPlayers() = %v, %v", players, err)
			}
			switch role {
			case "admin", "moderator", "gm", "observer":
				if players[0].AccessLevel == nil || *players[0].AccessLevel != role {
					t.Fatal("shared staff role was not preserved")
				}
			default:
				if players[0].AccessLevel != nil {
					t.Fatal("non-shared or non-staff role was preserved")
				}
			}
		})
	}
}
