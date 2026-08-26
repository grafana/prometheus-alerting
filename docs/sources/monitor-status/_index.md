---
title: Monitor alerts
description: See which alerts are firing, why they fired, and where they were sent, using the Rules and Alerts pages in the Prometheus Alerting plugin to check the ruler and Alertmanager separately.
keywords:
  - monitoring
  - alerts
  - firing
  - pending
  - status
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 500
review_date: '2026-08-19'
---

# Monitor alerts

Once rules and routing are in place, these pages tell you what's happening right now.

The split follows the two systems involved. **Rules** shows what the ruler is evaluating, including rules that are quiet or broken. **Alerts** shows what Alertmanager is currently holding, including what was suppressed and where it was routed.

Checking both matters, because they answer different questions. A rule producing no alerts looks the same on the **Alerts** page whether nothing is wrong or the rule is failing to evaluate.

## In this section

- [Alerts page](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/monitor-status/alerts-page/): what's firing right now.
- [View alert rules](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/monitor-status/view-alert-rules/): browse and inspect rules.
- [View alert state](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/monitor-status/view-alert-state/): read an individual alert instance.
- [View active notifications](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/monitor-status/view-active-notifications/): confirm routing and suppression.
