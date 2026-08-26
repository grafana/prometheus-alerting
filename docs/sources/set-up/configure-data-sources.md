---
title: Configure data sources
description: Learn which data sources the Prometheus Alerting plugin reads from, why a rules source and an Alertmanager are configured separately, and which backends support editing rules.
keywords:
  - data sources
  - prometheus
  - mimir
  - cortex
  - loki
  - ruler api
  - alertmanager api
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 200
review_date: '2026-08-19'
---

# Configure data sources

The plugin doesn't store anything itself. Everything it shows is read from your data sources, and everything you change is written back to them. What you can do therefore depends on which data sources you have and what their APIs support.

## Two kinds of data source

The plugin draws on two different data sources, and you need both to use everything it offers:

- **A rules source** backs the **Rules** pages. This is a Prometheus or Loki data source. Mimir and Cortex register in Grafana as the Prometheus data source type, so they're covered here too.
- **An Alertmanager data source** backs everything else: **Alerts**, **Routes**, **Receivers**, **Templates**, **Silences**, **Time intervals**, and **Inhibit Rules**.

These are configured separately in Grafana. Pointing the plugin at Mimir doesn't give it an Alertmanager; you add an Alertmanager data source for that, even when the same Mimir deployment serves both.

The split has a visible consequence. Rule pages work with no Alertmanager configured at all, and the Alertmanager-backed pages are unavailable until at least one Alertmanager data source exists. If you have rules but no Alertmanager, the plugin opens on **Rules** instead of **Alerts**.

## Rules sources

Add the data source that serves your rules as usual, under **Connections** > **Data sources**. The plugin picks up every Prometheus and Loki data source automatically. There's nothing to enable per data source.

Built-in data sources such as `-- Grafana --` and `-- Mixed --` are excluded, since they don't serve Prometheus-compatible rules.

### Read-only compared with editable rules

Whether you can edit rules depends on whether the backend serves a writable ruler API. The plugin doesn't assume this from the data source type. It probes the backend at runtime and adapts.

| Backend    | Read rules | Edit rules |
| ---------- | ---------- | ---------- |
| Prometheus | Yes        | No         |
| Mimir      | Yes        | Yes        |
| Cortex     | Yes        | Yes        |
| Loki       | Yes        | Yes        |

Vanilla Prometheus loads rules from files on disk and has no API for writing them back, so its rules are always read-only here. The rule detail page states which case you're in, showing either **✓ Ruler API Available** or **⚠ Ruler API Unavailable (Read-only)**. If you open the editor for a rule that can't be edited, the plugin explains that editing needs a data source with a ruler API rather than failing silently.

## Alertmanager data sources

Add an Alertmanager data source under **Connections** > **Data sources**, pointed at the Alertmanager your rules source sends alerts to. Any data source of the Alertmanager type is picked up.

When more than one is configured, a picker at the top of the Alertmanager-backed pages controls which one you're viewing. Your choice is stored in the browser, so it persists across visits and doesn't affect other users.

{{< admonition type="caution" >}}
Point the plugin at the same Alertmanager your rules actually send alerts to. Nothing prevents you from configuring an unrelated one, and the result is confusing: rules fire, but the alerts never appear in the plugin because they were delivered somewhere else.
{{< /admonition >}}

## Verify the setup

Open the plugin and check the two halves independently:

1. Go to **Rules**. Your rule groups should be listed, grouped by data source.
1. Go to **Alerts**. Any alert currently held by the selected Alertmanager should be listed.

A data source that can't be read doesn't hide the others. The **Rules** page shows **Cannot load rules for this data source** next to the failing source and still lists everything that loaded.

If either half is empty, refer to [Troubleshooting](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/guides/troubleshooting/).
