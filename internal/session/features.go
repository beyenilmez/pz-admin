package session

import (
	"github.com/beyenilmez/pz-admin/internal/command"
	"github.com/beyenilmez/pz-admin/internal/connection"
	"github.com/beyenilmez/pz-admin/internal/feature"
	"github.com/beyenilmez/pz-admin/internal/profile"
)

func resolveFeatures(p profile.Profile, channel connection.Channel) feature.Set {
	features := feature.NewSet()
	if _, ok := channel.(connection.CommandExecutor); !ok {
		return features
	}

	features.Add(feature.ConsoleExecuteCommand)
	features.Add(command.Features(p.Version).Values()...)
	return features
}
