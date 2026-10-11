package command

import (
	"context"
	"fmt"
	"log/slog"
	"net/netip"
	"strconv"
	"strings"
	"time"

	"github.com/beyenilmez/pz-admin/internal/connection"
)

// Client executes typed commands for a specific game version.
type Client struct {
	exec    connection.CommandExecutor
	version string
}

// NewClient returns a Client that executes commands through exec for version.
func NewClient(exec connection.CommandExecutor, version string) *Client {
	return &Client{exec: loggingExecutor{CommandExecutor: exec}, version: version}
}

type loggingExecutor struct {
	connection.CommandExecutor
}

func (e loggingExecutor) ExecuteCommand(ctx context.Context, input string) (string, error) {
	startedAt := time.Now()
	result, err := e.CommandExecutor.ExecuteCommand(ctx, input)
	command := "unknown"
	if fields := strings.Fields(input); len(fields) > 0 {
		command = fields[0]
	}
	if err != nil {
		slog.Debug(
			"server command failed",
			"command", command,
			"duration", time.Since(startedAt),
			"err", err,
		)
		return "", err
	}

	slog.Debug(
		"server command completed",
		"command", command,
		"duration", time.Since(startedAt),
	)
	return result, nil
}

// Execute sends an untyped command through the active server connection.
// It is intended for console commands that are not represented by a typed
// wrapper.
func (c *Client) Execute(ctx context.Context, input string) (string, error) {
	return c.exec.ExecuteCommand(ctx, input)
}

// AddItem gives items to a player. A count of zero omits the optional count.
func (c *Client) AddItem(ctx context.Context, username, item string, count int) (string, error) {
	args := map[string]string{"username": username, "item": item}
	if count > 0 {
		args["count"] = strconv.Itoa(count)
	}
	res, err := Execute(ctx, c.exec, "additem", c.version, args)
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// AddSteamID adds a Steam ID to the server's allowed list.
func (c *Client) AddSteamID(ctx context.Context, steamid string) (string, error) {
	res, err := Execute(ctx, c.exec, "addsteamid", c.version, map[string]string{
		"steamid": steamid,
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// InviteToSafehouse invites a player to the named safehouse.
func (c *Client) InviteToSafehouse(ctx context.Context, safehouse, username string) (string, error) {
	res, err := Execute(ctx, c.exec, "addtosafehouse", c.version, map[string]string{
		"safehouse": safehouse,
		"username":  username,
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// AddUser creates a new user account on a whitelisted server.
func (c *Client) AddUser(ctx context.Context, username, password string) (string, error) {
	res, err := Execute(ctx, c.exec, "adduser", c.version, map[string]string{
		"username": username,
		"password": password,
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// AddVehicle spawns a vehicle for a user or at `x,y,z` coordinates.
func (c *Client) AddVehicle(ctx context.Context, script, target string) (string, error) {
	res, err := Execute(ctx, c.exec, "addvehicle", c.version, map[string]string{
		"script": script,
		"target": target,
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// AddXP gives XP to a player.
func (c *Client) AddXP(ctx context.Context, username, perk string, amount int) (string, error) {
	res, err := Execute(ctx, c.exec, "addxp", c.version, map[string]string{
		"username": username,
		"perk":     perk + "=" + strconv.Itoa(amount),
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// BanID bans a Steam ID.
func (c *Client) BanID(ctx context.Context, steamid string) (string, error) {
	res, err := Execute(ctx, c.exec, "banid", c.version, map[string]string{
		"steamid": steamid,
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// UnbanID unbans a Steam ID.
func (c *Client) UnbanID(ctx context.Context, steamid string) (string, error) {
	res, err := Execute(ctx, c.exec, "unbanid", c.version, map[string]string{
		"steamid": steamid,
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// BanIP bans an IPv4 address.
func (c *Client) BanIP(ctx context.Context, ip string) (string, error) {
	if err := validateIPv4(ip); err != nil {
		return "", err
	}
	res, err := Execute(ctx, c.exec, "banip", c.version, map[string]string{"ip": ip})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// UnbanIP unbans an IPv4 address.
func (c *Client) UnbanIP(ctx context.Context, ip string) (string, error) {
	if err := validateIPv4(ip); err != nil {
		return "", err
	}
	res, err := Execute(ctx, c.exec, "unbanip", c.version, map[string]string{"ip": ip})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

func validateIPv4(ip string) error {
	address, err := netip.ParseAddr(ip)
	if err != nil || !address.Is4() {
		return fmt.Errorf("command: invalid IPv4 address %q", ip)
	}
	return nil
}

// BanUser bans a user. banIP also bans the IP address, and reason is optional.
func (c *Client) BanUser(ctx context.Context, username, reason string, banIP bool) (string, error) {
	args := map[string]string{"username": username}
	if banIP {
		args["banip"] = "true"
	}
	if reason != "" {
		args["reason"] = reason
	}
	res, err := Execute(ctx, c.exec, "banuser", c.version, args)
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// UnbanUser unbans a player.
func (c *Client) UnbanUser(ctx context.Context, username string) (string, error) {
	res, err := Execute(ctx, c.exec, "unbanuser", c.version, map[string]string{
		"username": username,
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// ChangeOption changes a server option.
func (c *Client) ChangeOption(ctx context.Context, option, value string) (string, error) {
	res, err := Execute(ctx, c.exec, "changeoption", c.version, map[string]string{
		"option": option,
		"value":  value,
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// Chopper places a helicopter event on a random player.
func (c *Client) Chopper(ctx context.Context) (string, error) {
	res, err := Execute(ctx, c.exec, "chopper", c.version, nil)
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// CreateHorde spawns a horde near a player.
func (c *Client) CreateHorde(ctx context.Context, count int, username string) (string, error) {
	res, err := Execute(ctx, c.exec, "createhorde", c.version, map[string]string{
		"count":    strconv.Itoa(count),
		"username": username,
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// SetGodMode enables or disables god mode for a player.
func (c *Client) SetGodMode(ctx context.Context, username string, enabled bool) (string, error) {
	name := "godmode"
	if c.version != "41" {
		name = "godmodeplayer"
	}
	res, err := Execute(ctx, c.exec, name, c.version, map[string]string{
		"username": username,
		"state":    strconv.FormatBool(enabled),
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// SetInvisible makes a player visible or invisible to zombies.
func (c *Client) SetInvisible(ctx context.Context, username string, enabled bool) (string, error) {
	res, err := Execute(ctx, c.exec, "invisibleplayer", c.version, map[string]string{
		"username": username,
		"state":    strconv.FormatBool(enabled),
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// SetNoClip enables or disables collision for a player.
func (c *Client) SetNoClip(ctx context.Context, username string, enabled bool) (string, error) {
	res, err := Execute(ctx, c.exec, "noclip", c.version, map[string]string{
		"username": username,
		"state":    strconv.FormatBool(enabled),
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// Gunshot places a gunshot sound on a random player.
func (c *Client) Gunshot(ctx context.Context) (string, error) {
	res, err := Execute(ctx, c.exec, "gunshot", c.version, nil)
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// Kick kicks a user with an optional reason.
func (c *Client) Kick(ctx context.Context, username, reason string) (string, error) {
	args := map[string]string{"username": username}
	if reason != "" {
		args["reason"] = reason
	}
	res, err := Execute(ctx, c.exec, "kick", c.version, args)
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// RemoveFromSafehouse removes a player directly from the named safehouse.
func (c *Client) RemoveFromSafehouse(ctx context.Context, safehouse, username string) (string, error) {
	res, err := Execute(ctx, c.exec, "kickfromsafehouse", c.version, map[string]string{
		"safehouse": safehouse,
		"username":  username,
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// Lightning strikes lightning on a player.
func (c *Client) Lightning(ctx context.Context, username string) (string, error) {
	res, err := Execute(ctx, c.exec, "lightning", c.version, map[string]string{
		"username": username,
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// Thunder strikes thunder on a player.
func (c *Client) Thunder(ctx context.Context, username string) (string, error) {
	res, err := Execute(ctx, c.exec, "thunder", c.version, map[string]string{
		"username": username,
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// Players returns the names of all connected players.
func (c *Client) Players(ctx context.Context) ([]string, error) {
	res, err := Execute(ctx, c.exec, "players", c.version, nil)
	if err != nil {
		return nil, err
	}
	return res.([]string), nil
}

// Quit saves and quits the server.
func (c *Client) Quit(ctx context.Context) (string, error) {
	res, err := Execute(ctx, c.exec, "quit", c.version, nil)
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// ReleaseSafehouse releases the named safehouse.
func (c *Client) ReleaseSafehouse(ctx context.Context, safehouse string) (string, error) {
	res, err := Execute(ctx, c.exec, "releasesafehouse", c.version, map[string]string{
		"safehouse": safehouse,
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// RemoveMapSymbolsForUser removes all shared map symbols created by a user.
func (c *Client) RemoveMapSymbolsForUser(ctx context.Context, username string) (int, error) {
	res, err := Execute(ctx, c.exec, "removemapsymbolsforuser", c.version, map[string]string{
		"username": username,
	})
	if err != nil {
		return 0, err
	}
	return res.(int), nil
}

// RemoveSteamID removes a Steam ID from the server's allowed list.
func (c *Client) RemoveSteamID(ctx context.Context, steamid string) (string, error) {
	res, err := Execute(ctx, c.exec, "removesteamid", c.version, map[string]string{
		"steamid": steamid,
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// ReloadOptions reloads server options from `ServerOptions.ini`.
func (c *Client) ReloadOptions(ctx context.Context) (string, error) {
	res, err := Execute(ctx, c.exec, "reloadoptions", c.version, nil)
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// ReloadLua reloads a loaded Lua file matching the supplied path suffix.
func (c *Client) ReloadLua(ctx context.Context, file string) (string, error) {
	res, err := Execute(ctx, c.exec, "reloadlua", c.version, map[string]string{
		"file": file,
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// ReloadAllLua reloads all loaded Lua files. It is available in Build 42.
func (c *Client) ReloadAllLua(ctx context.Context) (string, error) {
	res, err := Execute(ctx, c.exec, "reloadalllua", c.version, nil)
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// RemoveUserFromWhitelist removes a user from the whitelist.
func (c *Client) RemoveUserFromWhitelist(ctx context.Context, username string) (string, error) {
	res, err := Execute(ctx, c.exec, "removeuserfromwhitelist", c.version, map[string]string{
		"username": username,
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// Save saves the current world.
func (c *Client) Save(ctx context.Context) (string, error) {
	res, err := Execute(ctx, c.exec, "save", c.version, nil)
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// ServerMsg broadcasts a message to all connected players.
func (c *Client) ServerMsg(ctx context.Context, message string) (string, error) {
	res, err := Execute(ctx, c.exec, "servermsg", c.version, map[string]string{
		"message": message,
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// SetAccessLevel sets a player's access level.
func (c *Client) SetAccessLevel(ctx context.Context, username, level string) (string, error) {
	res, err := Execute(ctx, c.exec, "setaccesslevel", c.version, map[string]string{
		"username": username,
		"level":    level,
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// SetPassword changes a user's password without retaining it or the returned hash.
func (c *Client) SetPassword(ctx context.Context, username, password string) error {
	_, err := Execute(ctx, c.exec, "setpassword", c.version, map[string]string{
		"username": username,
		"password": password,
	})
	return err
}

// ShowOptions lists current server options and values as a map.
func (c *Client) ShowOptions(ctx context.Context) (map[string]string, error) {
	res, err := Execute(ctx, c.exec, "showoptions", c.version, nil)
	if err != nil {
		return nil, err
	}
	return res.(map[string]string), nil
}

// StartRain starts rain. An intensity of zero omits the optional intensity.
func (c *Client) StartRain(ctx context.Context, intensity int) (string, error) {
	args := map[string]string{}
	if intensity > 0 {
		args["intensity"] = strconv.Itoa(intensity)
	}
	res, err := Execute(ctx, c.exec, "startrain", c.version, args)
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// StartStorm starts a storm. A duration of zero omits the optional duration.
func (c *Client) StartStorm(ctx context.Context, duration int) (string, error) {
	args := map[string]string{}
	if duration > 0 {
		args["duration"] = strconv.Itoa(duration)
	}
	res, err := Execute(ctx, c.exec, "startstorm", c.version, args)
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// StopRain stops rain on the server.
func (c *Client) StopRain(ctx context.Context) (string, error) {
	res, err := Execute(ctx, c.exec, "stoprain", c.version, nil)
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// StopWeather stops weather on the server.
func (c *Client) StopWeather(ctx context.Context) (string, error) {
	res, err := Execute(ctx, c.exec, "stopweather", c.version, nil)
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// TeleportToPlayer teleports player1 to player2.
func (c *Client) TeleportToPlayer(ctx context.Context, player1, player2 string) (string, error) {
	name := "teleport"
	if c.version != "41" {
		name = "teleportplayer"
	}
	res, err := Execute(ctx, c.exec, name, c.version, map[string]string{
		"player1": player1,
		"player2": player2,
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// TeleportToCoordinates teleports a player to coordinates.
func (c *Client) TeleportToCoordinates(ctx context.Context, username, coordinates string) (string, error) {
	res, err := Execute(ctx, c.exec, "teleportto", c.version, map[string]string{
		"username":    username,
		"coordinates": coordinates,
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// VoiceBan blocks or unblocks voice from a user.
func (c *Client) VoiceBan(ctx context.Context, username string, block bool) (string, error) {
	res, err := Execute(ctx, c.exec, "voiceban", c.version, map[string]string{
		"username": username,
		"state":    strconv.FormatBool(block),
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}
