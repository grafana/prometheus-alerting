---
title: Template language
description: Learn the Go template syntax used in Alertmanager notification templates.
keywords:
  - go templates
  - syntax
  - functions
  - variables
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 200
review_date: '2027-08-19'
---

# Template language

Alertmanager templates use Go's `text/template` syntax. This page covers the parts you actually need.

## Define and use

Every template is a named definition:

```
{{ define "slack.title" }}
[{{ .Status | toUpper }}] {{ .GroupLabels.alertname }}
{{ end }}
```

Reference it from another template with `template`:

```
{{ template "slack.title" . }}
```

The trailing `.` passes the current context through. Leaving it off gives the template no data to work with, which is a common cause of mysteriously empty notifications.

## The dot

`.` is the current context. At the top of a notification template it's the notification data—the group of alerts and their shared labels. Inside a `range` it becomes the current item.

```
{{ .GroupLabels.alertname }}       one field of the notification
{{ range .Alerts }}{{ .Labels.instance }}{{ end }}   .  is now one alert
```

Losing track of what `.` refers to is the single most common template bug. Inside a loop, use `$` to reach back to the original top-level context:

```
{{ range .Alerts }}{{ $.GroupLabels.cluster }} — {{ .Labels.instance }}
{{ end }}
```

## Loops and conditionals

```
{{ range .Alerts }}
- {{ .Annotations.summary }}
{{ end }}
```

```
{{ if eq .Status "firing" }}Firing{{ else }}Resolved{{ end }}
```

```
{{ if .Alerts.Firing }}{{ len .Alerts.Firing }} firing{{ end }}
```

Comparison functions are written as functions, not operators: `eq`, `ne`, `lt`, `le`, `gt`, `ge`.

## Variables

```
{{ $count := len .Alerts }}
{{ $count }} alert(s) firing
```

## Useful functions

| Function                | Does                                  |
| ----------------------- | ------------------------------------- |
| `toUpper`, `toLower`    | Change case                           |
| `title`                 | Title-case a string                   |
| `join`                  | Join a list with a separator          |
| `len`                   | Length of a list                      |
| `printf`                | Format a value, as in `printf "%.2f"` |
| `match`, `reReplaceAll` | Regex match and replace               |

## Whitespace

Go templates keep the whitespace around actions, which is why templates often render with unexpected blank lines. Add a hyphen inside the braces to trim it:

```
{{- range .Alerts }}
- {{ .Annotations.summary }}
{{- end }}
```

`{{-` trims whitespace before the action, `-}}` trims after.

## Writing templates without breaking things

There's no preview in the plugin, and a broken template shows up when a notification is sent. Build them up in small steps: start with plain static text, confirm it arrives, then add one field at a time.

Refer to [Template examples](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/configure-notifications/template-notifications/examples/) for working starting points, and [Template reference](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/configure-notifications/template-notifications/reference/) for the available fields.
