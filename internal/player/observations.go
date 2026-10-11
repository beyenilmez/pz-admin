package player

import "strings"

func isStaffAccess(accessLevel string) bool {
	switch strings.ToLower(accessLevel) {
	case "observer", "gm", "overseer", "moderator", "admin":
		return true
	default:
		return false
	}
}

func isB42RegularAccess(accessLevel string) bool {
	switch strings.ToLower(accessLevel) {
	case "user", "priority", "banned":
		return true
	default:
		return false
	}
}

// A newly created account starts with known disabled powers and no bans. Build
// 41 and Build 42 use different names for the default access level.
func addedUserObservation(build, username string) Observation {
	if build == "41" {
		return newPlayerObservation(username, "none")
	}
	return newPlayerObservation(username, "user")
}

func newPlayerObservation(username, accessLevel string) Observation {
	return Observation{
		Username:    username,
		AccessLevel: Known(accessLevel),
		GodMode:     Known(false),
		Invisible:   Known(false),
		NoClip:      Known(false),
		Banned:      Known(false),
		VoiceBanned: Known(false),
	}
}

func offlineObservation(build string, accessLevel *string) Observation {
	if build == "41" {
		return b41OfflineObservation(accessLevel)
	}
	return b42OfflineObservation()
}

func b41OfflineObservation(accessLevel *string) Observation {
	observation := Observation{
		Online:      Known(false),
		VoiceBanned: Unknown[bool](),
	}
	if accessLevel == nil {
		observation.GodMode = Unknown[bool]()
		observation.Invisible = Unknown[bool]()
		observation.NoClip = Unknown[bool]()
		return observation
	}
	staff := isStaffAccess(*accessLevel)
	observation.GodMode = Known(staff)
	observation.Invisible = Known(staff)
	observation.NoClip = Known(false)
	return observation
}

func b42OfflineObservation() Observation {
	return Observation{
		Online:      Known(false),
		VoiceBanned: Unknown[bool](),
	}
}

func onlineObservation() Observation {
	return Observation{
		Online: Known(true),
		Banned: Known(false),
	}
}

func bannedObservation(build string, accessLevel *string) Observation {
	if build == "41" {
		return b41BannedObservation(accessLevel)
	}
	return b42BannedObservation()
}

func b41BannedObservation(accessLevel *string) Observation {
	observation := b41OfflineObservation(accessLevel)
	observation.Banned = Known(true)
	return observation
}

func b42BannedObservation() Observation {
	observation := b42OfflineObservation()
	observation.AccessLevel = Known("user")
	observation.Banned = Known(true)
	return observation
}

func unbannedObservation(string) Observation {
	return Observation{Banned: Known(false)}
}

func godModeObservation(enabled bool) Observation {
	return Observation{GodMode: Known(enabled)}
}

func invisibleObservation(enabled bool) Observation {
	return Observation{Invisible: Known(enabled)}
}

func noClipObservation(enabled bool) Observation {
	return Observation{NoClip: Known(enabled)}
}

func voiceBannedObservation(banned bool) Observation {
	return Observation{VoiceBanned: Known(banned)}
}

func whitelistedObservation(whitelisted bool) Observation {
	return Observation{Delete: !whitelisted}
}

func accessLevelObservation(build, level string, player *Player) Observation {
	if build == "41" {
		return b41AccessLevelObservation(level)
	}
	return b42AccessLevelObservation(level, player)
}

func b41AccessLevelObservation(level string) Observation {
	observation := Observation{AccessLevel: Known(level)}
	if strings.EqualFold(level, "none") {
		observation.GodMode = Known(false)
		observation.Invisible = Known(false)
		observation.NoClip = Known(false)
	} else if isStaffAccess(level) {
		observation.GodMode = Known(true)
		observation.Invisible = Known(true)
	}
	return observation
}

func b42AccessLevelObservation(level string, player *Player) Observation {
	observation := Observation{AccessLevel: Known(level)}
	observation.Banned = Known(strings.EqualFold(level, "banned"))
	if player.isOnline() && player.AccessLevel != nil {
		previousStaff := isStaffAccess(*player.AccessLevel)
		newStaff := isStaffAccess(level)
		switch {
		case isB42RegularAccess(*player.AccessLevel) && newStaff:
			observation.GodMode = Known(true)
			observation.Invisible = Known(true)
			observation.NoClip = Known(true)
		case previousStaff && isB42RegularAccess(level):
			observation.GodMode = Known(false)
			observation.Invisible = Known(false)
			observation.NoClip = Known(false)
		}
	}
	if strings.EqualFold(level, "banned") {
		banned := b42BannedObservation()
		observation.Online = banned.Online
		observation.AccessLevel = banned.AccessLevel
		observation.Banned = banned.Banned
		observation.VoiceBanned = banned.VoiceBanned
	}
	return observation
}
