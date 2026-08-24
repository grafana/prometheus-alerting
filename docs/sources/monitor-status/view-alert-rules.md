---
title: View alert rules
description: Browse alerting and recording rules and inspect their current state.
keywords:
  - rules page
  - browse
  - filters
  - rule details
  - namespaces
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 200
review_date: '2027-08-19'
---

# View alert rules

The **Rules** page lists alerting and recording rules from every configured rules source, organized by data source, then namespace, then group.

Unlike the **Alerts** page, this is the ruler's view: it shows every rule, including the ones that are quiet and the ones that are failing.

## Browse

Rules are grouped by data source. Expand a data source to see its namespaces and groups, and expand a group to see its rules. Large lists page rather than loading everything, with **Show more…** at the bottom.

If a data source can't be read, the plugin shows that it can't load rules for that source and carries on listing the others. One broken data source doesn't hide the rest.

## Filter

The filter sidebar narrows the list by:

- **Search**—free text against rule names.
- **Data source**
- **Namespace** and **Group**
- **Labels**

When nothing matches, the plugin says no alert or recording rules matched your filters, which distinguishes an over-narrow filter from a genuinely empty rules source.

## Rule details

Select a rule to open its detail page, which has three tabs:

**Details** shows evaluation behavior—**Pending Period**, **Evaluation interval**, **Last Evaluation**, **Evaluation Time**, and **Health**, plus **Last Error** when the last evaluation failed. It also shows the rule's labels and annotations, and states whether the ruler API is available, which is what decides if the rule is editable.

**Query** shows the expression, with **View in Explore** to open it in Explore.

**Instances** lists the rule's current alert instances. Refer to [View alert state](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/monitor-status/view-alert-state/).

## What to check when a rule looks wrong

In order:

1. **Health.** A rule in error health isn't evaluating, and **Last Error** says why.
1. **Last Evaluation.** If it's older than the group's interval, the group is lagging or stopped.
1. **Evaluation Time.** If it's close to the group's interval, the group is running out of headroom and should be split. Refer to [Manage rule groups](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/alerting-rules/manage-rule-groups/).
1. **The query, in Explore.** If the rule is healthy and evaluating on time but producing nothing, the expression is the thing to check.

## Group details

Selecting a group shows its **Namespace**, **Interval**, and the rules it contains, in evaluation order. This is where you check that a recording rule comes before the alerting rules that depend on it.

## Recently changed rules

After a create, edit, or delete, the plugin notes that changes may not be reflected yet and refreshes on its own once the ruler catches up. A rule that looks stale immediately after an edit is usually just propagating.
