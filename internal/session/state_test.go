package session

import (
	"slices"
	"testing"

	"github.com/beyenilmez/pz-admin/internal/feature"
	"github.com/beyenilmez/pz-admin/internal/profile"
	"github.com/beyenilmez/pz-admin/internal/testutil"
)

func TestNewState(t *testing.T) {
	p := profile.Profile{ID: "profile", Version: "42"}

	t.Run("returns zero state for nil channel", func(t *testing.T) {
		state := NewState(p, nil)
		if state.Channel != nil || state.CommandClient != nil || state.Connected ||
			state.Profile != (profile.Profile{}) || len(state.Features) != 0 {
			t.Errorf("NewState() = %+v, want zero state", state)
		}
	})

	t.Run("retains non-command channel without executable connection", func(t *testing.T) {
		channel := &stubChannel{}
		state := NewState(p, channel)
		if state.Channel != channel || state.Profile != p {
			t.Errorf("NewState() = %+v, want profile and channel retained", state)
		}
		if state.Connected || state.CommandClient != nil {
			t.Errorf("NewState() = %+v, want no command capability", state)
		}
	})

	t.Run("derives executable snapshot and client", func(t *testing.T) {
		state := NewState(p, &testutil.RecordingChannel{})
		if !state.Connected || state.CommandClient == nil {
			t.Errorf("NewState() = %+v, want connected command state", state)
		}
		if !containsFeature(state.Features, feature.ConsoleExecuteCommand) {
			t.Errorf("features = %v, want %q", state.Features, feature.ConsoleExecuteCommand)
		}
	})
}

type stubChannel struct {
	closed bool
}

func (c *stubChannel) Close() {
	c.closed = true
}

func containsFeature(features []feature.ID, want feature.ID) bool {
	return slices.Contains(features, want)
}
