package player

import (
	"context"
	"reflect"
	"testing"
	"time"

	"github.com/beyenilmez/pz-admin/internal/profile"
	"github.com/beyenilmez/pz-admin/internal/session"
	"github.com/beyenilmez/pz-admin/internal/testutil"
	"github.com/google/uuid"
	"github.com/wailsapp/wails/v3/pkg/application"
)

func TestService_Lifecycle(t *testing.T) {
	service := newService(t.TempDir())
	profileID := uuid.NewString()
	if _, err := service.List(profileID); err == nil {
		t.Error("List() succeeded before startup")
	}
	if err := service.Observe(profileID, Observation{Username: "Alice"}); err == nil {
		t.Error("Observe() succeeded before startup")
	}
	if err := service.DeleteByProfile(profileID); err == nil {
		t.Error("DeleteByProfile() succeeded before startup")
	}

	if err := service.ServiceStartup(t.Context(), application.ServiceOptions{}); err != nil {
		t.Fatal(err)
	}
	if err := service.Observe(profileID, Observation{Username: "Alice"}); err != nil {
		t.Fatal(err)
	}
	if player := getOnlyPlayer(t, service, profileID); player.Username != "Alice" {
		t.Fatalf("player = %#v", player)
	}
	if err := service.DeleteByProfile(profileID); err != nil {
		t.Fatal(err)
	}
	players, err := service.List(profileID)
	if err != nil {
		t.Fatal(err)
	}
	if len(players) != 0 {
		t.Fatalf("players = %#v, want empty", players)
	}
}

func TestService_Refresh(t *testing.T) {
	for _, test := range []struct {
		build, accessLevel                 string
		initialPowers, wantGod, wantHidden bool
		wantNoClip                         bool
	}{
		{build: "41", accessLevel: "moderator", initialPowers: false, wantGod: true, wantHidden: true, wantNoClip: false},
		{build: "42", accessLevel: "moderator", initialPowers: true, wantGod: true, wantHidden: true, wantNoClip: true},
	} {
		t.Run("Build "+test.build, func(t *testing.T) {
			store := openTestStore(t)
			p := profile.Profile{ID: uuid.NewString(), Version: test.build}
			if _, err := store.Merge(p.ID, []Observation{{
				Username: "Alice", Online: Known(true), AccessLevel: Known(test.accessLevel),
				GodMode: Known(test.initialPowers), Invisible: Known(test.initialPowers),
				NoClip: Known(test.initialPowers), VoiceBanned: Known(true),
			}}, time.Now().UTC()); err != nil {
				t.Fatal(err)
			}
			channel := &testutil.RecordingChannel{Handler: func(context.Context, string) (string, error) {
				return "Players connected (1):\n-Bob", nil
			}}
			service := &Service{store: store}

			service.refresh(t.Context(), session.NewState(p, channel))

			players, err := service.List(p.ID)
			if err != nil {
				t.Fatal(err)
			}
			alice := players[findByUsername(players, "Alice")]
			if alice.LastKnownOfflineAt.IsZero() || alice.GodMode == nil || *alice.GodMode != test.wantGod ||
				alice.Invisible == nil || *alice.Invisible != test.wantHidden ||
				alice.NoClip == nil || *alice.NoClip != test.wantNoClip ||
				alice.VoiceBanned != nil {
				t.Fatalf("offline Alice = %#v", alice)
			}
			bob := players[findByUsername(players, "Bob")]
			if bob.LastSeenOnlineAt.IsZero() {
				t.Fatalf("online Bob = %#v", bob)
			}
		})
	}

	t.Run("query failure preserves state", func(t *testing.T) {
		store := openTestStore(t)
		p := profile.Profile{ID: uuid.NewString(), Version: "42"}
		players, err := store.Merge(p.ID, []Observation{
			{Username: "Alice", Online: Known(true), VoiceBanned: Known(true)},
		}, time.Now().UTC())
		if err != nil {
			t.Fatal(err)
		}
		before := players[0]
		channel := &testutil.RecordingChannel{Handler: func(context.Context, string) (string, error) {
			return "", context.DeadlineExceeded
		}}
		service := &Service{store: store}

		service.refresh(t.Context(), session.NewState(p, channel))

		after := getOnlyPlayer(t, service, p.ID)
		if !reflect.DeepEqual(after, before) {
			t.Fatalf("player changed after query failure:\n got: %#v\nwant: %#v", after, before)
		}
	})
}

func TestService_PollingLifecycle(t *testing.T) {
	service := &Service{store: openTestStore(t)}
	firstStarted := make(chan struct{}, 1)
	firstStopped := make(chan struct{}, 1)
	first := &testutil.RecordingChannel{Handler: func(ctx context.Context, _ string) (string, error) {
		signal(firstStarted)
		<-ctx.Done()
		signal(firstStopped)
		return "", ctx.Err()
	}}
	service.SessionChanged(session.NewState(profile.Profile{ID: uuid.NewString(), Version: "42"}, first))
	awaitSignal(t, firstStarted, "first poller to start")

	secondStarted := make(chan struct{}, 1)
	secondStopped := make(chan struct{}, 1)
	second := &testutil.RecordingChannel{Handler: func(ctx context.Context, _ string) (string, error) {
		signal(secondStarted)
		<-ctx.Done()
		signal(secondStopped)
		return "", ctx.Err()
	}}
	service.SessionChanged(session.NewState(profile.Profile{ID: uuid.NewString(), Version: "42"}, second))
	awaitSignal(t, firstStopped, "replaced poller to stop")
	awaitSignal(t, secondStarted, "replacement poller to start")
	if err := service.ServiceShutdown(); err != nil {
		t.Fatal(err)
	}
	awaitSignal(t, secondStopped, "replacement poller to stop during shutdown")
}

func signal(ch chan<- struct{}) {
	select {
	case ch <- struct{}{}:
	default:
	}
}

func awaitSignal(t *testing.T, ch <-chan struct{}, event string) {
	t.Helper()
	select {
	case <-ch:
	case <-time.After(time.Second):
		t.Fatalf("timed out waiting for %s", event)
	}
}
