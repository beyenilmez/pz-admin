package options

import (
	"context"
	"errors"
	"slices"
	"strings"
	"testing"

	"github.com/beyenilmez/pz-admin/internal/profile"
	"github.com/beyenilmez/pz-admin/internal/session"
	"github.com/beyenilmez/pz-admin/internal/testutil"
)

func TestService_List(t *testing.T) {
	wantErr := errors.New("show options failed")
	channel := &testutil.RecordingChannel{Handler: func(context.Context, string) (string, error) {
		return "", wantErr
	}}
	service := connectedService(channel)

	if _, err := service.List(t.Context()); !errors.Is(err, wantErr) {
		t.Errorf("List() error = %v, want wrapped %v", err, wantErr)
	}
	testutil.AssertCommands(t, channel, "showoptions")
}

func TestService_Update(t *testing.T) {
	wantErr := errors.New("rejected by server")
	channel := &testutil.RecordingChannel{Handler: func(_ context.Context, command string) (string, error) {
		switch command {
		case `changeoption "Open" "true"`:
			return "Option : Open is now : true", nil
		case `changeoption "MaxPlayers" "32"`:
			return "", wantErr
		default:
			t.Fatalf("unexpected command %q", command)
			return "", nil
		}
	}}
	service := connectedService(channel)

	result, err := service.Update(t.Context(), map[string]string{"Open": "true", "MaxPlayers": "32"})
	if err != nil {
		t.Fatal(err)
	}
	if !slices.Equal(result.Updated, []string{"Open"}) {
		t.Errorf("Updated = %v, want [Open]", result.Updated)
	}
	if failure := result.Failed["MaxPlayers"]; !strings.Contains(failure, wantErr.Error()) {
		t.Errorf("Failed[MaxPlayers] = %q, want wrapped failure", failure)
	}
}

func TestService_RequiresActiveSession(t *testing.T) {
	service := NewService()
	if _, err := service.List(t.Context()); err == nil {
		t.Error("List() error = nil, want disconnected error")
	}
	if _, err := service.Update(t.Context(), map[string]string{"Open": "true"}); err == nil {
		t.Error("Update() error = nil, want disconnected error")
	}
}

func TestService_UpdateEmpty(t *testing.T) {
	channel := &testutil.RecordingChannel{}
	result, err := connectedService(channel).Update(t.Context(), nil)
	if err != nil {
		t.Fatal(err)
	}
	if len(result.Updated) != 0 || len(result.Failed) != 0 || len(channel.Commands()) != 0 {
		t.Errorf("Update(nil) = %+v after commands %v, want empty result without commands", result, channel.Commands())
	}
}

func connectedService(channel *testutil.RecordingChannel) *Service {
	service := NewService()
	service.SessionChanged(session.NewState(profile.Profile{Version: "42"}, channel))
	return service
}
