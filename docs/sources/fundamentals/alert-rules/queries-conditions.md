---
title: Queries and conditions
description: Learn how the expression in a data source-managed alerting rule acts as its condition, how aggregation changes the number of alert instances, and how the pending period delays firing.
keywords:
  - promql
  - logql
  - query
  - condition
  - for
  - pending period
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 100
review_date: '2026-08-19'
---

# Queries and conditions

An alerting rule has no separate threshold field. The expression is the condition: whatever it returns is what fires.

## The expression is the condition

The ruler evaluates the expression on each interval and looks at the result:

- **Empty result**: nothing is wrong, no alerts.
- **One or more series returned**: each series becomes one alert instance.

So you write a query that returns nothing in the healthy case, and returns something when there's a problem. The comparison operator is what does the filtering:

```promql
node_filesystem_avail_bytes / node_filesystem_size_bytes * 100 < 10
```

While every filesystem has more than 10% free, this returns no series and no alert exists. As soon as one drops below, the series for that filesystem is returned and becomes an alert instance.

This is why one rule commonly produces many alerts. If fifty filesystems are below the threshold, you get fifty alert instances from a single rule, each carrying the labels of its own series. Refer to [Multi-dimensional alerts](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/examples/multi-dimensional-alerts/).

## Aggregation changes what you get

How you aggregate decides how many alerts you get and how specific they are.

```promql
# One alert per instance: you learn exactly which machine
up{job="api"} == 0

# One alert for the whole job: you learn that something is wrong, not what
count(up{job="api"} == 0) > 3
```

Neither is better in general. Per-instance alerts are precise but can flood you during a broad outage; aggregated alerts stay quiet but need investigation. Refer to [High-cardinality alerts](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/examples/high-cardinality-alerts/).

## The pending period

A condition that's true for one evaluation is often just noise: a scrape blip, a brief spike. The pending period, written as `for` in the rule, is how long the condition has to hold continuously before the alert actually fires.

With `for: 10m`, the sequence looks like this:

1. The expression starts returning a series. The alert instance enters **pending**.
1. It stays pending while the condition keeps holding on each evaluation.
1. After 10 minutes of holding, it becomes **firing** and is sent to Alertmanager.

If the expression stops returning that series at any point before the 10 minutes elapse, the instance disappears and the clock resets. A pending alert is never sent to Alertmanager.

In the plugin, this field is labeled **Pending period**. Setting it to **None** fires the alert on the first evaluation where the condition holds.

{{< admonition type="note" >}}
The pending period is measured in evaluations, not wall-clock time. A rule in a group evaluated every 5 minutes with `for: 1m` fires on the second consecutive matching evaluation: 5 minutes later, not 1. Keep the evaluation interval well below the pending period. Refer to [Rule groups and evaluation](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/alert-rule-evaluation/rule-groups/).
{{< /admonition >}}

## Keeping an alert firing after it clears

Some conditions flap: the expression stops matching for one evaluation, then matches again. Every gap resolves the alert and sends a resolved notification, and the next match sends a new firing one.

`keep_firing_for` holds the alert open for a while after the expression stops matching. With `keep_firing_for: 10m`, the alert stays firing for 10 minutes after the last matching evaluation, and only resolves if the condition is still clear at the end of that window. If the expression starts matching again inside the window, nothing is sent—the alert never stopped firing.

In the plugin, this field is labeled **Keep firing for**. Leave it empty to resolve as soon as the condition clears, which is the default. It takes any Prometheus duration, including compound ones like `1h30m`.

## Writing the expression in the plugin

The rule editor embeds the query editor for the data source you selected, so you get the same autocomplete and syntax help as in Explore. Select the data source first. The editor can't load until it knows which one to build for.

From the rule detail page, **View in Explore** opens the same expression in Explore, which is the quickest way to see what a rule is actually matching right now.
