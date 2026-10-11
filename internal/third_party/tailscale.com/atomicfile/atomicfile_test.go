package atomicfile

import (
	"os"
	"path/filepath"
	"testing"
)

func TestWriteFileRoundtrip(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "test.txt")
	data := []byte("hello world")
	if err := WriteFile(path, data, 0o644); err != nil {
		t.Fatal(err)
	}
	got, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	if string(got) != string(data) {
		t.Errorf("got %q, want %q", string(got), string(data))
	}
}

func TestWriteFileOverwrite(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "test.txt")
	if err := WriteFile(path, []byte("old"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := WriteFile(path, []byte("new"), 0o644); err != nil {
		t.Fatal(err)
	}
	got, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	if string(got) != "new" {
		t.Errorf("got %q, want %q", string(got), "new")
	}
}

func TestWriteFileNoTempLeftovers(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "test.txt")
	if err := WriteFile(path, []byte("data"), 0o644); err != nil {
		t.Fatal(err)
	}
	// No temp files left behind.
	matches, _ := filepath.Glob(filepath.Join(dir, "*.tmp*"))
	if len(matches) > 0 {
		t.Errorf("leftover temp files: %v", matches)
	}
}

func TestWriteFileCreatesDir(t *testing.T) {
	dir := filepath.Join(t.TempDir(), "subdir")
	path := filepath.Join(dir, "test.txt")
	if err := WriteFile(path, []byte("ok"), 0o644); err != nil {
		t.Fatal(err)
	}
	got, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	if string(got) != "ok" {
		t.Errorf("got %q, want %q", string(got), "ok")
	}
}
