// Package connection defines transport-neutral server channel contracts and
// errors.
package connection

import "context"

// Type identifies the transport configured by a server profile.
type Type string

const (
	TypeRCON Type = "rcon"
)

// Channel is an open server transport. Close must be idempotent and safe to
// call concurrently with supported capability operations.
type Channel interface {
	Close()
}

// CommandExecutor is implemented by channels that can execute server commands.
type CommandExecutor interface {
	ExecuteCommand(ctx context.Context, command string) (string, error)
}
