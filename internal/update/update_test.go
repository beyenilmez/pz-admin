package update

import (
	"context"
	"crypto/ed25519"
	"crypto/sha512"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"testing"

	"github.com/wailsapp/wails/v3/pkg/updater"
)

type stubProvider struct {
	updater.Provider
	release *updater.Release
	err     error
}

func (p stubProvider) Check(context.Context, updater.CheckRequest) (*updater.Release, error) {
	return p.release, p.err
}

func TestVerifiedProvider(t *testing.T) {
	for _, tc := range []struct {
		name         string
		verification *updater.Verification
		valid        bool
	}{
		{"missing", nil, false},
		{"empty", &updater.Verification{}, false},
		{"short", &updater.Verification{DigestAlgo: "sha512", Digest: []byte{1}}, false},
		{"wrong algorithm", &updater.Verification{DigestAlgo: "sha256", Digest: make([]byte, sha512.Size)}, false},
		{"unsigned", &updater.Verification{DigestAlgo: "sha512", Digest: make([]byte, sha512.Size)}, false},
		{"short signature", &updater.Verification{
			DigestAlgo: "sha512", Digest: make([]byte, sha512.Size),
			SignatureAlgo: "ed25519ph", Signature: []byte{1},
		}, false},
		{"wrong signature algorithm", &updater.Verification{
			DigestAlgo: "sha512", Digest: make([]byte, sha512.Size),
			SignatureAlgo: "ed25519", Signature: make([]byte, ed25519.SignatureSize),
		}, false},
		{"valid metadata", &updater.Verification{
			DigestAlgo: "sha512", Digest: make([]byte, sha512.Size),
			SignatureAlgo: "ed25519ph", Signature: make([]byte, ed25519.SignatureSize),
		}, true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			p := verifiedProvider{stubProvider{release: &updater.Release{Verification: tc.verification}}}
			release, err := p.Check(context.Background(), updater.CheckRequest{})
			if (err == nil && release != nil) != tc.valid {
				t.Fatalf("Check returned %v, %v", release, err)
			}
		})
	}
	p := verifiedProvider{stubProvider{}}
	if release, err := p.Check(context.Background(), updater.CheckRequest{}); release != nil || err != nil {
		t.Fatal("no update should not require a checksum")
	}
	want := errors.New("network error")
	p = verifiedProvider{stubProvider{err: want}}
	if _, err := p.Check(context.Background(), updater.CheckRequest{}); !errors.Is(err, want) {
		t.Fatal("provider errors must be preserved")
	}
}

func TestPublicKey(t *testing.T) {
	block, _ := pem.Decode(publicKey)
	if block == nil || block.Type != "PUBLIC KEY" {
		t.Fatal("embedded key must be a PEM public key")
	}
	key, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		t.Fatal(err)
	}
	if _, ok := key.(ed25519.PublicKey); !ok {
		t.Fatal("embedded key must be Ed25519")
	}
}
