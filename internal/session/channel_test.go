package session

import (
	"strings"
	"testing"

	"github.com/beyenilmez/pz-admin/internal/profile"
)

func TestOpenChannel(t *testing.T) {
	t.Run("rejects unsupported connection type", func(t *testing.T) {
		_, err := openChannel(t.Context(), profile.Profile{ConnectionType: "unsupported"}, "", func() {})
		if err == nil || !strings.Contains(err.Error(), "unsupported connection type") {
			t.Errorf("openChannel() error = %v, want unsupported connection type", err)
		}
	})
}

func TestChannelAddr(t *testing.T) {
	got := channelAddr(profile.Profile{Host: "2001:db8::7", Port: 16261})
	if got != "[2001:db8::7]:16261" {
		t.Errorf("channelAddr() = %q, want IPv6 host and port", got)
	}
}
