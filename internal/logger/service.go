package logger

import (
	"log/slog"
	"regexp"
	"strings"
)

const (
	maxFrontendSourceLength         = 32
	maxFrontendNameLength           = 128
	maxFrontendMessageLength        = 1024
	maxFrontendStackLength          = 8192
	maxFrontendComponentStackLength = 4096
	maxFrontendRouteLength          = 256
)

var frontendSecret = regexp.MustCompile(`(?i)(password|token|secret|authorization|webhook)(\s*[:=]\s*)([^\s,;]+)`)

// FrontendError contains diagnostic context for an unexpected frontend error.
type FrontendError struct {
	Source         string `json:"source"`
	Name           string `json:"name"`
	Message        string `json:"message"`
	Stack          string `json:"stack"`
	ComponentStack string `json:"componentStack"`
	Route          string `json:"route"`
}

// Service accepts unexpected frontend errors for the application log.
type Service struct{}

// NewService creates the frontend logging boundary.
func NewService() *Service {
	return &Service{}
}

// ReportFrontendError writes a bounded and redacted frontend error.
func (s *Service) ReportFrontendError(report FrontendError) {
	report.Source = cleanFrontendField(report.Source, maxFrontendSourceLength)
	report.Name = cleanFrontendField(report.Name, maxFrontendNameLength)
	report.Message = cleanFrontendField(report.Message, maxFrontendMessageLength)
	report.Stack = cleanFrontendField(report.Stack, maxFrontendStackLength)
	report.ComponentStack = cleanFrontendField(report.ComponentStack, maxFrontendComponentStackLength)
	report.Route = cleanFrontendField(report.Route, maxFrontendRouteLength)

	attrs := []any{
		"frontend_source", report.Source,
		"name", report.Name,
		"message", report.Message,
		"route", report.Route,
	}
	if report.Stack != "" {
		attrs = append(attrs, "stack", report.Stack)
	}
	if report.ComponentStack != "" {
		attrs = append(attrs, "component_stack", report.ComponentStack)
	}

	if report.Source == "react_caught" || report.Source == "react_recoverable" {
		slog.Warn("frontend failure", attrs...)
		return
	}
	slog.Error("frontend failure", attrs...)
}

func cleanFrontendField(value string, limit int) string {
	value = strings.ReplaceAll(value, "\x00", "")
	value = frontendSecret.ReplaceAllString(value, "$1$2[redacted]")
	value = strings.TrimSpace(value)
	runes := []rune(value)
	if len(runes) > limit {
		return string(runes[:limit]) + "..."
	}
	return value
}
