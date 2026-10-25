// Package logger configures human-readable development logs and rotating file
// logs for bug reports.
package logger

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"sync/atomic"

	"github.com/beyenilmez/pz-admin/internal/appdata"
	"gopkg.in/natefinch/lumberjack.v2"
)

// FrameworkLogger excludes verbose runtime RPC traces, which contain complete
// binding arguments/results (including credentials) and the viewer's own reads.
// Application debug records still use Logger directly.
func (b *Bundle) FrameworkLogger() *slog.Logger {
	return slog.New(&frameworkHandler{Handler: b.Logger.Handler()})
}

type frameworkHandler struct{ slog.Handler }

func (h *frameworkHandler) Enabled(ctx context.Context, level slog.Level) bool {
	return level >= slog.LevelInfo && h.Handler.Enabled(ctx, level)
}

func (h *frameworkHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	return &frameworkHandler{Handler: h.Handler.WithAttrs(attrs)}
}

func (h *frameworkHandler) WithGroup(name string) slog.Handler {
	return &frameworkHandler{Handler: h.Handler.WithGroup(name)}
}

const (
	logFileName = "latest.log"
	maxSizeMB   = 10 // rotate at 10 MB
	maxBackups  = 3  // keep 3 rotated files
	maxAgeDays  = 30 // delete rotated files older than 30 days
)

// Options configures the application logger.
type Options struct {
	// FileLevel is the minimum level written to the rotating file log. It
	// defaults to Info when nil and does not affect stderr output.
	FileLevel slog.Leveler
}

// Bundle holds the application logger and its runtime file-level control.
type Bundle struct {
	Logger   *slog.Logger
	LevelVar *slog.LevelVar
	History  *History

	closer io.Closer
}

// New creates the application logger.
//
// New configures two sinks:
//   - stderr receives short text lines at all levels.
//   - a rotating file under the application state directory receives entries
//     at the configured level.
//
// The returned LevelVar changes the file log level at runtime.
func New(options Options) (*Bundle, error) {
	return newLogger(os.Stderr, appdata.StateDir(), options)
}

// newLogger creates a logger with explicit stderr and state-directory sinks.
func newLogger(stderr io.Writer, stateDir string, options Options) (*Bundle, error) {
	if options.FileLevel == nil {
		options.FileLevel = slog.LevelInfo
	}

	if err := os.MkdirAll(stateDir, 0o700); err != nil {
		return nil, fmt.Errorf("logger: create state dir: %w", err)
	}

	levelVar := new(slog.LevelVar)
	levelVar.Set(options.FileLevel.Level())

	logPath := filepath.Join(stateDir, logFileName)
	lj := &lumberjack.Logger{
		Filename:   logPath,
		MaxSize:    maxSizeMB,
		MaxBackups: maxBackups,
		MaxAge:     maxAgeDays,
		Compress:   true,
	}

	history := &History{}
	ew := &errorWriter{w: lj, path: logPath, errw: stderr}
	writer := &sessionWriter{history: history, file: ew}

	logger := slog.New(slog.NewMultiHandler(
		slog.NewTextHandler(stderr, handlerOpts(slog.LevelDebug)),
		slog.NewTextHandler(writer, handlerOpts(levelVar)),
	))

	return &Bundle{
		Logger:   logger,
		LevelVar: levelVar,
		History:  history,
		closer:   lj,
	}, nil
}

// SetDebugLogging changes the minimum level captured in the file and session log.
func (b *Bundle) SetDebugLogging(enabled bool) {
	level := slog.LevelInfo
	if enabled {
		level = slog.LevelDebug
	}
	if b.LevelVar.Level() != level {
		b.LevelVar.Set(level)
		b.Logger.Info("log level changed", "level", level)
	}
}

// Close flushes and closes the rotating file log. It is safe to call when the
// file was never opened.
func (b *Bundle) Close() error {
	if b.closer != nil {
		return b.closer.Close()
	}
	return nil
}

// handlerOpts enables source locations and shortens them to package/file names.
func handlerOpts(level slog.Leveler) *slog.HandlerOptions {
	return &slog.HandlerOptions{
		Level:       level,
		AddSource:   true,
		ReplaceAttr: shortSource,
	}
}

// shortSource keeps the package name and source file. It allocates a new Source
// so handlers never share mutable state.
func shortSource(_ []string, a slog.Attr) slog.Attr {
	if a.Key != slog.SourceKey {
		return a
	}
	if src, ok := a.Value.Any().(*slog.Source); ok && src != nil {
		return slog.Any(slog.SourceKey, &slog.Source{
			Function: src.Function,
			File:     filepath.Join(sourcePackage(src.Function), filepath.Base(src.File)),
			Line:     src.Line,
		})
	}
	return a
}

func sourcePackage(function string) string {
	if slash := strings.LastIndexByte(function, '/'); slash >= 0 {
		function = function[slash+1:]
	}
	if dot := strings.IndexByte(function, '.'); dot >= 0 {
		function = function[:dot]
	}
	if function == "" {
		return "unknown"
	}
	return function
}

// errorWriter reports the first underlying write error through errw so file
// sink failures are not silent.
type errorWriter struct {
	w     io.Writer
	path  string
	errw  io.Writer
	first atomic.Bool
}

func (ew *errorWriter) Write(p []byte) (int, error) {
	n, err := ew.w.Write(p)
	if err != nil && ew.first.CompareAndSwap(false, true) {
		// Reporting is best-effort; return the original write error below.
		_, _ = fmt.Fprintf(ew.errw, "logger: file sink error (%s): %v\n", ew.path, err)
	}
	return n, err
}
