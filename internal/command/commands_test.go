package command

import (
	"errors"
	"reflect"
	"testing"
)

func TestDefinitions(t *testing.T) {
	t.Run("catalog is valid", testDefinitionCatalog)
	t.Run("ranges do not overlap", testDefinitionRangesDoNotOverlap)
	t.Run("changeoption accepts normalized values", testChangeOptionNormalizedValues)
	t.Run("changeoption rejects a different value", testChangeOptionDifferentValue)
	t.Run("version-specific responses", testVersionedCommandResponses)
	t.Run("response contracts", testCommandResponseContracts)
}

func testDefinitionCatalog(t *testing.T) {
	for _, definition := range definitions {
		t.Run(definition.Name+"/"+definition.MinVersion+"-"+definition.MaxVersion, func(t *testing.T) {
			if definition.Name == "" {
				t.Fatal("definition name is empty")
			}
			if definition.MinVersion == "" || definition.MaxVersion == "" || definition.MinVersion > definition.MaxVersion {
				t.Errorf("version range = %q-%q", definition.MinVersion, definition.MaxVersion)
			}

			params := make(map[string]struct{}, len(definition.Params))
			for _, param := range definition.Params {
				if param.Name == "" {
					t.Error("parameter name is empty")
				}
				if _, exists := params[param.Name]; exists {
					t.Errorf("duplicate parameter %q", param.Name)
				}
				params[param.Name] = struct{}{}
				switch param.Type {
				case TypeString, TypeInt, TypeChoice, TypeFlag:
				default:
					t.Errorf("parameter %q has unknown type %q", param.Name, param.Type)
				}
			}

			for _, build := range supportedCommandTestBuilds {
				if !definition.matchesVersion(build) {
					continue
				}
				registered, ok := Lookup(definition.Name, build)
				if !ok {
					t.Errorf("Lookup(%q, %q) did not find definition", definition.Name, build)
					continue
				}
				if registered.MinVersion != definition.MinVersion || registered.MaxVersion != definition.MaxVersion {
					t.Errorf("registered range = %q-%q, want %q-%q", registered.MinVersion, registered.MaxVersion, definition.MinVersion, definition.MaxVersion)
				}
			}
		})
	}
}

func testDefinitionRangesDoNotOverlap(t *testing.T) {
	for _, build := range supportedCommandTestBuilds {
		seen := make(map[string]struct{})
		for _, definition := range definitions {
			if !definition.matchesVersion(build) {
				continue
			}
			if _, exists := seen[definition.Name]; exists {
				t.Errorf("Build %s has overlapping definitions for %q", build, definition.Name)
			}
			seen[definition.Name] = struct{}{}
		}
	}
}
func testChangeOptionNormalizedValues(t *testing.T) {
	definition, ok := Lookup("changeoption", "42")
	if !ok {
		t.Fatal("Lookup(changeoption) failed")
	}

	tests := []struct {
		name     string
		option   string
		value    string
		response string
	}{
		{"integer formatted as float", "VoiceMaxDistance", "99", "Option : VoiceMaxDistance is now : 99.0"},
		{"boolean true", "NoFire", "true", "Option : NoFire is now : true"},
		{"numeric boolean true", "NoFire", "1", "Option : NoFire is now : true"},
		{"numeric boolean false", "NoFire", "0", "Option : NoFire is now : false"},
		{"string", "ServerWelcomeMessage", "hello", "Option : ServerWelcomeMessage is now : hello"},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			args := map[string]string{"option": test.option, "value": test.value}
			if _, err := definition.Parse(test.response, args); err != nil {
				t.Fatalf("Parse() returned %v", err)
			}
		})
	}
}

func testChangeOptionDifferentValue(t *testing.T) {
	definition, ok := Lookup("changeoption", "42")
	if !ok {
		t.Fatal("Lookup(changeoption) failed")
	}
	args := map[string]string{"option": "VoiceMaxDistance", "value": "99"}
	if _, err := definition.Parse("Option : VoiceMaxDistance is now : 100.0", args); err == nil {
		t.Fatal("Parse() accepted a different option value")
	}
}

func testVersionedCommandResponses(t *testing.T) {
	tests := []struct {
		command  string
		build    string
		args     map[string]string
		response string
	}{
		{"adduser", "41", map[string]string{"username": "Alice", "password": "secret"}, "User Alice created with the password hash"},
		{"adduser", "42", map[string]string{"username": "Alice", "password": "secret"}, "User Alice created with password"},
		{"addxp", "41", map[string]string{"username": "Alice", "perk": "Fitness=90000"}, "Added 90000 Fitness xp's to Alice"},
		{"addxp", "42", map[string]string{"username": "Alice", "perk": "Fitness=90000"}, "Added 90000.0 Fitness xp's to Alice"},
		{"addtosafehouse", "42", map[string]string{"safehouse": "ev", "username": "Alice"}, "Player Alice invited to safehouse ev"},
		{"banid", "41", map[string]string{"steamid": "000000"}, "SteamID 000000 is now banned"},
		{"banid", "42", map[string]string{"steamid": "000000"}, "System banned SteamID 000000()"},
		{"banid", "42", map[string]string{"steamid": "00000000000000000"}, "System banned SteamID 00000000000000000(test, )"},
		{"banuser", "41", map[string]string{"username": "Alice"}, "User Alice is now banned"},
		{"banuser", "42", map[string]string{"username": "Alice"}, "System banned user Alice"},
		{"godmodeplayer", "42", map[string]string{"username": "Alice", "state": "true"}, "User Alice is now invincible."},
		{"godmodeplayer", "42", map[string]string{"username": "Alice", "state": "false"}, "User Alice is no longer invincible."},
		{"invisibleplayer", "42", map[string]string{"username": "Alice", "state": "true"}, "User Alice is now invisible."},
		{"kickfromsafehouse", "42", map[string]string{"safehouse": "ev", "username": "Alice"}, "Player Alice kicked from a safehouse ev"},
		{"releasesafehouse", "42", map[string]string{"safehouse": "ev"}, "Safehouse ev released"},
		{"setpassword", "42", map[string]string{"username": "Alice", "password": "secret"}, "Your new password is $2a$12$O/BFHoDFPrfFaNPAACmWpuMCmHRg5rkwMMGiwJ/VXw4XEzM52qB8q"},
		{"invisibleplayer", "42", map[string]string{"username": "Alice", "state": "false"}, "User Alice is no longer invisible."},
		{"noclip", "42", map[string]string{"username": "Alice", "state": "true"}, "User Alice won't collide."},
		{"noclip", "42", map[string]string{"username": "Alice", "state": "false"}, "User Alice will collide."},
		{"teleportplayer", "42", map[string]string{"player1": "Alice", "player2": "Bob"}, "teleported Alice to Bob"},
		{"unbanid", "41", map[string]string{"steamid": "000000"}, "SteamID 000000 is now unbanned"},
		{"unbanid", "42", map[string]string{"steamid": "000000"}, "SteamID 000000 is now unbanned"},
		{"unbanuser", "41", map[string]string{"username": "Alice"}, "User Alice is now un-banned"},
		{"unbanuser", "42", map[string]string{"username": "Alice"}, "System unbanned user Alice"},
	}

	for _, test := range tests {
		t.Run("Build "+test.build+"/"+test.command, func(t *testing.T) {
			definition, ok := Lookup(test.command, test.build)
			if !ok {
				t.Fatalf("Lookup(%s, %s) failed", test.command, test.build)
			}
			got, err := definition.Parse(test.response, test.args)
			if err != nil {
				t.Fatalf("Parse() returned %v", err)
			}
			if test.command == "setpassword" {
				if _, ok := got.(struct{}); !ok {
					t.Errorf("Parse() = %#v, want struct{}", got)
				}
			} else if got != test.response {
				t.Errorf("Parse() = %#v, want %#v", got, test.response)
			}
			if _, err := definition.Parse("unexpected response", test.args); !errors.Is(err, ErrCommandFailed) {
				t.Errorf("Parse(unrelated response) error = %v, want ErrCommandFailed", err)
			}
		})
	}
}
func testCommandResponseContracts(t *testing.T) {
	tests := []struct {
		name     string
		command  string
		build    string
		args     map[string]string
		response string
		want     any
	}{
		{name: "add item", command: "additem", build: "42", args: map[string]string{"username": "Alice", "item": "Base.Axe"}, response: "Item Base.Axe Added in Alice's inventory."},
		{name: "add vehicle", command: "addvehicle", build: "42", response: "Vehicle spawned"},
		{name: "chopper", command: "chopper", build: "42", response: "Chopper launched"},
		{name: "create horde", command: "createhorde", build: "42", response: "Horde spawned."},
		{name: "Build 41 enable god mode", command: "godmode", build: "41", args: map[string]string{"username": "Alice", "state": "true"}, response: "User Alice is now invincible."},
		{name: "Build 41 disable god mode", command: "godmode", build: "41", args: map[string]string{"username": "Alice", "state": "false"}, response: "User Alice is no more invincible."},
		{name: "gunshot", command: "gunshot", build: "42", response: "Gunshot fired"},
		{name: "kick", command: "kick", build: "42", args: map[string]string{"username": "Alice"}, response: "User Alice kicked."},
		{name: "lightning", command: "lightning", build: "42", response: "Lightning triggered"},
		{name: "thunder", command: "thunder", build: "42", response: "Thunder triggered"},
		{name: "players", command: "players", build: "42", response: "Players connected (2)\n-Alice\n-Bob\n", want: []string{"Alice", "Bob"}},
		{name: "quit", command: "quit", build: "42", response: "Quit"},
		{name: "reload Lua", command: "reloadlua", build: "42", response: "Lua file reloaded"},
		{name: "reload options", command: "reloadoptions", build: "42", response: "Options reloaded"},
		{name: "remove whitelist user", command: "removeuserfromwhitelist", build: "42", args: map[string]string{"username": "Alice"}, response: "User Alice removed from white list"},
		{name: "save", command: "save", build: "42", response: "World saved"},
		{name: "server message", command: "servermsg", build: "42", response: "Message sent."},
		{name: "set access level", command: "setaccesslevel", build: "42", args: map[string]string{"username": "Alice", "level": "moderator"}, response: "User Alice is now moderator"},
		{name: "remove Build 41 access level", command: "setaccesslevel", build: "41", args: map[string]string{"username": "Alice", "level": "none"}, response: "User Alice no longer has access level"},
		{name: "show options", command: "showoptions", build: "42", response: "List of Server Options:\n* Open=true\n* MaxPlayers=32\n", want: map[string]string{"Open": "true", "MaxPlayers": "32"}},
		{name: "start rain", command: "startrain", build: "42", response: "Rain started"},
		{name: "start storm", command: "startstorm", build: "42", response: "Thunderstorm started"},
		{name: "stop rain", command: "stoprain", build: "42", response: "Rain stopped"},
		{name: "stop weather", command: "stopweather", build: "42", response: "Weather stopped"},
		{name: "Build 41 teleport player", command: "teleport", build: "41", args: map[string]string{"player1": "Alice", "player2": "Bob"}, response: "teleported Alice to Bob"},
		{name: "teleport coordinates", command: "teleportto", build: "42", args: map[string]string{"username": "Alice", "coordinates": "10,20,0"}, response: "Alice teleported to 10,20,0 please wait two seconds to show the map around you."},
		{name: "apply voice ban", command: "voiceban", build: "42", args: map[string]string{"username": "Alice", "state": "true"}, response: "User Alice voice is banned."},
		{name: "remove voice ban", command: "voiceban", build: "42", args: map[string]string{"username": "Alice", "state": "false"}, response: "User Alice voice is unbanned."},
		{name: "add Steam ID", command: "addsteamid", build: "42", args: map[string]string{"steamid": "123"}, response: "SteamID 123 added to allowed SteamIDs"},
		{name: "ban IP", command: "banip", build: "42", args: map[string]string{"ip": "127.0.0.1"}, response: "System banned IP 127.0.0.1"},
		{name: "unban IP", command: "unbanip", build: "42", args: map[string]string{"ip": "127.0.0.1"}, response: "System unbanned IP 127.0.0.1"},
		{name: "reload all Lua", command: "reloadalllua", build: "42", response: "Lua files reloaded"},
		{name: "remove map symbols", command: "removemapsymbolsforuser", build: "42", response: "removed 12 symbols", want: 12},
		{name: "remove Steam ID", command: "removesteamid", build: "42", args: map[string]string{"steamid": "123"}, response: "SteamID 123 removed from allowed SteamIDs"},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			definition, ok := Lookup(test.command, test.build)
			if !ok {
				t.Fatalf("Lookup(%q, %q) failed", test.command, test.build)
			}
			got, err := definition.Parse(test.response, test.args)
			if err != nil {
				t.Fatalf("Parse(%q) error = %v", test.response, err)
			}
			want := test.want
			if want == nil {
				want = test.response
			}
			if !reflect.DeepEqual(got, want) {
				t.Errorf("Parse(%q) = %#v, want %#v", test.response, got, want)
			}
		})

		t.Run(test.name+" rejects unrelated response", func(t *testing.T) {
			definition, ok := Lookup(test.command, test.build)
			if !ok {
				t.Fatalf("Lookup(%q, %q) failed", test.command, test.build)
			}
			if _, err := definition.Parse("unexpected response", test.args); !errors.Is(err, ErrCommandFailed) {
				t.Errorf("Parse() error = %v, want ErrCommandFailed", err)
			}
		})
	}
}
