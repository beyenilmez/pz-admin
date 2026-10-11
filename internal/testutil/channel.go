// Package testutil provides small test doubles shared by backend tests.
package testutil

import (
	"context"
	"sync"
	"testing"
)

// RecordingChannel records commands and delegates responses to Handler.
type RecordingChannel struct {
	Handler func(context.Context, string) (string, error)

	mu       sync.Mutex
	commands []string
	closed   bool
}

// ExecuteCommand records command before invoking Handler.
func (c *RecordingChannel) ExecuteCommand(ctx context.Context, command string) (string, error) {
	c.mu.Lock()
	c.commands = append(c.commands, command)
	c.mu.Unlock()
	if c.Handler == nil {
		return "", nil
	}
	return c.Handler(ctx, command)
}

// Close marks the channel as closed.
func (c *RecordingChannel) Close() {
	c.mu.Lock()
	c.closed = true
	c.mu.Unlock()
}

// Commands returns a copy of the recorded commands.
func (c *RecordingChannel) Commands() []string {
	c.mu.Lock()
	defer c.mu.Unlock()
	return append([]string(nil), c.commands...)
}

// Closed reports whether Close was called.
func (c *RecordingChannel) Closed() bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.closed
}

// AssertCommands compares the channel's command history with the expected sequence.
func AssertCommands(t *testing.T, channel *RecordingChannel, want ...string) {
	t.Helper()
	got := channel.Commands()
	if len(got) != len(want) {
		t.Fatalf("commands = %q, want %q", got, want)
	}
	for index := range want {
		if got[index] != want[index] {
			t.Errorf("commands[%d] = %q, want %q", index, got[index], want[index])
		}
	}
}
