---
title: Create a recording rule
description: Create a recording rule that precomputes an expensive expression and saves the result as a new time series, learn when one is worth adding, and how to name it by convention.
keywords:
  - recording rules
  - precompute
  - promql
  - performance
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 200
review_date: '2026-08-19'
---

# Create a recording rule

A recording rule evaluates an expression on a schedule and stores the result as a new metric. It produces no alerts.

## When a recording rule is worth it

Reach for one when:

- **An expression is expensive and used repeatedly.** Computing it once per interval beats computing it every time a dashboard panel or alerting rule asks for it.
- **A query is complex enough to be worth naming.** `job:request_latency_seconds:mean5m` is easier to read, and harder to get subtly wrong, than the ratio of two rates spelled out in every rule that needs it.
- **Several alerting rules share a subexpression.** Record it once and have them all compare against the same number, so they can't drift apart.

They're not free. Each one adds a new series and work on every evaluation. A recording rule used by exactly one thing is usually not worth the indirection.

## Create the rule

1. Click **Rules** in the plugin navigation.
1. Click **New recording rule**.
1. Under **Define recording rule**, enter a **Name**. This is the name of the metric the rule produces.
1. Select the **Data source**.
1. Write the **Expression**.
1. Choose a **Namespace** and **Group**.
1. Click **Save**.

There's no pending period or annotations here. Nothing fires, so there's nothing to delay or describe.

## Naming

The convention is `level:metric:operations`:

- `level`: the labels the result is aggregated to, such as `job` or `instance`
- `metric`: the underlying metric name
- `operations`: what was done to it, such as `rate5m` or `mean5m`

For example, `job:request_latency_seconds:mean5m` reads as the mean 5-minute request latency, aggregated by job. Following the convention makes it obvious at a glance what a recorded series contains, and prevents recorded metrics from being mistaken for raw ones.

## Ordering matters

If an alerting rule uses a metric produced by a recording rule, they have to be in the same group, with the recording rule listed first. Rules in a group are evaluated top to bottom, so a recording rule below its consumer means the consumer reads a stale value, or nothing at all on the first cycle.

Reorder rules by dragging them on the group edit page. Refer to [Manage rule groups](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/alerting-rules/manage-rule-groups/).

## Checking the result

Recording rules have no alert state. The plugin shows them as **Recording**. What they do have is health, and a failing recording rule shows **Recording error**.

This is worth watching, because the failure is quiet. Nothing fires when a recording rule breaks; the metric stops updating, and every alerting rule built on it goes blind at the same time.
