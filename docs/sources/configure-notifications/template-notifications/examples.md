---
title: Template examples
description: Worked examples of common Alertmanager notification template patterns for Slack and email, including titles with alert counts, per-alert bodies, and firing and resolved in one message.
keywords:
  - notification templates
  - examples
  - slack
  - email
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 300
review_date: '2026-08-19'
---

# Template examples

Working templates you can copy and adapt. Each is a complete definition. Paste it into a template file and reference the defined name from a receiver.

## A Slack title

```go
{{ define "slack.title" }}
[{{ .Status | toUpper }}{{ if eq .Status "firing" }}:{{ .Alerts.Firing | len }}{{ end }}] {{ .GroupLabels.alertname }}
{{ end }}
```

Renders as `[FIRING:3] HighRequestLatency`. Putting the count in the title makes the scale of an incident visible without opening the message.

## A Slack body

```go
{{ define "slack.text" }}
{{- range .Alerts }}
*{{ .Labels.severity | toUpper }}* {{ .Annotations.summary }}
{{ if .Annotations.description }}{{ .Annotations.description }}
{{ end }}
{{- if .Annotations.runbook_url }}<{{ .Annotations.runbook_url }}|Runbook>{{ end }}
{{- end }}
{{ end }}
```

Loops over every alert in the group, printing its summary and, when present, its description and a runbook link. The `if` guards matter. An alert without a runbook would otherwise render an empty link.

## An email subject

```go
{{ define "email.subject" }}
{{ .Status | toUpper }}: {{ .GroupLabels.alertname }} ({{ .Alerts | len }})
{{ end }}
```

## Grouping by a label in the body

When one notification covers several clusters, group the list so it reads clearly:

```go
{{ define "alerts.by_cluster" }}
{{- range .Alerts }}
{{ .Labels.cluster }}/{{ .Labels.instance }}: {{ .Annotations.summary }}
{{- end }}
{{ end }}
```

## Firing and resolved in one message

```go
{{ define "alerts.status" }}
{{- if .Alerts.Firing }}
Firing ({{ .Alerts.Firing | len }}):
{{ range .Alerts.Firing }}- {{ .Annotations.summary }}
{{ end }}{{ end }}
{{- if .Alerts.Resolved }}
Resolved ({{ .Alerts.Resolved | len }}):
{{ range .Alerts.Resolved }}- {{ .Annotations.summary }}
{{ end }}{{ end }}
{{ end }}
```

Useful when **Send resolved** is enabled, so one message can show what recovered alongside what's still broken.

## A compact one-line summary

For a channel where alerts should be readable at a glance:

```go
{{ define "alerts.oneline" }}
{{ .Alerts | len }} × {{ .GroupLabels.alertname }} on {{ .CommonLabels.cluster }}
{{ end }}
```

`.CommonLabels` only holds labels shared by every alert in the group, so this works when the grouping guarantees a single cluster and renders empty when it doesn't. Refer to [Template reference](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/configure-notifications/template-notifications/reference/).

## A guideline

The notification's job is to tell someone what broke and where to look. Templates that try to include everything tend to be skimmed and then ignored. Lead with the summary, keep the detail short, and link out to a dashboard or runbook for the rest.
