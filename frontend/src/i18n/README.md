# Translations

`en-US` defines all valid namespaces and keys. Other locales may omit translations
and fall back to English, but must not add unknown keys or change interpolation
variables. Static calls are type-checked against English; keep dynamic keys bounded
by typed unions or domain values.

## Conventions

- Organize namespaces by feature or domain. Share keys in `common` only when their
  meaning and intended changes are shared—not merely their English wording.
- Use stable, semantic lowerCamelCase paths: `browser.search.label`,
  `errors.load.title`, `browser.actions.addItem`. Nest roles instead of using
  suffixes like `searchLabel`; `.label` names a control or region.
- Preserve game/catalog identifiers exactly; they are exempt from key naming rules.
- Preserve proper names, acronyms, technical identifiers, and imported game names.
  Review casing in context rather than enforcing it automatically.
- Translate complete messages, not concatenated fragments. Preserve named
  placeholders such as `{{name}}` and `{{count}}`.
- Use plural suffixes (`_one`, `_other`) with `count`, and context suffixes
  (`_minimum`, `_maximum`) with `context`.
- Keep accessibility text beside its feature/control. Prefer visible or native
  labels; otherwise provide a meaningful standalone accessible name.

## Commands

Run from `frontend/`:

- `pnpm format:translations` — format and sort resource files.
- `pnpm check:translations` — validate resources.
- `pnpm check` — run all checks, including formatting and TypeScript key checks.
