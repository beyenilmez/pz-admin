package session

import (
	"context"
	"errors"
	"testing"
)

func TestDetectGameVersion(t *testing.T) {
	for _, test := range []struct {
		name     string
		response string
		want     string
	}{
		{name: "Build 41", response: "Unknown command banip", want: "41"},
		{name: "Build 42", response: "Ban IP. Use /banip IP", want: "42"},
		{name: "surrounding whitespace", response: "\r\nBan IP. Use /banip IP\r\n", want: "42"},
	} {
		t.Run(test.name, func(t *testing.T) {
			channel := &stubVersionChannel{response: test.response}
			got, err := detectGameVersion(t.Context(), channel)
			if err != nil {
				t.Fatal(err)
			}
			if got != test.want {
				t.Errorf("detectGameVersion() = %q, want %q", got, test.want)
			}
			assertVersionProbe(t, channel)
		})
	}

	t.Run("rejects unrecognized response", func(t *testing.T) {
		channel := &stubVersionChannel{response: "unexpected"}
		if _, err := detectGameVersion(t.Context(), channel); err == nil {
			t.Error("detectGameVersion() error = nil, want unrecognized-response error")
		}
		assertVersionProbe(t, channel)
	})

	t.Run("returns command error", func(t *testing.T) {
		wantErr := errors.New("command failed")
		channel := &stubVersionChannel{err: wantErr}
		if _, err := detectGameVersion(t.Context(), channel); !errors.Is(err, wantErr) {
			t.Errorf("detectGameVersion() error = %v, want wrapped %v", err, wantErr)
		}
		assertVersionProbe(t, channel)
	})
}

type stubVersionChannel struct {
	response string
	err      error
	commands []string
}

func (*stubVersionChannel) Close() {}

func (c *stubVersionChannel) ExecuteCommand(_ context.Context, command string) (string, error) {
	c.commands = append(c.commands, command)
	return c.response, c.err
}

func assertVersionProbe(t *testing.T, channel *stubVersionChannel) {
	t.Helper()
	if len(channel.commands) != 1 || channel.commands[0] != "banip" {
		t.Errorf("commands = %v, want [banip]", channel.commands)
	}
}
