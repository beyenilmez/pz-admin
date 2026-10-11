package command

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/beyenilmez/pz-admin/internal/feature"
)

func TestRegistry_Register(t *testing.T) {
	for _, definition := range []Definition{
		{Name: "missing-minimum", MaxVersion: "42"},
		{Name: "missing-maximum", MinVersion: "41"},
		{Name: "reversed", MinVersion: "42", MaxVersion: "41"},
	} {
		t.Run(definition.Name, func(t *testing.T) {
			defer func() {
				if recover() == nil {
					t.Error("Register() did not panic")
				}
			}()
			new(Registry).Register(definition)
		})
	}
}

func TestRegistry_Lookup(t *testing.T) {
	registry := newTestRegistry(
		Definition{Name: "save", MinVersion: "41", MaxVersion: "42"},
		Definition{Name: "newsave", MinVersion: "42", MaxVersion: "42"},
	)

	for _, test := range []struct {
		name    string
		command string
		version string
		want    bool
	}{
		{name: "exact name", command: "save", version: "41", want: true},
		{name: "unknown command", command: "unknown", version: "41", want: false},
		{name: "below minimum", command: "newsave", version: "41", want: false},
		{name: "minimum boundary", command: "newsave", version: "42", want: true},
		{name: "maximum boundary", command: "save", version: "42", want: true},
		{name: "above maximum", command: "save", version: "43", want: false},
	} {
		t.Run(test.name, func(t *testing.T) {
			_, got := registry.Lookup(test.command, test.version)
			if got != test.want {
				t.Errorf("Lookup(%q, %q) found = %t, want %t", test.command, test.version, got, test.want)
			}
		})
	}
}

func TestRegistry_Features(t *testing.T) {
	registry := newTestRegistry(
		Definition{Name: "old", MinVersion: "41", MaxVersion: "41", Feature: feature.PlayerSetGodMode},
		Definition{Name: "new", MinVersion: "42", MaxVersion: "42", Feature: feature.PlayerSetGodMode},
		Definition{Name: "shared", MinVersion: "41", MaxVersion: "42", Feature: feature.PlayerKick},
		Definition{Name: "console-only", MinVersion: "41", MaxVersion: "42"},
	)

	for _, version := range supportedCommandTestBuilds {
		t.Run("Build "+version, func(t *testing.T) {
			features := registry.Features(version)
			if !features.Has(feature.PlayerSetGodMode) {
				t.Error("Features() does not contain PlayerSetGodMode")
			}
			if !features.Has(feature.PlayerKick) {
				t.Error("Features() does not contain PlayerKick")
			}
			if len(features) != 2 {
				t.Errorf("len(Features()) = %d, want 2", len(features))
			}
		})
	}
}

func TestRegistry_Execute(t *testing.T) {
	wantExecutorError := errors.New("execute")

	tests := []struct {
		name       string
		registry   *Registry
		executor   *stubExecutor
		command    string
		version    string
		args       map[string]string
		want       any
		wantError  error
		anyError   bool
		nilExecute bool
	}{
		{
			name: "parses response",
			registry: newTestRegistry(Definition{
				Name: "test", MinVersion: "41", MaxVersion: "41",
				Params: []Param{{Name: "value", Type: TypeString, Required: true}},
				Parse: func(raw string, _ map[string]string) (any, error) {
					return strings.ToUpper(raw), nil
				},
			}),
			executor: &stubExecutor{response: "ok"},
			command:  "test",
			version:  "41",
			args:     map[string]string{"value": "hello"},
			want:     "OK",
		},
		{
			name:     "returns raw response without parser",
			registry: newTestRegistry(Definition{Name: "save", MinVersion: "41", MaxVersion: "41"}),
			executor: &stubExecutor{response: "World saved"},
			command:  "save",
			version:  "41",
			want:     "World saved",
		},
		{
			name:      "rejects unknown command",
			registry:  new(Registry),
			executor:  new(stubExecutor),
			command:   "unknown",
			version:   "41",
			wantError: ErrUnknownCommand,
		},
		{
			name:      "propagates executor error",
			registry:  newTestRegistry(Definition{Name: "save", MinVersion: "41", MaxVersion: "41"}),
			executor:  &stubExecutor{err: wantExecutorError},
			command:   "save",
			version:   "41",
			wantError: wantExecutorError,
		},
		{
			name: "propagates build error",
			registry: newTestRegistry(Definition{
				Name: "kick", MinVersion: "41", MaxVersion: "41",
				Params: []Param{{Name: "username", Type: TypeString, Required: true}},
			}),
			executor: new(stubExecutor),
			command:  "kick",
			version:  "41",
			anyError: true,
		},
		{
			name:       "rejects nil executor",
			registry:   newTestRegistry(Definition{Name: "save", MinVersion: "41", MaxVersion: "41"}),
			command:    "save",
			version:    "41",
			anyError:   true,
			nilExecute: true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			var (
				got any
				err error
			)
			if test.nilExecute {
				got, err = test.registry.Execute(t.Context(), nil, test.command, test.version, test.args)
			} else {
				got, err = test.registry.Execute(t.Context(), test.executor, test.command, test.version, test.args)
			}
			switch {
			case test.wantError != nil && !errors.Is(err, test.wantError):
				t.Fatalf("Execute() error = %v, want %v", err, test.wantError)
			case test.anyError && err == nil:
				t.Fatal("Execute() error = nil, want error")
			case test.wantError == nil && !test.anyError && err != nil:
				t.Fatalf("Execute() error = %v", err)
			}
			if got != test.want {
				t.Errorf("Execute() = %#v, want %#v", got, test.want)
			}
		})
	}
}

type stubExecutor struct {
	response string
	err      error
}

func (s *stubExecutor) ExecuteCommand(context.Context, string) (string, error) {
	return s.response, s.err
}

func newTestRegistry(definitions ...Definition) *Registry {
	registry := new(Registry)
	for _, definition := range definitions {
		registry.Register(definition)
	}
	return registry
}
