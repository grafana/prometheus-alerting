# Security

This document describes the supply chain, developer environment, and CI/CD security controls applied in this repository.

---

## Toolchain management — mise

[mise](https://mise.jdx.dev) manages the Node and pnpm runtimes (and dev-only tools such as lefthook and trufflehog), ensuring every developer and CI job uses identical, verified binaries.

### Lockfile and checksum verification

`mise.toml` sets `lockfile = true`, which causes mise to record every tool download in `mise.lock` with a `sha256:` checksum per platform and URL. pnpm entries additionally carry `provenance = "github-attestations"` (SLSA provenance). Example:

```toml
[[tools.pnpm]]
version = "11.4.0"
backend = "aqua:pnpm/pnpm"

[tools.pnpm."platforms.linux-x64"]
checksum = "sha256:f3f8d1217..."
url = "https://github.com/pnpm/pnpm/releases/download/v11.4.0/pnpm-linux-x64.tar.gz"
provenance = "github-attestations"
```

### Paranoid mode

`paranoid = true` in `mise.toml` re-verifies checksums on every tool use, not just on first download. CI steps explicitly disable the action cache (`cache: false`) so binaries are always re-fetched and re-verified rather than restored from a cache that would skip this check.

### Minimum release age

`minimum_release_age = "7d"` prevents installing a tool version released fewer than 7 days ago. This guards against fast-follow supply chain attacks where a malicious release is published immediately after a legitimate one.

### No silent installs

`not_found_auto_install = false` and `yes = false` prevent mise from silently installing unexpected tools or accepting prompts without explicit user interaction.

### Profile separation

`mise.toml` defines shared tools (Node, pnpm) loaded in both CI and local environments. `mise.development.toml` defines dev-only tools (lefthook, trufflehog). `.miserc.toml` activates the `development` profile locally. CI sets `MISE_ENV=ci`, so dev-only tools are never installed there.

### Renovate automation

The `mise` manager in Renovate is configured with `rangeStrategy: 'pin'`, keeping Node and pnpm at exact versions.

---

## Dependency management — pnpm

### Lockfile integrity

`pnpm-lock.yaml` (lockfile v9) records an `integrity: sha512-...` field for every resolved package. CI enforces `--frozen-lockfile` so installs never silently update the lock.

### Binary verification via `packageManager`

`package.json` includes a `sha512` hash in the `packageManager` field:

```json
"packageManager": "pnpm@11.4.0+sha512.f0febc7e..."
```

corepack uses this hash to verify the exact pnpm binary before it runs, preventing a compromised or wrong-version pnpm from being used silently.

### Build script allow-list

`pnpm-workspace.yaml` sets `strictDepBuilds: true` and `dangerouslyAllowAllBuilds: false`. Post-install scripts are opt-in only via an explicit `allowBuilds` list — any package not on the list cannot run install-time scripts. This prevents malicious packages from executing arbitrary code during `pnpm install`.

### Exotic sub-dependency blocking

`blockExoticSubdeps: true` prevents git://, github:, and file: style dependency specifiers from being resolved. These specifiers bypass the registry and its integrity checks, making them a common supply chain attack vector.

### Dependency verification before script execution

`verifyDepsBeforeRun: install` causes pnpm to re-verify dependency integrity before running any script, catching tampering that might have occurred after installation.

### Minimum release age

`minimumReleaseAge: 10080` (7 days, in minutes) in `pnpm-workspace.yaml` mirrors the mise and Renovate policy. Scoped packages from trusted internal sources can be exempted from this gate.

### Transitive dependency overrides

`pnpm-workspace.yaml` contains an `overrides` block that pins specific transitive dependencies to minimum safe versions. These overrides address known vulnerabilities in packages that indirect dependencies bring in at insecure versions. Renovate keeps these overrides up to date.

### Preinstall guard

`scripts/check-mise.js` runs as a `preinstall` hook and warns if Node is not being invoked from a mise-managed path, reducing the risk of using an unverified system Node. The check is bypassed in CI where the environment is already controlled.

---

## Automated dependency updates — Renovate

Renovate configuration lives in `.github/renovate.json5` and extends Grafana's shared org-wide base preset.

### Minimum release age

`minimumReleaseAge: '7 days'` — Renovate will not open a PR for a package version younger than 7 days. This matches the pnpm and mise policies and provides consistent protection across the stack.

### Strict internal checks

`internalChecksFilter: 'strict'` applies more rigorous confidence checks before Renovate opens PRs, reducing noise from packages that are not yet stable.

### Exact version pinning

- **mise manager**: `rangeStrategy: 'pin'` — Node and pnpm are always pinned to exact versions, never ranges.
- **Docker Compose**: `rangeStrategy: 'pin'` plus `pinDigests: true` — container images are pinned by both tag and SHA256 digest.

### Vulnerability alerts

`vulnerabilityAlerts.minimumReleaseAge: null` — security fixes bypass the 7-day gate entirely and receive their own PRs labelled `security` so they can be fast-tracked for review and merge.

### No automerge

No automerge is configured. All dependency update PRs require a human review.

---

## Git hooks — lefthook

[Lefthook](https://github.com/evilmartians/lefthook) is installed as a dev tool via mise (aqua backend, exact version) and registered via the `prepare` script so hooks are active for every contributor after `pnpm install`.

### pre-commit (piped — stops on first failure)

1. **check-mise** — warns if the Node runtime is not managed by mise.
2. **lint-ts** — ESLint with auto-fix on staged TypeScript files.
3. **prettier** — auto-formats staged files.

### pre-push

1. **`pnpm audit --audit-level=high`** — blocks the push if any high-severity CVEs exist in the resolved dependency tree.
2. **TruffleHog secret scan** — see the next section.

---

## Secret scanning — TruffleHog

Secret scanning runs at two points so that the local hook catches secrets before they leave the developer's machine, and the CI workflow acts as a backstop if the hook was bypassed.

### Pre-push hook (local)

```
trufflehog git file://. --since-commit ${LEFTHOOK_REMOTE_REF:-origin/main} --only-verified --fail --log-level=-1 --no-update
```

- Scans all commits that are local but not yet on the remote — lefthook provides the remote ref via `LEFTHOOK_REMOTE_REF`, with `origin/main` as a fallback.
- `--only-verified`: only confirmed live credentials block the push; unverified pattern matches are informational.
- `--fail`: exits non-zero on any finding, blocking the push.
- `--no-update`: prevents trufflehog from self-updating at runtime, ensuring the pinned version is always used.
- Version is pinned via mise (aqua backend) in `mise.development.toml`.

### CI workflow (`.github/workflows/trufflehog.yml`)

- Triggers on every PR and every push to `main`.
- Uses Grafana's org-wide reusable workflow (`grafana/security-github-actions`).
- `fail-on-verified: 'true'` — PRs with verified secrets cannot be merged.
- Permissions are minimal: `contents: read`, `pull-requests: write`, `checks: write`.

---

## Version pinning and hashes

The table below summarises where and how versions and checksums are pinned across the repository.

| Artifact                                    | Location                              | Pinning mechanism                                             |
| ------------------------------------------- | ------------------------------------- | ------------------------------------------------------------- |
| Node runtime                                | `mise.lock`                           | `sha256:` checksum per platform and URL                       |
| pnpm runtime                                | `mise.lock`                           | `sha256:` per platform + `provenance = "github-attestations"` |
| pnpm binary (corepack)                      | `package.json` `packageManager` field | `sha512:` hash                                                |
| All npm packages                            | `pnpm-lock.yaml`                      | `integrity: sha512-...` per package                           |
| GitHub Actions (third-party)                | `.github/workflows/*.yml`             | Full commit SHA (`@abc1234...`)                               |
| `grafana/plugin-validator-cli` Docker image | `ci.yml`                              | `@sha256:...` digest                                          |
| Docker Compose images                       | `docker-compose.yaml`                 | Tag + SHA256 digest via Renovate `pinDigests: true`           |
| lefthook, trufflehog                        | `mise.development.toml`               | Exact version via aqua backend                                |

### Intentionally unpinned Grafana-org actions

Several actions from `grafana/plugin-actions` and `grafana/security-github-actions` are pinned to `@main` rather than a commit SHA. These are all owned and maintained by Grafana's infrastructure team; versioning is managed externally to this repository. Each reference carries a `# zizmor: ignore[unpinned-uses]` comment to suppress static analysis warnings and make the intentional exception explicit.

---

## CI/CD security posture

### Least-privilege permissions

Build jobs use `permissions: contents: read`. `id-token: write` is granted only to jobs that need OIDC (e.g. uploading Playwright reports). The release workflow defaults to `read-all` and adds targeted write permissions per job.

### No credential leakage

`persist-credentials: false` is set on every `actions/checkout` call, preventing the GitHub Actions token from being forwarded to subprocesses or scripts.

### Build attestations

The release workflow passes `attestation: true` to `grafana/plugin-actions/build-plugin`, generating SLSA-style GitHub artifact attestations that allow consumers to verify the provenance of published plugin archives.

### Plugin validation

Plugin artifacts are validated before publishing using `grafana/plugin-validator-cli`, referenced by SHA256 image digest in `ci.yml`.

### Plugin signing

The `sign` script in `package.json` is pinned to an exact version of `@grafana/sign-plugin` with an explicit comment discouraging changing it to `@latest`. Renovate manages the version bump when updates are needed.

---

## Secrets and environment variables

- `.env` and `.env.*` files are git-ignored. `.env.example` is explicitly allowed if a template is needed.
- `mise.local.toml` is git-ignored (per-developer tool overrides that should not affect other environments).
- Playwright authentication state (`/playwright/.auth/`) is git-ignored to prevent session tokens from being committed.
- The only repository secret used in CI is `GRAFANA_ACCESS_POLICY_TOKEN` for plugin signing. This step is conditional and is skipped entirely when the secret is not set.

---

## Reporting a vulnerability

To report a security vulnerability in this plugin, please use [GitHub's private security advisory feature](https://github.com/grafana/prometheus-alerting/security/advisories/new) or follow [Grafana's coordinated disclosure process](https://grafana.com/security/).

Do not report security vulnerabilities through public GitHub issues.
