package command

import "testing"

const (
	testBuild41 = "41"
	testBuild42 = "42"
)

var supportedCommandTestBuilds = []string{testBuild41, testBuild42}

func commandTestBuildsInRange(t *testing.T, minVersion, maxVersion string) []string {
	t.Helper()
	if minVersion == "" || maxVersion == "" || minVersion > maxVersion {
		t.Fatalf("invalid test build range %q-%q", minVersion, maxVersion)
	}

	var builds []string
	for _, build := range supportedCommandTestBuilds {
		if build >= minVersion && build <= maxVersion {
			builds = append(builds, build)
		}
	}
	if len(builds) == 0 {
		t.Fatalf("test build range %q-%q contains no supported command test build", minVersion, maxVersion)
	}
	return builds
}
