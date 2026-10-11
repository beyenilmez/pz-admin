package config

import (
	"errors"
	"strings"
	"testing"
)

func TestConfig_Validate(t *testing.T) {
	tests := []struct {
		name            string
		cfg             Config
		wantErr         error
		wantMsgContains string
	}{
		{name: "accepts defaults", cfg: defaults()},
		{name: "accepts non-default theme and language", cfg: Config{Theme: ThemeDark, Language: "tr-TR"}},
		{name: "accepts arbitrary language", cfg: Config{Theme: ThemeSystem, Language: "custom"}},
		{name: "rejects invalid theme", cfg: Config{Theme: "blue", Language: "en-US"}, wantErr: ErrInvalidTheme, wantMsgContains: "blue"},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := test.cfg.Validate()
			if test.wantErr == nil {
				if err != nil {
					t.Fatalf("Validate() = %v, want nil", err)
				}
				return
			}
			if !errors.Is(err, test.wantErr) {
				t.Errorf("Validate() error = %v, want error matching %v", err, test.wantErr)
			}
			if !strings.Contains(err.Error(), test.wantMsgContains) {
				t.Errorf("Validate() error = %q, want it to contain %q", err, test.wantMsgContains)
			}
		})
	}
}
