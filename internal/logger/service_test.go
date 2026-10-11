package logger

import (
	"bytes"
	"log/slog"
	"strings"
	"testing"
)

func TestService_ReportFrontendErrorLevel(t *testing.T) {
	for _, test := range []struct {
		source string
		level  string
	}{
		{source: "global_error", level: `"level":"ERROR"`},
		{source: "react_caught", level: `"level":"WARN"`},
		{source: "react_recoverable", level: `"level":"WARN"`},
	} {
		t.Run(test.source, func(t *testing.T) {
			output := captureFrontendLog(t)
			NewService().ReportFrontendError(FrontendError{Source: test.source, Message: "failure"})
			if logged := output.String(); !strings.Contains(logged, test.level) {
				t.Errorf("log = %q, want %s", logged, test.level)
			}
		})
	}
}

func TestService_ReportFrontendErrorSanitizesEveryField(t *testing.T) {
	output := captureFrontendLog(t)
	NewService().ReportFrontendError(FrontendError{
		Source:         "password=source-secret",
		Name:           "password=name-secret",
		Message:        "password=message-secret",
		Stack:          "password=stack-secret",
		ComponentStack: "password=component-secret",
		Route:          "password=route-secret",
	})

	logged := output.String()
	for _, secret := range []string{"source-secret", "name-secret", "message-secret", "stack-secret", "component-secret", "route-secret"} {
		if strings.Contains(logged, secret) {
			t.Errorf("log contains secret %q: %q", secret, logged)
		}
	}
	for _, field := range []string{"frontend_source", "name", "message", "stack", "component_stack", "route"} {
		if !strings.Contains(logged, `"`+field+`"`) {
			t.Errorf("log = %q, want field %q", logged, field)
		}
	}
	if got := strings.Count(logged, "[redacted]"); got != 6 {
		t.Errorf("redacted fields = %d, want 6; log = %q", got, logged)
	}
}

func TestCleanFrontendField(t *testing.T) {
	for _, test := range []struct {
		name  string
		value string
		limit int
		want  string
	}{
		{name: "normalizes input", value: "  bad\x00value  ", limit: 20, want: "badvalue"},
		{name: "limits Unicode by rune", value: "abcçdef", limit: 4, want: "abcç..."},
		{name: "redacts secrets", value: "Token: abc123 secret=value", limit: 100, want: "Token: [redacted] secret=[redacted]"},
	} {
		t.Run(test.name, func(t *testing.T) {
			if got := cleanFrontendField(test.value, test.limit); got != test.want {
				t.Errorf("cleanFrontendField() = %q, want %q", got, test.want)
			}
		})
	}
}

func captureFrontendLog(t *testing.T) *bytes.Buffer {
	t.Helper()
	previous := slog.Default()
	var output bytes.Buffer
	slog.SetDefault(slog.New(slog.NewJSONHandler(&output, nil)))
	t.Cleanup(func() { slog.SetDefault(previous) })
	return &output
}
