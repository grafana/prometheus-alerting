---
title: Alert rules
description: Understand what a data source-managed alert rule is and what it's made of.
keywords:
  - prometheus
  - alert rules
  - alerting rules
  - recording rules
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 100
review_date: '2027-08-19'
---

# Alert rules

A data source-managed alert rule lives in your Prometheus-compatible ruler, not in Grafana. The plugin reads it from there and, when the backend allows it, writes changes back.

## Two kinds of rule

Both live side by side in the same rule groups, and the plugin lists both together.

**Alerting rules** watch for a condition and produce alerts when it holds. This is what most people mean by a rule.

```yaml
- alert: HighRequestLatency
  expr: job:request_latency_seconds:mean5m{job="api"} > 0.5
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: 'High latency on {{ $labels.job }}'
```

**Recording rules** evaluate an expression ahead of time and save the result as a new time series. They produce no alerts. They exist so that expensive queries run once on a schedule instead of every time a dashboard or alerting rule needs them.

```yaml
- record: job:request_latency_seconds:mean5m
  expr: rate(request_latency_seconds_sum[5m]) / rate(request_latency_seconds_count[5m])
```

The example above shows the two working together: the recording rule does the arithmetic, and the alerting rule compares the result against a threshold.

## What a rule is made of

| Part           | Applies to     | Purpose                                                        |
| -------------- | -------------- | -------------------------------------------------------------- |
| Name           | Both           | `alert:` names the alert; `record:` names the resulting metric |
| Expression     | Both           | The PromQL or LogQL query to evaluate                          |
| Pending period | Alerting rules | How long the condition must hold before the alert fires        |
| Labels         | Alerting rules | Identify the alert and drive routing                           |
| Annotations    | Alerting rules | Human-readable context, carried into notifications             |

Recording rules have no pending period or annotations, because there's no alert to delay or describe.

## Where rules live

Rules are organized into **groups**, and groups sit inside a **namespace**. In Mimir and Cortex a namespace is roughly a file's worth of rules; in vanilla Prometheus it corresponds to a rule file on disk.

The group is the unit of evaluation: everything in a group runs together, on the group's interval, in the order the rules are listed. Refer to [Rule groups and evaluation](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/alert-rule-evaluation/rule-groups/).

## In this section

- [Queries and conditions](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/alert-rules/queries-conditions/)
- [Labels and annotations](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/alert-rules/labels-and-annotations/)
