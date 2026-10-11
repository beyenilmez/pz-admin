package player

import (
	"testing"
	"time"
)

func TestPlayer_IsOnline(t *testing.T) {
	onlineAt := time.Unix(20, 0)
	offlineBefore := time.Unix(10, 0)
	offlineAfter := time.Unix(30, 0)

	for _, test := range []struct {
		name   string
		player *Player
		want   bool
	}{
		{name: "nil player", player: nil, want: false},
		{name: "never observed", player: &Player{}, want: false},
		{name: "online without offline observation", player: &Player{LastSeenOnlineAt: onlineAt}, want: true},
		{name: "online observation is newer", player: &Player{LastSeenOnlineAt: onlineAt, LastKnownOfflineAt: offlineBefore}, want: true},
		{name: "offline observation is newer", player: &Player{LastSeenOnlineAt: onlineAt, LastKnownOfflineAt: offlineAfter}, want: false},
		{name: "equal observations are offline", player: &Player{LastSeenOnlineAt: onlineAt, LastKnownOfflineAt: onlineAt}, want: false},
	} {
		t.Run(test.name, func(t *testing.T) {
			if got := test.player.isOnline(); got != test.want {
				t.Errorf("isOnline() = %v, want %v", got, test.want)
			}
		})
	}
}

func TestKnown(t *testing.T) {
	known := Known("value")
	if known.operation != setObservation || known.value != "value" {
		t.Errorf("Known() = %+v, want set observation containing value", known)
	}
}

func TestUnknown(t *testing.T) {
	unknown := Unknown[string]()
	if unknown.operation != clearObservation {
		t.Errorf("Unknown() = %+v, want clear observation", unknown)
	}
}

func TestObservationValue(t *testing.T) {
	t.Run("zero value preserves state", func(t *testing.T) {
		if preserved := (ObservationValue[string]{}); preserved.operation != preserveObservation {
			t.Errorf("zero ObservationValue = %+v, want preserve observation", preserved)
		}
	})
}
