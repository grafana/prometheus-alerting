---
title: Template annotations and labels
description: Use Go templating in rule annotations and labels to include query results and label values.
keywords:
  - templates
  - annotations
  - labels
  - go templates
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 400
review_date: '2027-08-19'
---

# Template annotations and labels

Annotation and label values are Go templates, rendered by the ruler each time the rule is evaluated. This is what lets one rule produce alerts that describe their own specifics.

## Available variables

| Variable                | Contains                                                    |
| ----------------------- | ----------------------------------------------------------- |
| `{{ $labels }}`         | The labels of this alert instance                           |
| `{{ $value }}`          | The numeric value the expression returned for this instance |
| `{{ $externalLabels }}` | The external labels configured on the ruler                 |

The scope is one alert instance. A rule matching fifty filesystems renders its annotations fifty times, once per instance, each with that instance's own labels and value.

## Common patterns

Reference a label by name:

```
{{ $labels.instance }} is unreachable.
```

Format the value, which is a float and prints unhelpfully by default:

```
Disk is {{ $value | printf "%.1f" }}% full.
```

Use `humanize` for large or small numbers, and `humanizeDuration` for seconds:

```
Receiving {{ $value | humanize }} requests per second.
Backlog will clear in {{ $value | humanizeDuration }}.
```

Build a link that points at the specific thing that's broken:

```
https://grafana.example.com/d/abc123?var-instance={{ $labels.instance }}
```

## A worked example

```yaml
annotations:
  summary: 'Disk almost full on {{ $labels.instance }}'
  description: >-
    {{ $labels.mountpoint }} on {{ $labels.instance }} is
    {{ $value | printf "%.1f" }}% full and needs attention.
  runbook_url: https://runbooks.example.com/disk-full
```

The `summary` is short enough to work as a notification title. The `description` carries the detail. The `runbook_url` is static, which is fine—not every annotation has to be templated.

## Templating labels

Labels can be templated too, but it's usually a mistake. A label whose value changes while the alert is firing changes the alert's identity, which Alertmanager reads as the old alert resolving and a new one starting, re-notifying people mid-incident.

Templating a label from another label is safe, since neither changes. Templating a label from `$value` is not.

## Keep it simple

These templates run on every evaluation of every instance, so they're not the place for elaborate logic. If a notification needs a complicated layout, build that in a notification template instead, where it runs once per notification rather than once per instance per evaluation. Refer to [Templates](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/templates/).

## Troubleshooting

A template that fails to parse makes the rule fail to evaluate. The rule shows **error** health and its **Last Error** carries the reason, so a rule that goes quiet right after an annotation edit is usually a broken template.

Use **Query Preview** in the rule editor to check which labels are actually available before referencing them. `{{ $labels.pod }}` renders as nothing at all if the series has no `pod` label.
