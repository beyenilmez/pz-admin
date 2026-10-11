package console

import (
	"context"
	"errors"
	"testing"

	"github.com/beyenilmez/pz-admin/internal/profile"
	"github.com/beyenilmez/pz-admin/internal/session"
	"github.com/beyenilmez/pz-admin/internal/testutil"
)

type recordingCommandObserver struct {
	profile profile.Profile
	input   string
	output  string
	calls   int
	err     error
}

func (o *recordingCommandObserver) Observe(p profile.Profile, input, output string) error {
	o.calls++
	o.profile = p
	o.input = input
	o.output = output
	return o.err
}

func TestService_Execute(t *testing.T) {
	t.Run("executes trimmed command and records response", func(t *testing.T) {
		channel := &testutil.RecordingChannel{Handler: func(context.Context, string) (string, error) {
			return "response", nil
		}}
		observer := &recordingCommandObserver{}
		p := profile.Profile{ID: "profile-id", Version: "42"}
		service := NewService(observer.Observe)
		service.SessionChanged(session.NewState(p, channel))

		result, err := service.Execute(t.Context(), "  players  ")
		if err != nil {
			t.Fatal(err)
		}
		if result != "response" {
			t.Errorf("Execute() = %q, want response", result)
		}
		testutil.AssertCommands(t, channel, "players")
		if observer.profile != p || observer.input != "players" || observer.output != result {
			t.Errorf("observed command = (%+v, %q, %q), want (%+v, %q, %q)", observer.profile, observer.input, observer.output, p, "players", result)
		}
	})

	t.Run("requires active command capability", func(t *testing.T) {
		service := NewService(nil)
		if _, err := service.Execute(t.Context(), "players"); err == nil {
			t.Error("Execute() error = nil, want disconnected error")
		}
	})

	t.Run("rejects blank command without execution or observation", func(t *testing.T) {
		channel := &testutil.RecordingChannel{}
		observer := &recordingCommandObserver{}
		service := NewService(observer.Observe)
		service.SessionChanged(session.NewState(profile.Profile{}, channel))

		if _, err := service.Execute(t.Context(), " \t\n "); err == nil {
			t.Error("Execute() accepted a blank command")
		}
		if len(channel.Commands()) != 0 || observer.calls != 0 {
			t.Errorf("blank command executed %d commands and made %d observations", len(channel.Commands()), observer.calls)
		}
	})

	t.Run("returns command error", func(t *testing.T) {
		wantErr := errors.New("command failed")
		observer := &recordingCommandObserver{}
		channel := &testutil.RecordingChannel{Handler: func(context.Context, string) (string, error) {
			return "", wantErr
		}}
		service := NewService(observer.Observe)
		service.SessionChanged(session.NewState(profile.Profile{}, channel))

		if _, err := service.Execute(t.Context(), "players"); !errors.Is(err, wantErr) {
			t.Errorf("Execute() error = %v, want wrapped %v", err, wantErr)
		}
		if observer.calls != 0 {
			t.Errorf("observer calls = %d, want 0", observer.calls)
		}
	})

	t.Run("does not fail a successful command when observation fails", func(t *testing.T) {
		observer := &recordingCommandObserver{err: errors.New("observation failed")}
		channel := &testutil.RecordingChannel{Handler: func(context.Context, string) (string, error) {
			return "response", nil
		}}
		service := NewService(observer.Observe)
		service.SessionChanged(session.NewState(profile.Profile{ID: "profile"}, channel))

		result, err := service.Execute(t.Context(), "players")
		if err != nil || result != "response" {
			t.Fatalf("Execute() = (%q, %v), want (response, nil)", result, err)
		}
		if observer.calls != 1 {
			t.Errorf("observer calls = %d, want 1", observer.calls)
		}
	})

}
