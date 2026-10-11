package diagnostics

import (
	"bufio"
	"errors"
	"fmt"
	"os"
	"runtime"
	"strings"
)

type FlatpakInfo struct {
	AppID         string `json:"appId"`
	Version       string `json:"version"`
	Branch        string `json:"branch"`
	Runtime       string `json:"runtime"`
	AppCommit     string `json:"appCommit"`
	RuntimeCommit string `json:"runtimeCommit"`
}

type Service struct{}

// Flatpak returns nil for native installs.
func (s *Service) Flatpak() (*FlatpakInfo, error) {
	if runtime.GOOS != "linux" {
		return nil, nil
	}
	return readFlatpakInfo("/.flatpak-info")
}

func readFlatpakInfo(filename string) (*FlatpakInfo, error) {
	file, err := os.Open(filename)
	if errors.Is(err, os.ErrNotExist) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("read Flatpak diagnostics: %w", err)
	}
	defer file.Close()

	info := &FlatpakInfo{}
	// Only report selected fields; the file also contains private host paths.
	fields := map[string]*string{
		"Application.name":         &info.AppID,
		"Application.runtime":      &info.Runtime,
		"Instance.flatpak-version": &info.Version,
		"Instance.branch":          &info.Branch,
		"Instance.app-commit":      &info.AppCommit,
		"Instance.runtime-commit":  &info.RuntimeCommit,
	}
	section := ""
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if strings.HasPrefix(line, "[") && strings.HasSuffix(line, "]") {
			section = strings.TrimSuffix(strings.TrimPrefix(line, "["), "]")
			continue
		}
		key, value, ok := strings.Cut(line, "=")
		if target := fields[section+"."+strings.TrimSpace(key)]; ok && target != nil {
			*target = strings.TrimSpace(value)
		}
	}
	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("read Flatpak diagnostics: %w", err)
	}
	return info, nil
}
