- Support arbitrary mount points for Mimir Alertmanager (currently hard-coded to `/alertmanager/api`)
- Add support for Alertmanager configuration modifications

  - this is Mimir only
  - we should re-use the entire `useProduceNewAlertmanagerConfiguration` hook from `grafana/grafana`
    - but with updated type definitions from `packages/alertmanager`

- Support "global config" for receivers (see https://prometheus.io/docs/alerting/latest/configuration/#file-layout-and-global-settings)
- RBAC integration with Grafana (where possible)
