package command

import "errors"

// ErrUnknownCommand indicates that Lookup or Execute found no command matching
// the supplied name and version.
var ErrUnknownCommand = errors.New("unknown command")

// ErrCommandFailed indicates that a server response reports an unsuccessful
// command. Parsers wrap it with the response text so callers can use errors.Is.
var ErrCommandFailed = errors.New("command failed")
