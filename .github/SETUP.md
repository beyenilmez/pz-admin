# Automation setup

Add these repository secrets under **Settings → Secrets and variables → Actions**.

| Secret                 | Value                                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `RELEASE_PLEASE_TOKEN` | Fine-grained PAT for this repository with **Contents**, **Issues**, and **Pull requests** read/write access.                                     |
| `RENOVATE_TOKEN`       | Fine-grained PAT for this repository with **Contents**, **Issues**, **Pull requests**, **Commit statuses**, and **Workflows** read/write access. |
| `UPDATER_PRIVATE_KEY`  | PEM private key matching `internal/update/updater.pub`.                                                                                          |

Renew PATs before expiry and back up the updater signing key. GitHub supplies `GITHUB_TOKEN`
automatically. No Cloudsmith API key secret is required.
Use the Renovate workflow without also enabling the hosted Renovate app.

## Cloudsmith

- **Repository:** Create public repository `pz-admin` in workspace `beyenilmez`.
- **Service account:** Create `github-releases` and grant it **Write** access to
  `pz-admin`. Use its actual slug in `oidc-service-slug` in [cloudsmith.yml](workflows/cloudsmith.yml).
- **OIDC provider:** In workspace **OIDC Provider Settings**, create a provider
  named `github-actions`, with URL `https://token.actions.githubusercontent.com`.
  Select the `github-releases` service account and set these required token claims:

  ```json
  {
    "repository": "beyenilmez/pz-admin",
    "ref": "refs/heads/main",
    "aud": "https://github.com/beyenilmez"
  }
  ```

- **Signing:** Configure your GPG key in Cloudsmith's **Custom GPG signing key** setting.

See [Cloudsmith's OIDC setup](https://docs.cloudsmith.com/authentication/setup-cloudsmith-to-authenticate-with-oidc-in-github-actions)
for provider configuration, [Releases](RELEASES.md) for publishing details.

## AUR

- **Account:** Create an [AUR account](https://aur.archlinux.org/register) and add
  a dedicated SSH public key to its profile. Add the unencrypted private key as
  the repository Actions secret `AUR_SSH_PRIVATE_KEY`.
