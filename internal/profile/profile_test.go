package profile

import (
	"errors"
	"os"
	"path/filepath"
	"testing"

	"github.com/beyenilmez/pz-admin/internal/connection"
	"github.com/zalando/go-keyring"
)

func TestOpen(t *testing.T) {
	t.Run("creates missing store", func(t *testing.T) {
		store, err := Open(filepath.Join(t.TempDir(), "profiles.json"))
		if err != nil {
			t.Fatalf("Open() error = %v", err)
		}
		if got := len(store.List()); got != 0 {
			t.Errorf("List() length = %d, want 0", got)
		}
	})
	t.Run("recovers corrupt store", func(t *testing.T) {
		path := filepath.Join(t.TempDir(), "profiles.json")
		corruptData := []byte("not json")
		if err := os.WriteFile(path, corruptData, 0o600); err != nil {
			t.Fatalf("write fixture: %v", err)
		}
		store, err := Open(path)
		if err != nil {
			t.Fatalf("Open() error = %v", err)
		}
		if got := len(store.List()); got != 0 {
			t.Errorf("List() length = %d, want 0", got)
		}
		backup, err := os.ReadFile(path + ".bak")
		if err != nil {
			t.Fatalf("read backup: %v", err)
		}
		if string(backup) != string(corruptData) {
			t.Errorf("backup = %q, want %q", backup, corruptData)
		}
		reopened := openProfileStore(t, path)
		if got := len(reopened.List()); got != 0 {
			t.Errorf("reopened List() length = %d, want 0", got)
		}
	})
	t.Run("loads persisted profiles", func(t *testing.T) {
		path := filepath.Join(t.TempDir(), "profiles.json")
		first := openProfileStore(t, path)
		saved := saveProfile(t, first, validProfile("server"))
		second := openProfileStore(t, path)
		profiles := second.List()
		if len(profiles) != 1 {
			t.Fatalf("List() length = %d, want 1", len(profiles))
		}
		if got := profiles[0]; got != saved {
			t.Errorf("List()[0] = %+v, want %+v", got, saved)
		}
	})
}

func TestStore_List(t *testing.T) {
	store := newProfileStore(t)
	saved := saveProfile(t, store, validProfile("server"))
	profiles := store.List()
	profiles[0].Name = "mutated"
	if got := store.List()[0]; got != saved {
		t.Errorf("List()[0] = %+v, want %+v", got, saved)
	}
}

func TestStore_Save(t *testing.T) {
	t.Run("creates profile", func(t *testing.T) {
		store := newProfileStore(t)
		saved := saveProfile(t, store, validProfile("server"))
		if saved.ID == "" {
			t.Error("Save().ID = empty, want generated ID")
		}
		if got := store.List(); len(got) != 1 || got[0] != saved {
			t.Errorf("List() = %+v, want [%+v]", got, saved)
		}
	})
	t.Run("updates profile in place", func(t *testing.T) {
		store := newProfileStore(t)
		first := saveProfile(t, store, validProfile("first"))
		second := saveProfile(t, store, validProfile("second"))
		first.Name, first.Version = "updated", "41"
		updated := saveProfile(t, store, first)
		got := store.List()
		if len(got) != 2 {
			t.Fatalf("List() length = %d, want 2", len(got))
		}
		if got[0] != updated {
			t.Errorf("List()[0] = %+v, want %+v", got[0], updated)
		}
		if got[1] != second {
			t.Errorf("List()[1] = %+v, want %+v", got[1], second)
		}
	})
	for _, test := range []struct {
		name    string
		profile Profile
	}{
		{name: "requires name", profile: Profile{ConnectionType: connection.TypeRCON, Host: "h", Port: 1}},
		{name: "requires host", profile: Profile{ConnectionType: connection.TypeRCON, Name: "n", Port: 1}},
		{name: "requires valid port", profile: Profile{ConnectionType: connection.TypeRCON, Name: "n", Host: "h"}},
		{name: "requires supported connection", profile: Profile{ConnectionType: "unknown", Name: "n", Host: "h", Port: 1}},
	} {
		t.Run(test.name, func(t *testing.T) {
			if _, err := newProfileStore(t).Save(test.profile); err == nil {
				t.Fatal("Save() error = nil, want validation error")
			}
		})
	}
}

func TestStore_Delete(t *testing.T) {
	keyring.MockInit()
	t.Run("deletes profile", func(t *testing.T) {
		path := filepath.Join(t.TempDir(), "profiles.json")
		store := openProfileStore(t, path)
		saved := saveProfile(t, store, validProfile("server"))
		if err := store.SetPassword(saved.ID, "secret"); err != nil {
			t.Fatalf("SetPassword() error = %v", err)
		}
		if err := store.Delete(saved.ID); err != nil {
			t.Fatalf("Delete() error = %v", err)
		}
		if got := len(store.List()); got != 0 {
			t.Errorf("List() length = %d, want 0", got)
		}
		if _, err := keyring.Get(KeyringService, saved.ID); !errors.Is(err, keyring.ErrNotFound) {
			t.Errorf("keyring.Get() error = %v, want ErrNotFound", err)
		}
		reopened := openProfileStore(t, path)
		if got := len(reopened.List()); got != 0 {
			t.Errorf("reopened List() length = %d, want 0", got)
		}
	})
	t.Run("rejects unknown profile", func(t *testing.T) {
		if err := newProfileStore(t).Delete("missing"); !errors.Is(err, ErrNotFound) {
			t.Errorf("Delete() error = %v, want error matching %v", err, ErrNotFound)
		}
	})
}

func TestStore_SetPassword(t *testing.T) {
	keyring.MockInit()
	store := newProfileStore(t)
	if err := store.SetPassword("missing", "secret"); !errors.Is(err, ErrNotFound) {
		t.Errorf("SetPassword() error = %v, want error matching %v", err, ErrNotFound)
	}
}

func TestStore_Credentials(t *testing.T) {
	keyring.MockInit()
	store := newProfileStore(t)
	saved := saveProfile(t, store, validProfile("server"))
	if err := store.SetPassword(saved.ID, "secret"); err != nil {
		t.Fatalf("SetPassword() error = %v", err)
	}
	t.Run("returns profile and password", func(t *testing.T) {
		got, password, err := store.Credentials(saved.ID)
		if err != nil {
			t.Fatalf("Credentials() error = %v", err)
		}
		if got != saved || password != "secret" {
			t.Errorf("Credentials() = (%+v, %q), want (%+v, %q)", got, password, saved, "secret")
		}
	})
	t.Run("rejects unknown profile", func(t *testing.T) {
		if _, _, err := store.Credentials("missing"); !errors.Is(err, ErrNotFound) {
			t.Errorf("Credentials() error = %v, want error matching %v", err, ErrNotFound)
		}
	})
}

func newProfileStore(t *testing.T) *Store {
	t.Helper()
	return openProfileStore(t, filepath.Join(t.TempDir(), "profiles.json"))
}
func openProfileStore(t *testing.T, path string) *Store {
	t.Helper()
	store, err := Open(path)
	if err != nil {
		t.Fatalf("Open() error = %v", err)
	}
	return store
}
func saveProfile(t *testing.T, store *Store, profile Profile) Profile {
	t.Helper()
	saved, err := store.Save(profile)
	if err != nil {
		t.Fatalf("Save() error = %v", err)
	}
	return saved
}
func validProfile(name string) Profile {
	return Profile{Name: name, ConnectionType: connection.TypeRCON, Host: "example.com", Port: 27015, Version: "42"}
}
