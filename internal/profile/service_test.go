package profile

import (
	"errors"
	"testing"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/zalando/go-keyring"
)

func TestService_Lifecycle(t *testing.T) {
	service := newService(t.TempDir())
	if _, err := service.List(); err == nil {
		t.Error("List() error = nil before startup")
	}
	if _, _, err := service.Credentials("missing"); err == nil {
		t.Error("Credentials() error = nil before startup")
	}
	startProfileService(t, service)
	profiles, err := service.List()
	if err != nil {
		t.Fatalf("List() error = %v", err)
	}
	if len(profiles) != 0 {
		t.Errorf("List() = %+v, want empty", profiles)
	}
}

func TestService_Save(t *testing.T) {
	keyring.MockInit()
	t.Run("requires password for new profile", func(t *testing.T) {
		service := newStartedProfileService(t, nil)
		if _, err := service.Save(validProfile("server"), ""); err == nil {
			t.Fatal("Save() error = nil, want password error")
		}
		profiles, err := service.List()
		if err != nil || len(profiles) != 0 {
			t.Errorf("List() = (%v, %v), want empty", profiles, err)
		}
	})
	t.Run("stores new profile and password", func(t *testing.T) {
		service := newStartedProfileService(t, nil)
		saved, err := service.Save(validProfile("server"), "secret")
		if err != nil {
			t.Fatalf("Save() error = %v", err)
		}
		got, password, err := service.Credentials(saved.ID)
		if err != nil {
			t.Fatalf("Credentials() error = %v", err)
		}
		if got != saved || password != "secret" {
			t.Errorf("Credentials() = (%+v, %q), want (%+v, %q)", got, password, saved, "secret")
		}
	})
	t.Run("preserves password for blank update", func(t *testing.T) {
		service := newStartedProfileService(t, nil)
		saved, err := service.Save(validProfile("before"), "secret")
		if err != nil {
			t.Fatalf("initial Save() error = %v", err)
		}
		saved.Name = "after"
		updated, err := service.Save(saved, "")
		if err != nil {
			t.Fatalf("update Save() error = %v", err)
		}
		if updated.Name != "after" {
			t.Errorf("Save().Name = %q, want %q", updated.Name, "after")
		}
		_, password, err := service.Credentials(saved.ID)
		if err != nil {
			t.Fatalf("Credentials() error = %v", err)
		}
		if password != "secret" {
			t.Errorf("Credentials().password = %q, want %q", password, "secret")
		}
	})
	t.Run("rejects unknown update", func(t *testing.T) {
		service := newStartedProfileService(t, nil)
		profile := validProfile("server")
		profile.ID = "missing"
		if _, err := service.Save(profile, ""); !errors.Is(err, ErrNotFound) {
			t.Errorf("Save() error = %v, want error matching %v", err, ErrNotFound)
		}
	})
	t.Run("rolls back a new profile when password storage fails", func(t *testing.T) {
		wantErr := errors.New("keyring unavailable")
		keyring.MockInitWithError(wantErr)
		t.Cleanup(keyring.MockInit)
		service := newStartedProfileService(t, nil)

		if _, err := service.Save(validProfile("server"), "secret"); !errors.Is(err, wantErr) {
			t.Fatalf("Save() error = %v, want error matching %v", err, wantErr)
		}
		if profiles, err := service.List(); err != nil || len(profiles) != 0 {
			t.Fatalf("List() = (%v, %v), want empty after rollback", profiles, err)
		}
	})
	t.Run("rolls back an update when password storage fails", func(t *testing.T) {
		keyring.MockInit()
		service := newStartedProfileService(t, nil)
		saved, err := service.Save(validProfile("before"), "secret")
		if err != nil {
			t.Fatal(err)
		}
		wantErr := errors.New("keyring unavailable")
		keyring.MockInitWithError(wantErr)
		t.Cleanup(keyring.MockInit)
		saved.Name = "after"

		if _, err := service.Save(saved, "replacement"); !errors.Is(err, wantErr) {
			t.Fatalf("Save() error = %v, want error matching %v", err, wantErr)
		}
		profiles, err := service.List()
		if err != nil || len(profiles) != 1 || profiles[0].Name != "before" {
			t.Fatalf("List() = (%v, %v), want original profile", profiles, err)
		}
	})
}

func TestService_Delete(t *testing.T) {
	keyring.MockInit()
	t.Run("removes player data", func(t *testing.T) {
		players := &recordingPlayerDataStore{}
		service := newStartedProfileService(t, players)
		saved, err := service.Save(validProfile("server"), "secret")
		if err != nil {
			t.Fatalf("Save() error = %v", err)
		}
		if err := service.Delete(saved.ID); err != nil {
			t.Fatalf("Delete() error = %v", err)
		}
		if players.deletedID != saved.ID {
			t.Errorf("DeleteByProfile() ID = %q, want %q", players.deletedID, saved.ID)
		}
	})
	t.Run("keeps profile deleted after player cleanup failure", func(t *testing.T) {
		wantErr := errors.New("disk failure")
		service := newStartedProfileService(t, &recordingPlayerDataStore{err: wantErr})
		saved, err := service.Save(validProfile("server"), "secret")
		if err != nil {
			t.Fatalf("Save() error = %v", err)
		}
		if err := service.Delete(saved.ID); !errors.Is(err, wantErr) {
			t.Errorf("Delete() error = %v, want error matching %v", err, wantErr)
		}
		profiles, err := service.List()
		if err != nil {
			t.Fatalf("List() error = %v", err)
		}
		if len(profiles) != 0 {
			t.Errorf("List() = %+v, want empty", profiles)
		}
	})
}

type recordingPlayerDataStore struct {
	deletedID string
	err       error
}

func (store *recordingPlayerDataStore) DeleteByProfile(profileID string) error {
	store.deletedID = profileID
	return store.err
}
func startProfileService(t *testing.T, service *Service) {
	t.Helper()
	if err := service.ServiceStartup(t.Context(), application.ServiceOptions{}); err != nil {
		t.Fatalf("ServiceStartup() error = %v", err)
	}
}
func newStartedProfileService(t *testing.T, players playerDataStore) *Service {
	t.Helper()
	service := NewService(players)
	service.dir = t.TempDir()
	startProfileService(t, service)
	return service
}
