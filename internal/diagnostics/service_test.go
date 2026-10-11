package diagnostics

import (
	"os"
	"path/filepath"
	"testing"
)

func TestReadFlatpakInfo(t *testing.T) {
	filename := filepath.Join(t.TempDir(), "flatpak-info")
	info, err := readFlatpakInfo(filename)
	if err != nil || info != nil {
		t.Fatalf("native install: got %v, %v", info, err)
	}
	const contents = `[Application]
name=com.bedirhanyenilmez.pzadmin
runtime=runtime/org.gnome.Platform/x86_64/51
[Instance]
flatpak-version=1.18.2
branch=master
app-commit=app-hash
runtime-commit=runtime-hash
app-path=/private/host/path
[Unrelated]
name=wrong-app
branch=wrong-branch
`
	if err := os.WriteFile(filename, []byte(contents), 0o600); err != nil {
		t.Fatal(err)
	}
	info, err = readFlatpakInfo(filename)
	if err != nil {
		t.Fatal(err)
	}
	want := FlatpakInfo{
		AppID: "com.bedirhanyenilmez.pzadmin", Version: "1.18.2", Branch: "master",
		Runtime: "runtime/org.gnome.Platform/x86_64/51", AppCommit: "app-hash", RuntimeCommit: "runtime-hash",
	}
	if info == nil || *info != want {
		t.Fatalf("got %+v, want %+v", info, want)
	}
}

func TestReadFlatpakInfoReadError(t *testing.T) {
	if _, err := readFlatpakInfo(t.TempDir()); err == nil {
		t.Fatal("expected an error when reading a directory")
	}
}
