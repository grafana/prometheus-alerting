---
title: Configure alert rules
description: Create and manage data source-managed alerting and recording rules.
keywords:
  - alert rules
  - alerting rules
  - recording rules
  - ruler
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 120
review_date: '2027-08-19'
---

# Configure alert rules

Alert rules are stored and evaluated by the ruler of your Prometheus, Mimir, Cortex, or Loki data source. The plugin gives you an editor for them, so you can manage rules without editing YAML by hand or redeploying.

## Before you start

Editing rules needs two things:

- The `alert.rules.external:write` permission. Refer to [Configure access control](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/set-up/configure-rbac/).
- A data source with a writable ruler API. Mimir, Cortex, and Loki have one; vanilla Prometheus doesn't, and its rules are read-only here. Refer to [Configure data sources](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/set-up/configure-data-sources/).

If either is missing you can still browse rules—the create and edit actions are simply absent.

## In this section

- [Create an alert rule](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/alerting-rules/create-alert-rule/)
- [Create a recording rule](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/alerting-rules/create-recording-rule/)
- [Manage rule groups](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/alerting-rules/manage-rule-groups/)
- [Template annotations and labels](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/alerting-rules/template-annotations-and-labels/)
