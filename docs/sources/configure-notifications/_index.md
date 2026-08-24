---
title: Configure notifications
description: Configure Alertmanager routes, receivers, templates, silences, time intervals, and inhibition rules.
keywords:
  - alertmanager
  - notifications
  - routes
  - receivers
  - silences
  - templates
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 125
review_date: '2027-08-19'
---

# Configure notifications

Alertmanager decides what happens to an alert once it fires. This section covers every Alertmanager resource the plugin manages.

## Before you start

These pages need an Alertmanager data source. Without one they don't appear in the plugin at all. Refer to [Configure data sources](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/set-up/configure-data-sources/).

Viewing needs `alert.notifications.external:read`; changing anything needs `alert.notifications.external:write`. Silences are separate, using the `alert.instances.external:*` permissions instead. Refer to [Configure access control](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/set-up/configure-rbac/).

If several Alertmanagers are configured, check the picker at the top of the page before making changes—every edit applies to the selected one.

## Where to start

If you're setting up notifications from scratch, work outward from the destination:

1. **Create a receiver** for each place notifications should land.
1. **Configure routes** so alerts reach the right receiver.
1. **Add time intervals** if some routes should be quiet at certain hours.
1. **Add inhibition rules** if some alerts should suppress others.
1. **Customize templates** once the mechanics work and you want the messages to read better.

Silences come later—they're a day-to-day operational tool rather than part of the initial setup.

## In this section

- [Configure routes](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/configure-notifications/configure-routes/)
- [Create a receiver](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/configure-notifications/create-receiver/)
- [Create a silence](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/configure-notifications/create-silence/)
- [Configure time intervals](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/configure-notifications/time-intervals/)
- [Configure inhibition rules](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/configure-notifications/inhibition-rules/)
- [Notification templates](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/configure-notifications/template-notifications/)
