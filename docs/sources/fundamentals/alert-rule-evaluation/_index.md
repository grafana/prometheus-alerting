---
title: Alert rule evaluation
description: Learn how the Prometheus Alerting plugin evaluates rule groups on a schedule, how the evaluation interval interacts with the pending period, and how an alert moves between states.
keywords:
  - evaluation
  - rule groups
  - evaluation interval
  - pending
  - firing
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 200
review_date: '2026-08-19'
---

# Alert rule evaluation

Rules don't run individually. They run as part of a group, on that group's schedule, and the timing of that schedule affects how quickly alerts fire and how reliable they are.

## In this section

- [Rule groups and evaluation](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/alert-rule-evaluation/rule-groups/): when rules run and in what order.
- [Alert rule state and health](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/alert-rule-evaluation/alert-rule-state-and-health/): what the plugin is telling you about a rule.
