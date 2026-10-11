# Releases

- **Setup:** Add `RELEASE_PLEASE_TOKEN` as a repository Actions secret: a fine-grained
  PAT restricted to this repository with **Contents**, **Issues**, and **Pull requests**
  read/write access. Renew before expiry. It enables automatic release-PR checks.
- **Update signing:** Add the PEM private key as the `UPDATER_PRIVATE_KEY` Actions
  secret. Its public key is embedded from `internal/update/updater.pub`.
  Keep a secure backup of the private key; never commit it or replace the pair
  casually, since installed versions trust the existing public key.
- **Release:** Release Please prepares a PR from Conventional Commits on `main`,
  starting at **2.0.0**. The **Release PR** workflow refreshes screenshots and README download links,
  then builds six native and two Flatpak targets without publishing. Packaging runs after any
  generated changes are committed, with checks reported on the latest PR commit.
  Review the version, changelog, and screenshots, then squash merge to approve publication.
  A tag and draft release are created; all targets must build and
  upload again from the tag before automatic publication. On failure, rerun failed jobs.
- **Versions:** Release Please updates `VERSION` and desktop metadata via
  `release-please-config.json`. Preserve `x-release-please-version` markers when
  regenerating Wails assets.
- **AppStream:** Linux packaging takes release versions, dates, and notes from `CHANGELOG.md`.
  Language coverage is calculated from the app's translations, omitting languages at 0%.
  Screenshot metadata comes from `assets/screenshots/manifest.json`, with image URLs
  using the source repository and pinned to the commit for test builds or tag for releases.
  Refresh images with `wails3 task screenshots`.
- **Updates:** Wails generates and verifies `manifest.json` for the Windows/macOS
  `*-update.exe` / `*-update.zip` assets, including release notes and SHA-512 checksums.
  Windows/macOS check once at startup (enabled by default in Settings) and show
  Wails' update window when an update is available. Development builds and Linux
  do not check automatically.
  Artifacts are signed with Ed25519ph; the app rejects unsigned updates.
- **Flatpak:** The **Flatpak** workflow builds x86_64 and ARM64 bundles and runs
  Flathub checks before publication. See [Flatpak](../build/linux/flatpak/README.md).
- **Cloudsmith:** After GitHub publication, the **Cloudsmith** workflow publishes
  x64 and ARM64 DEB and RPM packages to `beyenilmez/pz-admin`.
  To retry or backfill, run
  **Cloudsmith** from `main` with a published stable release tag. Existing packages
  are replaced; a failure leaves the GitHub release published.
- **Cloudsmith authentication:** Use OIDC with the `github-releases` service account,
  granting Write access to `pz-admin`. Configure the GitHub provider with claims
  `repository=beyenilmez/pz-admin`, `ref=refs/heads/main`, and
  `aud=https://github.com/beyenilmez`.
  See [OIDC setup](https://docs.cloudsmith.com/authentication/setup-cloudsmith-to-authenticate-with-oidc-in-github-actions).
- **Linux signing:** Cloudsmith signs APT metadata and RPM packages with the
  repository's configured GPG key. Back up the key and retain it across releases
  and account moves. This is separate from the updater key.
- **Manual builds:** Run **Package** or **Flatpak** to build without releasing.
- **AUR:** The **AUR** workflow prepares `pz-admin-bin` from the x64 and ARM64 Arch assets.
- **Storage:** Actions package artifacts expire after 1 day; rerun package jobs
  to regenerate them.
