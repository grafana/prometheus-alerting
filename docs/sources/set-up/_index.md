---
title: Set up the Prometheus Alerting plugin
menuTitle: Set up
description: Install the plugin, connect your data sources, and configure access control.
keywords:
  - installation
  - setup
  - data sources
  - rbac
  - permissions
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 110
review_date: '2027-08-19'
---

# Set up the Prometheus Alerting plugin

Getting the plugin working takes three steps: install it, point it at your data sources, and decide who can use it.

The order matters a little. The plugin has nothing to show until at least one data source is configured, so an empty-looking plugin right after install is expected rather than a sign that something went wrong.

## In this section

- [Install the plugin](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/set-up/install-plugin/)—install from the catalog and enable the app.
- [Configure data sources](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/set-up/configure-data-sources/)—connect a rules source and an Alertmanager, and understand what each supports.
- [Configure access control](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/set-up/configure-rbac/)—grant the permissions that control each page.
