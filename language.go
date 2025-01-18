package main

import (
	_ "embed"
	"strings"

	"encoding/json"

	"github.com/jeandeaual/go-locale"
)

//go:embed frontend/src/locales.json
var localesJSON string

func set_system_language() error {

	userLocales, err := locale.GetLocales()
	if err != nil {
		return err
	}

	var localesData struct {
		Locales []struct {
			Code string `json:"code"`
		} `json:"locales"`
	}
	err = json.Unmarshal([]byte(localesJSON), &localesData)
	if err != nil {
		return err
	}
	availableLocales := make([]string, len(localesData.Locales))
	for i, l := range localesData.Locales {
		availableLocales[i] = l.Code
	}

	for _, l := range userLocales {
		if contains(availableLocales, l) {
			config.Language = &l
		}
	}

	return nil
}

func contains(haystack []string, needle string) bool {
	for _, v := range haystack {
		if v == needle {
			return true
		}
		splitted := strings.Split(v, "-")
		if len(splitted) == 2 && splitted[0] == needle {
			return true
		}
	}

	return false
}
