// Package feature defines application functionality that may be available in
// an active server session. It is independent of the connection or protocol
// that provides each feature.
package feature

import "slices"

// ID identifies application functionality exposed to the user.
type ID string

// Feature identifiers.
const (
	ConsoleExecuteCommand ID = "console.command.execute"

	ServerActionReloadAllLua      ID = "serverAction.reloadAllLua"
	ServerActionReloadLua         ID = "serverAction.reloadLua"
	ServerActionReloadOptions     ID = "serverAction.reloadOptions"
	ServerActionSaveWorld         ID = "serverAction.saveWorld"
	ServerActionSendMessage       ID = "serverAction.sendMessage"
	ServerActionStartRain         ID = "serverAction.startRain"
	ServerActionStartStorm        ID = "serverAction.startStorm"
	ServerActionStopRain          ID = "serverAction.stopRain"
	ServerActionStopServer        ID = "serverAction.stopServer"
	ServerActionStopWeather       ID = "serverAction.stopWeather"
	ServerActionTriggerGunshot    ID = "serverAction.triggerGunshot"
	ServerActionTriggerHelicopter ID = "serverAction.triggerHelicopter"

	PlayerAddItems              ID = "player.addItems"
	PlayerAddUser               ID = "player.addUser"
	PlayerSpawnVehicle          ID = "player.spawnVehicle"
	PlayerAddXP                 ID = "player.addXP"
	PlayerBan                   ID = "player.ban"
	PlayerUnban                 ID = "player.unban"
	PlayerCreateHorde           ID = "player.createHorde"
	PlayerSetGodMode            ID = "player.setGodMode"
	PlayerSetInvisible          ID = "player.setInvisible"
	PlayerKick                  ID = "player.kick"
	PlayerTriggerLightning      ID = "player.triggerLightning"
	PlayerTriggerThunder        ID = "player.triggerThunder"
	PlayerSetNoClip             ID = "player.setNoClip"
	PlayerList                  ID = "player.list"
	PlayerRemoveFromWhitelist   ID = "player.removeFromWhitelist"
	PlayerSetAccessLevel        ID = "player.setAccessLevel"
	PlayerSetPassword           ID = "player.setPassword"
	PlayerTeleportToPlayer      ID = "player.teleport.toPlayer"
	PlayerTeleportToCoordinates ID = "player.teleport.toCoordinates"
	PlayerSetVoiceBanned        ID = "player.setVoiceBanned"
)

// Set stores unique feature IDs.
type Set map[ID]struct{}

// NewSet creates a feature set containing the supplied IDs.
func NewSet(ids ...ID) Set {
	set := make(Set, len(ids))
	set.Add(ids...)
	return set
}

// Add inserts the supplied IDs into the set.
func (s Set) Add(ids ...ID) {
	for _, id := range ids {
		s[id] = struct{}{}
	}
}

// Has reports whether the ID belongs to the set.
func (s Set) Has(id ID) bool {
	_, ok := s[id]
	return ok
}

// Values returns the feature IDs in stable lexical order.
func (s Set) Values() []ID {
	values := make([]ID, 0, len(s))
	for id := range s {
		values = append(values, id)
	}
	slices.Sort(values)
	return values
}
