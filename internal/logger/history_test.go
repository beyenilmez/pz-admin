package logger

import (
	"bytes"
	"fmt"
	"io"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"unicode/utf8"
)

func TestHistoryContainsOnlyCurrentSession(t *testing.T) {
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "latest.log"), []byte("level=INFO msg=previous\n"), 0600); err != nil {
		t.Fatal(err)
	}
	bundle, err := newLogger(&bytes.Buffer{}, dir, Options{})
	if err != nil {
		t.Fatal(err)
	}
	defer bundle.Close()
	bundle.Logger.Info("current")
	bundle.Logger.Debug("hidden debug")
	page := bundle.History.Read(0)
	if len(page.Entries) != 1 || !strings.Contains(page.Entries[0].Text, "current") {
		t.Fatalf("session: %+v", page)
	}
}

func TestHistoryRetainsRecentEntries(t *testing.T) {
	h := &History{}
	w := sessionWriter{history: h, file: io.Discard}
	const written = 3*maxHistoryEntries + 2
	for range written {
		if _, err := fmt.Fprintln(&w, "level=INFO entry"); err != nil {
			t.Fatal(err)
		}
	}
	snapshot := h.Read(0)
	if snapshot.FirstID != snapshot.Entries[0].ID || len(snapshot.Entries) != maxHistoryEntries || snapshot.Entries[0].ID != written-maxHistoryEntries+1 {
		t.Fatalf("retention: entries=%d firstID=%d", len(snapshot.Entries), snapshot.FirstID)
	}
	if unchanged := h.Read(written); len(unchanged.Entries) != 0 || unchanged.FirstID != snapshot.FirstID {
		t.Fatal("unchanged history must not resend entries")
	}
	if _, err := fmt.Fprintln(&w, "level=WARN new entry"); err != nil {
		t.Fatal(err)
	}
	updated := h.Read(written)
	last := updated.Entries[len(updated.Entries)-1]
	if last.ID != written+1 || len(updated.Entries) != 1 || last.Level != "WARN" || updated.FirstID != snapshot.FirstID+1 {
		t.Fatal("changed history must send only the new entry and advance the retention boundary")
	}
	missed := h.Read(1)
	if len(missed.Entries) != maxHistoryEntries || missed.Entries[0].ID != updated.FirstID {
		t.Fatal("a reader that fell behind must receive all entries still retained")
	}
}

func TestHistoryByteLimitAndLongLines(t *testing.T) {
	h := &History{}
	w := sessionWriter{history: h, file: io.Discard}
	line := []byte("level=INFO " + strings.Repeat("あ", maxDisplayBytes) + "\n")
	for range maxHistoryBytes/(maxDisplayBytes-3) + 2 {
		if _, err := w.Write(line); err != nil {
			t.Fatal(err)
		}
	}
	snapshot := h.Read(0)
	if snapshot.FirstID <= 1 || h.bytes > maxHistoryBytes || len(snapshot.Entries) >= maxHistoryEntries {
		t.Fatal("history must respect its byte limit independently of the entry limit")
	}
	for _, entry := range snapshot.Entries {
		if !entry.Truncated || len(entry.Text) > maxDisplayBytes || !utf8.ValidString(entry.Text) {
			t.Fatal("long lines must be bounded and truncated on character boundaries")
		}
	}
}

func TestFrameworkLoggerSuppressesBindingDebug(t *testing.T) {
	bundle, stderr, dir := newTestLogger(t, Options{FileLevel: slog.LevelDebug})
	bundle.FrameworkLogger().With("component", "bindings").WithGroup("call").Debug("secret password")
	bundle.FrameworkLogger().With("component", "bindings").WithGroup("call").Warn("framework warning")
	bundle.Logger.Debug("application detail")
	for _, text := range []string{stderr.String(), string(readLog(t, dir))} {
		if strings.Contains(text, "secret password") || !strings.Contains(text, "framework warning") || !strings.Contains(text, "application detail") {
			t.Fatalf("framework filtering: %s", text)
		}
	}
}
