package player

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/beyenilmez/pz-admin/internal/profile"
	"github.com/beyenilmez/pz-admin/internal/session"
	"github.com/beyenilmez/pz-admin/internal/testutil"
	"github.com/google/uuid"
)

func TestService_AddLocalUser(t *testing.T) {
	commandExecuted := false
	service, p, existing := newActionService(t, "42", func(string) (string, error) {
		commandExecuted = true
		return "", nil
	})

	if err := service.AddLocalUser(" Bob "); err != nil {
		t.Fatal(err)
	}
	if commandExecuted {
		t.Fatal("AddLocalUser() executed a remote command")
	}
	players, err := service.List(p.ID)
	if err != nil {
		t.Fatal(err)
	}
	index := findByUsername(players, "Bob")
	if index == -1 {
		t.Fatal("Bob was not stored")
	}
	created := players[index]
	if created.ID == "" || created.FirstSeenAt.IsZero() || !created.LastSeenOnlineAt.IsZero() {
		t.Fatalf("created player = %#v", created)
	}
	if created.AccessLevel != nil || created.GodMode != nil || created.Invisible != nil ||
		created.NoClip != nil || created.Banned != nil || created.VoiceBanned != nil {
		t.Fatalf("local player has known server state: %#v", created)
	}
	if err := service.AddLocalUser("  "); err == nil {
		t.Error("AddLocalUser() accepted an empty username")
	}
	if err := service.AddLocalUser(strings.ToLower(existing.Username)); err == nil {
		t.Error("AddLocalUser() accepted a case-insensitive duplicate")
	}
}

func TestService_AddUserCreatesOrUpdatesLocalPlayer(t *testing.T) {
	for _, username := range []string{"Alice", "Bob"} {
		t.Run(username, func(t *testing.T) {
			service, p, existing := newActionService(t, "42", func(string) (string, error) {
				return "User " + username + " created with password", nil
			})
			if err := service.AddUser(t.Context(), username, "secret"); err != nil {
				t.Fatal(err)
			}
			players, err := service.List(p.ID)
			if err != nil {
				t.Fatal(err)
			}
			index := findByUsername(players, username)
			if index == -1 {
				t.Fatalf("%s was not stored", username)
			}
			if username == existing.Username && players[index].ID != existing.ID {
				t.Fatalf("player ID = %q, want existing ID %q", players[index].ID, existing.ID)
			}
			if players[index].AccessLevel == nil || *players[index].AccessLevel != "user" {
				t.Fatalf("AccessLevel = %v, want user", players[index].AccessLevel)
			}
		})
	}
}

func TestService_PlayerActionReportsPartialFailure(t *testing.T) {
	commandError := errors.New("command failed")
	service, p, alice := newActionService(t, "42", func(command string) (string, error) {
		if strings.Contains(command, "Bob") {
			return "", commandError
		}
		return "User Alice kicked.", nil
	})
	bob := addTestPlayer(t, service.store, p.ID, "Bob")

	missingID := uuid.NewString()
	result, err := service.Kick(t.Context(), []string{alice.ID, bob.ID, missingID}, "")
	if err != nil {
		t.Fatal(err)
	}
	if len(result.Succeeded) != 1 || result.Succeeded[0] != alice.ID {
		t.Fatalf("Succeeded = %#v, want Alice", result.Succeeded)
	}
	if len(result.Failed) != 2 || result.Failed[0].PlayerID != bob.ID ||
		!strings.Contains(result.Failed[0].Message, commandError.Error()) ||
		result.Failed[1].PlayerID != missingID || !strings.Contains(result.Failed[1].Message, "not found") {
		t.Fatalf("Failed = %#v, want Bob command failure and unknown-player failure", result.Failed)
	}
	players, err := service.List(p.ID)
	if err != nil {
		t.Fatal(err)
	}
	if players[findByUsername(players, "Alice")].LastKnownOfflineAt.IsZero() {
		t.Fatal("successful kick was not recorded as offline")
	}
	if !players[findByUsername(players, "Bob")].LastKnownOfflineAt.IsZero() {
		t.Fatal("failed kick changed Bob's online state")
	}
}

func TestService_MultiValueActionExecutesEveryValue(t *testing.T) {
	executed := 0
	service, _, player := newActionService(t, "41", func(command string) (string, error) {
		executed++
		if strings.Contains(command, "Base.Broken") {
			return "", errors.New("item rejected")
		}
		return "Item Base.Axe Added in Alice's inventory.", nil
	})

	result, err := service.AddItems(t.Context(), []string{player.ID}, []ItemGrant{
		{Item: "Base.Axe", Count: 1},
		{Item: "Base.Broken", Count: 1},
	})
	if err != nil {
		t.Fatal(err)
	}
	if executed != 2 {
		t.Fatalf("executed %d item commands, want 2", executed)
	}
	if len(result.Succeeded) != 0 || len(result.Failed) != 1 ||
		!strings.Contains(result.Failed[0].Message, "Base.Broken") {
		t.Fatalf("result = %#v, want one player failure naming the rejected item", result)
	}
}

func TestService_StateChangingActions(t *testing.T) {
	tests := []struct {
		name, response string
		run            func(context.Context, *Service, string) (ActionResult, error)
		check          func(*testing.T, *Service, string)
	}{
		{name: "ban", response: "System banned user Alice", run: func(ctx context.Context, s *Service, id string) (ActionResult, error) {
			return s.Ban(ctx, []string{id}, "", false)
		}, check: checkStoredBool("Banned", func(p Player) *bool { return p.Banned }, true)},
		{name: "unban", response: "System unbanned user Alice", run: func(ctx context.Context, s *Service, id string) (ActionResult, error) {
			return s.Unban(ctx, []string{id})
		}, check: checkStoredBool("Banned", func(p Player) *bool { return p.Banned }, false)},
		{name: "god mode", response: "User Alice is now invincible.", run: func(ctx context.Context, s *Service, id string) (ActionResult, error) {
			return s.SetGodMode(ctx, []string{id}, true)
		}, check: checkStoredBool("GodMode", func(p Player) *bool { return p.GodMode }, true)},
		{name: "invisible", response: "User Alice is now invisible.", run: func(ctx context.Context, s *Service, id string) (ActionResult, error) {
			return s.SetInvisible(ctx, []string{id}, true)
		}, check: checkStoredBool("Invisible", func(p Player) *bool { return p.Invisible }, true)},
		{name: "no clip", response: "User Alice won't collide.", run: func(ctx context.Context, s *Service, id string) (ActionResult, error) {
			return s.SetNoClip(ctx, []string{id}, true)
		}, check: checkStoredBool("NoClip", func(p Player) *bool { return p.NoClip }, true)},
		{name: "voice ban", response: "User Alice voice is banned.", run: func(ctx context.Context, s *Service, id string) (ActionResult, error) {
			return s.SetVoiceBanned(ctx, []string{id}, true)
		}, check: checkStoredBool("VoiceBanned", func(p Player) *bool { return p.VoiceBanned }, true)},
		{name: "access level", response: "User Alice is now moderator", run: func(ctx context.Context, s *Service, id string) (ActionResult, error) {
			return s.SetAccessLevel(ctx, []string{id}, "moderator")
		}, check: func(t *testing.T, s *Service, profileID string) {
			if got := getOnlyPlayer(t, s, profileID).AccessLevel; got == nil || *got != "moderator" {
				t.Fatalf("AccessLevel = %v, want moderator", got)
			}
		}},
		{name: "whitelist removal", response: "User Alice removed from white list", run: func(ctx context.Context, s *Service, id string) (ActionResult, error) {
			return s.RemoveFromWhitelist(ctx, []string{id})
		}, check: func(t *testing.T, s *Service, profileID string) {
			players, err := s.List(profileID)
			if err != nil {
				t.Fatal(err)
			}
			if len(players) != 0 {
				t.Fatalf("players = %#v, want empty", players)
			}
		}},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			service, p, player := newActionService(t, "42", func(string) (string, error) { return test.response, nil })
			result, err := test.run(t.Context(), service, player.ID)
			assertActionSucceeded(t, result, err, player.ID)
			test.check(t, service, p.ID)
		})
	}

	t.Run("does not apply observation after failure", func(t *testing.T) {
		service, p, player := newActionService(t, "42", func(string) (string, error) {
			return "", errors.New("command failed")
		})
		result, err := service.Ban(t.Context(), []string{player.ID}, "", false)
		if err != nil {
			t.Fatal(err)
		}
		if len(result.Succeeded) != 0 || len(result.Failed) != 1 {
			t.Fatalf("result = %#v, want one failure", result)
		}
		if got := getOnlyPlayer(t, service, p.ID).Banned; got != nil {
			t.Fatalf("Banned = %v, want unchanged unknown", got)
		}
	})

}

func checkStoredBool(name string, field func(Player) *bool, want bool) func(*testing.T, *Service, string) {
	return func(t *testing.T, service *Service, profileID string) {
		t.Helper()
		got := field(getOnlyPlayer(t, service, profileID))
		if got == nil || *got != want {
			t.Fatalf("%s = %v, want %v", name, got, want)
		}
	}
}

func TestService_ActionValidation(t *testing.T) {
	service, _, player := newActionService(t, "42", func(string) (string, error) {
		t.Fatal("validation failure executed a command")
		return "", nil
	})
	if _, err := service.Kick(t.Context(), nil, ""); err == nil {
		t.Error("Kick() accepted no players")
	}
	if _, err := service.AddItems(t.Context(), []string{player.ID}, nil); err == nil {
		t.Error("AddItems() accepted no items")
	}
	if _, err := service.AddXP(t.Context(), []string{player.ID}, nil); err == nil {
		t.Error("AddXP() accepted no grants")
	}
	if _, err := service.SetPassword(t.Context(), []string{player.ID}, ""); err == nil {
		t.Error("SetPassword() accepted an empty password")
	}
	disconnected := &Service{store: openTestStore(t)}
	if _, err := disconnected.Kick(t.Context(), []string{player.ID}, ""); err == nil {
		t.Error("Kick() succeeded without a connected server")
	}
}

func newActionService(
	t *testing.T,
	build string,
	execute func(string) (string, error),
) (*Service, profile.Profile, Player) {
	t.Helper()
	store := openTestStore(t)
	p := profile.Profile{ID: uuid.NewString(), Version: build}
	player := addTestPlayer(t, store, p.ID, "Alice")
	channel := &testutil.RecordingChannel{Handler: func(_ context.Context, input string) (string, error) {
		return execute(input)
	}}
	return &Service{store: store, active: session.NewState(p, channel)}, p, player
}

func addTestPlayer(t *testing.T, store *Store, profileID, username string) Player {
	t.Helper()
	players, err := store.Merge(profileID, []Observation{{Username: username}}, time.Now().UTC())
	if err != nil {
		t.Fatalf("Merge() setup player: %v", err)
	}
	return players[findByUsername(players, username)]
}

func assertActionSucceeded(t *testing.T, result ActionResult, err error, playerID string) {
	t.Helper()
	if err != nil {
		t.Fatal(err)
	}
	if len(result.Succeeded) != 1 || result.Succeeded[0] != playerID || len(result.Failed) != 0 {
		t.Fatalf("result = %#v, want one success for %q", result, playerID)
	}
}

func getOnlyPlayer(t *testing.T, service *Service, profileID string) Player {
	t.Helper()
	players, err := service.List(profileID)
	if err != nil {
		t.Fatalf("List() player: %v", err)
	}
	if len(players) != 1 {
		t.Fatalf("List() = %#v, want one player", players)
	}
	return players[0]
}
