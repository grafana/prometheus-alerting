---
title: View alert state
description: Understand what the state of an alert instance is telling you, read the instances list on a rule's detail page, and tell a firing alert apart from a delivered notification.
keywords:
  - alert state
  - inactive
  - pending
  - firing
  - instances
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 300
review_date: '2026-08-19'
---

# View alert state

A rule can produce many alert instances, one per series its expression returns. The **Instances** tab on a rule's detail page is where you see them.

## Reading the instances list

| Column           | Shows                                       |
| ---------------- | ------------------------------------------- |
| **State**        | Firing or pending                           |
| **Labels**       | The labels identifying this instance        |
| **Active Since** | When the instance entered its current state |

Expanding an instance shows its **Annotations** and its **Value**, the number the expression returned for that series on the last evaluation.

The value is worth checking. A firing alert whose value sits just past the threshold is a different situation from one far beyond it, and it's the quickest way to tell a genuine problem from a threshold that needs adjusting.

## Filter instances

Filter by **State** using **All**, **Firing**, or **Pending**, each showing a count. Search by label narrows further.

The counts alone are informative. Many pending and few firing means a condition that keeps almost holding, which usually points at a pending period that's too short for a noisy signal.

## What each state means

**Pending**: the condition holds but hasn't held long enough. Nothing has been sent to Alertmanager, and nobody has been notified.

**Firing**: the condition has held for the full pending period. The alert is being sent to Alertmanager, which then decides whether to notify.

An instance that disappears from the list has gone inactive: the expression stopped returning that series.

## Firing here but no notification

A firing instance on this page means the ruler is sending the alert. It doesn't mean anyone was told. Between here and a notification sit routing, silences, inhibition rules, and time intervals.

To find out what happened, look at the alert on the **Alerts** page, where the drawer names the receiver it was routed to and any suppression that applied. Refer to [View active notifications](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/monitor-status/view-active-notifications/).

## No instances at all

**No active alert instances** means the expression is returning nothing, which is the healthy case for most rules.

Confirm the rule is actually working before assuming so. Check its health on the **Details** tab, and run the query in Explore. A broken rule and a healthy quiet rule both show no instances.
