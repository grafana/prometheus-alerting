---
title: Template reference
description: Reference for the data available inside Alertmanager notification templates.
keywords:
  - notification templates
  - reference
  - alerts
  - groupLabels
  - commonLabels
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 400
review_date: '2027-08-19'
---

# Template reference

The data a notification template can read. The top-level context is one notification, covering a group of alerts.

## Top-level fields

| Field                | Type   | Contains                                                           |
| -------------------- | ------ | ------------------------------------------------------------------ |
| `.Receiver`          | string | Name of the receiver being notified                                |
| `.Status`            | string | `firing` if any alert in the group is firing, otherwise `resolved` |
| `.Alerts`            | list   | Every alert in the group                                           |
| `.Alerts.Firing`     | list   | Only the firing alerts                                             |
| `.Alerts.Resolved`   | list   | Only the resolved alerts                                           |
| `.GroupLabels`       | map    | The labels this group was grouped by                               |
| `.CommonLabels`      | map    | Labels shared by every alert in the group                          |
| `.CommonAnnotations` | map    | Annotations shared by every alert in the group                     |
| `.ExternalURL`       | string | URL of the Alertmanager sending the notification                   |

## Fields on each alert

Inside `{{ range .Alerts }}`, the dot becomes one alert:

| Field           | Type   | Contains                                               |
| --------------- | ------ | ------------------------------------------------------ |
| `.Status`       | string | `firing` or `resolved`                                 |
| `.Labels`       | map    | The alert's labels                                     |
| `.Annotations`  | map    | The alert's annotations, already rendered by the ruler |
| `.StartsAt`     | time   | When the alert started firing                          |
| `.EndsAt`       | time   | When it ended, for resolved alerts                     |
| `.GeneratorURL` | string | Link back to the rule in the source system             |
| `.Fingerprint`  | string | Identifier derived from the alert's labels             |

## Common compared with group labels

These three are easy to confuse:

- `.GroupLabels`—the labels named in `group_by`. Always present, always identical across the group.
- `.CommonLabels`—labels that happen to be identical across every alert in the group. A wider set than `.GroupLabels`, and it shrinks as the group becomes more varied.
- `.Labels`, inside a range—that one alert's labels, including the ones that differ.

A template using `.CommonLabels.instance` renders correctly while a group holds one instance and renders empty the moment a second joins. When a value has to be present, use `.GroupLabels` or read it per alert inside a range.

## Accessing a label

```
{{ .GroupLabels.alertname }}
{{ .CommonLabels.severity }}
{{ range .Alerts }}{{ .Labels.instance }}{{ end }}
```

For label names that aren't valid identifiers—anything with a dot or dash—use `index`:

```
{{ index .CommonLabels "k8s.namespace" }}
```

## Formatting times

```
{{ .StartsAt.Format "2006-01-02 15:04:05 MST" }}
```

Go's reference time is `2006-01-02 15:04:05`; the layout string is that exact moment written the way you want your output to look.

## Where the annotation content comes from

`.Annotations` holds values the ruler already rendered during evaluation. A notification template can read and rearrange them, but it can't recover information the alert never carried—that has to be added at the rule. Refer to [Template annotations and labels](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/alerting-rules/template-annotations-and-labels/).
