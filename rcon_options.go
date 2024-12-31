package main

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"reflect"
	"strconv"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type PzOptions struct {
	AdminSafehouse                               bool    `json:"AdminSafehouse"`
	AllowCoop                                    bool    `json:"AllowCoop"`
	AllowDestructionBySledgehammer               bool    `json:"AllowDestructionBySledgehammer"`
	AllowNonAsciiUsername                        bool    `json:"AllowNonAsciiUsername"`
	AnnounceDeath                                bool    `json:"AnnounceDeath"`
	AntiCheatProtectionType1                     bool    `json:"AntiCheatProtectionType1"`
	AntiCheatProtectionType2                     bool    `json:"AntiCheatProtectionType2"`
	AntiCheatProtectionType3                     bool    `json:"AntiCheatProtectionType3"`
	AntiCheatProtectionType4                     bool    `json:"AntiCheatProtectionType4"`
	AntiCheatProtectionType5                     bool    `json:"AntiCheatProtectionType5"`
	AntiCheatProtectionType6                     bool    `json:"AntiCheatProtectionType6"`
	AntiCheatProtectionType7                     bool    `json:"AntiCheatProtectionType7"`
	AntiCheatProtectionType8                     bool    `json:"AntiCheatProtectionType8"`
	AntiCheatProtectionType9                     bool    `json:"AntiCheatProtectionType9"`
	AntiCheatProtectionType10                    bool    `json:"AntiCheatProtectionType10"`
	AntiCheatProtectionType11                    bool    `json:"AntiCheatProtectionType11"`
	AntiCheatProtectionType12                    bool    `json:"AntiCheatProtectionType12"`
	AntiCheatProtectionType13                    bool    `json:"AntiCheatProtectionType13"`
	AntiCheatProtectionType14                    bool    `json:"AntiCheatProtectionType14"`
	AntiCheatProtectionType15                    bool    `json:"AntiCheatProtectionType15"`
	AntiCheatProtectionType16                    bool    `json:"AntiCheatProtectionType16"`
	AntiCheatProtectionType17                    bool    `json:"AntiCheatProtectionType17"`
	AntiCheatProtectionType18                    bool    `json:"AntiCheatProtectionType18"`
	AntiCheatProtectionType19                    bool    `json:"AntiCheatProtectionType19"`
	AntiCheatProtectionType20                    bool    `json:"AntiCheatProtectionType20"`
	AntiCheatProtectionType21                    bool    `json:"AntiCheatProtectionType21"`
	AntiCheatProtectionType22                    bool    `json:"AntiCheatProtectionType22"`
	AntiCheatProtectionType23                    bool    `json:"AntiCheatProtectionType23"`
	AntiCheatProtectionType24                    bool    `json:"AntiCheatProtectionType24"`
	AntiCheatProtectionType2ThresholdMultiplier  float64 `json:"AntiCheatProtectionType2ThresholdMultiplier"`
	AntiCheatProtectionType3ThresholdMultiplier  float64 `json:"AntiCheatProtectionType3ThresholdMultiplier"`
	AntiCheatProtectionType4ThresholdMultiplier  float64 `json:"AntiCheatProtectionType4ThresholdMultiplier"`
	AntiCheatProtectionType9ThresholdMultiplier  float64 `json:"AntiCheatProtectionType9ThresholdMultiplier"`
	AntiCheatProtectionType15ThresholdMultiplier float64 `json:"AntiCheatProtectionType15ThresholdMultiplier"`
	AntiCheatProtectionType20ThresholdMultiplier float64 `json:"AntiCheatProtectionType20ThresholdMultiplier"`
	AntiCheatProtectionType22ThresholdMultiplier float64 `json:"AntiCheatProtectionType22ThresholdMultiplier"`
	AntiCheatProtectionType24ThresholdMultiplier float64 `json:"AntiCheatProtectionType24ThresholdMultiplier"`
	AutoCreateUserInWhiteList                    bool    `json:"AutoCreateUserInWhiteList"`
	BackupsCount                                 int     `json:"BackupsCount"`
	BackupsOnStart                               bool    `json:"BackupsOnStart"`
	BackupsOnVersionChange                       bool    `json:"BackupsOnVersionChange"`
	BackupsPeriod                                int     `json:"BackupsPeriod"`
	BanKickGlobalSound                           bool    `json:"BanKickGlobalSound"`
	BloodSplatLifespanDays                       int     `json:"BloodSplatLifespanDays"`
	CarEngineAttractionModifier                  float64 `json:"CarEngineAttractionModifier"`
	ChatStreams                                  string  `json:"ChatStreams"`
	ClientActionLogs                             string  `json:"ClientActionLogs"`
	ClientCommandFilter                          string  `json:"ClientCommandFilter"`
	ConstructionPreventsLootRespawn              bool    `json:"ConstructionPreventsLootRespawn"`
	DefaultPort                                  int     `json:"DefaultPort"`
	DenyLoginOnOverloadedServer                  bool    `json:"DenyLoginOnOverloadedServer"`
	DisableRadioAdmin                            bool    `json:"DisableRadioAdmin"`
	DisableRadioGM                               bool    `json:"DisableRadioGM"`
	DisableRadioInvisible                        bool    `json:"DisableRadioInvisible"`
	DisableRadioModerator                        bool    `json:"DisableRadioModerator"`
	DisableRadioOverseer                         bool    `json:"DisableRadioOverseer"`
	DisableRadioStaff                            bool    `json:"DisableRadioStaff"`
	DisableSafehouseWhenPlayerConnected          bool    `json:"DisableSafehouseWhenPlayerConnected"`
	DiscordEnable                                bool    `json:"DiscordEnable"`
	DiscordToken                                 string  `json:"DiscordToken"`
	DiscordChannel                               string  `json:"DiscordChannel"`
	DiscordChannelID                             string  `json:"DiscordChannelID"`
	DisplayUserName                              bool    `json:"DisplayUserName"`
	DoLuaChecksum                                bool    `json:"DoLuaChecksum"`
	DropOffWhiteListAfterDeath                   bool    `json:"DropOffWhiteListAfterDeath"`
	Faction                                      bool    `json:"Faction"`
	FactionDaySurvivedToCreate                   int     `json:"FactionDaySurvivedToCreate"`
	FactionPlayersRequiredForTag                 int     `json:"FactionPlayersRequiredForTag"`
	FastForwardMultiplier                        float64 `json:"FastForwardMultiplier"`
	GlobalChat                                   bool    `json:"GlobalChat"`
	HidePlayersBehindYou                         bool    `json:"HidePlayersBehindYou"`
	HoursForLootRespawn                          int     `json:"HoursForLootRespawn"`
	ItemNumbersLimitPerContainer                 int     `json:"ItemNumbersLimitPerContainer"`
	KickFastPlayers                              bool    `json:"KickFastPlayers"`
	KnockedDownAllowed                           bool    `json:"KnockedDownAllowed"`
	LoginQueueConnectTimeout                     int     `json:"LoginQueueConnectTimeout"`
	LoginQueueEnabled                            bool    `json:"LoginQueueEnabled"`
	Map                                          string  `json:"Map"`
	MapRemotePlayerVisibility                    int     `json:"MapRemotePlayerVisibility"`
	MaxAccountsPerUser                           int     `json:"MaxAccountsPerUser"`
	MaxItemsForLootRespawn                       int     `json:"MaxItemsForLootRespawn"`
	MaxPlayers                                   int     `json:"MaxPlayers"`
	MinutesPerPage                               float64 `json:"MinutesPerPage"`
	Mods                                         string  `json:"Mods"`
	MouseOverToSeeDisplayName                    bool    `json:"MouseOverToSeeDisplayName"`
	NoFire                                       bool    `json:"NoFire"`
	Open                                         bool    `json:"Open"`
	PVP                                          bool    `json:"PVP"`
	PVPFirearmDamageModifier                     float64 `json:"PVPFirearmDamageModifier"`
	PVPMeleeDamageModifier                       float64 `json:"PVPMeleeDamageModifier"`
	PVPMeleeWhileHitReaction                     bool    `json:"PVPMeleeWhileHitReaction"`
	PauseEmpty                                   bool    `json:"PauseEmpty"`
	PerkLogs                                     bool    `json:"PerkLogs"`
	PingLimit                                    int     `json:"PingLimit"`
	PlayerBumpPlayer                             bool    `json:"PlayerBumpPlayer"`
	PlayerRespawnWithOther                       bool    `json:"PlayerRespawnWithOther"`
	PlayerRespawnWithSelf                        bool    `json:"PlayerRespawnWithSelf"`
	PlayerSafehouse                              bool    `json:"PlayerSafehouse"`
	Public                                       bool    `json:"Public"`
	PublicDescription                            string  `json:"PublicDescription"`
	PublicName                                   string  `json:"PublicName"`
	RemovePlayerCorpsesOnCorpseRemoval           bool    `json:"RemovePlayerCorpsesOnCorpseRemoval"`
	ResetID                                      int     `json:"ResetID"`
	SafeHouseRemovalTime                         int     `json:"SafeHouseRemovalTime"`
	SafehouseAllowFire                           bool    `json:"SafehouseAllowFire"`
	SafehouseAllowLoot                           bool    `json:"SafehouseAllowLoot"`
	SafehouseAllowNonResidential                 bool    `json:"SafehouseAllowNonResidential"`
	SafehouseAllowRespawn                        bool    `json:"SafehouseAllowRespawn"`
	SafehouseAllowTrepass                        bool    `json:"SafehouseAllowTrepass"`
	SafehouseDaySurvivedToClaim                  int     `json:"SafehouseDaySurvivedToClaim"`
	SafetyCooldownTimer                          int     `json:"SafetyCooldownTimer"`
	SafetySystem                                 bool    `json:"SafetySystem"`
	SafetyToggleTimer                            int     `json:"SafetyToggleTimer"`
	SaveWorldEveryMinutes                        int     `json:"SaveWorldEveryMinutes"`
	ServerPlayerID                               int     `json:"ServerPlayerID"`
	ShowFirstAndLastName                         bool    `json:"ShowFirstAndLastName"`
	ShowSafety                                   bool    `json:"ShowSafety"`
	SledgehammerOnlyInSafehouse                  bool    `json:"SledgehammerOnlyInSafehouse"`
	SleepAllowed                                 bool    `json:"SleepAllowed"`
	SleepNeeded                                  bool    `json:"SleepNeeded"`
	SneakModeHideFromOtherPlayers                bool    `json:"SneakModeHideFromOtherPlayers"`
	SpawnItems                                   string  `json:"SpawnItems"`
	SpawnPoint                                   string  `json:"SpawnPoint"`
	SpeedLimit                                   float64 `json:"SpeedLimit"`
	SteamScoreboard                              bool    `json:"SteamScoreboard"`
	SteamVAC                                     bool    `json:"SteamVAC"`
	TrashDeleteAll                               bool    `json:"TrashDeleteAll"`
	UDPPort                                      int     `json:"UDPPort"`
	UPnP                                         bool    `json:"UPnP"`
	Voice3D                                      bool    `json:"Voice3D"`
	VoiceEnable                                  bool    `json:"VoiceEnable"`
	VoiceMaxDistance                             float64 `json:"VoiceMaxDistance"`
	VoiceMinDistance                             float64 `json:"VoiceMinDistance"`
	WorkshopItems                                string  `json:"WorkshopItems"`
	ServerWelcomeMessage                         string  `json:"ServerWelcomeMessage"`
}

var (
	pzOptions       PzOptions
	lastOptionsHash string
)

func setFieldValue(field reflect.Value, value string) error {
	switch field.Kind() {
	case reflect.Bool:
		field.SetBool(strings.ToLower(value) == "true")
	case reflect.Int:
		intVal, err := strconv.Atoi(value)
		if err != nil {
			return err
		}
		field.SetInt(int64(intVal))
	case reflect.Float64:
		floatVal, err := strconv.ParseFloat(value, 64)
		if err != nil {
			return err
		}
		field.SetFloat(floatVal)
	case reflect.String:
		field.SetString(value)
	default:
		return errors.New("unsupported field type")
	}
	return nil
}

func hashString(input string) string {
	hash := sha256.Sum256([]byte(input))
	return hex.EncodeToString(hash[:])
}

func pzOptions_update() error {
	res, err := conn.Execute("showoptions")
	if err != nil {
		return errors.New("Error getting options: " + err.Error())
	}

	// Compute hash of the result
	currentHash := hashString(res)
	if currentHash == lastOptionsHash {
		runtime.LogDebugf(app.ctx, "Options unchanged, skipping parsing")
		return nil
	}

	lastOptionsHash = currentHash

	lines := strings.Split(res, "\n")
	if len(lines) < 1 {
		return nil
	}

	updatedOptions := PzOptions{}
	updatedValue := reflect.ValueOf(&updatedOptions).Elem()
	updatedType := updatedValue.Type()

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if !strings.HasPrefix(line, "* ") {
			continue
		}

		line = strings.TrimPrefix(line, "* ")
		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}

		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])

		for i := 0; i < updatedType.NumField(); i++ {
			field := updatedType.Field(i)
			if field.Name == key {
				err := setFieldValue(updatedValue.Field(i), value)
				if err != nil {
					runtime.LogErrorf(app.ctx, "Failed to set field %s: %v", field.Name, err)
				}
				break
			}
		}
	}

	pzOptions = updatedOptions
	runtime.EventsEmit(app.ctx, "update-options", pzOptions)
	runtime.LogDebugf(app.ctx, "Options updated: %v", pzOptions)

	return nil
}

func (app *App) GetPzOptions() PzOptions {
	return pzOptions
}

func (app *App) UpdatePzOptions(newOptions PzOptions) bool {
	return true
}
