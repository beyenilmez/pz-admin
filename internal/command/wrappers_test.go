package command

import (
	"context"
	"errors"
	"testing"

	"github.com/beyenilmez/pz-admin/internal/testutil"
)

type commandRoutingTest struct {
	name       string
	minVersion string
	maxVersion string
	run        func(context.Context, *Client) error
	want       string
}

func TestClient_CommandRouting(t *testing.T) {
	tests := []commandRoutingTest{
		{name: "execute", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.Execute(ctx, "custom command"); return err }, want: "custom command"},
		{name: "add item", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error {
			_, err := c.AddItem(ctx, "Alice Smith", "Base.Axe", 2)
			return err
		}, want: `additem "Alice Smith" "Base.Axe" 2`},
		{name: "add item without count", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error {
			_, err := c.AddItem(ctx, "Alice", "Base.Axe", 0)
			return err
		}, want: `additem "Alice" "Base.Axe"`},
		{name: "add Steam ID", minVersion: testBuild42, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.AddSteamID(ctx, "123"); return err }, want: `addsteamid "123"`},
		{name: "invite to safehouse", minVersion: testBuild42, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error {
			_, err := c.InviteToSafehouse(ctx, "Home", "Alice")
			return err
		}, want: `addtosafehouse "Home" "Alice"`},
		{name: "add user", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.AddUser(ctx, "Alice", "secret"); return err }, want: `adduser "Alice" "secret"`},
		{name: "add vehicle", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error {
			_, err := c.AddVehicle(ctx, "Base.CarNormal", "Alice")
			return err
		}, want: `addvehicle "Base.CarNormal" "Alice"`},
		{name: "add XP", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.AddXP(ctx, "Alice", "Fitness", 25); return err }, want: `addxp "Alice" "Fitness=25"`},
		{name: "ban ID", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.BanID(ctx, "123"); return err }, want: `banid "123"`},
		{name: "unban ID", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.UnbanID(ctx, "123"); return err }, want: `unbanid "123"`},
		{name: "ban IP", minVersion: testBuild42, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.BanIP(ctx, "127.0.0.1"); return err }, want: `banip "127.0.0.1"`},
		{name: "unban IP", minVersion: testBuild42, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.UnbanIP(ctx, "127.0.0.1"); return err }, want: `unbanip "127.0.0.1"`},
		{name: "ban user", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error {
			_, err := c.BanUser(ctx, "Alice", "reason", true)
			return err
		}, want: `banuser "Alice" -ip -r "reason"`},
		{name: "ban user without options", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.BanUser(ctx, "Alice", "", false); return err }, want: `banuser "Alice"`},
		{name: "unban user", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.UnbanUser(ctx, "Alice"); return err }, want: `unbanuser "Alice"`},
		{name: "change option", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error {
			_, err := c.ChangeOption(ctx, "PublicDescription", "")
			return err
		}, want: `changeoption "PublicDescription" ""`},
		{name: "chopper", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.Chopper(ctx); return err }, want: "chopper"},
		{name: "create horde", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.CreateHorde(ctx, 10, "Alice"); return err }, want: `createhorde 10 "Alice"`},
		{name: "set god mode", minVersion: testBuild41, maxVersion: testBuild41, run: func(ctx context.Context, c *Client) error { _, err := c.SetGodMode(ctx, "Alice", true); return err }, want: `godmode "Alice" -true`},
		{name: "set god mode", minVersion: testBuild42, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.SetGodMode(ctx, "Alice", true); return err }, want: `godmodeplayer "Alice" -true`},
		{name: "set invisible", minVersion: testBuild42, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.SetInvisible(ctx, "Alice", false); return err }, want: `invisibleplayer "Alice" -false`},
		{name: "set no clip", minVersion: testBuild42, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.SetNoClip(ctx, "Alice", true); return err }, want: `noclip "Alice" -true`},
		{name: "gunshot", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.Gunshot(ctx); return err }, want: "gunshot"},
		{name: "kick", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.Kick(ctx, "Alice", "reason"); return err }, want: `kick "Alice" -r "reason"`},
		{name: "kick without reason", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.Kick(ctx, "Alice", ""); return err }, want: `kick "Alice"`},
		{name: "remove from safehouse", minVersion: testBuild42, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error {
			_, err := c.RemoveFromSafehouse(ctx, "Home", "Alice")
			return err
		}, want: `kickfromsafehouse "Home" "Alice"`},
		{name: "lightning", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.Lightning(ctx, "Alice"); return err }, want: `lightning "Alice"`},
		{name: "thunder", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.Thunder(ctx, "Alice"); return err }, want: `thunder "Alice"`},
		{name: "players", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.Players(ctx); return err }, want: "players"},
		{name: "quit", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.Quit(ctx); return err }, want: "quit"},
		{name: "release safehouse", minVersion: testBuild42, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.ReleaseSafehouse(ctx, "Home"); return err }, want: `releasesafehouse "Home"`},
		{name: "remove map symbols", minVersion: testBuild42, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error {
			_, err := c.RemoveMapSymbolsForUser(ctx, "Alice")
			return err
		}, want: `removemapsymbolsforuser "Alice"`},
		{name: "remove Steam ID", minVersion: testBuild42, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.RemoveSteamID(ctx, "123"); return err }, want: `removesteamid "123"`},
		{name: "reload options", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.ReloadOptions(ctx); return err }, want: "reloadoptions"},
		{name: "reload Lua", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error {
			_, err := c.ReloadLua(ctx, "media/lua/server/test file.lua")
			return err
		}, want: `reloadlua "media/lua/server/test file.lua"`},
		{name: "reload all Lua", minVersion: testBuild42, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.ReloadAllLua(ctx); return err }, want: "reloadalllua"},
		{name: "remove user from whitelist", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error {
			_, err := c.RemoveUserFromWhitelist(ctx, "Alice")
			return err
		}, want: `removeuserfromwhitelist "Alice"`},
		{name: "save", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.Save(ctx); return err }, want: "save"},
		{name: "server message", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.ServerMsg(ctx, "hello"); return err }, want: `servermsg "hello"`},
		{name: "set access level", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error {
			_, err := c.SetAccessLevel(ctx, "Alice", "moderator")
			return err
		}, want: `setaccesslevel "Alice" "moderator"`},
		{name: "set password", minVersion: testBuild42, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { return c.SetPassword(ctx, "Alice", "secret") }, want: `setpassword "Alice" "secret"`},
		{name: "show options", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.ShowOptions(ctx); return err }, want: "showoptions"},
		{name: "start automatic rain", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.StartRain(ctx, 0); return err }, want: "startrain"},
		{name: "start rain with intensity", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.StartRain(ctx, 25); return err }, want: "startrain 25"},
		{name: "start automatic storm", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.StartStorm(ctx, 0); return err }, want: "startstorm"},
		{name: "start storm with duration", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.StartStorm(ctx, 12); return err }, want: "startstorm 12"},
		{name: "stop rain", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.StopRain(ctx); return err }, want: "stoprain"},
		{name: "stop weather", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.StopWeather(ctx); return err }, want: "stopweather"},
		{name: "teleport to player", minVersion: testBuild41, maxVersion: testBuild41, run: func(ctx context.Context, c *Client) error {
			_, err := c.TeleportToPlayer(ctx, "Alice", "Bob")
			return err
		}, want: `teleport "Alice" "Bob"`},
		{name: "teleport to player", minVersion: testBuild42, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error {
			_, err := c.TeleportToPlayer(ctx, "Alice", "Bob")
			return err
		}, want: `teleportplayer "Alice" "Bob"`},
		{name: "teleport to coordinates", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error {
			_, err := c.TeleportToCoordinates(ctx, "Alice", "10,20,0")
			return err
		}, want: `teleportto "Alice" "10,20,0"`},
		{name: "apply voice ban", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.VoiceBan(ctx, "Alice", true); return err }, want: `voiceban "Alice" -true`},
		{name: "remove voice ban", minVersion: testBuild41, maxVersion: testBuild42, run: func(ctx context.Context, c *Client) error { _, err := c.VoiceBan(ctx, "Alice", false); return err }, want: `voiceban "Alice" -false`},
	}

	wantErr := errors.New("stop after recording")
	for _, test := range tests {
		for _, build := range commandTestBuildsInRange(t, test.minVersion, test.maxVersion) {
			t.Run("Build "+build+"/"+test.name, func(t *testing.T) {
				channel := &testutil.RecordingChannel{Handler: func(context.Context, string) (string, error) {
					return "", wantErr
				}}
				if err := test.run(t.Context(), NewClient(channel, build)); !errors.Is(err, wantErr) {
					t.Errorf("wrapper error = %v, want %v", err, wantErr)
				}
				commands := channel.Commands()
				if len(commands) != 1 || commands[0] != test.want {
					t.Errorf("commands = %q, want [%q]", commands, test.want)
				}
			})
		}
	}
}

func TestClient_RejectsInvalidIPWithoutExecuting(t *testing.T) {
	channel := &testutil.RecordingChannel{}
	client := NewClient(channel, testBuild42)

	tests := map[string]func() error{
		"ban":   func() error { _, err := client.BanIP(t.Context(), "not-an-ip"); return err },
		"unban": func() error { _, err := client.UnbanIP(t.Context(), "::1"); return err },
	}
	for name, run := range tests {
		t.Run(name, func(t *testing.T) {
			if err := run(); err == nil {
				t.Error("invalid IP succeeded")
			}
		})
	}
	if commands := channel.Commands(); len(commands) != 0 {
		t.Errorf("invalid IP executed commands: %v", commands)
	}
}

func TestClient_TypedResults(t *testing.T) {
	tests := []struct {
		name     string
		response string
		run      func(context.Context, *Client) bool
	}{
		{name: "string", response: "Message sent.", run: func(ctx context.Context, c *Client) bool {
			got, err := c.ServerMsg(ctx, "hello")
			return err == nil && got == "Message sent."
		}},
		{name: "slice", response: "Players connected (2):\n-Alice\n-Bob", run: func(ctx context.Context, c *Client) bool {
			got, err := c.Players(ctx)
			return err == nil && len(got) == 2 && got[0] == "Alice" && got[1] == "Bob"
		}},
		{name: "map", response: "List of Server Options:\n* Open=true", run: func(ctx context.Context, c *Client) bool {
			got, err := c.ShowOptions(ctx)
			return err == nil && got["Open"] == "true"
		}},
		{name: "integer", response: "removed 12 symbols", run: func(ctx context.Context, c *Client) bool {
			got, err := c.RemoveMapSymbolsForUser(ctx, "Alice")
			return err == nil && got == 12
		}},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			channel := &testutil.RecordingChannel{Handler: func(context.Context, string) (string, error) {
				return test.response, nil
			}}
			if !test.run(t.Context(), NewClient(channel, testBuild42)) {
				t.Error("typed wrapper returned an unexpected result")
			}
		})
	}
}
