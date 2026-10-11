package session

import (
	"context"
	"fmt"
	"strings"

	"github.com/beyenilmez/pz-admin/internal/connection"
)

var buildByBanIPResponse = map[string]string{
	"Unknown command banip": "41",
	"Ban IP. Use /banip IP": "42",
}

// The argument-less banip command is harmless on both supported builds. Build
// 41 does not recognize it, while Build 42 returns its usage text.
func detectGameVersion(ctx context.Context, channel connection.Channel) (string, error) {
	executor, ok := channel.(connection.CommandExecutor)
	if !ok {
		return "", fmt.Errorf("detect game version: channel cannot execute commands")
	}

	response, err := executor.ExecuteCommand(ctx, "banip")
	if err != nil {
		return "", fmt.Errorf("detect game version: %w", err)
	}
	if build, ok := buildByBanIPResponse[strings.TrimSpace(response)]; ok {
		return build, nil
	}
	return "", fmt.Errorf("detect game version: unrecognized banip response")
}
