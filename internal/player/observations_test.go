package player

import (
	"testing"
	"time"
)

func TestAddedUserObservation(t *testing.T) {
	for _, test := range []struct {
		build string
		want  Observation
	}{
		{build: "41", want: Observation{
			Username: "Alice", AccessLevel: Known("none"), GodMode: Known(false),
			Invisible: Known(false), NoClip: Known(false), Banned: Known(false), VoiceBanned: Known(false),
		}},
		{build: "42", want: Observation{
			Username: "Alice", AccessLevel: Known("user"), GodMode: Known(false),
			Invisible: Known(false), NoClip: Known(false), Banned: Known(false), VoiceBanned: Known(false),
		}},
		{build: "unknown", want: Observation{
			Username: "Alice", AccessLevel: Known("user"), GodMode: Known(false),
			Invisible: Known(false), NoClip: Known(false), Banned: Known(false), VoiceBanned: Known(false),
		}},
	} {
		t.Run(test.build, func(t *testing.T) {
			assertObservation(t, addedUserObservation(test.build, "Alice"), test.want)
		})
	}
}

func TestOfflineObservation(t *testing.T) {
	user := "user"
	admin := "admin"
	for _, test := range []struct {
		name   string
		build  string
		access *string
		want   Observation
	}{
		{
			name:  "Build 41 unknown access invalidates powers",
			build: "41",
			want: Observation{
				Online: Known(false), VoiceBanned: Unknown[bool](),
				GodMode: Unknown[bool](), Invisible: Unknown[bool](), NoClip: Unknown[bool](),
			},
		},
		{
			name: "Build 41 regular account disables powers", build: "41", access: &user,
			want: Observation{
				Online: Known(false), VoiceBanned: Unknown[bool](),
				GodMode: Known(false), Invisible: Known(false), NoClip: Known(false),
			},
		},
		{
			name: "Build 41 staff restores login powers", build: "41", access: &admin,
			want: Observation{
				Online: Known(false), VoiceBanned: Unknown[bool](),
				GodMode: Known(true), Invisible: Known(true), NoClip: Known(false),
			},
		},
		{
			name: "Build 42 preserves powers", build: "42", access: &admin,
			want: Observation{Online: Known(false), VoiceBanned: Unknown[bool]()},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			assertObservation(t, offlineObservation(test.build, test.access), test.want)
		})
	}
}

func TestBuild41StaffRolesReceiveStaffOfflineObservation(t *testing.T) {
	want := Observation{
		Online: Known(false), VoiceBanned: Unknown[bool](),
		GodMode: Known(true), Invisible: Known(true), NoClip: Known(false),
	}
	for _, role := range []string{"observer", "gm", "overseer", "moderator", "admin"} {
		t.Run(role, func(t *testing.T) {
			assertObservation(t, offlineObservation("41", &role), want)
		})
	}
}

func TestOnlineObservation(t *testing.T) {
	assertObservation(t, onlineObservation(), Observation{Online: Known(true), Banned: Known(false)})
}
func TestBannedObservation(t *testing.T) {
	admin := "admin"
	for _, test := range []struct {
		name  string
		build string
		want  Observation
	}{
		{
			name: "Build 41 preserves staff access and expected login powers", build: "41",
			want: Observation{
				Online: Known(false), Banned: Known(true), VoiceBanned: Unknown[bool](),
				GodMode: Known(true), Invisible: Known(true), NoClip: Known(false),
			},
		},
		{
			name: "Build 42 resets access and preserves powers", build: "42",
			want: Observation{
				Online: Known(false), AccessLevel: Known("user"), Banned: Known(true),
				VoiceBanned: Unknown[bool](),
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			assertObservation(t, bannedObservation(test.build, &admin), test.want)
		})
	}
}

func TestUnbannedObservation(t *testing.T) {
	assertObservation(t, unbannedObservation("42"), Observation{Banned: Known(false)})
}

func TestGodModeObservation(t *testing.T) {
	assertObservation(t, godModeObservation(true), Observation{GodMode: Known(true)})
}

func TestInvisibleObservation(t *testing.T) {
	assertObservation(t, invisibleObservation(true), Observation{Invisible: Known(true)})
}

func TestNoClipObservation(t *testing.T) {
	assertObservation(t, noClipObservation(true), Observation{NoClip: Known(true)})
}
func TestVoiceBannedObservation(t *testing.T) {
	assertObservation(t, voiceBannedObservation(true), Observation{VoiceBanned: Known(true)})
}

func TestWhitelistedObservation(t *testing.T) {
	t.Run("removed", func(t *testing.T) {
		assertObservation(t, whitelistedObservation(false), Observation{Delete: true})
	})
	t.Run("retained", func(t *testing.T) {
		assertObservation(t, whitelistedObservation(true), Observation{})
	})
}
func TestAccessLevelObservation(t *testing.T) {
	for _, test := range []struct {
		name   string
		build  string
		level  string
		player *Player
		want   Observation
	}{
		{
			name: "Build 41 regular disables every power", build: "41", level: "none",
			want: Observation{AccessLevel: Known("none"), GodMode: Known(false), Invisible: Known(false), NoClip: Known(false)},
		},
		{
			name: "Build 41 staff enables automatic powers and preserves no clip", build: "41", level: "moderator",
			want: Observation{AccessLevel: Known("moderator"), GodMode: Known(true), Invisible: Known(true)},
		},
		{
			name: "Build 42 online regular to staff enables every power", build: "42", level: "admin",
			player: onlinePlayer("user"),
			want:   Observation{AccessLevel: Known("admin"), Banned: Known(false), GodMode: Known(true), Invisible: Known(true), NoClip: Known(true)},
		},
		{
			name: "Build 42 online staff to regular disables every power", build: "42", level: "priority",
			player: onlinePlayer("admin"),
			want:   Observation{AccessLevel: Known("priority"), Banned: Known(false), GodMode: Known(false), Invisible: Known(false), NoClip: Known(false)},
		},
		{
			name: "Build 42 staff to staff preserves powers", build: "42", level: "moderator",
			player: onlinePlayer("admin"),
			want:   Observation{AccessLevel: Known("moderator"), Banned: Known(false)},
		},
		{
			name: "Build 42 offline role change preserves powers", build: "42", level: "admin",
			player: &Player{AccessLevel: new("user")},
			want:   Observation{AccessLevel: Known("admin"), Banned: Known(false)},
		},
		{
			name: "Build 42 online set banned disables staff powers then models ban", build: "42", level: "banned",
			player: onlinePlayer("admin"),
			want: Observation{
				Online: Known(false), AccessLevel: Known("user"), Banned: Known(true), VoiceBanned: Unknown[bool](),
				GodMode: Known(false), Invisible: Known(false), NoClip: Known(false),
			},
		},
		{
			name: "Build 42 offline set banned preserves powers", build: "42", level: "banned",
			player: &Player{AccessLevel: new("admin")},
			want:   Observation{Online: Known(false), AccessLevel: Known("user"), Banned: Known(true), VoiceBanned: Unknown[bool]()},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			assertObservation(t, accessLevelObservation(test.build, test.level, test.player), test.want)
		})
	}
}

func onlinePlayer(accessLevel string) *Player {
	return &Player{AccessLevel: &accessLevel, LastSeenOnlineAt: time.Unix(2, 0)}
}

func assertObservation(t *testing.T, got, want Observation) {
	t.Helper()
	if got != want {
		t.Errorf("observation = %+v, want %+v", got, want)
	}
}
