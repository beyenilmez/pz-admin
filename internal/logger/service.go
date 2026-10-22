package logger

import (
	"log/slog"
	"regexp"
	"strings"

	"github.com/beyenilmez/pz-admin/internal/config"
	"github.com/wailsapp/wails/v3/pkg/application"
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

const LogWindowName = "application-logs"

// Service exposes application logging to the frontend.
type Service struct {
	bundle *Bundle
	config *config.Service
}

func NewService(bundle *Bundle, configService *config.Service) *Service {
	return &Service{bundle: bundle, config: configService}
}

// ReportFrontendError writes a bounded and redacted frontend error.
func (s *Service) ReportFrontendError(report FrontendError) {
	reportFrontendError(report)
}

func reportFrontendError(report FrontendError) {
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

func (s *Service) Read(afterID int64) Update {
	return s.bundle.History.Read(afterID)
}

func (s *Service) OpenWindow() {
	application.InvokeAsync(func() {
		// Show current window if already opened
		app := application.Get()
		if window, ok := app.Window.GetByName(LogWindowName); ok {
			window.UnMinimise()
			window.Show()
			window.Focus()
			return
		}

		// Choose which background color to show before frontend loads
		theme := s.config.Config().Theme
		background := application.NewRGB(255, 255, 255)
		if theme == config.ThemeDark || (theme == config.ThemeSystem && app.Env.IsDarkMode()) {
			background = application.NewRGB(36, 36, 36)
		}

		app.Window.NewWithOptions(application.WebviewWindowOptions{
			Name:             LogWindowName,
			Title:            "PZ Admin — Application logs",
			Width:            960,
			Height:           640,
			MinWidth:         320,
			MinHeight:        320,
			BackgroundColour: background,
			URL:              "/?view=logs",
			Permissions: map[application.PermissionType]application.Permission{
				application.PermissionMicrophone:    application.PermissionDeny,
				application.PermissionCamera:        application.PermissionDeny,
				application.PermissionGeolocation:   application.PermissionDeny,
				application.PermissionNotifications: application.PermissionDeny,
				application.PermissionClipboardRead: application.PermissionDeny,
			},
		})
	})
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
