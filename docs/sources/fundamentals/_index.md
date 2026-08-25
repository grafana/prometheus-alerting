---
title: Introduction to Prometheus Alerting
menuTitle: Introduction
description: Learn how data source-managed alert rules and Alertmanager work together in the Prometheus Alerting plugin, which resources it manages, and how its terminology maps to Grafana Alerting.
keywords:
  - prometheus
  - alerting
  - concepts
  - introduction
  - alertmanager
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 100
review_date: '2026-08-19'
---

# Introduction to Prometheus Alerting

Data source-managed alerting splits the work between two systems. Understanding where the line falls explains most of the plugin's behavior, including why some pages work when others are empty.

## How it fits together

1. **The ruler evaluates rules.** Your Prometheus, Mimir, Cortex, or Loki instance runs each alerting rule on a schedule. When a rule's expression returns results, the ruler produces one alert per result series.
1. **The ruler sends alerts to Alertmanager.** Alerts are pushed continuously for as long as they keep firing. The ruler doesn't decide who gets notified—it only reports what's firing.
1. **Alertmanager decides what to do with them.** It groups related alerts, walks the routing tree to pick a receiver, applies silences, inhibition rules, and time intervals, and then sends the notification.

Grafana isn't in this path. The alert would fire and the notification would be delivered even with Grafana switched off. The plugin is a management and observation layer over systems that run on their own.

That's also why the plugin needs two separate data sources, and why rule pages keep working when no Alertmanager is configured. Refer to [Configure data sources](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/set-up/configure-data-sources/).

## What this plugin covers

The plugin manages **data source-managed** resources only: rules stored in a Prometheus-compatible ruler, and configuration stored in an external Alertmanager.

It doesn't manage Grafana-managed alert rules, which Grafana evaluates itself and stores in its own database, or the built-in Grafana Alertmanager. Those have their own UI—refer to [Grafana Alerting](https://grafana.com/docs/grafana/latest/alerting/).

## Terminology

The plugin uses Alertmanager's vocabulary rather than the Grafana equivalents, because that's what the underlying configuration uses. If you're coming from Grafana Alerting, these are the same concepts under different names:

| Grafana Alerting    | Prometheus Alerting plugin | In the Alertmanager configuration |
| ------------------- | -------------------------- | --------------------------------- |
| Contact point       | Receiver                   | `receivers`                       |
| Notification policy | Route, or the routing tree | `route`                           |
| Mute timing         | Time interval              | `time_intervals`                  |

Silences and inhibition rules are called the same thing in both.

## In this section

- [Alert rules](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/alert-rules/)—what a rule is made of.
- [Alert rule evaluation](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/alert-rule-evaluation/)—when rules run and how state changes.
- [Notifications](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/notifications/)—how Alertmanager routes and delivers.
- [Templates](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/templates/)—where templating applies.
