---
title: Manage rule groups
description: Organize data source-managed rules into namespaces and groups, change how often a group is evaluated, reorder rules to satisfy dependencies, and size groups so evaluations finish in time.
keywords:
  - rule groups
  - namespaces
  - evaluation interval
  - reorder
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 300
review_date: '2026-08-19'
---

# Manage rule groups

A rule group is a set of rules evaluated together, on one schedule, in a fixed order. Groups sit inside namespaces.

## View a group

1. Click **Rules**.
1. Select a group.

The group page lists the alerting and recording rules it contains, along with its **Namespace** and **Interval**.

## Change the evaluation interval

1. Open the group.
1. Click **Edit**.
1. Change **Evaluation interval**—how often the rules in this group are evaluated. Durations are written as `30s`, `1m`, `5m`.
1. Click **Save**.

The plugin validates the format, and warns you if the interval is longer than the pending period of rules in the group, since that combination can make alerts fire on their first matching evaluation rather than after the delay you intended. Refer to [Rule groups and evaluation](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/alert-rule-evaluation/rule-groups/).

## Reorder rules

Rules in a group are evaluated top to bottom. On the group edit page, drag a rule to move it.

The case that matters is a recording rule feeding an alerting rule: the recording rule has to come first, or the alerting rule reads a value from the previous cycle. The table shows each rule's name, its pending period, and whether it's a recording rule, so the dependency stays visible while you reorder.

## Rename a group or namespace

The group edit page exposes both **Evaluation group name** and **Namespace**. Both are required, and limited to 255 characters.

{{< admonition type="caution" >}}
A rule is identified by its namespace, group, and name together. Renaming a group or namespace changes the identity of every rule inside it, so anything referring to those rules by full identifier—bookmarks, links in runbooks, external tooling—stops resolving.
{{< /admonition >}}

## Move a rule to another group

Edit the rule and change its **Namespace** or **Group**. There's no separate move action; a rule's location is just a field on the rule.

## Delete a group

1. Open the group.
1. Click **Edit**.
1. Click **Delete group** and confirm.

This deletes every rule in the group, not just the group itself, and can't be undone. The confirmation says so explicitly.

## Groups that can't be edited

Some data sources don't support editing rule groups. The plugin says the group can't be edited and that the data source doesn't support it, rather than offering controls that would fail on save. This is the expected state for vanilla Prometheus, which serves rules from files on disk. Refer to [Configure data sources](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/set-up/configure-data-sources/).

## How to size a group

Two pressures pull against each other:

- A group has to finish evaluating within its interval. Large groups of expensive rules start to lag, and alerts arrive late.
- Rules that depend on each other have to share a group, since ordering is only guaranteed within one.

Start by grouping rules that belong to the same service or team, keep dependent rules together, and split a group if its evaluation time creeps toward its interval. The rule detail page shows **Evaluation Time** and **Last Evaluation**, which is how you notice that happening.
