- Support arbitrary mount points for Mimir Alertmanager (currently hard-coded to `/alertmanager/api`)
- Add support for Alertmanager configuration modifications
  - this is Mimir only
  - we should re-use the entire `useProduceNewAlertmanagerConfiguration` hook from `grafana/grafana`
    - but with updated type definitions from `packages/alertmanager`

- Support "global config" for receivers (see https://prometheus.io/docs/alerting/latest/configuration/#file-layout-and-global-settings)
- RBAC integration with Grafana (where possible)
- Amazon Managed Service for Prometheus rules support (see [docs/adr/0001-rules-source-flavors.md](docs/adr/0001-rules-source-flavors.md))
  - reads are implemented (read-only); rule CRUD and the datasource-repo proxy routes are not
  - blocked on `grafana/grafana-amazonprometheus-datasource` exposing the AMP control plane

- AMP notification configuration is a separate, unsolved problem
  - `PutAlertManagerDefinition` is control-plane, and there is no `alertmanager`-type data source to
    attach to, so `useAvailableAlertmanagers` cannot see it
