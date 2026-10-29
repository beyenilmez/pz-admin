# Metadata generation

Run `wails3 task generate:metadata GOOS=<target>` to generate platform metadata in
`.generated/<target>/`.

`locales.json` must cover every registered language. Upstream references:

- [Desktop entry POSIX names](https://specifications.freedesktop.org/desktop-entry/latest/localized-keys.html).
- [Apple language IDs](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPInternational/LanguageandLocaleIDs/LanguageandLocaleIDs.html).
- [Android resource qualifiers](https://developer.android.com/guide/topics/resources/providing-resources#AlternativeResources).
- [Windows LANGIDs](https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-lcid/a9eac961-e77d-41a6-90a5-ce1a8b0cdb9c).
- [NSIS language files](https://github.com/NSIS-Dev/nsis/tree/master/Contrib/Language%20files).
