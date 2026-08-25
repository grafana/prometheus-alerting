---
title: Alert rule state and health
description: Understand the inactive, pending, and firing states of an alert instance, and how rule health tells you whether the rule itself evaluated successfully in the Prometheus Alerting plugin.
keywords:
  - alert state
  - inactive
  - pending
  - firing
  - health
  - recording
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 200
review_date: '2026-08-19'
---

# Alert rule state and health

The plugin reports two independent things about a rule: its **state**, which is about the alerts it's producing, and its **health**, which is about whether the rule itself is working.

They're worth keeping separate. A rule can be perfectly healthy and producing no alerts, or badly broken and therefore silent—and those look identical if you only watch for firing alerts.

## Alert state

State applies to alerting rules and describes what its alert instances are doing.

| State        | Meaning                                                                                                                |
| ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| **Inactive** | The expression returns nothing. Nothing is wrong.                                                                      |
| **Pending**  | The condition holds, but hasn't held long enough to satisfy the pending period. Nothing has been sent to Alertmanager. |
| **Firing**   | The condition has held for the full pending period. The alert is being sent to Alertmanager.                           |

State is per instance, not per rule. One rule can have some instances firing while others are pending and others have gone inactive. The rule detail page shows this under **Instances**, with counts and a filter for **All**, **Firing**, and **Pending**.

Recording rules have no alert state. The plugin shows them as **Recording**.

## Health

Health answers a different question: did the last evaluation succeed?

| Health      | Meaning                                                                                |
| ----------- | -------------------------------------------------------------------------------------- |
| **ok**      | The rule evaluated without error.                                                      |
| **error**   | The last evaluation failed. **Last Error** on the rule detail page carries the reason. |
| **unknown** | The rule hasn't been evaluated yet—usually a rule that was only just created.          |

A rule in **error** health produces no alerts, which is the dangerous case: the thing it was watching could be broken and you'd hear nothing. Common causes are a query that references a metric that no longer exists, a syntax error introduced by an edit, or a query too expensive to complete.

For recording rules the plugin distinguishes this explicitly, showing **Recording error** when the recording rule itself failed.

{{< admonition type="caution" >}}
Watch rule health, not just firing alerts. A silent alerting stack looks the same whether everything is fine or every rule is failing to evaluate. Refer to [Best practices](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/guides/best-practices/).
{{< /admonition >}}

## Newly created rules

Rules take a moment to reach the ruler after you save them. During that window the plugin shows that the rule is being propagated to the monitoring system and refreshes on its own once it lands. This is normal and usually takes a few seconds—the same applies after deleting a rule.
