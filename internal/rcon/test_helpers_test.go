package rcon

import (
	"encoding/binary"
	"errors"
	"io"
	"net"
	"sync"
	"testing"
)

const (
	testPacketResponse = 0
	testPacketCommand  = 2
	testPacketAuth     = 3
)

type testReply struct {
	body       string
	closeWrite bool
	respond    bool
}

type testServer struct {
	listener net.Listener
	handler  func(string) testReply

	mu    sync.Mutex
	conns map[net.Conn]struct{}
}

func newTestServer(t *testing.T, handlers ...func(string) testReply) *testServer {
	t.Helper()
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	server := &testServer{listener: listener, conns: make(map[net.Conn]struct{})}
	if len(handlers) > 0 {
		server.handler = handlers[0]
	}
	go server.serve()
	t.Cleanup(server.Close)
	return server
}

func (s *testServer) Addr() string {
	return s.listener.Addr().String()
}

func (s *testServer) Close() {
	_ = s.listener.Close()
	s.mu.Lock()
	for conn := range s.conns {
		_ = conn.Close()
	}
	s.mu.Unlock()
}

func (s *testServer) serve() {
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

func (s *testServer) serveConn(conn net.Conn) {
	defer func() {
		_ = conn.Close()
		s.mu.Lock()
		delete(s.conns, conn)
		s.mu.Unlock()
	}()

	authenticated := false
	for {
		packet, err := readTestPacket(conn)
		if err != nil {
			return
		}
		switch packet.packetType {
		case testPacketAuth:
			_ = writeTestPacket(conn, testPacketResponse, packet.id, "")
			authenticated = packet.body == testPassword
			authID := packet.id
			if !authenticated {
				authID = -1
			}
			_ = writeTestPacket(conn, testPacketCommand, authID, "")
			if !authenticated {
				return
			}
		case testPacketCommand:
			if !authenticated {
				return
			}
			reply := testReply{respond: true}
			if s.handler != nil {
				reply = s.handler(packet.body)
			}
			if reply.closeWrite {
				if tcpConn, ok := conn.(*net.TCPConn); ok {
					_ = tcpConn.CloseWrite()
				}
				return
			}
			if reply.respond {
				_ = writeTestPacket(conn, testPacketResponse, packet.id, reply.body)
			}
		}
	}
}

type testPacket struct {
	id         int32
	packetType int32
	body       string
}

func readTestPacket(reader io.Reader) (testPacket, error) {
	var size int32
	if err := binary.Read(reader, binary.LittleEndian, &size); err != nil {
		return testPacket{}, err
	}
	if size < 10 {
		return testPacket{}, errors.New("invalid test packet size")
	}
	payload := make([]byte, size)
	if _, err := io.ReadFull(reader, payload); err != nil {
		return testPacket{}, err
	}
	return testPacket{
		id:         int32(binary.LittleEndian.Uint32(payload[0:4])),
		packetType: int32(binary.LittleEndian.Uint32(payload[4:8])),
		body:       string(payload[8 : len(payload)-2]),
	}, nil
}

func writeTestPacket(writer io.Writer, packetType, id int32, body string) error {
	size := int32(len(body) + 10)
	packet := make([]byte, size+4)
	binary.LittleEndian.PutUint32(packet[0:4], uint32(size))
	binary.LittleEndian.PutUint32(packet[4:8], uint32(id))
	binary.LittleEndian.PutUint32(packet[8:12], uint32(packetType))
	copy(packet[12:], body)
	_, err := writer.Write(packet)
	return err
}
