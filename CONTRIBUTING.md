# Contributing

Thanks for your interest in Prometheus Alerting! This document explains how we like to work, so your time and ours is well spent.

## Before you write code

**Bug fixes are always welcome.** If something is broken, open a PR — no need to ask first. A short issue describing the bug is appreciated but not required, as long as the PR itself explains what was wrong and how to reproduce it.

**For new features or larger changes, talk to us first.** Open an issue, or a draft PR with a rough sketch of the approach, before investing significant effort. This plugin has opinions about scope, RBAC, and how it maps onto the upstream Prometheus/Alertmanager model, and we would rather discuss those early than ask you to rewrite (or turn down) a finished PR. A draft PR is a perfectly good discussion format — you don't need a polished implementation to start the conversation.

Roughly:

| Change                                         | What to do                                                      |
| ---------------------------------------------- | --------------------------------------------------------------- |
| Bug fix, typo, small refactor, test coverage   | Open a PR directly                                              |
| New feature, new page, new dependency          | Open an issue or draft PR first                                 |
| Refactor touching many files or core data flow | Open an issue or draft PR first                                 |
| Security vulnerability                         | See [SECURITY.md](SECURITY.md) — **do not** open a public issue |

## Development setup

See the [README](README.md) for prerequisites, installing dependencies, running the plugin against a local Grafana, and running the test suites. We use [mise](https://mise.jdx.dev) to pin the Node.js and pnpm versions used in CI; `pnpm install` will refuse to run if your toolchain doesn't match.

Before pushing, make sure these pass:

```bash
pnpm typecheck
pnpm lint
pnpm test:ci
pnpm e2e        # requires `pnpm run server` in another terminal
```

Git hooks are installed automatically by [lefthook](https://lefthook.dev) on `pnpm install`. They run ESLint and Prettier on staged files before each commit, and `pnpm audit` plus a [TruffleHog](https://github.com/trufflesecurity/trufflehog) secret scan before each push. Please don't bypass them with `--no-verify`.

## Commit signing

**All commits must be signed.** Unsigned commits show up as "Unverified" on GitHub and cannot be merged. SSH, GPG, and S/MIME signing all work — see [GitHub's docs on commit signature verification](https://docs.github.com/en/authentication/managing-commit-signature-verification) to set it up.

## Commit messages and PR titles

We follow [Conventional Commits](https://www.conventionalcommits.org/) — see that spec for the format. Scope is optional but encouraged: use the area of the plugin you touched (`rules`, `routes`, `receivers`, `silences`, …).

PRs are squash-merged, so **the PR title becomes the commit message on `main`** — that's the string that matters, and CI validates its format on every PR. Releases and the [changelog](CHANGELOG.md) are generated from those messages by [release-please](https://github.com/googleapis/release-please), so please don't bump the version in `package.json` or edit `CHANGELOG.md` by hand.

## Pull requests

- **Keep them focused.** One logical change per PR. Unrelated cleanups belong in their own PR — they make review slower and bisects harder.
- **Explain the why.** What problem does this solve, what alternatives did you consider, and how did you verify it? Screenshots or a short clip are very welcome for UI changes.
- **Add tests.** Bug fixes should come with a regression test. New features need unit tests, and E2E coverage if they add or change a user-facing flow.
- **Respect RBAC.** Every page in this plugin gates access through Grafana RBAC. If you add a view or an action, wire up the corresponding permission checks and cover them in tests.
- **Translate user-facing strings.** Use `t()` from `@grafana/i18n` and the `<Trans />` component for anything a user reads, then run `pnpm i18n-extract`.
- **Don't commit secrets.** Tokens, credentials, and real data source URLs stay out of the repo. The pre-push hook scans for these, but the first line of defence is you.
- **Draft PRs are fine.** Open one early if you want feedback on direction before polishing.

Review is handled by [@grafana/alerting-frontend](https://github.com/orgs/grafana/teams/alerting-frontend).

## Code of conduct

This project follows the [Grafana Labs Code of Conduct](https://github.com/grafana/grafana/blob/main/CODE_OF_CONDUCT.md). Be decent to each other.

## Licence

This project is licensed under Apache 2.0. By contributing, you agree that your contributions are licensed under the same terms — see [LICENSE](LICENSE).
