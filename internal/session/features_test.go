package session

import (
	"testing"

	"github.com/beyenilmez/pz-admin/internal/command"
	"github.com/beyenilmez/pz-admin/internal/feature"
	"github.com/beyenilmez/pz-admin/internal/profile"
	"github.com/beyenilmez/pz-admin/internal/testutil"
)

func TestResolveFeatures(t *testing.T) {
	t.Run("does not add command execution without command capability", func(t *testing.T) {
		features := resolveFeatures(profile.Profile{Version: "42"}, &stubChannel{})
		if features.Has(feature.ConsoleExecuteCommand) {
			t.Errorf("resolveFeatures() = %v, unexpectedly contains ConsoleExecuteCommand", features.Values())
		}
	})

	for _, version := range []string{"41", "42"} {
		t.Run("returns command features for Build "+version, func(t *testing.T) {
			got := resolveFeatures(profile.Profile{Version: version}, &testutil.RecordingChannel{})
			want := command.Features(version)
			want.Add(feature.ConsoleExecuteCommand)
			for _, required := range want.Values() {
				if !got.Has(required) {
					t.Errorf("resolveFeatures() = %v, missing %q", got.Values(), required)
				}
			}
		})
	}
}
