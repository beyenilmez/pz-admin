package main

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
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

type OptionPair struct {
	Name  string
	Value string
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
		return fmt.Errorf("error getting options: %v", err)
	}

	currentHash := hashString(res)
	if currentHash == lastOptionsHash {
		runtime.LogTracef(app.ctx, "Options unchanged, skipping sync")
		return nil
	}

	lastOptionsHash = currentHash
	lines := strings.Split(res, "\n")
	updatedOptions := PzOptions{}

	if err := parseOptions(lines, &updatedOptions); err != nil {
		return fmt.Errorf("error parsing options: %v", err)
	}

	pzOptions = updatedOptions
	runtime.EventsEmit(app.ctx, "update-options", pzOptions)
	runtime.LogDebugf(app.ctx, "Options synced: %v", pzOptions)

	return nil
}

func parseOptions(lines []string, target *PzOptions) error {
	v := reflect.ValueOf(target).Elem()

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if !strings.HasPrefix(line, "* ") {
			continue
		}

		parts := strings.SplitN(strings.TrimPrefix(line, "* "), "=", 2)
		if len(parts) != 2 {
			runtime.LogDebugf(app.ctx, "Invalid option: %s", line)
			continue
		}

		fieldName, fieldValue := strings.TrimSpace(parts[0]), strings.TrimSpace(parts[1])
		field := v.FieldByName(fieldName)

		if !field.IsValid() {
			runtime.LogDebugf(app.ctx, "Unknown option: %s", fieldName)
			continue
		}

		if err := setFieldValue(field, fieldValue); err != nil {
			return fmt.Errorf("failed to set field %s: %v", fieldName, err)
		}
	}

	return nil
}

func (app *App) UpdatePzOptions(newOptions PzOptions, reloadOptions bool) bool {
	defer pzOptions_update()

	optionsToUpdate := app.diffOptions(newOptions)

	if len(optionsToUpdate) == 0 {
		app.SendNotification(Notification{Title: "No options to update", Variant: "warning"})
		return false
	}

	successCount := app.applyOptions(optionsToUpdate)

	if successCount != len(optionsToUpdate) {
		app.SendNotification(Notification{Title: fmt.Sprintf("Failed to update %d options", len(optionsToUpdate)-successCount), Variant: "error"})
		return false
	}

	if err := pzOptions_update(); err != nil {
		runtime.LogErrorf(app.ctx, "Error syncing options after update: %v", err)
		app.SendNotification(Notification{Title: "Options updated but sync failed", Variant: "error"})
		return false
	}

	if reloadOptions {
		command := RCONCommand{
			CommandTemplate: "reloadoptions",
			SuccessCheck: func(name string, response string) bool {
				return response == "Options reloaded"
			},
		}

		success := command.execute() == 1
		if !success {
			app.SendNotification(Notification{Title: "Failed to reload options", Variant: "error"})
			return false
		} else {
			app.SendNotification(Notification{Title: "Options saved and applied successfully", Variant: "success"})
			return true
		}
	}

	app.SendNotification(Notification{Title: "Options updated successfully", Variant: "success"})
	return true
}

func (app *App) diffOptions(newOptions PzOptions) []OptionPair {
	var optionsToUpdate []OptionPair

	newVal := reflect.ValueOf(newOptions)
	oldVal := reflect.ValueOf(pzOptions)

	for i := 0; i < newVal.NumField(); i++ {
		fieldName := newVal.Type().Field(i).Name
		newField := newVal.Field(i).Interface()
		oldField := oldVal.FieldByName(fieldName).Interface()

		if newField != oldField {
			runtime.LogDebugf(app.ctx, "Updating %s from %v to %v", fieldName, oldField, newField)
			optionsToUpdate = append(optionsToUpdate, OptionPair{
				Name:  fieldName,
				Value: fmt.Sprintf("%v", newField),
			})
		}
	}

	return optionsToUpdate
}

func (app *App) applyOptions(options []OptionPair) int {
	defer runtime.EventsEmit(app.ctx, "setProgress", 0)
	runtime.EventsEmit(app.ctx, "setProgress", 10)

	successCount := 0
	optionCount := len(options)

	for _, option := range options {
		runtime.EventsEmit(app.ctx, "setProgress", float64(successCount)/float64(optionCount)*100)

		command := fmt.Sprintf("changeoption %s \"%s\"", option.Name, option.Value)
		res, err := conn.Execute(command)

		if err == nil && isOptionUpdateSuccessful(option, res) {
			successCount++
		} else {
			runtime.LogErrorf(app.ctx, "Failed to update %s: %v", option.Name, err)
		}
	}

	return successCount
}

func isOptionUpdateSuccessful(option OptionPair, res string) bool {
	// Extract the server response value for the given option
	expectedResponse := fmt.Sprintf("Option : %s is now : %s", option.Name, option.Value)

	if res == expectedResponse {
		return true
	}

	// For floats, handle formatting differences
	field := reflect.ValueOf(pzOptions).FieldByName(option.Name)
	if !field.IsValid() {
		runtime.LogErrorf(nil, "Invalid field name: %s", option.Name)
		return false
	}

	switch field.Kind() {
	case reflect.Float64:
		value, err := strconv.ParseFloat(option.Value, 64)
		if err != nil {
			runtime.LogErrorf(nil, "Failed to parse float: %s", option.Value)
			return false
		}

		normalized := fmt.Sprintf("Option : %s is now : %.1f", option.Name, value)
		return res == normalized
	default:
		return false
	}
}
