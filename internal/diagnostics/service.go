package diagnostics

import (
	"bufio"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"slices"
	"strings"

	"github.com/wailsapp/wails/v3/pkg/application"
)

type FlatpakInfo struct {
	AppID         string `json:"appId"`
	Version       string `json:"version"`
	Branch        string `json:"branch"`
	Runtime       string `json:"runtime"`
	AppCommit     string `json:"appCommit"`
	RuntimeCommit string `json:"runtimeCommit"`
}

// Report contains the same diagnostic fields for the Settings view and logs.
type Report map[string]any

func (r Report) LogValue() slog.Value {
	keys := make([]string, 0, len(r))
	for key := range r {
		keys = append(keys, key)
	}
	slices.Sort(keys)
	attrs := make([]slog.Attr, 0, len(keys))
	for _, key := range keys {
		attrs = append(attrs, slog.Any(key, r[key]))
	}
	return slog.GroupValue(attrs...)
}

type Service struct {
	version string
}

func NewService(version string) *Service {
	return &Service{version: version}
}

// Report collects the current environment and installation details. On error,
// it still returns the available fields so startup logging can retain them.
func (s *Service) Report() (Report, error) {
	return collectReport(s.version, application.Get().Env.Info(), "/.flatpak-info")
}

func collectReport(version string, environment application.EnvironmentInfo, flatpakPath string) (Report, error) {
	report := Report{
		"version":     version,
		"os":          environment.OS,
		"arch":        environment.Arch,
		"debug_build": environment.Debug,
	}
	if environment.OSInfo != nil {
		report["os_details.name"] = environment.OSInfo.Name
		report["os_details.version"] = environment.OSInfo.Version
		report["os_details.id"] = environment.OSInfo.ID
		report["os_details.branding"] = environment.OSInfo.Branding
	}
	for key, value := range environment.PlatformInfo {
		report["platform."+key] = value
	}

	var flatpak *FlatpakInfo
	if environment.OS == "linux" {
		var err error
		flatpak, err = readFlatpakInfo(flatpakPath)
		if err != nil {
			return report, err
		}
	}
	if flatpak != nil {
		report["flatpak"] = true
		for key, value := range map[string]string{
			"app_id":         flatpak.AppID,
			"version":        flatpak.Version,
			"branch":         flatpak.Branch,
			"runtime":        flatpak.Runtime,
			"app_commit":     flatpak.AppCommit,
			"runtime_commit": flatpak.RuntimeCommit,
		} {
			if value != "" {
				report["flatpak."+key] = value
			}
		}
	}
	return report, nil
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
