---
title: Prometheus Alerting
description: Prometheus Alerting is a Grafana app plugin for managing data source-managed alert rules and Alertmanager configuration across Prometheus, Mimir, Cortex, and Loki without leaving Grafana.
keywords:
  - prometheus
  - mimir
  - cortex
  - loki
  - alerting
  - alertmanager
  - alert rules
  - silences
  - receivers
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 10
review_date: '2026-08-19'
---

# Prometheus Alerting

Prometheus Alerting is a Grafana app plugin for managing alert rules and Alertmanager configuration across Prometheus, Mimir, Cortex, and Loki data sources—all from within Grafana.

It brings the native Prometheus and Alertmanager alerting experience into Grafana, so you can manage external alerting stacks without leaving the Grafana UI.

{{< admonition type="note" >}}
This plugin works with data source-managed alert rules and Alertmanager resources only. It doesn't manage Grafana-managed alert rules or the built-in Grafana Alertmanager. For those, refer to [Grafana Alerting](https://grafana.com/docs/grafana/latest/alerting/).
{{< /admonition >}}

## Requirements

To use the Prometheus Alerting plugin, you need:

- Grafana 13.1.0 or later (OSS, Enterprise, or Cloud).
- A Prometheus, Mimir, Cortex, or Loki data source, to manage alert rules.
- An Alertmanager data source, to manage routing, receivers, silences, and the rest of the Alertmanager configuration.

You don't need both. Rule management works without an Alertmanager, and the Alertmanager pages work without a rules source.

## Explore

- [Introduction](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/)—how data source-managed rules and Alertmanager fit together.
- [Set up](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/set-up/)—install the plugin, connect data sources, and configure access.
- [Configure alert rules](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/alerting-rules/)—write alerting and recording rules.
- [Configure notifications](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/configure-notifications/)—routes, receivers, templates, silences, time intervals, and inhibition rules.
- [Monitor alerts](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/monitor-status/)—see what's firing and why.
- [Guides](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/guides/)—best practices and troubleshooting.
- [Examples](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/examples/)—worked examples of common alerting patterns.

## Related resources

- [Prometheus alerting rules](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/)
- [Alertmanager configuration](https://prometheus.io/docs/alerting/latest/configuration/)
- [Grafana community forum](https://community.grafana.com/)
- [Report issues on GitHub](https://github.com/grafana/prometheus-alerting/issues)
