package notices

import (
	"reflect"
	"testing"
)

func TestReportPreservesNotices(t *testing.T) {
	const applicationLicense = "Application license\n"
	const input = `[{"name":"Component","identifier":"MIT","version":"1.0","source":"https://example.com","note":"Original attribution","text":"License text\n"}]`
	service := NewService(applicationLicense, input)
	got, err := service.Report()
	if err != nil {
		t.Fatal(err)
	}
	want := Report{ApplicationLicense: applicationLicense, Entries: []Entry{{
		Name: "Component", Identifier: "MIT", Version: "1.0", Source: "https://example.com",
		Note: "Original attribution", Text: "License text\n",
	}}}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("Report() = %#v, want %#v", got, want)
	}
	got.Entries[0].Text = "changed"
	next, err := service.Report()
	if err != nil || !reflect.DeepEqual(next, want) {
		t.Fatalf("Report() was changed by its caller: %#v, %v", next, err)
	}
}

func TestReportWithoutCollectedNotices(t *testing.T) {
	for _, input := range []string{"", " \n\t", "[]", "null"} {
		t.Run(input, func(t *testing.T) {
			report, err := NewService("Application license", input).Report()
			if err != nil {
				t.Fatal(err)
			}
			if report.ApplicationLicense != "Application license" || report.Entries == nil || len(report.Entries) != 0 {
				t.Fatalf("unexpected report: %#v", report)
			}
		})
	}
}

func TestReportRejectsMalformedNotices(t *testing.T) {
	for _, input := range []string{"[", "{}", `[{"text":42}]`} {
		t.Run(input, func(t *testing.T) {
			if _, err := NewService("Application license", input).Report(); err == nil {
				t.Fatal("expected an error")
			}
		})
	}
}
