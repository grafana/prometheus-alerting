---
title: Templates
description: 'Learn where templating applies: in rule annotations and in Alertmanager notifications.'
keywords:
  - templates
  - go templates
  - annotations
  - notification templates
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 400
review_date: '2027-08-19'
---

# Templates

Templating shows up in two places in a data source-managed setup. They look alike—both use Go template syntax—but they're evaluated by different systems at different times, and the data available to each is different.

## The two contexts

|                | Rule annotations and labels     | Notification templates                             |
| -------------- | ------------------------------- | -------------------------------------------------- |
| Evaluated by   | The ruler                       | Alertmanager                                       |
| Evaluated when | Every rule evaluation           | Every notification sent                            |
| Scope          | One alert instance              | A whole group of alerts                            |
| Key variables  | `$labels`, `$value`             | `.Alerts`, `.GroupLabels`, `.CommonLabels`         |
| Configured in  | The rule, on the **Rules** page | The Alertmanager config, on the **Templates** page |

## Rule annotations and labels

The ruler renders these when it evaluates the rule, so the result is baked into the alert before Alertmanager ever sees it. The template has access to exactly one alert instance—its labels and its value.

```
{{ $labels.instance }} is using {{ $value | printf "%.1f" }}% of its disk.
```

Because this runs on every evaluation, keep it cheap and simple. Refer to [Template annotations and labels](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/alerting-rules/template-annotations-and-labels/).

## Notification templates

Alertmanager renders these when it sends a notification, which happens after grouping. The template therefore sees a _group_ of alerts, not one, and its job is to format that group into a message.

```
{{ define "slack.summary" }}
{{ .Alerts | len }} alert(s) firing for {{ .GroupLabels.alertname }}
{{ range .Alerts }}- {{ .Annotations.summary }}
{{ end }}{{ end }}
```

Notice that this template reads `.Annotations.summary`—the output of the rule-level template from the previous step. The two stack: the ruler produces per-alert text, and Alertmanager assembles those into a message. Refer to [Notification templates](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/configure-notifications/template-notifications/).

## Which one do you want?

- To change what a single alert says about itself, edit the rule's annotations.
- To change how a batch of alerts is laid out in Slack or email, edit a notification template.

A common mistake is reaching for a notification template to add information the alert never carried. If the data isn't in the alert's labels or annotations, no notification template can recover it—it has to be added at the rule.
