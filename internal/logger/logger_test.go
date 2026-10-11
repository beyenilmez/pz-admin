package logger

import (
	"bytes"
	"errors"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestLogger_Output(t *testing.T) {
	bundle, stderr, dir := newTestLogger(t, Options{})

	bundle.Logger.Debug("debug before level change")
	bundle.Logger.Info("info message")

	if got := stderr.String(); !strings.Contains(got, "debug before level change") || !strings.Contains(got, "info message") {
		t.Errorf("stderr = %q, want debug and info messages", got)
	}
	fileLog := readLog(t, dir)
	if bytes.Contains(fileLog, []byte("debug before level change")) {
		t.Errorf("file log = %q, want debug message filtered", fileLog)
	}
	if !bytes.Contains(fileLog, []byte("info message")) {
		t.Errorf("file log = %q, want info message", fileLog)
	}
	normalizedLog := filepath.ToSlash(string(fileLog))
	if !strings.Contains(normalizedLog, "logger/logger_test.go") {
		t.Errorf("file log = %q, want source logger/logger_test.go", fileLog)
	}
	workingDirectory, err := os.Getwd()
	if err != nil {
		t.Fatalf("Getwd() error = %v", err)
	}
	if strings.Contains(normalizedLog, filepath.ToSlash(workingDirectory)) {
		t.Errorf("file log = %q, want source without absolute working directory", fileLog)
	}

	bundle.LevelVar.Set(slog.LevelDebug)
	bundle.Logger.Debug("debug after level change")
	if fileLog := readLog(t, dir); !bytes.Contains(fileLog, []byte("debug after level change")) {
		t.Errorf("file log = %q, want runtime level change to take effect", fileLog)
	}
}

func TestNewLogger_ReturnsDirectoryError(t *testing.T) {
	blocker := filepath.Join(t.TempDir(), "blocker")
	if err := os.WriteFile(blocker, []byte("x"), 0o600); err != nil {
		t.Fatalf("write blocker: %v", err)
	}
	if _, err := newLogger(&bytes.Buffer{}, filepath.Join(blocker, "state"), Options{}); err == nil {
		t.Fatal("newLogger() error = nil, want directory creation error")
	}
}

func TestBundle_Close(t *testing.T) {
	bundle, _, _ := newTestLogger(t, Options{})
	if err := bundle.Close(); err != nil {
		t.Fatalf("Close() error = %v", err)
	}
}

func TestErrorWriter_ReportsFirstFailure(t *testing.T) {
	wantErr := errors.New("disk full")
	var stderr bytes.Buffer
	underlying := &stubFailingWriter{err: wantErr}
	writer := &errorWriter{w: underlying, path: "test.log", errw: &stderr}

	if _, err := writer.Write([]byte("first")); !errors.Is(err, wantErr) {
		t.Fatalf("Write() error = %v, want error matching %v", err, wantErr)
	}
	_, _ = writer.Write([]byte("second"))

	if underlying.writes != 2 {
		t.Errorf("underlying writes = %d, want 2", underlying.writes)
	}
	for _, want := range []string{"logger: file sink error", "test.log", "disk full"} {
		if !strings.Contains(stderr.String(), want) {
			t.Errorf("error report = %q, want it to contain %q", stderr.String(), want)
		}
	}
	if got := strings.Count(stderr.String(), "logger: file sink error"); got != 1 {
		t.Errorf("reported errors = %d, want 1", got)
	}
}

type stubFailingWriter struct {
	err    error
	writes int
}

func (writer *stubFailingWriter) Write(_ []byte) (int, error) {
	writer.writes++
	return 0, writer.err
}

func newTestLogger(t *testing.T, options Options) (*Bundle, *bytes.Buffer, string) {
	t.Helper()
	var stderr bytes.Buffer
	dir := t.TempDir()
	bundle, err := newLogger(&stderr, dir, options)
	if err != nil {
		t.Fatalf("newLogger() error = %v", err)
	}
	t.Cleanup(func() { _ = bundle.Close() })
	return bundle, &stderr, dir
}

func readLog(t *testing.T, dir string) []byte {
	t.Helper()
	data, err := os.ReadFile(filepath.Join(dir, logFileName))
	if err != nil {
		t.Fatalf("ReadFile() error = %v", err)
	}
	return data
}
