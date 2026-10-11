package serveraction

import (
	"context"
	"errors"
	"testing"

	"github.com/beyenilmez/pz-admin/internal/profile"
	"github.com/beyenilmez/pz-admin/internal/session"
	"github.com/beyenilmez/pz-admin/internal/testutil"
)

func TestService_RoutesActions(t *testing.T) {
	tests := []struct {
		name    string
		command string
		run     func(context.Context, *Service) error
	}{
		{name: "save world", command: "save", run: func(ctx context.Context, s *Service) error { return s.SaveWorld(ctx) }},
		{name: "send message", command: `servermsg "hello"`, run: func(ctx context.Context, s *Service) error { return s.SendMessage(ctx, "hello") }},
		{name: "start rain", command: "startrain 20", run: func(ctx context.Context, s *Service) error { return s.StartRain(ctx, 20) }},
		{name: "start storm", command: "startstorm 8", run: func(ctx context.Context, s *Service) error { return s.StartStorm(ctx, 8) }},
		{name: "stop rain", command: "stoprain", run: func(ctx context.Context, s *Service) error { return s.StopRain(ctx) }},
		{name: "stop weather", command: "stopweather", run: func(ctx context.Context, s *Service) error { return s.StopWeather(ctx) }},
		{name: "helicopter", command: "chopper", run: func(ctx context.Context, s *Service) error { return s.TriggerHelicopter(ctx) }},
		{name: "gunshot", command: "gunshot", run: func(ctx context.Context, s *Service) error { return s.TriggerGunshot(ctx) }},
		{name: "reload options", command: "reloadoptions", run: func(ctx context.Context, s *Service) error { return s.ReloadOptions(ctx) }},
		{name: "reload Lua", command: `reloadlua "media/lua/test.lua"`, run: func(ctx context.Context, s *Service) error { return s.ReloadLua(ctx, "media/lua/test.lua") }},
		{name: "reload all Lua", command: "reloadalllua", run: func(ctx context.Context, s *Service) error { return s.ReloadAllLua(ctx) }},
		{name: "stop server", command: "quit", run: func(ctx context.Context, s *Service) error { return s.StopServer(ctx) }},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			stop := errors.New("stop after routing")
			channel := &testutil.RecordingChannel{Handler: func(context.Context, string) (string, error) {
				return "", stop
			}}
			if err := test.run(t.Context(), connectedService(channel)); !errors.Is(err, stop) {
				t.Errorf("action error = %v, want wrapped routing error", err)
			}
			testutil.AssertCommands(t, channel, test.command)
		})
	}
}

func TestService_RequiresActiveSession(t *testing.T) {
	if err := NewService().SaveWorld(t.Context()); err == nil {
		t.Error("SaveWorld() error = nil, want disconnected error")
	}
}

func TestService_RandomPlayerEvents(t *testing.T) {
	events := []struct {
		name     string
		command  string
		response string
		run      func(context.Context, *Service) (EventResult, error)
	}{
		{name: "lightning", command: `lightning "Alice"`, response: "Lightning triggered", run: func(ctx context.Context, s *Service) (EventResult, error) { return s.TriggerLightning(ctx) }},
		{name: "thunder", command: `thunder "Alice"`, response: "Thunder triggered", run: func(ctx context.Context, s *Service) (EventResult, error) { return s.TriggerThunder(ctx) }},
	}

	for _, event := range events {
		t.Run(event.name, func(t *testing.T) {
			channel := &testutil.RecordingChannel{Handler: func(_ context.Context, command string) (string, error) {
				switch command {
				case "players":
					return "Players connected (1)\n-Alice\n", nil
				case event.command:
					return event.response, nil
				default:
					t.Fatalf("unexpected command %q", command)
					return "", nil
				}
			}}
			result, err := event.run(t.Context(), connectedService(channel))
			if err != nil {
				t.Fatal(err)
			}
			if result.Target != "Alice" {
				t.Errorf("Target = %q, want Alice", result.Target)
			}
			testutil.AssertCommands(t, channel, "players", event.command)
		})
	}
}

func TestService_RandomPlayerEventFailures(t *testing.T) {
	t.Run("no online player", func(t *testing.T) {
		channel := &testutil.RecordingChannel{Handler: func(context.Context, string) (string, error) {
			return "Players connected (0)\n", nil
		}}
		result, err := connectedService(channel).TriggerLightning(t.Context())
		if err == nil || result != (EventResult{}) {
			t.Errorf("TriggerLightning() = (%+v, %v), want zero result and error", result, err)
		}
		testutil.AssertCommands(t, channel, "players")
	})

	t.Run("player lookup failure", func(t *testing.T) {
		wantErr := errors.New("players failed")
		channel := &testutil.RecordingChannel{Handler: func(context.Context, string) (string, error) {
			return "", wantErr
		}}
		if _, err := connectedService(channel).TriggerThunder(t.Context()); !errors.Is(err, wantErr) {
			t.Errorf("TriggerThunder() error = %v, want wrapped lookup error", err)
		}
		testutil.AssertCommands(t, channel, "players")
	})

	t.Run("event dispatch failure", func(t *testing.T) {
		wantErr := errors.New("lightning failed")
		channel := &testutil.RecordingChannel{Handler: func(_ context.Context, command string) (string, error) {
			switch command {
			case "players":
				return "Players connected (1)\n-Alice\n", nil
			case `lightning "Alice"`:
				return "", wantErr
			default:
				t.Fatalf("unexpected command %q", command)
				return "", nil
			}
		}}
		result, err := connectedService(channel).TriggerLightning(t.Context())
		if !errors.Is(err, wantErr) || result != (EventResult{}) {
			t.Errorf("TriggerLightning() = (%+v, %v), want zero result and wrapped dispatch error", result, err)
		}
		testutil.AssertCommands(t, channel, "players", `lightning "Alice"`)
	})
}

func connectedService(channel *testutil.RecordingChannel) *Service {
	service := NewService()
	service.SessionChanged(session.NewState(profile.Profile{Version: "42"}, channel))
	return service
}
