---
title: Multi-dimensional alerts
description: Write one alerting rule that produces a separate alert instance per series, learn why the label set gives each instance its identity, and how grouping keeps the notifications manageable.
keywords:
  - multi-dimensional
  - instances
  - labels
  - promql
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 100
review_date: '2026-08-19'
---

# Multi-dimensional alerts

A single rule normally produces many alerts—one per series its expression returns. This is the default behavior rather than something you enable, and understanding it explains a lot of alerting behavior.

## The pattern

```yaml
- alert: FilesystemAlmostFull
  expr: |
    node_filesystem_avail_bytes / node_filesystem_size_bytes * 100 < 10
  for: 15m
  labels:
    severity: warning
  annotations:
    summary: '{{ $labels.mountpoint }} on {{ $labels.instance }} is almost full'
    description: 'Only {{ $value | printf "%.1f" }}% free.'
```

The expression returns one series per filesystem below the threshold, and each becomes its own alert instance carrying the `instance` and `mountpoint` labels for that filesystem.

One rule covers every filesystem on every host. You don't write a rule per host, and hosts added later are covered automatically.

## Why this works

An alert instance's identity is its label set, which comes from the series the expression returned. Because each filesystem is a distinct series with distinct labels, each becomes a distinct alert—tracked separately, firing and resolving on its own schedule.

The annotations are templated per instance, so each alert names its own filesystem. Refer to [Template annotations and labels](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/alerting-rules/template-annotations-and-labels/).

## Keeping the notifications sane

Fifty full filesystems produce fifty alert instances. Whether that means fifty notifications depends on grouping.

Grouping by `alertname` and `instance` gives one notification per host, listing that host's affected filesystems:

```yaml
group_by: ['alertname', 'instance']
```

Grouping by `alertname` alone gives one notification covering everything. Refer to [Group alert notifications](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/notifications/group-alert-notifications/).

## Check the count before you save

The rule editor's **Query Preview** shows what the expression returns right now. If it comes back with hundreds of rows, the rule will produce hundreds of alerts the moment it's saved.

That's the point at which to reconsider—either aggregate the expression, or plan the grouping to match. Refer to [High-cardinality alerts](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/examples/high-cardinality-alerts/).

## Preserve the labels you route on

Aggregating away a label you need for routing breaks the routing silently:

```promql
# Keeps instance and mountpoint — routable per host
node_filesystem_avail_bytes / node_filesystem_size_bytes * 100 < 10

# Drops every label — one anonymous alert, nothing to route on
count(node_filesystem_avail_bytes / node_filesystem_size_bytes * 100 < 10) > 5
```

Use `by (...)` to keep the labels you need while still aggregating:

```promql
count by (instance) (
  node_filesystem_avail_bytes / node_filesystem_size_bytes * 100 < 10
) > 3
```
