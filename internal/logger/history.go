package logger

import (
	"io"
	"log/slog"
	"sort"
	"strings"
	"sync"
	"unicode/utf8"
)

const (
	maxHistoryBytes   = 20 << 20
	maxHistoryEntries = 10000
	maxDisplayBytes   = 64 << 10
)

// Entry is a log record kept in the session history.
type Entry struct {
	ID        int64  `json:"id"`
	Text      string `json:"text"`
	Level     string `json:"level"`
	Truncated bool   `json:"truncated"`
}

// Update contains new entries and the oldest ID still retained by the backend.
type Update struct {
	Entries []Entry `json:"entries"`
	FirstID int64   `json:"firstID"`
}

// History retains a bounded session independently of the viewer's lifetime.
type History struct {
	mu       sync.Mutex
	entries  []Entry
	bytes    int
	sequence int64
}

type sessionWriter struct {
	history *History
	file    io.Writer
}

func (w *sessionWriter) Write(p []byte) (int, error) {
	h := w.history
	h.mu.Lock()
	defer h.mu.Unlock()
	// Keep the full record in the file; shorten only the viewer copy.
	n, err := w.file.Write(p)
	h.sequence++
	text := strings.TrimSuffix(string(p), "\n")
	truncated := false
	if len(text) > maxDisplayBytes {
		text = strings.Clone(validPrefix(text, maxDisplayBytes))
		truncated = true
	}
	e := Entry{ID: h.sequence, Text: text, Level: entryLevel(text), Truncated: truncated}
	// Drop the oldest records until the new entry fits both limits.
	for len(h.entries) > 0 && (h.bytes+len(text) > maxHistoryBytes || len(h.entries) >= maxHistoryEntries) {
		h.bytes -= len(h.entries[0].Text)
		// Release the text before dropping the entry from the slice.
		h.entries[0] = Entry{}
		h.entries = h.entries[1:]
	}

	h.entries = append(h.entries, e)
	h.bytes += len(text)
	return n, err
}

func validPrefix(s string, n int) string {
	if len(s) <= n {
		return s
	}
	// Avoid cutting through a UTF-8 character.
	for n > 0 && !utf8.RuneStart(s[n]) {
		n--
	}
	return s[:n]
}

func entryLevel(text string) string {
	// slog's level precedes all message and attribute text.
	_, rest, ok := strings.Cut(text, "level=")
	if !ok {
		return "OTHER"
	}
	value, _, _ := strings.Cut(rest, " ")
	var level slog.Level
	if level.UnmarshalText([]byte(strings.TrimSpace(value))) != nil {
		return "OTHER"
	}
	switch {
	case level >= slog.LevelError:
		return "ERROR"
	case level >= slog.LevelWarn:
		return "WARN"
	case level >= slog.LevelInfo:
		return "INFO"
	default:
		return "DEBUG"
	}
}

// Read returns retained entries newer than afterID. Use zero for the initial load.
func (h *History) Read(afterID int64) Update {
	h.mu.Lock()
	defer h.mu.Unlock()
	update := Update{Entries: []Entry{}}
	if len(h.entries) == 0 {
		return update
	}
	// Tell the viewer which older records it should discard.
	update.FirstID = h.entries[0].ID
	start := sort.Search(len(h.entries), func(i int) bool { return h.entries[i].ID > afterID })
	update.Entries = append(update.Entries, h.entries[start:]...)
	return update
}
