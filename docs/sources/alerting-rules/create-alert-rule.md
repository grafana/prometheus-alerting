---
title: Create an alert rule
description: Create a data source-managed alerting rule from the Rules page.
keywords:
  - alert rules
  - create
  - promql
  - logql
  - pending period
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 100
review_date: '2027-08-19'
---

# Create an alert rule

An alerting rule watches an expression and produces alerts when it returns results.

## Before you begin

- Make sure you have the `alert.rules.external:write` permission.
- Make sure the data source you're writing to supports a ruler API.

## Create the rule

1. Click **Rules** in the plugin navigation.
1. Click **New alert rule**.
1. Under **Define alert rule**, enter a **Name**. This becomes the alert's `alertname` label, so make it descriptive and stable—renaming it later creates what Alertmanager treats as a different alert.
1. Select the **Data source** to write the rule to. The query editor can't load until you've chosen one.
1. Write the **Expression**. Write it so that it returns nothing when everything is healthy, and returns one series per problem otherwise. Refer to [Queries and conditions](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/alert-rules/queries-conditions/).
1. Set the **Pending period**—how long the condition has to hold before the alert fires. Select **None** to fire on the first matching evaluation.
1. Optionally set **Keep firing for**—how long the alert keeps firing after the condition stops being met. Leave it empty to resolve as soon as the condition clears. It takes a duration like `5m`, or a compound one like `1h30m`.
1. Choose a **Namespace** and **Group**. Both pickers search existing values as you type and let you create a new one if nothing matches.
1. Add **Labels** for routing. Click **Add labels** to open the label editor.
1. Add **Annotations** describing what happened and what to do about it. Click **Add custom annotation** for keys beyond the standard ones.
1. Click **Save**.

Names, namespaces, and groups are each limited to 255 characters, and all are required.

## Check the expression before saving

The editor includes a **Query Preview**. Click **Run query** to execute the expression against the data source and see what comes back, paged if there are many series.

This is the single most useful step in the form. The preview tells you how many alert instances the rule will produce right now—no rows means the rule fires nothing, and a hundred rows means a hundred alerts. It's much easier to notice a missing aggregation here than after the rule is live.

## After saving

Rules take a few seconds to reach the ruler. The plugin shows that the rule is being propagated and refreshes on its own when it lands, so an empty-looking rule immediately after saving is expected.

Once it appears, check its health on the rule detail page. A rule showing **error** health isn't watching anything. Refer to [Alert rule state and health](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/alert-rule-evaluation/alert-rule-state-and-health/).

## Other actions on a rule

From the rule list and detail pages:

| Action                    | What it does                                              |
| ------------------------- | --------------------------------------------------------- |
| **Edit**                  | Change the rule in place                                  |
| **Duplicate**             | Create a copy to edit as a new rule                       |
| **Export**                | Download the rule definition, or copy it to the clipboard |
| **Copy link**             | Copy a direct URL to the rule                             |
| **Silence notifications** | Create a silence pre-filled with this rule's matchers     |
| **Delete**                | Remove the rule from its group                            |

**Duplicate** and **Edit** are only available for rules on data sources with a ruler API—the plugin says so rather than failing when you try.

**Export** works everywhere, including read-only Prometheus sources, which makes it a practical way to copy a rule out of Prometheus and into Mimir.

## Delete a rule

1. Open the rule.
1. Click **Delete**.
1. Confirm. The dialog names the rule, its group, and its namespace, since names alone are easy to confuse.

Deletion can't be undone. As with creation, the plugin waits for the change to propagate before showing the updated list.
