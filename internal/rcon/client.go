// Package rcon provides a thread-safe Source RCON client suitable for game
// server administration.
package rcon

import (
	"context"
	"errors"
	"fmt"
	"net"
	"sync/atomic"
	"time"

	"github.com/beyenilmez/pz-admin/internal/connection"
	source "gitlab.com/nyxi/go-source-rcon/v2"
)

const defaultTimeout = 5 * time.Second

// Config configures an RCON client connection.
type Config struct {
	// Addr is the server address in `host:port` form.
	Addr string

	// Password is the RCON password.
	Password string

	// Timeout bounds connection, authentication, queueing, and command
	// execution. Zero uses the five-second default.
	Timeout time.Duration

	// OnDisconnect is called asynchronously after an unexpected transport
	// failure. Explicitly closing the client does not call it. It is optional.
	OnDisconnect func()
}

func (c Config) withDefaults() Config {
	if c.Timeout <= 0 {
		c.Timeout = defaultTimeout
	}
	return c
}

// Client is a managed RCON connection that is safe for concurrent use. Connect
// creates a Client, and Close releases its resources.
type Client struct {
	conn         *source.Client
	closed       atomic.Bool
	onDisconnect func()
}

var (
	_ connection.Channel         = (*Client)(nil)
	_ connection.CommandExecutor = (*Client)(nil)
)

// Connect dials the RCON server once; callers retry by calling Connect again.
// Authentication failures wrap source.ErrAuthentication. The context bounds
// only the initial dial and does not control the Client's lifetime.
func Connect(ctx context.Context, config Config) (*Client, error) {
	config = config.withDefaults()
	// Project Zomboid returns one packet per command and can exceed Source's
	// standard 4096-byte limit; Build 42's `help` packet is 4218 bytes.
	conn, err := source.Dial(
		ctx,
		config.Addr,
		source.WithPassword(config.Password),
		source.WithTimeout(config.Timeout),
		source.WithSinglePacketResponses(),
		source.WithMaxPacketSize(source.MaxPacketSizeLimit),
		source.WithUTF8(),
	)
	if err != nil {
		return nil, fmt.Errorf("rcon: connect: %w", err)
	}

	return &Client{conn: conn, onDisconnect: config.OnDisconnect}, nil
}

// ExecuteCommand runs a command on the established connection. The underlying
// client serializes concurrent commands. Any transport failure closes the
// connection permanently; callers must create a new Client to connect again.
//
// Empty commands are rejected before I/O. Config.Timeout bounds the round trip,
// and timeouts report connection.ErrCommandTimeout. Cancelling ctx aborts a
// pending execution, although the command may already have reached the server.
//
// Cancelling ctx before transmission returns the unwrapped context error so
// callers can distinguish cancellation from transport failures with errors.Is.
func (c *Client) ExecuteCommand(ctx context.Context, cmd string) (string, error) {
	if c.closed.Load() {
		return "", fmt.Errorf("rcon: execute: %w", connection.ErrDisconnected)
	}
	if err := ctx.Err(); err != nil {
		return "", err
	}

	if cmd == "" {
		return "", fmt.Errorf("rcon: execute: command is empty")
	}

	response, err := c.conn.Exec(ctx, cmd)
	if err != nil {
		if isCommandValidationError(err) {
			return "", fmt.Errorf("rcon: execute: %w", err)
		}

		// Any transaction failure may have left the stream ambiguous. Keep the
		// application's explicit reconnect lifecycle instead of reusing it.
		c.close(true)
		var netErr net.Error
		if errors.Is(err, context.DeadlineExceeded) ||
			(errors.As(err, &netErr) && netErr.Timeout()) {
			return "", fmt.Errorf("rcon: execute: %w", connection.ErrCommandTimeout)
		}
		return "", fmt.Errorf("rcon: execute: %w", err)
	}
	return response, nil
}

func isCommandValidationError(err error) bool {
	return errors.Is(err, source.ErrBodyTooLarge) ||
		errors.Is(err, source.ErrBodyContainsNUL) ||
		errors.Is(err, source.ErrNonASCII) ||
		errors.Is(err, source.ErrInvalidUTF8)
}

// Close shuts down the client. Idempotent.
func (c *Client) Close() {
	c.close(false)
}

func (c *Client) close(notify bool) {
	if !c.closed.CompareAndSwap(false, true) {
		return
	}
	_ = c.conn.Close()
	if notify && c.onDisconnect != nil {
		go c.onDisconnect()
	}
}
