package notices

import (
	"encoding/json"
	"fmt"
	"strings"
)

// Entry preserves the license text and attribution supplied by the report.
type Entry struct {
	Name       string `json:"name"`
	Identifier string `json:"identifier"`
	Version    string `json:"version,omitempty"`
	Source     string `json:"source,omitempty"`
	Note       string `json:"note,omitempty"`
	Text       string `json:"text"`
}

type Report struct {
	ApplicationLicense string  `json:"applicationLicense"`
	Entries            []Entry `json:"entries"`
}

// Service exposes the notices embedded in this build without reading installed files.
type Service struct {
	applicationLicense string
	thirdPartyNotices  string
}

func NewService(applicationLicense, thirdPartyNotices string) *Service {
	return &Service{applicationLicense: applicationLicense, thirdPartyNotices: thirdPartyNotices}
}

func (s *Service) Report() (Report, error) {
	report := Report{ApplicationLicense: s.applicationLicense, Entries: []Entry{}}
	// Development builds can contain the empty collection placeholder.
	if strings.TrimSpace(s.thirdPartyNotices) == "" {
		return report, nil
	}
	if err := json.Unmarshal([]byte(s.thirdPartyNotices), &report.Entries); err != nil {
		return Report{}, fmt.Errorf("read embedded third-party notices: %w", err)
	}
	if report.Entries == nil {
		report.Entries = []Entry{}
	}
	return report, nil
}
