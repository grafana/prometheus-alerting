---
title: Labels and annotations
description: Learn how labels give an alert instance its identity and drive routing, grouping, and silencing, while annotations carry the human-readable context that ends up in notifications.
keywords:
  - labels
  - annotations
  - alert instances
  - cardinality
  - severity
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 200
review_date: '2026-08-19'
---

# Labels and annotations

Labels and annotations look similar in a rule definition and do completely different jobs. The short version: labels are for machines, annotations are for people.

## Labels identify the alert

An alert instance's identity is its complete set of labels. That set comes from two places: the labels on the series the expression returned, plus any labels the rule adds.

Identity matters because Alertmanager uses it for everything:

- **Routing**: matchers in the routing tree are label matchers. Refer to [The routing tree](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/notifications/routing-tree/).
- **Grouping**: alerts are batched by label value using `group_by`. Refer to [Group alert notifications](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/notifications/group-alert-notifications/).
- **Silencing**: silences match on labels. Refer to [Create a silence](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/configure-notifications/create-silence/).
- **Inhibition**: source and target matchers are label matchers, and `equal` compares label values. Refer to [Configure inhibition rules](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/configure-notifications/inhibition-rules/).
- **Deduplication**: two alerts with identical labels are the same alert.

Because identity is the whole label set, _changing any label produces a different alert_. An alert whose labels change mid-incident looks to Alertmanager like the old one resolving and a new one appearing, which can re-notify people. Avoid putting anything that varies over time—a timestamp, a current value—in a label.

### Conventional labels

`alertname` is set automatically from the rule's name and is what most routing keys off first. Beyond that, the useful convention is a small, stable set that every rule sets consistently:

```yaml
labels:
  severity: critical
  team: platform
```

The value is in the consistency. A routing tree can only send critical alerts to PagerDuty if every rule agrees on what `severity: critical` means and spells it the same way. Refer to [Best practices](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/guides/best-practices/).

### Labels and cardinality

Every distinct label combination is a distinct alert. A label with many possible values—a request ID, a user ID, a pod name in a large cluster—multiplies the number of alerts a single rule can produce. Aggregate those away in the expression rather than carrying them into the alert.

## Annotations describe the alert

Annotations carry the human-readable content: what happened, what it means, what to do about it. They're passed through to notifications and are what people actually read.

```yaml
annotations:
  summary: 'High latency on {{ $labels.job }}'
  description: '{{ $labels.job }} has a mean latency of {{ $value | printf "%.2f" }}s over 5m.'
  runbook_url: https://runbooks.example.com/high-latency
```

Annotations play no part in routing, grouping, silencing, or deduplication. Changing an annotation on a firing alert doesn't create a new alert, which is exactly why anything that varies belongs here rather than in a label.

Annotation values are templated by the ruler at evaluation time, so `$labels` and `$value` are available. Refer to [Template annotations and labels](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/alerting-rules/template-annotations-and-labels/).

## Which one should it be?

Ask what the field is for:

| The field                                       | Where it goes              |
| ----------------------------------------------- | -------------------------- |
| Routes, groups, silences, or inhibits the alert | Label                      |
| Tells a person what happened or what to do      | Annotation                 |
| Changes while the alert is firing               | Annotation                 |
| Has many possible values                        | Neither; aggregate it away |

In the plugin, both are edited in the rule editor: labels in the rule definition, annotations under **Annotations**, where **Add custom annotation** adds keys beyond the standard ones.
