package session

import (
	"encoding/binary"
	"io"
	"log/slog"
	"net"
	"slices"
	"strconv"
	"sync"
	"testing"
	"time"

	"github.com/adrg/xdg"
	"github.com/beyenilmez/pz-admin/internal/connection"
	"github.com/beyenilmez/pz-admin/internal/feature"
	"github.com/beyenilmez/pz-admin/internal/profile"
	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/zalando/go-keyring"
)

func TestService_ConnectionLifecycle(t *testing.T) {
	application.New(application.Options{
		Name:                        "session-test",
		Logger:                      slog.New(slog.NewTextHandler(io.Discard, nil)),
		DisableDefaultSignalHandler: true,
	})
	keyring.MockInit()
	previousConfigHome := xdg.ConfigHome
	xdg.ConfigHome = t.TempDir()
	t.Cleanup(func() { xdg.ConfigHome = previousConfigHome })

	server := newSessionRCONServer(t)
	host, portText, err := net.SplitHostPort(server.Addr())
	if err != nil {
		t.Fatal(err)
	}
	port, err := strconv.Atoi(portText)
	if err != nil {
		t.Fatal(err)
	}

	profiles := profile.NewService(nil)
	if err := profiles.ServiceStartup(t.Context(), application.ServiceOptions{}); err != nil {
		t.Fatalf("profile ServiceStartup() error = %v", err)
	}
	saved, err := profiles.Save(profile.Profile{
		Name:           "server",
		ConnectionType: connection.TypeRCON,
		Host:           host,
		Port:           port,
		Version:        "auto",
	}, sessionTestPassword)
	if err != nil {
		t.Fatalf("profile Save() error = %v", err)
	}

	observer := newRecordingSessionObserver()
	service := NewService(profiles, observer)
	if err := service.Connect(t.Context(), saved.ID); err != nil {
		t.Fatalf("Connect() error = %v", err)
	}
	observer.WaitForConnected(t, true)
	activeProfile, connected := service.Profile()
	if !connected || activeProfile.ID != saved.ID || activeProfile.Version != "42" {
		t.Errorf("Profile() = (%+v, %v), want connected Build 42 profile %q", activeProfile, connected, saved.ID)
	}
	snapshot := service.Snapshot()
	if !snapshot.Connected || snapshot.Profile != activeProfile ||
		!slices.Contains(snapshot.Features, feature.ConsoleExecuteCommand) {
		t.Errorf("Snapshot() = %+v, want connected profile and console feature", snapshot)
	}
	if got := service.Features(); !slices.Equal(got, snapshot.Features) {
		t.Errorf("Features() = %v, want %v", got, snapshot.Features)
	}
	if err := service.Connect(t.Context(), saved.ID); err == nil {
		t.Error("second Connect() error = nil, want already-connected error")
	}
	if err := service.Disconnect(); err != nil {
		t.Fatalf("Disconnect() error = %v", err)
	}
	observer.WaitForConnected(t, false)
	if _, connected := service.Profile(); connected || service.Snapshot().Connected {
		t.Error("service remains connected after Disconnect()")
	}

	if err := service.Connect(t.Context(), saved.ID); err != nil {
		t.Fatalf("reconnect error = %v", err)
	}
	connectedState := observer.WaitForConnected(t, true)
	server.CloseConnections()
	executor, ok := connectedState.Channel.(connection.CommandExecutor)
	if !ok {
		t.Fatal("connected channel does not support command execution")
	}
	if _, err := executor.ExecuteCommand(t.Context(), "players"); err == nil {
		t.Fatal("ExecuteCommand() after transport loss error = nil")
	}
	observer.WaitForConnected(t, false)
	if _, connected := service.Profile(); connected || service.Snapshot().Connected {
		t.Error("service remains connected after transport loss")
	}

	if err := service.Connect(t.Context(), saved.ID); err != nil {
		t.Fatalf("second reconnect error = %v", err)
	}
	observer.WaitForConnected(t, true)
	if err := service.ServiceShutdown(); err != nil {
		t.Fatalf("ServiceShutdown() error = %v", err)
	}
	observer.WaitForConnected(t, false)
	if service.Snapshot().Connected {
		t.Error("service remains connected after ServiceShutdown()")
	}
	if got := server.Commands(); !slices.Equal(got, []string{"banip", "banip", "banip"}) {
		t.Errorf("server commands = %v, want three version probes", got)
	}
	if got := observer.ConnectedStates(); !slices.Equal(got, []bool{true, false, true, false, true, false}) {
		t.Errorf("observer connected states = %v, want explicit, unexpected, and shutdown lifecycle", got)
	}
}

type recordingSessionObserver struct {
	mu      sync.Mutex
	states  []State
	changed chan State
}

func newRecordingSessionObserver() *recordingSessionObserver {
	return &recordingSessionObserver{changed: make(chan State, 8)}
}

func (o *recordingSessionObserver) SessionChanged(state State) {
	o.mu.Lock()
	o.states = append(o.states, state)
	o.mu.Unlock()
	o.changed <- state
}

func (o *recordingSessionObserver) ConnectedStates() []bool {
	o.mu.Lock()
	defer o.mu.Unlock()
	states := make([]bool, len(o.states))
	for index, state := range o.states {
		states[index] = state.Connected
	}
	return states
}

func (o *recordingSessionObserver) WaitForConnected(t *testing.T, connected bool) State {
	t.Helper()
	select {
	case state := <-o.changed:
		if state.Connected != connected {
			t.Fatalf("observer state connected = %v, want %v", state.Connected, connected)
		}
		return state
	case <-time.After(5 * time.Second):
		t.Fatalf("timed out waiting for observer connected = %v", connected)
		return State{}
	}
}

const sessionTestPassword = "secret"

type sessionRCONServer struct {
	listener net.Listener

	mu       sync.Mutex
	commands []string
	conns    map[net.Conn]struct{}
}

func newSessionRCONServer(t *testing.T) *sessionRCONServer {
	t.Helper()
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	server := &sessionRCONServer{listener: listener, conns: make(map[net.Conn]struct{})}
	go server.serve()
	t.Cleanup(server.Close)
	return server
}

func (s *sessionRCONServer) Addr() string {
	return s.listener.Addr().String()
}

func (s *sessionRCONServer) Commands() []string {
	s.mu.Lock()
	defer s.mu.Unlock()
	return append([]string(nil), s.commands...)
}

func (s *sessionRCONServer) Close() {
	_ = s.listener.Close()
	s.CloseConnections()
}

func (s *sessionRCONServer) CloseConnections() {
	s.mu.Lock()
	defer s.mu.Unlock()
	for conn := range s.conns {
		_ = conn.Close()
	}
}

func (s *sessionRCONServer) serve() {
	for {
		conn, err := s.listener.Accept()
		if err != nil {
			return
		}
		s.mu.Lock()
		s.conns[conn] = struct{}{}
		s.mu.Unlock()
		go s.serveConn(conn)
	}
}

func (s *sessionRCONServer) serveConn(conn net.Conn) {
	defer func() {
		_ = conn.Close()
		s.mu.Lock()
		delete(s.conns, conn)
		s.mu.Unlock()
	}()
	for {
		packet, err := readSessionRCONPacket(conn)
		if err != nil {
			return
		}
		switch packet.packetType {
		case 3:
			_ = writeSessionRCONPacket(conn, 0, packet.id, "")
			authID := packet.id
			if packet.body != sessionTestPassword {
				authID = -1
			}
			_ = writeSessionRCONPacket(conn, 2, authID, "")
			if authID == -1 {
				return
			}
		case 2:
			s.mu.Lock()
			s.commands = append(s.commands, packet.body)
			s.mu.Unlock()
			response := ""
			if packet.body == "banip" {
				response = "Ban IP. Use /banip IP"
			}
			_ = writeSessionRCONPacket(conn, 0, packet.id, response)
		}
	}
}

type sessionRCONPacket struct {
	id         int32
	packetType int32
	body       string
}

func readSessionRCONPacket(reader io.Reader) (sessionRCONPacket, error) {
	var size int32
	if err := binary.Read(reader, binary.LittleEndian, &size); err != nil {
		return sessionRCONPacket{}, err
	}
	payload := make([]byte, size)
	if _, err := io.ReadFull(reader, payload); err != nil {
		return sessionRCONPacket{}, err
	}
	return sessionRCONPacket{
		id:         int32(binary.LittleEndian.Uint32(payload[0:4])),
		packetType: int32(binary.LittleEndian.Uint32(payload[4:8])),
		body:       string(payload[8 : len(payload)-2]),
	}, nil
}

func writeSessionRCONPacket(writer io.Writer, packetType, id int32, body string) error {
	size := int32(len(body) + 10)
	packet := make([]byte, size+4)
	binary.LittleEndian.PutUint32(packet[0:4], uint32(size))
	binary.LittleEndian.PutUint32(packet[4:8], uint32(id))
	binary.LittleEndian.PutUint32(packet[8:12], uint32(packetType))
	copy(packet[12:], body)
	_, err := writer.Write(packet)
	return err
}
