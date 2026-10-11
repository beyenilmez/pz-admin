// Copyright (c) Tailscale Inc & contributors
// SPDX-License-Identifier: BSD-3-Clause

// Modifications:
//   - Replaced log.Fatalf with t.Fatalf (test framework integration).
//   - Replaced go-cmp with plain comparisons (drop dependency).
//   - Added tests for missing, corrupt, recovered, and saved JSON files.

package jsondb

import (
	"bytes"
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func TestDB(t *testing.T) {
	dir, err := os.MkdirTemp("", "db-test")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(dir)

	path := filepath.Join(dir, "db.json")
	db, err := Open[testDB](path)
	if err != nil {
		t.Fatalf("creating empty DB: %v", err)
	}

	if db.Data.MyString != "" || db.Data.AnInt != 0 {
		t.Fatalf("unexpected empty DB content: %+v", db.Data)
	}
	db.Data.MyString = "test"
	db.Data.unexported = "don't keep"
	db.Data.AnInt = 42
	if err := db.Save(); err != nil {
		t.Fatalf("saving database: %v", err)
	}

	db2, err := Open[testDB](path)
	if err != nil {
		t.Fatalf("opening DB again: %v", err)
	}
	if db2.Data.MyString != "test" || db2.Data.AnInt != 42 {
		t.Fatalf("unexpected saved DB content: got %+v, want {test 42}", db2.Data)
	}
	if db2.Data.unexported != "" {
		t.Fatalf("unexported field was persisted: %q", db2.Data.unexported)
	}
}

func TestOpenMissingFile(t *testing.T) {
	path := filepath.Join(t.TempDir(), "missing.json")
	db, err := Open[testDB](path)
	if err != nil {
		t.Fatal(err)
	}
	if db.Data.MyString != "" || db.Data.AnInt != 0 {
		t.Errorf("non-zero: %+v", db.Data)
	}
}

func TestOpenCorruptFile(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "corrupt.json")
	if err := os.WriteFile(path, []byte("not json"), 0o600); err != nil {
		t.Fatal(err)
	}
	_, err := Open[testDB](path)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

func TestOpenRecoveringCorruptFile(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "corrupt.json")
	corrupt := []byte("not json")
	if err := os.WriteFile(path, corrupt, 0o600); err != nil {
		t.Fatal(err)
	}

	empty := testDB{MyString: "recovered"}
	db, err := OpenRecovering(path, empty)
	if err != nil {
		t.Fatal(err)
	}
	if *db.Data != empty {
		t.Fatalf("recovered data = %+v, want %+v", *db.Data, empty)
	}

	backup, err := os.ReadFile(path + ".bak")
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(backup, corrupt) {
		t.Fatalf("backup = %q, want %q", backup, corrupt)
	}
	if _, err := Open[testDB](path); err != nil {
		t.Fatalf("open recovered file: %v", err)
	}
}

func TestSaveValidJSON(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "test.json")
	db, _ := Open[testDB](path)
	db.Data.MyString = "hello"
	db.Save()

	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	var got testDB
	if err := json.Unmarshal(data, &got); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}
	if got.MyString != "hello" {
		t.Errorf("MyString = %q, want %q", got.MyString, "hello")
	}
}

type testDB struct {
	MyString   string
	unexported string
	AnInt      int64
}
