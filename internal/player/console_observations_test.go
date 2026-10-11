package player

import (
	"reflect"
	"testing"
	"time"

	"github.com/beyenilmez/pz-admin/internal/profile"
	"github.com/google/uuid"
)

func TestService_ObserveConsoleCommandRoutesConfirmedResponses(t *testing.T) {
	tests := []struct {
		name, build, input, output string
		check                      func(*testing.T, []Player)
	}{
		{name: "add user", build: "42", input: `adduser "Bob" secret`, output: "User Bob created with password", check: func(t *testing.T, players []Player) {
			if findByUsername(players, "Bob") == -1 {
				t.Fatal("Bob was not recorded")
			}
		}},
		{name: "ban", build: "42", input: `banuser "Alice"`, output: "System banned user Alice", check: checkBoolField("Banned", func(p Player) *bool { return p.Banned }, true)},
		{name: "ban alternate", build: "42", input: `banuser "Alice"`, output: "User Alice is now banned", check: checkBoolField("Banned", func(p Player) *bool { return p.Banned }, true)},
		{name: "unban", build: "42", input: `unbanuser "Alice"`, output: "System unbanned user Alice", check: checkBoolField("Banned", func(p Player) *bool { return p.Banned }, false)},
		{name: "unban alternate", build: "42", input: `unbanuser "Alice"`, output: "User Alice is now un-banned", check: checkBoolField("Banned", func(p Player) *bool { return p.Banned }, false)},
		{name: "kick", build: "41", input: `kick "Alice"`, output: "User Alice kicked", check: func(t *testing.T, players []Player) {
			if players[0].LastKnownOfflineAt.IsZero() {
				t.Fatal("kick was not recorded as offline")
			}
		}},
		{name: "god mode alias", build: "41", input: `GODMOD "Alice"`, output: "User Alice is now invincible", check: checkBoolField("GodMode", func(p Player) *bool { return p.GodMode }, true)},
		{name: "invisible", build: "42", input: `invisibleplayer "Alice" -true`, output: "User Alice is now invisible", check: checkBoolField("Invisible", func(p Player) *bool { return p.Invisible }, true)},
		{name: "no clip", build: "42", input: `noclip "Alice" -true`, output: "User Alice won't collide", check: checkBoolField("NoClip", func(p Player) *bool { return p.NoClip }, true)},
		{name: "voice ban", build: "42", input: `voiceban "Alice" -true`, output: "User Alice voice is banned", check: checkBoolField("VoiceBanned", func(p Player) *bool { return p.VoiceBanned }, true)},
		{name: "disable god mode", build: "42", input: `godmodeplayer "Alice" -false`, output: "User Alice is no longer invincible", check: checkBoolField("GodMode", func(p Player) *bool { return p.GodMode }, false)},
		{name: "disable god mode alternate", build: "42", input: `godmodeplayer "Alice" -false`, output: "User Alice is no more invincible", check: checkBoolField("GodMode", func(p Player) *bool { return p.GodMode }, false)},
		{name: "disable invisible", build: "42", input: `invisibleplayer "Alice" -false`, output: "User Alice is no longer invisible", check: checkBoolField("Invisible", func(p Player) *bool { return p.Invisible }, false)},
		{name: "disable no clip", build: "42", input: `noclip "Alice" -false`, output: "User Alice will collide", check: checkBoolField("NoClip", func(p Player) *bool { return p.NoClip }, false)},
		{name: "remove voice ban", build: "42", input: `voiceban "Alice" -false`, output: "User Alice voice is unbanned", check: checkBoolField("VoiceBanned", func(p Player) *bool { return p.VoiceBanned }, false)},
		{name: "access level", build: "42", input: `setaccesslevel "Alice" "admin"`, output: "User Alice is now admin", check: checkAccessLevel("admin")},
		{name: "grant admin", build: "41", input: `grantadmin "Alice"`, output: "User Alice is now admin", check: checkAccessLevel("admin")},
		{name: "remove admin", build: "41", input: `removeadmin "Alice"`, output: "User Alice no longer has access level", check: checkAccessLevel("none")},
		{name: "remove whitelist", build: "42", input: `removeuserfromwhitelist "Alice"`, output: "User Alice removed from white list", check: func(t *testing.T, players []Player) {
			if len(players) != 0 {
				t.Fatalf("players = %#v, want empty", players)
			}
		}},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			service, p := newConsoleObservationService(t, test.build)
			if err := service.ObserveConsoleCommand(p, test.input, test.output); err != nil {
				t.Fatal(err)
			}
			players, err := service.List(p.ID)
			if err != nil {
				t.Fatal(err)
			}
			test.check(t, players)
		})
	}
}

func TestService_ObserveConsoleCommandIgnoresUnconfirmedResponses(t *testing.T) {
	tests := []struct {
		name, input, output string
	}{
		{name: "unsuccessful response", input: `godmodeplayer "Alice" -false`, output: "User Alice was not found"},
		{name: "unrelated command", input: `servermsg "godmodeplayer Alice"`, output: "User Alice is no longer invincible"},
		{name: "different username", input: `godmodeplayer "Alice"`, output: "User Bob is now invincible"},
		{name: "wrong build response", input: `removeadmin "Alice"`, output: "User Alice no longer has access level"},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			service, p := newConsoleObservationService(t, "42")
			before := getOnlyPlayer(t, service, p.ID)
			if err := service.ObserveConsoleCommand(p, test.input, test.output); err != nil {
				t.Fatal(err)
			}
			after := getOnlyPlayer(t, service, p.ID)
			if !reflect.DeepEqual(after, before) {
				t.Fatalf("player changed:\n got: %#v\nwant: %#v", after, before)
			}
		})
	}
}

func newConsoleObservationService(t *testing.T, build string) (*Service, profile.Profile) {
	t.Helper()
	store := openTestStore(t)
	p := profile.Profile{ID: uuid.NewString(), Version: build}
	accessLevel := "user"
	if build == "41" {
		accessLevel = "moderator"
	}
	if _, err := store.Merge(p.ID, []Observation{
		{Username: "Alice", Online: Known(true), AccessLevel: Known(accessLevel)},
	}, time.Now().UTC()); err != nil {
		t.Fatal(err)
	}
	return &Service{store: store}, p
}

func checkBoolField(name string, field func(Player) *bool, want bool) func(*testing.T, []Player) {
	return func(t *testing.T, players []Player) {
		t.Helper()
		got := field(players[0])
		if got == nil || *got != want {
			t.Fatalf("%s = %v, want %v", name, got, want)
		}
	}
}

func checkAccessLevel(want string) func(*testing.T, []Player) {
	return func(t *testing.T, players []Player) {
		t.Helper()
		got := players[0].AccessLevel
		if got == nil || *got != want {
			t.Fatalf("AccessLevel = %v, want %s", got, want)
		}
	}
}
