package player

import (
	"regexp"
	"strings"
	"time"

	"github.com/beyenilmez/pz-admin/internal/profile"
)

type consoleObservationRule struct {
	input     *regexp.Regexp
	responses []consoleResponseRule
}

type consoleResponseRule struct {
	build   string
	output  *regexp.Regexp
	observe func(*Service, profile.Profile, string, map[string]string) (Observation, error)
}

var consoleObservationRules = []consoleObservationRule{
	{
		input: regexp.MustCompile(`(?i)^adduser\s+(?P<username>"[^"]+"|'[^']+'|\S+)\s+.+$`),
		responses: []consoleResponseRule{
			{
				build:  "41",
				output: regexp.MustCompile(`^User (?P<username>.+?) created with the password .+$`),
				observe: func(_ *Service, profile profile.Profile, username string, _ map[string]string) (Observation, error) {
					return addedUserObservation(profile.Version, username), nil
				},
			},
			{
				build:  "42",
				output: regexp.MustCompile(`^User (?P<username>.+?) created with password\.?$`),
				observe: func(_ *Service, profile profile.Profile, username string, _ map[string]string) (Observation, error) {
					return addedUserObservation(profile.Version, username), nil
				},
			},
		},
	},
	{
		input: regexp.MustCompile(`(?i)^banuser\s+(?P<username>"[^"]+"|'[^']+'|\S+)(?:\s+.*)?$`),
		responses: []consoleResponseRule{
			observationResponseUsingStoredAccessLevel(`^User (?P<username>.+?) is now banned\.?$`, bannedObservation),
			observationResponseUsingStoredAccessLevel(`^System banned user (?P<username>.+?)\.?$`, bannedObservation),
		},
	},
	{
		input: regexp.MustCompile(`(?i)^unbanuser\s+(?P<username>"[^"]+"|'[^']+'|\S+)$`),
		responses: []consoleResponseRule{
			observationResponse(`^User (?P<username>.+?) is now un-banned\.?$`, unbannedObservation),
			observationResponse(`^System unbanned user (?P<username>.+?)\.?$`, unbannedObservation),
		},
	},
	{
		input: regexp.MustCompile(`(?i)^kick\s+(?P<username>"[^"]+"|'[^']+'|\S+)(?:\s+.*)?$`),
		responses: []consoleResponseRule{
			observationResponseUsingStoredAccessLevel(`^User (?P<username>.+?) kicked\.?$`, offlineObservation),
		},
	},
	{
		input: regexp.MustCompile(`(?i)^(?:godmode|godmodeplayer|godmod|godmodplayer)\s+(?P<username>"[^"]+"|'[^']+'|\S+)(?:\s+-(?:true|false))?$`),
		responses: []consoleResponseRule{
			observationResponse(`^User (?P<username>.+?) is now invincible\.?$`, func(string) Observation {
				return godModeObservation(true)
			}),
			observationResponse(`^User (?P<username>.+?) is (?:no more|no longer) invincible\.?$`, func(string) Observation {
				return godModeObservation(false)
			}),
		},
	},
	{
		input: regexp.MustCompile(`(?i)^invisibleplayer\s+(?P<username>"[^"]+"|'[^']+'|\S+)(?:\s+-(?:true|false))?$`),
		responses: []consoleResponseRule{
			observationResponse(`^User (?P<username>.+?) is now invisible\.?$`, func(string) Observation {
				return invisibleObservation(true)
			}),
			observationResponse(`^User (?P<username>.+?) is no longer invisible\.?$`, func(string) Observation {
				return invisibleObservation(false)
			}),
		},
	},
	{
		input: regexp.MustCompile(`(?i)^noclip\s+(?P<username>"[^"]+"|'[^']+'|\S+)(?:\s+-(?:true|false))?$`),
		responses: []consoleResponseRule{
			observationResponse(`^User (?P<username>.+?) won't collide\.?$`, func(string) Observation {
				return noClipObservation(true)
			}),
			observationResponse(`^User (?P<username>.+?) will collide\.?$`, func(string) Observation {
				return noClipObservation(false)
			}),
		},
	},
	{
		input: regexp.MustCompile(`(?i)^removeuserfromwhitelist\s+(?P<username>"[^"]+"|'[^']+'|\S+)$`),
		responses: []consoleResponseRule{
			observationResponse(`^User (?P<username>.+?) removed from white list\.?$`, func(string) Observation {
				return whitelistedObservation(false)
			}),
		},
	},
	{
		input: regexp.MustCompile(`(?i)^setaccesslevel\s+(?P<username>"[^"]+"|'[^']+'|\S+)\s+(?:"[^"]+"|'[^']+'|\S+)$`),
		responses: []consoleResponseRule{
			{
				output: regexp.MustCompile(`^User (?P<username>.+?) is now (?P<accessLevel>\S+)\.?$`),
				observe: func(service *Service, profile profile.Profile, username string, captures map[string]string) (Observation, error) {
					level := strings.TrimSuffix(captures["accessLevel"], ".")
					return service.observeAccessLevel(profile, username, level)
				},
			},
			{
				build:  "41",
				output: regexp.MustCompile(`^User (?P<username>.+?) no longer has access level\.?$`),
				observe: func(service *Service, profile profile.Profile, username string, _ map[string]string) (Observation, error) {
					return service.observeAccessLevel(profile, username, "none")
				},
			},
		},
	},
	{
		input: regexp.MustCompile(`(?i)^grantadmin\s+(?P<username>"[^"]+"|'[^']+'|\S+)$`),
		responses: []consoleResponseRule{
			{
				output: regexp.MustCompile(`^User (?P<username>.+?) is now admin\.?$`),
				observe: func(service *Service, profile profile.Profile, username string, _ map[string]string) (Observation, error) {
					return service.observeAccessLevel(profile, username, "admin")
				},
			},
		},
	},
	{
		input: regexp.MustCompile(`(?i)^removeadmin\s+(?P<username>"[^"]+"|'[^']+'|\S+)$`),
		responses: []consoleResponseRule{
			{
				build:  "41",
				output: regexp.MustCompile(`^User (?P<username>.+?) no longer has access level\.?$`),
				observe: func(service *Service, profile profile.Profile, username string, _ map[string]string) (Observation, error) {
					return service.observeAccessLevel(profile, username, "none")
				},
			},
		},
	},
	{
		input: regexp.MustCompile(`(?i)^voiceban\s+(?P<username>"[^"]+"|'[^']+'|\S+)(?:\s+-(?:true|false))?$`),
		responses: []consoleResponseRule{
			observationResponse(`^User (?P<username>.+?) voice is banned\.?$`, func(string) Observation {
				return voiceBannedObservation(true)
			}),
			observationResponse(`^User (?P<username>.+?) voice is unbanned\.?$`, func(string) Observation {
				return voiceBannedObservation(false)
			}),
		},
	},
}

// ObserveConsoleCommand records only player state confirmed by a recognized
// console response. It ignores ambiguous and unsuccessful responses.
//
//wails:ignore
func (s *Service) ObserveConsoleCommand(p profile.Profile, input, output string) error {
	for _, rule := range consoleObservationRules {
		inputCaptures := rule.input.FindStringSubmatch(strings.TrimSpace(input))
		if inputCaptures == nil {
			continue
		}
		username := strings.Trim(namedCapture(rule.input, inputCaptures, "username"), `"'`)
		for _, response := range rule.responses {
			if response.build != "" && response.build != p.Version {
				continue
			}
			outputCaptures := response.output.FindStringSubmatch(strings.TrimSpace(output))
			if outputCaptures == nil ||
				username != namedCapture(response.output, outputCaptures, "username") {
				continue
			}
			observation, err := response.observe(s, p, username, namedCaptures(response.output, outputCaptures))
			if err != nil {
				return err
			}
			_, err = s.merge(p.ID, []Observation{observation}, time.Now().UTC())
			return err
		}
		return nil
	}
	return nil
}

func (s *Service) storedPlayer(profileID, username string) (*Player, error) {
	players, err := s.List(profileID)
	if err != nil {
		return nil, err
	}
	for index := range players {
		player := &players[index]
		if strings.EqualFold(player.Username, username) {
			return player, nil
		}
	}
	return nil, nil
}

func (s *Service) storedAccessLevel(profileID, username string) (*string, error) {
	player, err := s.storedPlayer(profileID, username)
	if err != nil || player == nil {
		return nil, err
	}
	return player.AccessLevel, nil
}

func observationResponse(pattern string, observation func(string) Observation) consoleResponseRule {
	return consoleResponseRule{
		output: regexp.MustCompile(pattern),
		observe: func(_ *Service, profile profile.Profile, username string, _ map[string]string) (Observation, error) {
			result := observation(profile.Version)
			result.Username = username
			return result, nil
		},
	}
}

func (s *Service) observeAccessLevel(profile profile.Profile, username, accessLevel string) (Observation, error) {
	player, err := s.storedPlayer(profile.ID, username)
	if err != nil {
		return Observation{}, err
	}
	observation := accessLevelObservation(profile.Version, accessLevel, player)
	observation.Username = username
	return observation, nil
}

func observationResponseUsingStoredAccessLevel(
	pattern string,
	create func(build string, accessLevel *string) Observation,
) consoleResponseRule {
	return consoleResponseRule{
		output: regexp.MustCompile(pattern),
		observe: func(
			service *Service,
			profile profile.Profile,
			username string,
			_ map[string]string,
		) (Observation, error) {
			accessLevel, err := service.storedAccessLevel(profile.ID, username)
			if err != nil {
				return Observation{}, err
			}

			observation := create(profile.Version, accessLevel)
			observation.Username = username
			return observation, nil
		},
	}
}

func namedCapture(pattern *regexp.Regexp, captures []string, name string) string {
	index := pattern.SubexpIndex(name)
	if index == -1 || index >= len(captures) {
		return ""
	}
	return captures[index]
}

func namedCaptures(pattern *regexp.Regexp, captures []string) map[string]string {
	values := make(map[string]string)
	for index, name := range pattern.SubexpNames() {
		if index > 0 && name != "" && index < len(captures) {
			values[name] = captures[index]
		}
	}
	return values
}
