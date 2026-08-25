---
title: Notification templates
description: Customize how Alertmanager formats the notifications it sends, using Go templates that are rendered at send time and describe a whole group of alerts rather than a single instance.
keywords:
  - alertmanager
  - notification templates
  - go templates
  - formatting
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 600
review_date: '2026-08-19'
---

# Notification templates

Notification templates control how a notification is formatted before it's sent. Alertmanager renders them at send time, after grouping, so a template describes a whole group of alerts rather than one.

This is different from templating a rule's annotations, which the ruler does per alert instance during evaluation. Refer to [Templates](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/templates/).

## In this section

- [Manage notification templates](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/configure-notifications/template-notifications/manage-notification-templates/)—create, edit, and delete templates.
- [Template language](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/configure-notifications/template-notifications/language/)—the Go template syntax.
- [Template examples](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/configure-notifications/template-notifications/examples/)—patterns you can copy.
- [Template reference](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/configure-notifications/template-notifications/reference/)—the data a template can read.
