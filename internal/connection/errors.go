package connection

import "errors"

// ErrDisconnected reports that a connection is not established.
var ErrDisconnected = errors.New("not connected")

// ErrCommandTimeout reports that a command exceeded its interaction timeout.
var ErrCommandTimeout = errors.New("command timed out")
