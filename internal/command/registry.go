package command

import (
	"context"
	"fmt"

	"github.com/beyenilmez/pz-admin/internal/connection"
	"github.com/beyenilmez/pz-admin/internal/feature"
)

// Registry is a version-aware collection of command definitions. Its zero
// value is ready to use.
type Registry struct {
	defs []Definition
}

// Default is the global command registry. Register adds commands to Default;
// callers that require isolation can create a separate Registry.
var Default = &Registry{}

// Register adds a definition to Default.
func Register(d Definition) {
	Default.Register(d)
}

// Lookup returns the first definition in Default matching the name and version.
func Lookup(name, version string) (Definition, bool) {
	return Default.Lookup(name, version)
}

// Features returns the application features provided by commands available in
// the specified version.
func Features(version string) feature.Set {
	return Default.Features(version)
}

// Execute looks up, builds, sends, and parses a command through Default for the
// specified game version.
func Execute(ctx context.Context, exec connection.CommandExecutor, name, version string, args map[string]string) (any, error) {
	return Default.Execute(ctx, exec, name, version, args)
}

// Register adds a command definition.
func (r *Registry) Register(d Definition) {
	if d.MinVersion == "" || d.MaxVersion == "" {
		panic(fmt.Sprintf("command: %q requires minimum and maximum versions", d.Name))
	}
	if d.MinVersion > d.MaxVersion {
		panic(fmt.Sprintf("command: %q has an invalid version range %s-%s", d.Name, d.MinVersion, d.MaxVersion))
	}
	r.defs = append(r.defs, d)
}

// Lookup returns the first definition matching the name and version. The
// boolean is false when no definition matches.
func (r *Registry) Lookup(name, version string) (Definition, bool) {
	for _, d := range r.defs {
		if d.Name == name && d.matchesVersion(version) {
			return d, true
		}
	}
	return Definition{}, false
}

// Features returns the unique application features provided by definitions
// available in the specified version.
func (r *Registry) Features(version string) feature.Set {
	features := feature.NewSet()
	for _, d := range r.defs {
		if d.Feature != "" && d.matchesVersion(version) {
			features.Add(d.Feature)
		}
	}
	return features
}

// Execute looks up the command, builds its RCON string, sends it, and parses the
// response. A definition without a parser returns the raw response.
func (r *Registry) Execute(ctx context.Context, exec connection.CommandExecutor, name, version string, args map[string]string) (any, error) {
	if exec == nil {
		return nil, fmt.Errorf("command: Execute: executor is nil")
	}
	d, ok := r.Lookup(name, version)
	if !ok {
		return nil, fmt.Errorf("%w: %q for version %q", ErrUnknownCommand, name, version)
	}
	cmd, err := Build(d, args)
	if err != nil {
		return nil, err
	}
	raw, err := exec.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, err
	}
	if d.Parse != nil {
		return d.Parse(raw, args)
	}
	return raw, nil
}
