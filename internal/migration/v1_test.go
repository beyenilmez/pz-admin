package migration

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"os"
	"path/filepath"
	"testing"

	"github.com/beyenilmez/pz-admin/internal/player"
	"github.com/beyenilmez/pz-admin/internal/profile"
	"github.com/zalando/go-keyring"
)

func legacyFixture(t *testing.T) (string, string, string) {
	t.Helper()
	root := t.TempDir()
	legacy, config, data := filepath.Join(root, "v1"), filepath.Join(root, "config"), filepath.Join(root, "data")
	key := sha256.Sum256([]byte("6f6c11c2-1dc8-417d-a68e-0e487629"))
	block, err := aes.NewCipher(key[:])
	if err != nil {
		t.Fatal(err)
	}
	password := []byte("test-password")
	encrypted := make([]byte, aes.BlockSize+len(password))
	cipher.NewCFBEncrypter(block, encrypted[:aes.BlockSize]).XORKeyStream(encrypted[aes.BlockSize:], password)
	if err := writeJSON(filepath.Join(legacy, "credentials.json"), map[string]string{
		"ip": "localhost", "port": "27015", "password": base64.StdEncoding.EncodeToString(encrypted),
	}); err != nil {
		t.Fatal(err)
	}
	return legacy, config, data
}

func TestImportV1(t *testing.T) {
	keyring.MockInit()
	legacy, config, data := legacyFixture(t)
	history := filepath.Join(legacy, "localhost-27015", "players.json")
	original := []byte(`[
		{"name":"Alice","accessLevel":"admin","banned":true,"online":true,"godmode":true},
		{"name":"Bob","accessLevel":"player","banned":false},
		{"name":"Charlie","accessLevel":"unexpected"},
		{"name":"alice"}, {"name":""}
	]`)
	if err := os.MkdirAll(filepath.Dir(history), 0o700); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(history, original, 0o600); err != nil {
		t.Fatal(err)
	}
	if err := importV1(legacy, config, data); err != nil {
		t.Fatal(err)
	}
	profiles, err := profile.Open(filepath.Join(config, "profiles.json"))
	if err != nil {
		t.Fatal(err)
	}
	list := profiles.List()
	if len(list) != 1 || list[0].Name != "localhost:27015" || list[0].Version != "auto" || list[0].Port != 27015 || list[0].Host != "localhost" {
		t.Fatalf("unexpected imported profiles: %+v", list)
	}
	if _, password, credentialsErr := profiles.Credentials(list[0].ID); credentialsErr != nil || password != "test-password" {
		t.Fatal("password was not imported correctly")
	}
	store, err := player.Open(filepath.Join(data, "players"))
	if err != nil {
		t.Fatal(err)
	}
	players, err := store.List(list[0].ID)
	if err != nil || len(players) != 3 {
		t.Fatalf("imported players = %v, error = %v", players, err)
	}
	if players[0].AccessLevel == nil || *players[0].AccessLevel != "admin" || players[0].Banned == nil || !*players[0].Banned {
		t.Fatal("lost known role or ban")
	}
	if players[1].AccessLevel != nil || players[1].Banned != nil || players[2].AccessLevel != nil {
		t.Fatal("incorrect default/unknown field conversion")
	}
	for _, p := range players {
		if p.ID == "" || p.GodMode != nil || !p.FirstSeenAt.IsZero() || !p.LastSeenOnlineAt.IsZero() || !p.LastKnownOfflineAt.IsZero() {
			t.Fatal("unexpected imported identity, state or timestamps")
		}
	}
	unchanged, err := os.ReadFile(history)
	if err != nil || string(unchanged) != string(original) {
		t.Fatal("legacy history was changed")
	}
	// An intentionally empty store must not cause deleted profiles to reappear.
	if err = profiles.Delete(list[0].ID); err != nil {
		t.Fatal(err)
	}
	if err = importV1(legacy, config, data); err != nil {
		t.Fatal(err)
	}
	content, err := os.ReadFile(filepath.Join(config, "profiles.json"))
	if err != nil || string(content) != "[]" {
		t.Fatal("existing empty profile store was overwritten")
	}
}

func TestImportV1KeyringFailureIsNotRetried(t *testing.T) {
	legacy, config, data := legacyFixture(t)
	keyring.MockInitWithError(errors.New("keyring unavailable"))
	t.Cleanup(keyring.MockInit)
	if err := importV1(legacy, config, data); err == nil {
		t.Fatal("expected keyring failure")
	}
	if _, err := os.Stat(filepath.Join(config, "profiles.json")); !errors.Is(err, os.ErrNotExist) {
		t.Fatal("failed import created a profile store")
	}
	keyring.MockInit()
	if err := importV1(legacy, config, data); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(filepath.Join(config, "profiles.json")); !errors.Is(err, os.ErrNotExist) {
		t.Fatal("failed migration was retried")
	}
	marker, err := os.ReadFile(filepath.Join(legacy, markerName))
	if err != nil || len(marker) != 0 {
		t.Fatal("missing or nonempty migration marker")
	}
}

func TestImportV1DoesNotRestoreDeletedV2Data(t *testing.T) {
	keyring.MockInit()
	legacy, config, data := legacyFixture(t)
	if err := writeJSON(filepath.Join(legacy, "config.json"), map[string]string{"theme": "dark"}); err != nil {
		t.Fatal(err)
	}
	if err := importV1(legacy, config, data); err != nil {
		t.Fatal(err)
	}
	for _, name := range []string{"config.json", "profiles.json"} {
		if err := os.Remove(filepath.Join(config, name)); err != nil {
			t.Fatal(err)
		}
	}
	if err := importV1(legacy, config, data); err != nil {
		t.Fatal(err)
	}
	for _, name := range []string{"config.json", "profiles.json"} {
		if _, err := os.Stat(filepath.Join(config, name)); !errors.Is(err, os.ErrNotExist) {
			t.Fatalf("deleted %s was restored", name)
		}
	}
}

func TestImportV1MissingOrInvalidData(t *testing.T) {
	t.Run("no legacy directory", func(t *testing.T) {
		root := t.TempDir()
		legacy := filepath.Join(root, "v1")
		if err := importV1(legacy, filepath.Join(root, "config"), filepath.Join(root, "data")); err != nil {
			t.Fatal(err)
		}
		if _, err := os.Stat(legacy); !errors.Is(err, os.ErrNotExist) {
			t.Fatal("created an unnecessary legacy directory")
		}
	})
	t.Run("no legacy credentials", func(t *testing.T) {
		root := t.TempDir()
		if err := importV1(root, filepath.Join(root, "config"), filepath.Join(root, "data")); err != nil {
			t.Fatal(err)
		}
	})
	t.Run("invalid player history", func(t *testing.T) {
		legacy, config, data := legacyFixture(t)
		if err := writeJSON(filepath.Join(legacy, "localhost-27015", "players.json"), "invalid"); err != nil {
			t.Fatal(err)
		}
		if err := importV1(legacy, config, data); err == nil {
			t.Fatal("expected invalid history error")
		}
		if _, err := os.Stat(filepath.Join(config, "profiles.json")); !errors.Is(err, os.ErrNotExist) {
			t.Fatal("invalid history committed a profile")
		}
	})
	for _, password := range []string{"", "not base64", base64.StdEncoding.EncodeToString(make([]byte, aes.BlockSize))} {
		if _, err := decryptPassword(password); err == nil {
			t.Fatal("accepted invalid password encoding")
		}
	}
}
