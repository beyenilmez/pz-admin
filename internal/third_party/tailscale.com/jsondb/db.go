// Copyright (c) Tailscale Inc & contributors
// SPDX-License-Identifier: BSD-3-Clause

// Modifications:
//   - Import path changed from tailscale.com/atomicfile to vendored path.
//   - Added OpenRecovering for backup and recovery of invalid JSON.

// Package jsondb provides a trivial "database": a Go object saved to
// disk as JSON.
package jsondb

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"log/slog"
	"os"

	"github.com/beyenilmez/pz-admin/internal/third_party/tailscale.com/atomicfile"
)

// DB is a database backed by a JSON file.
type DB[T any] struct {
	// Data is the contents of the database.
	Data *T

	path string
}

// Open opens the database at path, creating it with a zero value if
// necessary.
func Open[T any](path string) (*DB[T], error) {
	bs, err := os.ReadFile(path)
	if errors.Is(err, fs.ErrNotExist) {
		return &DB[T]{
			Data: new(T),
			path: path,
		}, nil
	} else if err != nil {
		return nil, err
	}

	var val T
	if err := json.Unmarshal(bs, &val); err != nil {
		return nil, err
	}

	return &DB[T]{
		Data: &val,
		path: path,
	}, nil
}

// OpenRecovering opens the database at path. Invalid JSON is backed up to
// path + ".bak" and atomically replaced with empty. I/O errors leave the
// original file untouched and are returned to the caller.
func OpenRecovering[T any](path string, empty T) (*DB[T], error) {
	db, err := Open[T](path)
	if err == nil {
		return db, nil
	}

	data, readErr := os.ReadFile(path)
	if readErr != nil {
		return nil, err
	}

	backup := ""
	if len(data) > 0 {
		backup = path + ".bak"
		if backupErr := atomicfile.WriteFile(backup, data, 0o600); backupErr != nil {
			return nil, fmt.Errorf("backup corrupt JSON: %w (original: %w)", backupErr, err)
		}
	}
	// Replace the invalid file with the empty state in a single atomic
	// rename so a crash can never leave the store without a live file.
	replacement, err := json.Marshal(empty)
	if err != nil {
		return nil, fmt.Errorf("marshal empty state: %w", err)
	}
	if writeErr := atomicfile.WriteFile(path, replacement, 0o600); writeErr != nil {
		return nil, fmt.Errorf("replace invalid JSON: %w", writeErr)
	}

	db, err = Open[T](path)
	if err != nil {
		return nil, fmt.Errorf("open after JSON recovery: %w", err)
	}
	*db.Data = empty
	if backup != "" {
		slog.Warn("corrupt JSON recovered with empty data", "path", path, "backup", backup)
	}
	return db, nil
}

// Save writes db.Data back to disk.
func (db *DB[T]) Save() error {
	bs, err := json.Marshal(db.Data)
	if err != nil {
		return err
	}

	return atomicfile.WriteFile(db.path, bs, 0600)
}
