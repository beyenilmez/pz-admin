package command

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/beyenilmez/pz-admin/internal/feature"
)

func optionValueMatches(requested, actual string) bool {
	requested = strings.TrimSpace(requested)
	actual = strings.TrimSpace(actual)

	if requested == actual {
		return true
	}

	requestedBoolean, requestedIsBoolean := optionBoolean(requested)
	actualBoolean, actualIsBoolean := optionBoolean(actual)
	if requestedIsBoolean && actualIsBoolean {
		return requestedBoolean == actualBoolean
	}

	requestedNumber, err := strconv.ParseFloat(requested, 64)
	if err != nil {
		return false
	}
	actualNumber, err := strconv.ParseFloat(actual, 64)
	return err == nil && requestedNumber == actualNumber
}

func optionBoolean(value string) (bool, bool) {
	switch strings.ToLower(value) {
	case "true", "1":
		return true, true
	case "false", "0":
		return false, true
	default:
		return false, false
	}
}

func matchesNumericXPResponse(raw, username, perk, amount string) bool {
	wantAmount, err := strconv.ParseFloat(amount, 64)
	if err != nil {
		return false
	}
	value, ok := strings.CutPrefix(raw, "Added ")
	if !ok {
		return false
	}
	value, ok = strings.CutSuffix(value, fmt.Sprintf(" %s xp's to %s", perk, username))
	if !ok {
		return false
	}
	gotAmount, err := strconv.ParseFloat(value, 64)
	return err == nil && gotAmount == wantAmount
}

// definitions is the canonical command catalog. Entries are registered
// automatically during package initialization.
var definitions = []Definition{

	// Build 41 and shared commands

	// Gives items to a player.
	// Count is optional and defaults to 1 when omitted.
	//
	// Usage: /additem "username" "module.item" [count]
	// Example: /additem "rj" Base.Axe 5
	{
		Name:       "additem",
		MinVersion: "41",
		MaxVersion: "42",
		Feature:    feature.PlayerAddItems,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "item", Type: TypeString, Required: true},
			{Name: "count", Type: TypeInt, Required: false},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if raw == fmt.Sprintf("Item %s Added in %s's inventory.", args["item"], args["username"]) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Creates a user account on a whitelisted server.
	//
	// Usage: /adduser "username" "password"
	// Example: /adduser "rj" hunter2
	{
		Name:       "adduser",
		MinVersion: "41",
		MaxVersion: "41",
		Feature:    feature.PlayerAddUser,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "password", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if strings.Contains(raw, fmt.Sprintf("User %s created with the password ", args["username"])) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},
	// Spawns a vehicle for a user or at `x,y,z` coordinates.
	//
	// Usage: /addvehicle "script" "user or x,y,z"
	// Example: /addvehicle "Base.VanAmbulance" "rj"
	{
		Name:       "addvehicle",
		MinVersion: "41",
		MaxVersion: "42",
		Feature:    feature.PlayerSpawnVehicle,
		Params: []Param{
			{Name: "script", Type: TypeString, Required: true},
			{Name: "target", Type: TypeString, Required: true},
		},
		Parse: func(raw string, _ map[string]string) (any, error) {
			if strings.TrimSpace(raw) == "Vehicle spawned" {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Gives XP to a player. The perk argument uses `perkname=xp` format, such as
	// `Woodwork=2`.
	//
	// Usage: /addxp "playername" perkname=xp
	// Example: /addxp "rj" Woodwork=2
	{
		Name:       "addxp",
		MinVersion: "41",
		MaxVersion: "41",
		Feature:    feature.PlayerAddXP,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "perk", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			perk, amount, ok := strings.Cut(args["perk"], "=")
			if !ok {
				return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
			}
			raw = strings.TrimSpace(raw)
			if raw == fmt.Sprintf("Added %s %s xp's to %s", amount, perk, args["username"]) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Invites a player to a safehouse.
	//
	// Usage: /addtosafehouse "safehouse" "username"
	// Example: /addtosafehouse "Rosewood Base" "rj"
	{
		Name:       "addtosafehouse",
		MinVersion: "42",
		MaxVersion: "42",
		Params: []Param{
			{Name: "safehouse", Type: TypeString, Required: true},
			{Name: "username", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if raw == fmt.Sprintf("Player %s invited to safehouse %s", args["username"], args["safehouse"]) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Bans a Steam ID.
	//
	// Usage: /banid SteamID
	// Example: /banid 00000000000000000
	{
		Name:       "banid",
		MinVersion: "41",
		MaxVersion: "41",
		Params: []Param{
			{Name: "steamid", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			want := fmt.Sprintf("SteamID %s is now banned", args["steamid"])
			if strings.TrimSpace(raw) == want {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Unbans a Steam ID.
	//
	// Usage: /unbanid SteamID
	// Example: /unbanid 00000000000000000
	{
		Name:       "unbanid",
		MinVersion: "41",
		MaxVersion: "42",
		Params: []Param{
			{Name: "steamid", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			want := fmt.Sprintf("SteamID %s is now unbanned", args["steamid"])
			if strings.TrimSpace(raw) == want {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Bans a user. `-ip` also bans the IP address, and `-r "reason"` records a
	// reason.
	//
	// Usage: /banuser "username" -ip -r "reason"
	// Example: /banuser "rj" -ip -r "spawn kill"
	{
		Name:       "banuser",
		MinVersion: "41",
		MaxVersion: "41",
		Feature:    feature.PlayerBan,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "banip", Type: TypeFlag, Prefix: "-ip", Required: false},
			{Name: "reason", Type: TypeString, Prefix: "-r ", Required: false},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if raw == fmt.Sprintf("User %s is now banned", args["username"]) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Unbans a player.
	//
	// Usage: /unbanuser "username"
	// Example: /unbanuser "rj"
	{
		Name:       "unbanuser",
		MinVersion: "41",
		MaxVersion: "41",
		Feature:    feature.PlayerUnban,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if raw == fmt.Sprintf("User %s is now un-banned", args["username"]) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Changes a server option.
	//
	// Usage: /changeoption optionName "newValue"
	// Example: /changeoption SleepAllowed false
	{
		Name:       "changeoption",
		MinVersion: "41",
		MaxVersion: "42",
		Params: []Param{
			{Name: "option", Type: TypeString, Required: true},
			{Name: "value", Type: TypeString, Required: true, AllowEmpty: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			prefix := fmt.Sprintf("Option : %s is now :", args["option"])
			if returned, ok := strings.CutPrefix(raw, prefix); ok &&
				optionValueMatches(args["value"], strings.TrimSpace(returned)) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Places a helicopter event on a random player.
	//
	// Usage: /chopper
	{
		Name:       "chopper",
		MinVersion: "41",
		MaxVersion: "42",
		Feature:    feature.ServerActionTriggerHelicopter,
		Parse: func(raw string, _ map[string]string) (any, error) {
			if strings.TrimSpace(raw) == "Chopper launched" {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Spawns a horde near a player. RCON requires both the zombie count and the
	// username.
	//
	// Usage: /createhorde count "username"
	// Example: /createhorde 150 "rj"
	{
		Name:       "createhorde",
		MinVersion: "41",
		MaxVersion: "42",
		Feature:    feature.PlayerCreateHorde,
		Params: []Param{
			{Name: "count", Type: TypeInt, Required: true},
			{Name: "username", Type: TypeString, Required: true},
		},
		Parse: func(raw string, _ map[string]string) (any, error) {
			if strings.TrimSpace(raw) == "Horde spawned." {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Makes a player invincible.
	//
	// Usage: /godmode "username" -value
	// Example: /godmode "rj" -true (or -false)
	{
		Name:       "godmode",
		MinVersion: "41",
		MaxVersion: "41",
		Feature:    feature.PlayerSetGodMode,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "state", Type: TypeChoice, Prefix: "-", Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			expected := fmt.Sprintf("User %s is no more invincible.", args["username"])
			if args["state"] == "true" {
				expected = fmt.Sprintf("User %s is now invincible.", args["username"])
			}
			if raw == expected {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Places a gunshot sound on a random player.
	//
	// Usage: /gunshot
	{
		Name:       "gunshot",
		MinVersion: "41",
		MaxVersion: "42",
		Feature:    feature.ServerActionTriggerGunshot,
		Parse: func(raw string, _ map[string]string) (any, error) {
			if strings.TrimSpace(raw) == "Gunshot fired" {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Kicks a user. `-r "reason"` records a reason.
	//
	// Usage: /kick "username" -r "reason"
	// Example: /kick "rj" -r "spam"
	{
		Name:       "kick",
		MinVersion: "41",
		MaxVersion: "42",
		Feature:    feature.PlayerKick,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "reason", Type: TypeString, Prefix: "-r ", Required: false},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if raw == fmt.Sprintf("User %s kicked.", args["username"]) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Strikes a player with lightning.
	//
	// Usage: /lightning "username"
	// Example: /lightning "rj"
	{
		Name:       "lightning",
		MinVersion: "41",
		MaxVersion: "42",
		Feature:    feature.PlayerTriggerLightning,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
		},
		Parse: func(raw string, _ map[string]string) (any, error) {
			if strings.TrimSpace(raw) == "Lightning triggered" {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Plays thunder on a player.
	//
	// Usage: /thunder "username"
	// Example: /thunder "rj"
	{
		Name:       "thunder",
		MinVersion: "41",
		MaxVersion: "42",
		Feature:    feature.PlayerTriggerThunder,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
		},
		Parse: func(raw string, _ map[string]string) (any, error) {
			if strings.TrimSpace(raw) == "Thunder triggered" {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Lists connected players and parses their names from the response.
	//
	// Usage: /players
	{
		Name:       "players",
		MinVersion: "41",
		MaxVersion: "42",
		Feature:    feature.PlayerList,
		Parse: func(raw string, _ map[string]string) (any, error) {
			first, rest, _ := strings.Cut(raw, "\n")
			first = strings.TrimSpace(first)
			if !strings.HasPrefix(first, "Players connected (") {
				return nil, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
			}
			var names []string
			for line := range strings.SplitSeq(rest, "\n") {
				if name, ok := strings.CutPrefix(strings.TrimSpace(line), "-"); ok {
					names = append(names, name)
				}
			}
			return names, nil
		},
	},

	// Saves and quits the server.
	//
	// Usage: /quit
	{
		Name:       "quit",
		MinVersion: "41",
		MaxVersion: "42",
		Feature:    feature.ServerActionStopServer,
		Parse: func(raw string, _ map[string]string) (any, error) {
			if strings.TrimSpace(raw) == "Quit" {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Reloads a loaded Lua file matching the supplied path suffix.
	//
	// Usage: /reloadlua "file"
	{
		Name:       "reloadlua",
		MinVersion: "41",
		MaxVersion: "42",
		Feature:    feature.ServerActionReloadLua,
		Params: []Param{
			{Name: "file", Type: TypeString, Required: true},
		},
		Parse: func(raw string, _ map[string]string) (any, error) {
			if strings.TrimSpace(raw) == "Lua file reloaded" {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Reloads server options from `ServerOptions.ini` and sends them to clients.
	//
	// Usage: /reloadoptions
	{
		Name:       "reloadoptions",
		MinVersion: "41",
		MaxVersion: "42",
		Feature:    feature.ServerActionReloadOptions,
		Parse: func(raw string, _ map[string]string) (any, error) {
			if strings.TrimSpace(raw) == "Options reloaded" {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Removes a user from the whitelist.
	//
	// Usage: /removeuserfromwhitelist "username"
	// Example: /removeuserfromwhitelist "rj"
	{
		Name:       "removeuserfromwhitelist",
		MinVersion: "41",
		MaxVersion: "42",
		Feature:    feature.PlayerRemoveFromWhitelist,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if raw == fmt.Sprintf("User %s removed from white list", args["username"]) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Saves the current world.
	//
	// Usage: /save
	{
		Name:       "save",
		MinVersion: "41",
		MaxVersion: "42",
		Feature:    feature.ServerActionSaveWorld,
		Parse: func(raw string, _ map[string]string) (any, error) {
			if strings.TrimSpace(raw) == "World saved" {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Broadcasts a message to all connected players.
	//
	// Usage: /servermsg "My Message"
	{
		Name:       "servermsg",
		MinVersion: "41",
		MaxVersion: "42",
		Feature:    feature.ServerActionSendMessage,
		Params: []Param{
			{Name: "message", Type: TypeString, Required: true},
		},
		Parse: func(raw string, _ map[string]string) (any, error) {
			if strings.TrimSpace(raw) == "Message sent." {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Sets a player's access level. Valid levels are Admin, Moderator, Overseer,
	// GM, Observer, and none.
	//
	// Usage: /setaccesslevel "username" "accesslevel"
	// Example: /setaccesslevel "rj" "moderator"
	{
		Name:       "setaccesslevel",
		MinVersion: "41",
		MaxVersion: "42",
		Feature:    feature.PlayerSetAccessLevel,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "level", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if raw == fmt.Sprintf("User %s is now %s", args["username"], args["level"]) ||
				raw == fmt.Sprintf("User %s no longer has access level", args["username"]) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Lists current server options and parses their values into a string map.
	//
	// Usage: /showoptions
	{
		Name:       "showoptions",
		MinVersion: "41",
		MaxVersion: "42",
		Parse: func(raw string, _ map[string]string) (any, error) {
			first, rest, _ := strings.Cut(raw, "\n")
			if strings.TrimSpace(first) != "List of Server Options:" {
				return nil, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
			}
			options := make(map[string]string)
			for line := range strings.SplitSeq(rest, "\n") {
				line = strings.TrimSpace(line)
				if name, val, ok := strings.Cut(strings.TrimPrefix(line, "* "), "="); ok {
					options[name] = val
				}
			}
			return options, nil
		},
	},

	// Starts rain on the server. Intensity is optional and ranges from 1 to 100.
	//
	// Usage: /startrain "intensity"
	// Example: /startrain 100
	{
		Name:       "startrain",
		MinVersion: "41",
		MaxVersion: "42",
		Feature:    feature.ServerActionStartRain,
		Params: []Param{
			{Name: "intensity", Type: TypeInt, Required: false},
		},
		Parse: func(raw string, _ map[string]string) (any, error) {
			if strings.TrimSpace(raw) == "Rain started" {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Starts a storm on the server. Duration is optional and measured in game
	// hours.
	//
	// Usage: /startstorm "duration"
	// Example: /startstorm 1
	{
		Name:       "startstorm",
		MinVersion: "41",
		MaxVersion: "42",
		Feature:    feature.ServerActionStartStorm,
		Params: []Param{
			{Name: "duration", Type: TypeInt, Required: false},
		},
		Parse: func(raw string, _ map[string]string) (any, error) {
			if strings.TrimSpace(raw) == "Thunderstorm started" {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Stops rain on the server.
	//
	// Usage: /stoprain
	{
		Name:       "stoprain",
		MinVersion: "41",
		MaxVersion: "42",
		Feature:    feature.ServerActionStopRain,
		Parse: func(raw string, _ map[string]string) (any, error) {
			if strings.TrimSpace(raw) == "Rain stopped" {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Stops weather on the server.
	//
	// Usage: /stopweather
	{
		Name:       "stopweather",
		MinVersion: "41",
		MaxVersion: "42",
		Feature:    feature.ServerActionStopWeather,
		Parse: func(raw string, _ map[string]string) (any, error) {
			if strings.TrimSpace(raw) == "Weather stopped" {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Teleports one player to another. RCON requires both players.
	//
	// Usage: /teleport "player1" "player2"
	// Example: /teleport "rj" "steve"
	{
		Name:       "teleport",
		MinVersion: "41",
		MaxVersion: "41",
		Feature:    feature.PlayerTeleportToPlayer,
		Params: []Param{
			{Name: "player1", Type: TypeString, Required: true},
			{Name: "player2", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if raw == fmt.Sprintf("teleported %s to %s", args["player1"], args["player2"]) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Teleports a player to coordinates.
	//
	// Usage: /teleportto "username" x,y,z
	// Example: /teleportto "rj" 10000,11000,0
	{
		Name:       "teleportto",
		MinVersion: "41",
		MaxVersion: "42",
		Feature:    feature.PlayerTeleportToCoordinates,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "coordinates", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if raw == fmt.Sprintf("%s teleported to %s please wait two seconds to show the map around you.", args["username"], args["coordinates"]) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Blocks or unblocks voice from a user.
	//
	// Usage: /voiceban "username" -value
	// Example: /voiceban "rj" -true (or -false)
	{
		Name:       "voiceban",
		MinVersion: "41",
		MaxVersion: "42",
		Feature:    feature.PlayerSetVoiceBanned,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "state", Type: TypeChoice, Prefix: "-", Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			expected := fmt.Sprintf("User %s voice is unbanned.", args["username"])
			if args["state"] == "true" {
				expected = fmt.Sprintf("User %s voice is banned.", args["username"])
			}
			if raw == expected {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Build 42 commands

	// Adds a Steam ID to the server's allowed list.
	//
	// Usage: /addsteamid "steamid"
	// Example: /addsteamid "76561198181797231"
	{
		Name:       "addsteamid",
		MinVersion: "42",
		MaxVersion: "42",
		Params: []Param{
			{Name: "steamid", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if raw == fmt.Sprintf("SteamID %s added to allowed SteamIDs", args["steamid"]) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Creates a user account on a whitelisted server.
	//
	// Usage: /adduser "username" "password"
	// Example: /adduser "rj" hunter2
	{
		Name:       "adduser",
		MinVersion: "42",
		MaxVersion: "42",
		Feature:    feature.PlayerAddUser,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "password", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if raw == fmt.Sprintf("User %s created with password", args["username"]) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Gives XP to a player. Build 42 formats integral XP amounts with a
	// decimal suffix in successful responses.
	//
	// Usage: /addxp "playername" perkname=xp
	// Example: /addxp "rj" Fitness=90000
	{
		Name:       "addxp",
		MinVersion: "42",
		MaxVersion: "42",
		Feature:    feature.PlayerAddXP,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "perk", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			perk, amount, ok := strings.Cut(args["perk"], "=")
			raw = strings.TrimSpace(raw)
			if ok && matchesNumericXPResponse(raw, args["username"], perk, amount) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Bans a Steam ID. The response may include details for a connected
	// account inside the response's parentheses.
	//
	// Usage: /banid SteamID
	// Example: /banid 00000000000000000
	{
		Name:       "banid",
		MinVersion: "42",
		MaxVersion: "42",
		Params: []Param{
			{Name: "steamid", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			prefix := fmt.Sprintf("System banned SteamID %s(", args["steamid"])
			if strings.HasPrefix(raw, prefix) && strings.HasSuffix(raw, ")") {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Bans an IPv4 address.
	//
	// Usage: /banip IP
	// Example: /banip 0.0.0.0
	{
		Name:       "banip",
		MinVersion: "42",
		MaxVersion: "42",
		Params: []Param{
			{Name: "ip", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if raw == fmt.Sprintf("System banned IP %s", args["ip"]) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Unbans an IPv4 address.
	//
	// Usage: /unbanip IP
	// Example: /unbanip 0.0.0.0
	{
		Name:       "unbanip",
		MinVersion: "42",
		MaxVersion: "42",
		Params: []Param{
			{Name: "ip", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if raw == fmt.Sprintf("System unbanned IP %s", args["ip"]) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Bans a user. `-ip` also bans the IP address, and `-r "reason"` records a
	// reason.
	//
	// Usage: /banuser "username" -ip -r "reason"
	// Example: /banuser "rj" -ip -r "spawn kill"
	{
		Name:       "banuser",
		MinVersion: "42",
		MaxVersion: "42",
		Feature:    feature.PlayerBan,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "banip", Type: TypeFlag, Prefix: "-ip", Required: false},
			{Name: "reason", Type: TypeString, Prefix: "-r ", Required: false},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if raw == fmt.Sprintf("System banned user %s", args["username"]) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Unbans a user.
	//
	// Usage: /unbanuser "username"
	// Example: /unbanuser "rj"
	{
		Name:       "unbanuser",
		MinVersion: "42",
		MaxVersion: "42",
		Feature:    feature.PlayerUnban,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if raw == fmt.Sprintf("System unbanned user %s", args["username"]) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Makes a player invincible.
	//
	// Usage: /godmodeplayer "username" -value
	// Example: /godmodeplayer "rj" -true (or -false)
	{
		Name:       "godmodeplayer",
		MinVersion: "42",
		MaxVersion: "42",
		Feature:    feature.PlayerSetGodMode,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "state", Type: TypeChoice, Prefix: "-", Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			expected := fmt.Sprintf("User %s is no longer invincible.", args["username"])
			if args["state"] == "true" {
				expected = fmt.Sprintf("User %s is now invincible.", args["username"])
			}
			if raw == expected {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Makes a player invisible to zombies.
	//
	// Usage: /invisibleplayer "username" -value
	// Example: /invisibleplayer "rj" -true (or -false)
	{
		Name:       "invisibleplayer",
		MinVersion: "42",
		MaxVersion: "42",
		Feature:    feature.PlayerSetInvisible,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "state", Type: TypeChoice, Prefix: "-", Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			expected := fmt.Sprintf("User %s is no longer invisible.", args["username"])
			if args["state"] == "true" {
				expected = fmt.Sprintf("User %s is now invisible.", args["username"])
			}
			if raw == expected {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Removes a player directly from a safehouse.
	//
	// Usage: /kickfromsafehouse "safehouse" "username"
	// Example: /kickfromsafehouse "Rosewood Base" "rj"
	{
		Name:       "kickfromsafehouse",
		MinVersion: "42",
		MaxVersion: "42",
		Params: []Param{
			{Name: "safehouse", Type: TypeString, Required: true},
			{Name: "username", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if raw == fmt.Sprintf("Player %s kicked from a safehouse %s", args["username"], args["safehouse"]) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Allows a player to pass through walls and structures.
	//
	// Usage: /noclip "username" -value
	// Example: /noclip "rj" -true (or -false)
	{
		Name:       "noclip",
		MinVersion: "42",
		MaxVersion: "42",
		Feature:    feature.PlayerSetNoClip,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "state", Type: TypeChoice, Prefix: "-", Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			expected := fmt.Sprintf("User %s will collide.", args["username"])
			if args["state"] == "true" {
				expected = fmt.Sprintf("User %s won't collide.", args["username"])
			}
			if raw == expected {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Releases the named safehouse.
	//
	// Usage: /releasesafehouse "safehouse"
	// Example: /releasesafehouse "Rosewood Base"
	{
		Name:       "releasesafehouse",
		MinVersion: "42",
		MaxVersion: "42",
		Params: []Param{
			{Name: "safehouse", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if raw == fmt.Sprintf("Safehouse %s released", args["safehouse"]) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Reloads all loaded Lua files.
	//
	// Usage: /reloadalllua
	{
		Name:       "reloadalllua",
		MinVersion: "42",
		MaxVersion: "42",
		Feature:    feature.ServerActionReloadAllLua,
		Parse: func(raw string, _ map[string]string) (any, error) {
			if strings.TrimSpace(raw) == "Lua files reloaded" {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Removes all shared map symbols created by a user.
	//
	// Usage: /removemapsymbolsforuser "username"
	// Example: /removemapsymbolsforuser "rj"
	{
		Name:       "removemapsymbolsforuser",
		MinVersion: "42",
		MaxVersion: "42",
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
		},
		Parse: func(raw string, _ map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			countText, ok := strings.CutPrefix(raw, "removed ")
			if ok {
				countText, ok = strings.CutSuffix(countText, " symbols")
			}
			if ok {
				count, err := strconv.Atoi(countText)
				if err == nil && count >= 0 {
					return count, nil
				}
			}
			return nil, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Removes a Steam ID from the server's allowed list.
	//
	// Usage: /removesteamid "steamid"
	// Example: /removesteamid "76561198181797231"
	{
		Name:       "removesteamid",
		MinVersion: "42",
		MaxVersion: "42",
		Params: []Param{
			{Name: "steamid", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if raw == fmt.Sprintf("SteamID %s removed from allowed SteamIDs", args["steamid"]) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Changes a user's password. The server returns the new password
	// hash, which is never exposed by the typed wrapper.
	//
	// Usage: /setpassword "username" "newpassword"
	// Example: /setpassword "rj" hunter2
	{
		Name:       "setpassword",
		MinVersion: "42",
		MaxVersion: "42",
		Feature:    feature.PlayerSetPassword,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "password", Type: TypeString, Required: true},
		},
		Parse: func(raw string, _ map[string]string) (any, error) {
			if strings.HasPrefix(strings.TrimSpace(raw), "Your new password is ") {
				return struct{}{}, nil
			}
			return nil, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// Teleports one player to another.
	//
	// Usage: /teleportplayer "player1" "player2"
	// Example: /teleportplayer "rj" "steve"
	{
		Name:       "teleportplayer",
		MinVersion: "42",
		MaxVersion: "42",
		Feature:    feature.PlayerTeleportToPlayer,
		Params: []Param{
			{Name: "player1", Type: TypeString, Required: true},
			{Name: "player2", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if raw == fmt.Sprintf("teleported %s to %s", args["player1"], args["player2"]) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},
}

func init() {
	for _, d := range definitions {
		Register(d)
	}
}
