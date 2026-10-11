package migration

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/beyenilmez/pz-admin/internal/connection"
	"github.com/beyenilmez/pz-admin/internal/profile"
	"github.com/google/uuid"
	"github.com/zalando/go-keyring"
)

type legacyCredentials struct {
	IP       string `json:"ip"`
	Port     string `json:"port"`
	Password string `json:"password"`
}

func importServer(legacyDir, configDir, dataDir string) error {
	profilePath := filepath.Join(configDir, "profiles.json")
	if _, err := os.Lstat(profilePath); !errors.Is(err, os.ErrNotExist) {
		if err == nil {
			slog.Debug("v1 server import skipped", "reason", "v2 profiles exist")
		}
		return err
	}
	data, err := os.ReadFile(filepath.Join(legacyDir, "credentials.json"))
	if errors.Is(err, os.ErrNotExist) {
		slog.Debug("v1 server import skipped", "reason", "no v1 credentials")
		return nil
	}
	if err != nil {
		return err
	}
	var credentials legacyCredentials
	if err := json.Unmarshal(data, &credentials); err != nil {
		return errors.New("invalid v1 credentials JSON")
	}
	savedProfile, password, err := convertCredentials(credentials)
	if err != nil {
		return err
	}
	historyPath := filepath.Join(legacyDir, credentials.IP+"-"+credentials.Port, "players.json")
	players, err := readPlayers(historyPath)
	if err != nil {
		return err
	}
	if err := keyring.Set(profile.KeyringService, savedProfile.ID, password); err != nil {
		return fmt.Errorf("store imported password: %w", err)
	}
	playerPath := filepath.Join(dataDir, "players", savedProfile.ID+".json")
	// Commit profiles last so they never reference incomplete imported data.
	if err := writeJSON(playerPath, players); err != nil {
		return errors.Join(err, keyring.Delete(profile.KeyringService, savedProfile.ID))
	}
	if err := writeJSON(profilePath, []profile.Profile{savedProfile}); err != nil {
		return errors.Join(err, os.Remove(playerPath), keyring.Delete(profile.KeyringService, savedProfile.ID))
	}
	slog.Info("v1 server import completed", "players_imported", len(players))
	return nil
}

func convertCredentials(credentials legacyCredentials) (profile.Profile, string, error) {
	port, err := strconv.Atoi(credentials.Port)
	if err != nil || port < 1 || port > 65535 || strings.TrimSpace(credentials.IP) == "" {
		return profile.Profile{}, "", errors.New("invalid v1 host or port")
	}
	// The legacy host also forms a directory name; never allow it to escape its root.
	if strings.ContainsAny(credentials.IP, `/\`) {
		return profile.Profile{}, "", errors.New("invalid v1 host")
	}
	password, err := decryptPassword(credentials.Password)
	if err != nil {
		return profile.Profile{}, "", err
	}
	return profile.Profile{
		ID:             uuid.NewString(),
		Name:           net.JoinHostPort(credentials.IP, credentials.Port),
		Host:           credentials.IP,
		Port:           port,
		Version:        "auto",
		ConnectionType: connection.TypeRCON,
	}, password, nil
}

func decryptPassword(encoded string) (string, error) {
	data, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil || len(data) <= aes.BlockSize {
		return "", errors.New("invalid v1 password encoding")
	}
	key := sha256.Sum256([]byte("6f6c11c2-1dc8-417d-a68e-0e487629"))
	block, err := aes.NewCipher(key[:])
	if err != nil {
		return "", err
	}
	// CFB is retained only to read v1's format; new passwords go into the OS keyring.
	iv, password := data[:aes.BlockSize], data[aes.BlockSize:]
	cipher.NewCFBDecrypter(block, iv).XORKeyStream(password, password)
	return string(password), nil
}
