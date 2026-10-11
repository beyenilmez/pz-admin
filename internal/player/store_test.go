package player

import (
	"bytes"
	"os"
	"path/filepath"
	"reflect"
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestStore_RecoversCorruptProfile(t *testing.T) {
	store := openTestStore(t)
	profileID := uuid.NewString()
	path := filepath.Join(store.dir, profileID+".json")
	corrupt := []byte("not json")
	if err := os.WriteFile(path, corrupt, 0o600); err != nil {
		t.Fatal(err)
	}

	players, err := store.List(profileID)
	if err != nil {
		t.Fatal(err)
	}
	if players == nil || len(players) != 0 {
		t.Fatalf("players = %#v, want non-nil empty slice", players)
	}
	backup, err := os.ReadFile(path + ".bak")
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(backup, corrupt) {
		t.Fatalf("backup = %q, want %q", backup, corrupt)
	}

	reopened, err := Open(store.dir)
	if err != nil {
		t.Fatal(err)
	}
	players, err = reopened.List(profileID)
	if err != nil {
		t.Fatal(err)
	}
	if players == nil || len(players) != 0 {
		t.Fatalf("reopened players = %#v, want non-nil empty slice", players)
	}
}

func TestStore_PersistsCompletePlayer(t *testing.T) {
	store := openTestStore(t)
	profileID := uuid.NewString()
	playerID := uuid.NewString()
	firstSeen := time.Date(2026, time.August, 14, 10, 0, 0, 0, time.UTC)
	lastOffline := firstSeen.Add(time.Minute)
	accessLevel := "admin"

	if _, err := store.Merge(profileID, []Observation{{
		ID: playerID, Username: "Alice", Online: Known(true), AccessLevel: Known(accessLevel),
		GodMode: Known(true), Invisible: Known(false), NoClip: Known(true),
		Banned: Known(false), VoiceBanned: Known(true),
	}}, firstSeen); err != nil {
		t.Fatal(err)
	}
	if _, err := store.Merge(profileID, []Observation{{ID: playerID, Online: Known(false)}}, lastOffline); err != nil {
		t.Fatal(err)
	}

	reopened, err := Open(store.dir)
	if err != nil {
		t.Fatal(err)
	}
	players, err := reopened.List(profileID)
	if err != nil {
		t.Fatal(err)
	}
	want := Player{
		ID: playerID, Username: "Alice", AccessLevel: new(accessLevel),
		GodMode: new(true), Invisible: new(false), NoClip: new(true),
		Banned: new(false), VoiceBanned: new(true),
		FirstSeenAt: firstSeen, LastSeenOnlineAt: firstSeen, LastKnownOfflineAt: lastOffline,
	}
	if len(players) != 1 || !reflect.DeepEqual(players[0], want) {
		t.Fatalf("persisted player:\n got: %#v\nwant: %#v", players, want)
	}
}

func TestStore_MergeState(t *testing.T) {
	t.Run("preserves omitted values and clears unknown values", func(t *testing.T) {
		store := openTestStore(t)
		profileID := uuid.NewString()
		players, err := store.Merge(profileID, []Observation{{
			Username: "Alice", AccessLevel: Known("admin"), GodMode: Known(true),
		}}, time.Now().UTC())
		if err != nil {
			t.Fatal(err)
		}
		players, err = store.Merge(profileID, []Observation{{
			ID: players[0].ID, GodMode: Unknown[bool](),
		}}, time.Now().UTC().Add(time.Second))
		if err != nil {
			t.Fatal(err)
		}
		if players[0].AccessLevel == nil || *players[0].AccessLevel != "admin" || players[0].GodMode != nil {
			t.Fatalf("player = %#v", players[0])
		}
	})

	t.Run("records offline time once until the next online observation", func(t *testing.T) {
		store := openTestStore(t)
		profileID := uuid.NewString()
		start := time.Date(2026, time.August, 14, 10, 0, 0, 0, time.UTC)
		players, err := store.Merge(profileID, []Observation{{Username: "Alice", Online: Known(false)}}, start)
		if err != nil {
			t.Fatal(err)
		}
		id := players[0].ID
		onlineAt := start.Add(time.Minute)
		offlineAt := start.Add(2 * time.Minute)
		if _, err := store.Merge(profileID, []Observation{{ID: id, Online: Known(true)}}, onlineAt); err != nil {
			t.Fatal(err)
		}
		if _, err := store.Merge(profileID, []Observation{{ID: id, Online: Known(false)}}, offlineAt); err != nil {
			t.Fatal(err)
		}
		players, err = store.Merge(profileID, []Observation{{ID: id, Online: Known(false)}}, offlineAt.Add(time.Minute))
		if err != nil {
			t.Fatal(err)
		}
		if !players[0].LastSeenOnlineAt.Equal(onlineAt) || !players[0].LastKnownOfflineAt.Equal(offlineAt) {
			t.Fatalf("timestamps = online %v, offline %v", players[0].LastSeenOnlineAt, players[0].LastKnownOfflineAt)
		}
	})
}

func TestStore_MergeIdentity(t *testing.T) {
	t.Run("matches usernames case insensitively", func(t *testing.T) {
		store := openTestStore(t)
		profileID := uuid.NewString()
		players, err := store.Merge(profileID, []Observation{{Username: "Alice"}}, time.Now().UTC())
		if err != nil {
			t.Fatal(err)
		}
		id := players[0].ID
		players, err = store.Merge(profileID, []Observation{{Username: "alice"}}, time.Now().UTC().Add(time.Second))
		if err != nil {
			t.Fatal(err)
		}
		if len(players) != 1 || players[0].ID != id {
			t.Fatalf("players = %#v, want one player with ID %q", players, id)
		}
	})

	t.Run("propagates rename on ID match", func(t *testing.T) {
		store := openTestStore(t)
		profileID := uuid.NewString()
		players, err := store.Merge(profileID, []Observation{{Username: "Alice"}}, time.Now().UTC())
		if err != nil {
			t.Fatal(err)
		}
		id := players[0].ID
		players, err = store.Merge(profileID, []Observation{{ID: id, Username: "Alicia"}}, time.Now().UTC().Add(time.Second))
		if err != nil {
			t.Fatal(err)
		}
		if len(players) != 1 || players[0].Username != "Alicia" {
			t.Fatalf("players = %#v, want renamed player", players)
		}
		players, err = store.Merge(profileID, []Observation{{Username: "alicia", Online: Known(true)}}, time.Now().UTC().Add(2*time.Second))
		if err != nil || len(players) != 1 || players[0].ID != id {
			t.Fatalf("follow-up merge = %#v, %v", players, err)
		}
	})

	t.Run("adopts stable ID", func(t *testing.T) {
		store := openTestStore(t)
		profileID := uuid.NewString()
		players, err := store.Merge(profileID, []Observation{{Username: "Alice"}}, time.Now().UTC())
		if err != nil {
			t.Fatal(err)
		}
		provisionalID := players[0].ID
		stableID := uuid.NewString()
		players, err = store.Merge(profileID, []Observation{{ID: stableID, Username: "Alice"}}, time.Now().UTC().Add(time.Second))
		if err != nil {
			t.Fatal(err)
		}
		if len(players) != 1 || players[0].ID != stableID || players[0].ID == provisionalID {
			t.Fatalf("players = %#v, want adopted ID %q", players, stableID)
		}
	})

	t.Run("skips observations that cannot identify a usable player", func(t *testing.T) {
		store := openTestStore(t)
		players, err := store.Merge(uuid.NewString(), []Observation{{}, {ID: uuid.NewString()}}, time.Now().UTC())
		if err != nil {
			t.Fatal(err)
		}
		if len(players) != 0 {
			t.Fatalf("players = %#v, want empty", players)
		}
	})
}

func TestStore_Deletion(t *testing.T) {
	store := openTestStore(t)
	profileID := uuid.NewString()
	players, err := store.Merge(profileID, []Observation{{Username: "Alice"}}, time.Now().UTC())
	if err != nil {
		t.Fatal(err)
	}
	if players, err = store.Merge(profileID, []Observation{{ID: players[0].ID, Delete: true}}, time.Now().UTC().Add(time.Second)); err != nil || len(players) != 0 {
		t.Fatalf("delete observation = %#v, %v", players, err)
	}
	reopened, err := Open(store.dir)
	if err != nil {
		t.Fatal(err)
	}
	players, err = reopened.List(profileID)
	if err != nil || len(players) != 0 {
		t.Fatalf("persisted players after delete = %#v, %v", players, err)
	}
	if _, err := store.Merge(profileID, []Observation{{Username: "Bob"}}, time.Now().UTC().Add(2*time.Second)); err != nil {
		t.Fatal(err)
	}
	path := filepath.Join(store.dir, profileID+".json")
	if err := store.DeleteByProfile(profileID); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(path); !os.IsNotExist(err) {
		t.Fatalf("player file still exists: %v", err)
	}
	if err := store.DeleteByProfile(profileID); err != nil {
		t.Fatalf("second DeleteByProfile() returned %v", err)
	}
}

func TestStore_RejectsInvalidProfileID(t *testing.T) {
	if _, err := openTestStore(t).List("../profiles"); err == nil {
		t.Fatal("List() accepted invalid profile ID")
	}
}

func openTestStore(t *testing.T) *Store {
	t.Helper()
	store, err := Open(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	return store
}

func pointer[T any](value T) *T {
	return &value
}
