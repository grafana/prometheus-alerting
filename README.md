# Prometheus Alerting

Prometheus Alerting is a Grafana app plugin for managing alert rules and Alertmanager configuration across Prometheus, Mimir, Cortex, and Loki data sources — all from within Grafana.

It brings the native Prometheus/Alertmanager alerting experience into Grafana, so you can manage external alerting stacks without leaving the Grafana UI:

- **Alerts** — view firing and pending alerts across your configured data sources
- **Rules** — browse Prometheus-compatible alerting and recording rules
- **Routes** — configure Alertmanager routing trees
- **Receivers** — manage notification receivers (email, Slack, PagerDuty, webhooks, and more)
- **Templates** — edit Alertmanager notification templates
- **Silences** — create and manage silences for alert instances
- **Time intervals** — define mute/active time intervals used by routes
- **Inhibit rules** — configure Alertmanager inhibition rules

Access to each page is enforced via Grafana RBAC, and the plugin picks up any Prometheus, Mimir, Cortex, or Loki data source configured with an accessible Alertmanager/ruler API.

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

- **Node.js**: `>=24.21` (see `engines` in `package.json`)
- **pnpm**: `>=12.4.2` (installed via `corepack enable` or standalone)

Check your versions match the requirements:

```bash
node --version  # should be >= 24.21
pnpm --version  # should be >= 12.4.2
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

4. Run the tests (using Vitest)

   ```bash
   # Runs the tests and watches for changes
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

## Learn more

- [`plugin.json` documentation](https://grafana.com/developers/plugin-tools/reference/plugin-jsonplugin-json)
- [Sign a plugin](https://grafana.com/developers/plugin-tools/publish-a-plugin/sign-a-plugin)
