package command

import "testing"

func TestBuild(t *testing.T) {
	tests := []struct {
		name       string
		definition Definition
		args       map[string]string
		want       string
		wantError  bool
	}{
		{
			name:       "command without parameters",
			definition: Definition{Name: "save"},
			want:       "save",
		},
		{
			name: "required and optional strings",
			definition: Definition{Name: "kick", Params: []Param{
				{Name: "username", Type: TypeString, Required: true},
				{Name: "reason", Type: TypeString, Prefix: "-r "},
			}},
			args: map[string]string{"username": "rj", "reason": "griefing"},
			want: `kick "rj" -r "griefing"`,
		},
		{
			name: "omitted optional string",
			definition: Definition{Name: "kick", Params: []Param{
				{Name: "username", Type: TypeString, Required: true},
				{Name: "reason", Type: TypeString, Prefix: "-r "},
			}},
			args: map[string]string{"username": "rj"},
			want: `kick "rj"`,
		},
		{
			name: "explicitly empty allowed string",
			definition: Definition{Name: "changeoption", Params: []Param{
				{Name: "option", Type: TypeString, Required: true},
				{Name: "value", Type: TypeString, Required: true, AllowEmpty: true},
			}},
			args: map[string]string{"option": "PublicDescription", "value": ""},
			want: `changeoption "PublicDescription" ""`,
		},
		{
			name: "integer",
			definition: Definition{Name: "additem", Params: []Param{
				{Name: "username", Type: TypeString, Required: true},
				{Name: "count", Type: TypeInt},
			}},
			args: map[string]string{"username": "rj", "count": "5"},
			want: `additem "rj" 5`,
		},
		{
			name: "choice",
			definition: Definition{Name: "godmode", Params: []Param{
				{Name: "username", Type: TypeString, Required: true},
				{Name: "state", Type: TypeChoice, Prefix: "-", Required: true},
			}},
			args: map[string]string{"username": "rj", "state": "true"},
			want: `godmode "rj" -true`,
		},
		{
			name: "enabled flag",
			definition: Definition{Name: "banuser", Params: []Param{
				{Name: "username", Type: TypeString, Required: true},
				{Name: "banip", Type: TypeFlag, Prefix: "-ip"},
			}},
			args: map[string]string{"username": "rj", "banip": "true"},
			want: `banuser "rj" -ip`,
		},
		{
			name: "disabled flag",
			definition: Definition{Name: "banuser", Params: []Param{
				{Name: "username", Type: TypeString, Required: true},
				{Name: "banip", Type: TypeFlag, Prefix: "-ip"},
			}},
			args: map[string]string{"username": "rj", "banip": "false"},
			want: `banuser "rj"`,
		},
		{
			name: "numeric true flag",
			definition: Definition{Name: "banuser", Params: []Param{
				{Name: "username", Type: TypeString, Required: true},
				{Name: "banip", Type: TypeFlag, Prefix: "-ip"},
			}},
			args: map[string]string{"username": "rj", "banip": "1"},
			want: `banuser "rj" -ip`,
		},
		{
			name: "missing required parameter",
			definition: Definition{Name: "kick", Params: []Param{
				{Name: "username", Type: TypeString, Required: true},
			}},
			wantError: true,
		},
		{
			name: "invalid integer",
			definition: Definition{Name: "createhorde", Params: []Param{
				{Name: "count", Type: TypeInt, Required: true},
			}},
			args:      map[string]string{"count": "many"},
			wantError: true,
		},
		{
			name: "invalid flag",
			definition: Definition{Name: "banuser", Params: []Param{
				{Name: "banip", Type: TypeFlag, Prefix: "-ip"},
			}},
			args:      map[string]string{"banip": "yes"},
			wantError: true,
		},
		{
			name: "quote in string",
			definition: Definition{Name: "servermsg", Params: []Param{
				{Name: "message", Type: TypeString, Required: true},
			}},
			args:      map[string]string{"message": `say "hi"`},
			wantError: true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got, err := Build(test.definition, test.args)
			if test.wantError {
				if err == nil {
					t.Fatalf("Build() = %q, want error", got)
				}
				return
			}
			if err != nil {
				t.Fatalf("Build() error = %v", err)
			}
			if got != test.want {
				t.Errorf("Build() = %q, want %q", got, test.want)
			}
		})
	}
}
