---
title: Best practices
description: Recommendations for writing alert rules and organizing Alertmanager configuration that stays maintainable as it grows, covering symptoms over causes, labels, grouping, and rule health.
keywords:
  - best practices
  - alert fatigue
  - labels
  - severity
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 100
review_date: '2026-08-19'
---

# Best practices

Advice for keeping a data source-managed alerting setup usable as it grows.

## Alert on symptoms, not causes

Alert on what users experience—requests failing, latency rising, a queue growing without bound. Those alerts stay meaningful as the system changes underneath them.

Alerts on causes, like a specific process restarting or a disk filling on one host, tend to fire during situations that aren't actually problems, and miss failures that arrive by an unanticipated route. Keep the cause-level signals as dashboards, and alert on the symptom.

## Every alert should be actionable

The test: if this fires at 3 AM, is there something a person should do right now?

If the answer is no, it shouldn't be paging anyone. Route it somewhere quieter, or delete it. Alerts nobody acts on train people to ignore the ones that matter, which is a far worse failure than missing an alert.

## Be consistent about labels

Routing, grouping, silencing, and inhibition all work on labels, and all of them break when labels are applied inconsistently.

Agree on a small set every rule carries—typically `severity` and a team or service label—and use the same values everywhere. A routing tree can only send critical alerts to on-call if every rule agrees on what `severity: critical` means and spells it identically.

Refer to [Labels and annotations](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/alert-rules/labels-and-annotations/).

## Set pending periods deliberately

A pending period that's too short produces alerts that fire and resolve on their own. Too long, and you learn about problems late.

Match it to how long the condition has to hold before it's genuinely worth interrupting someone. Then check the group's evaluation interval is well below it—a pending period shorter than the interval doesn't do what it looks like it does. Refer to [Rule groups and evaluation](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/alert-rule-evaluation/rule-groups/).

## Write annotations for whoever gets paged

The person reading the notification may not have written the rule. Give them:

- A **summary** that names what broke and where.
- A **description** with the numbers.
- A **runbook_url** pointing at what to do.

An alert saying only `HighErrorRate` sends someone hunting. One saying which service, how high, and where the runbook is lets them start working.

## Group so that one incident is one notification

Grouping is the main defense against a broad outage flooding a channel. Group by the labels that describe the scope of an incident—commonly `alertname` and a cluster or environment label.

Keep the repeat interval long. A short one is a reliable way to make people mute the channel. Refer to [Group alert notifications](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/notifications/group-alert-notifications/).

## Use inhibition for known cause-and-effect

When one failure reliably produces a cascade of others, encode that as an inhibition rule rather than expecting people to work it out mid-incident.

Always set equal labels, so the suppression is scoped. Refer to [Configure inhibition rules](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/configure-notifications/inhibition-rules/).

## Keep silences short and explained

Always fill in the comment—a silence nobody understands is one nobody dares remove. Prefer a short silence you extend over a long one you forget.

Review inactive silences periodically. A silence that keeps being recreated is telling you a rule needs fixing rather than muting.

## Watch rule health, not just firing alerts

A rule failing to evaluate produces no alerts, which looks exactly like everything being fine.

Check rule health periodically, and consider alerting on it—most Prometheus-compatible backends expose rule evaluation failures as metrics, so you can write a rule that watches your other rules. Refer to [Alert rule state and health](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/alert-rule-evaluation/alert-rule-state-and-health/).

## Test routing changes against real alerts

After changing the routing tree, check the **Receiver** column on the **Alerts** page for an alert that's currently firing. Predicting which route matches is easy to get wrong; reading what actually happened isn't. Refer to [View active notifications](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/monitor-status/view-active-notifications/).

## Keep rule groups small enough to finish

A group has to evaluate within its interval. When evaluation time creeps toward the interval, split the group—several smaller groups run in parallel, one large one doesn't.
