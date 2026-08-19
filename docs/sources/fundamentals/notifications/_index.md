---
title: Notifications
description: Learn how Alertmanager groups, routes, and delivers notifications for firing alerts.
keywords:
  - alertmanager
  - notifications
  - routing
  - grouping
  - receivers
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 300
review_date: '2027-08-19'
---

# Notifications

Once a rule fires, the ruler's job is done—it just keeps reporting the alert. Everything from that point is Alertmanager's decision.

## What Alertmanager does with an alert

For each firing alert, in roughly this order:

1. **Deduplicate.** Alerts with identical labels are the same alert, even from different ruler replicas.
1. **Group.** Related alerts are batched so one incident produces one notification instead of fifty. Refer to [Group alert notifications](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/notifications/group-alert-notifications/).
1. **Route.** The routing tree is walked to decide which receiver the group goes to. Refer to [The routing tree](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/notifications/routing-tree/).
1. **Suppress, if applicable.** A matching silence, an active inhibition rule, or a route muted by a time interval stops the notification here.
1. **Notify.** The receiver's integrations are called. Refer to [Receivers](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/notifications/receivers/).

The important consequence: a firing alert and a delivered notification are different things. Most "the alert fired but nobody was paged" problems are a suppression or routing step in the middle, not a broken rule.

## Three ways to suppress a notification

They're easy to confuse, and the plugin exposes all three separately:

| Mechanism           | Suppresses                                         | Typical use                                                 |
| ------------------- | -------------------------------------------------- | ----------------------------------------------------------- |
| **Silence**         | Alerts matching label matchers, for a fixed window | Planned maintenance, a known issue being worked on          |
| **Inhibition rule** | Alerts of one kind while another kind is firing    | Don't page for every service when the whole cluster is down |
| **Time interval**   | Notifications on a route, during recurring windows | Don't send non-urgent alerts overnight                      |

A silence is a one-off you create by hand and that expires. An inhibition rule is standing configuration driven by other alerts. A time interval is a recurring schedule attached to a route.

The **Alerts** page shows which of these applied, labeling an alert as silenced by a silence, inhibited by an inhibition rule, or muted by a time interval.

## In this section

- [The routing tree](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/notifications/routing-tree/)
- [Receivers](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/notifications/receivers/)
- [Group alert notifications](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/notifications/group-alert-notifications/)
