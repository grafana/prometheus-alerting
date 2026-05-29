# Grafana app plugin template

This template is a starting point for building an app plugin for Grafana.

## What are Grafana app plugins?

App plugins can let you create a custom out-of-the-box monitoring experience by custom pages, nested data sources and panel plugins.

## Requirements

### Recommended: Use mise (optional)

This project recommends using [mise](https://mise.jdx.dev) to automatically manage the Node.js and pnpm versions declared in `mise.toml`. This ensures you're using the exact versions tested in CI.

Install mise once on your machine:

```bash
# macOS
brew install mise

# or via the installer script
curl https://mise.run | sh
```

Then, from the repo root, trust the config and install the pinned tool versions:

```bash
mise trust
mise install
```

See the [mise installation docs](https://mise.jdx.dev/installing-mise.html) for other platforms and shell activation options.

### Alternative: Manual installation

If you prefer not to use mise, you can manually install the required versions:

- **Node.js**: `>=24.16` (see `engines` in `package.json`)
- **pnpm**: `>=11.4` (installed via `corepack enable` or standalone)

Check your versions match the requirements:

```bash
node --version  # should be >= 24.16
pnpm --version  # should be >= 11.4
```

## Get started

### Frontend

1. Install dependencies

   ```bash
   # If using mise (recommended):
   mise trust && mise install  # installs pinned Node.js and pnpm

   # Install project dependencies:
   pnpm install
   ```

2. Build plugin in development mode and run in watch mode

   ```bash
   pnpm run dev
   ```

3. Build plugin in production mode

   ```bash
   pnpm run build
   ```

4. Run the tests (using Jest)

   ```bash
   # Runs the tests and watches for changes, requires git init first
   pnpm run test

   # Exits after running all the tests
   pnpm run test:ci
   ```

5. Spin up a Grafana instance and run the plugin inside it (using Docker)

   ```bash
   pnpm run server
   ```

6. Run the E2E tests (using Playwright)

   ```bash
   # Spins up a Grafana instance first that we tests against
   pnpm run server

   # If you wish to start a certain Grafana version. If not specified will use latest by default
   GRAFANA_VERSION=11.3.0 pnpm run server

   # Starts the tests
   pnpm run e2e
   ```

7. Run the linter

   ```bash
   pnpm run lint

   # or

   pnpm run lint:fix
   ```

## Installing the plugin in a local Grafana instance

To install and test the plugin in a local Grafana instance (outside of Docker):

1. Clone the repository and follow the build instructions above:

   ```bash
   git clone https://github.com/grafana/prometheus-alerting
   cd prometheus-alerting

   # If using mise (recommended):
   mise trust && mise install

   # Install dependencies and start development:
   pnpm install
   pnpm run dev
   ```

2. Configure Grafana to load plugins from your local directory. In your Grafana configuration file (e.g., `custom.ini` or `grafana.ini`), add:

   ```ini
   [paths]
   plugins = /Users/your-username/grafana-plugins
   ```

3. Create a symlink from your Grafana plugins directory to the cloned repository:

   ```bash
   ln -s /path/to/prometheus-alerting /path/to/grafana-plugins/grafana-prometheusalerting-app
   ```

4. Restart the Grafana backend

5. Enable the plugin in the Grafana UI:
   - Navigate to **Administration > Plugins > Prometheus Alerting**
   - Click **Enable**
   - Access the plugin via **More apps > Prometheus Alerting**

**Note:** You must have at least one external Alertmanager configured as a data source to use this plugin.

# Distributing your plugin

When distributing a Grafana plugin either within the community or privately the plugin must be signed so the Grafana application can verify its authenticity. This can be done with the `@grafana/sign-plugin` package.

_Note: It's not necessary to sign a plugin during development. The docker development environment that is scaffolded with `@grafana/create-plugin` caters for running the plugin without a signature._

## Initial steps

Before signing a plugin please read the Grafana [plugin publishing and signing criteria](https://grafana.com/legal/plugins/#plugin-publishing-and-signing-criteria) documentation carefully.

`@grafana/create-plugin` has added the necessary commands and workflows to make signing and distributing a plugin via the grafana plugins catalog as straightforward as possible.

Before signing a plugin for the first time please consult the Grafana [plugin signature levels](https://grafana.com/legal/plugins/#what-are-the-different-classifications-of-plugins) documentation to understand the differences between the types of signature level.

1. Create a [Grafana Cloud account](https://grafana.com/signup).
2. Make sure that the first part of the plugin ID matches the slug of your Grafana Cloud account.
   - _You can find the plugin ID in the `plugin.json` file inside your plugin directory. For example, if your account slug is `acmecorp`, you need to prefix the plugin ID with `acmecorp-`._
3. Create a Grafana Cloud API key with the `PluginPublisher` role.
4. Keep a record of this API key as it will be required for signing a plugin

## Signing a plugin

### Using Github actions release workflow

If the plugin is using the github actions supplied with `@grafana/create-plugin` signing a plugin is included out of the box. The [release workflow](./.github/workflows/release.yml) can prepare everything to make submitting your plugin to Grafana as easy as possible. Before being able to sign the plugin however a secret needs adding to the Github repository.

1. Please navigate to "settings > secrets > actions" within your repo to create secrets.
2. Click "New repository secret"
3. Name the secret "GRAFANA_API_KEY"
4. Paste your Grafana Cloud API key in the Secret field
5. Click "Add secret"

#### Push a version tag

To trigger the workflow we need to push a version tag to github. This can be achieved with the following steps:

1. Run `pnpm version <major|minor|patch>`
2. Run `git push origin main --follow-tags`

## Learn more

Below you can find source code for existing app plugins and other related documentation.

- [Basic app plugin example](https://github.com/grafana/grafana-plugin-examples/tree/master/examples/app-basic#readme)
- [`plugin.json` documentation](https://grafana.com/developers/plugin-tools/reference/plugin-jsonplugin-json)
- [Sign a plugin](https://grafana.com/developers/plugin-tools/publish-a-plugin/sign-a-plugin)
