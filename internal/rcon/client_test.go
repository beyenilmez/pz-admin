package rcon

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/beyenilmez/pz-admin/internal/connection"
	source "gitlab.com/nyxi/go-source-rcon/v2"
)

const testPassword = "test-password"

func TestConnect(t *testing.T) {
	t.Run("authenticates and connects", func(t *testing.T) {
		server := newTestServer(t, echoHandler)
		client := newTestClient(t, server, Config{})

		response, err := client.ExecuteCommand(t.Context(), "players")
		if err != nil {
			t.Fatalf("ExecuteCommand() error = %v", err)
		}
		if response != "echo:players" {
			t.Errorf("ExecuteCommand() = %q, want %q", response, "echo:players")
		}
	})

	t.Run("rejects invalid password", func(t *testing.T) {
		server := newTestServer(t)

		_, err := Connect(t.Context(), Config{
			Addr:     server.Addr(),
			Password: "wrong-password",
		})
		if !errors.Is(err, source.ErrAuthentication) {
			t.Errorf("Connect() error = %v, want source.ErrAuthentication", err)
		}
	})

	t.Run("honors cancelled context", func(t *testing.T) {
		server := newTestServer(t)
		ctx, cancel := context.WithCancel(t.Context())
		cancel()

		_, err := Connect(ctx, Config{Addr: server.Addr(), Password: testPassword})
		if !errors.Is(err, context.Canceled) {
			t.Errorf("Connect() error = %v, want context.Canceled", err)
		}
	})
}

func TestClient_ExecuteCommand(t *testing.T) {
	t.Run("collects complete replies and reuses connection", func(t *testing.T) {
		for _, tt := range []struct {
			name   string
			chunks []string
		}{
			{name: "older build oversized packet", chunks: []string{strings.Repeat("x", 5797)}},
			{name: "newer build multipart reply", chunks: []string{strings.Repeat("x", 4086), strings.Repeat("y", 1780)}},
			{name: "empty reply", chunks: []string{""}},
			// A UTF-8 character can straddle the server's packet boundary.
			{name: "split UTF-8", chunks: []string{strings.Repeat("x", 4084) + "\xf0\x9f", "\x98\x80"}},
		} {
			t.Run(tt.name, func(t *testing.T) {
				server := newTestServer(t, func(command string) testReply {
					if command == "help" {
						return testReply{chunks: tt.chunks, respond: true}
					}
					return echoHandler(command)
				})
				client := newTestClient(t, server, Config{})
				for _, command := range []string{"servermsg hello", "help", "players"} {
					response, err := client.ExecuteCommand(t.Context(), command)
					if err != nil {
						t.Fatalf("ExecuteCommand(%q) error = %v", command, err)
					}
					want := "echo:" + command
					if command == "help" {
						want = strings.Join(tt.chunks, "")
					}
					if response != want {
						t.Fatalf("ExecuteCommand(%q) = %q, want %q", command, response, want)
					}
				}
			})
		}
	})

	t.Run("rejects invalid commands without disconnecting", func(t *testing.T) {
		server := newTestServer(t, echoHandler)
		client := newTestClient(t, server, Config{})

		if _, err := client.ExecuteCommand(t.Context(), ""); err == nil {
			t.Error("ExecuteCommand() accepted an empty command")
		}
		if _, err := client.ExecuteCommand(t.Context(), strings.Repeat("x", 5000)); !errors.Is(err, source.ErrBodyTooLarge) {
			t.Errorf("ExecuteCommand() error = %v, want source.ErrBodyTooLarge", err)
		}
		if _, err := client.ExecuteCommand(t.Context(), "players"); err != nil {
			t.Errorf("ExecuteCommand() after validation error = %v", err)
		}
	})

	t.Run("honors cancelled context without disconnecting", func(t *testing.T) {
		server := newTestServer(t, echoHandler)
		client := newTestClient(t, server, Config{})
		ctx, cancel := context.WithCancel(t.Context())
		cancel()

		if _, err := client.ExecuteCommand(ctx, "anything"); !errors.Is(err, context.Canceled) {
			t.Errorf("ExecuteCommand() error = %v, want context.Canceled", err)
		}
		if _, err := client.ExecuteCommand(t.Context(), "players"); err != nil {
			t.Errorf("ExecuteCommand() after cancellation = %v", err)
		}
	})

	t.Run("transport failure disconnects permanently", func(t *testing.T) {
		server := newTestServer(t, func(command string) testReply {
			if command == "break" {
				return testReply{closeWrite: true}
			}
			return echoHandler(command)
		})
		client := newTestClient(t, server, Config{})

		if _, err := client.ExecuteCommand(t.Context(), "break"); err == nil {
			t.Fatal("ExecuteCommand() error = nil, want transport error")
		}
		if _, err := client.ExecuteCommand(t.Context(), "after"); !errors.Is(err, connection.ErrDisconnected) {
			t.Errorf("ExecuteCommand() error = %v, want connection.ErrDisconnected", err)
		}
	})

	t.Run("serializes concurrent commands", func(t *testing.T) {
		server := newTestServer(t, echoHandler)
		client := newTestClient(t, server, Config{})

		const count = 20
		var waitGroup sync.WaitGroup
		errs := make(chan error, count)
		for i := range count {
			waitGroup.Go(func() {
				command := fmt.Sprintf("command-%d", i)
				response, err := client.ExecuteCommand(t.Context(), command)
				if err != nil {
					errs <- err
					return
				}
				if response != "echo:"+command {
					errs <- fmt.Errorf("response = %q, want %q", response, "echo:"+command)
				}
			})
		}
		waitGroup.Wait()
		close(errs)

		for err := range errs {
			t.Error(err)
		}
	})

	t.Run("timeout allows reconnect", func(t *testing.T) {
		disconnected := make(chan struct{}, 1)
		server := newTestServer(t, func(command string) testReply {
			if command == "slow" {
				return testReply{}
			}
			return echoHandler(command)
		})
		client := newTestClient(t, server, Config{
			Timeout:      time.Second,
			OnDisconnect: func() { disconnected <- struct{}{} },
		})

		if _, err := client.ExecuteCommand(t.Context(), "slow"); !errors.Is(err, connection.ErrCommandTimeout) {
			t.Fatalf("ExecuteCommand() error = %v, want connection.ErrCommandTimeout", err)
		}
		if response, err := client.ExecuteCommand(t.Context(), "players"); err != nil || response != "echo:players" {
			t.Fatalf("command after timeout = (%q, %v)", response, err)
		}
		select {
		case <-disconnected:
			t.Fatal("timeout notified disconnect")
		default:
		}

		// A subsequent transport failure still ends the session normally.
		server.Close()
		if _, err := client.ExecuteCommand(t.Context(), "players"); err == nil {
			t.Fatal("command after server shutdown error = nil")
		}
		select {
		case <-disconnected:
		case <-time.After(5 * time.Second):
			t.Fatal("disconnect callback was not called")
		}
		if _, err := client.ExecuteCommand(t.Context(), "after"); !errors.Is(err, connection.ErrDisconnected) {
			t.Errorf("ExecuteCommand() error = %v, want connection.ErrDisconnected", err)
		}
	})

	t.Run("notifies unexpected disconnect", func(t *testing.T) {
		disconnected := make(chan struct{}, 1)
		server := newTestServer(t, func(string) testReply {
			return testReply{closeWrite: true}
		})
		client := newTestClient(t, server, Config{
			OnDisconnect: func() { disconnected <- struct{}{} },
		})

		if _, err := client.ExecuteCommand(t.Context(), "break"); err == nil {
			t.Fatal("ExecuteCommand() error = nil, want transport error")
		}
		select {
		case <-disconnected:
		case <-time.After(5 * time.Second):
			t.Fatal("disconnect callback was not called")
		}
	})
}

func TestClient_Close(t *testing.T) {
	server := newTestServer(t, echoHandler)
	client := newTestClient(t, server, Config{})

	client.Close()
	client.Close()
	if _, err := client.ExecuteCommand(t.Context(), "anything"); !errors.Is(err, connection.ErrDisconnected) {
		t.Errorf("ExecuteCommand() error = %v, want connection.ErrDisconnected", err)
	}
}

func newTestClient(t *testing.T, server *testServer, config Config) *Client {
	t.Helper()
	if config.Addr == "" {
		config.Addr = server.Addr()
	}
	if config.Password == "" {
		config.Password = testPassword
	}
	if config.Timeout == 0 {
		config.Timeout = 2 * time.Second
	}
	ctx, cancel := context.WithTimeout(t.Context(), 5*time.Second)
	defer cancel()
	client, err := Connect(ctx, config)
	if err != nil {
		t.Fatalf("Connect(%s) error = %v", config.Addr, err)
	}
	t.Cleanup(client.Close)
	return client
}

func echoHandler(command string) testReply {
	return testReply{body: "echo:" + command, respond: true}
}
