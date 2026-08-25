---
title: Rule groups and evaluation
description: Learn how rules in a group are evaluated together in order on the group's interval, how that interval interacts with the pending period, and how to size groups so evaluations don't lag.
keywords:
  - rule groups
  - evaluation interval
  - sequential evaluation
  - namespaces
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 100
review_date: '2026-08-19'
---

# Rule groups and evaluation

A rule group is the unit of scheduling. Everything in it is evaluated together, on the group's interval, in the order the rules appear.

## Groups and namespaces

Rules sit in a **group**, and groups sit in a **namespace**. Namespaces are containers for organizing groups—in Mimir and Cortex a namespace is roughly a file's worth of rules, and in vanilla Prometheus it corresponds to a rule file on disk.

A rule is identified by all three: its namespace, its group, and its name.

## The evaluation interval

Each group has an interval—every 1 minute, every 5 minutes—that decides how often its rules run. In the plugin this is the **Evaluation interval** field on the group, edited on the group edit page.

The interval is a floor on how quickly you can learn about a problem. A group evaluated every 5 minutes can't tell you about anything sooner than 5 minutes after it starts.

### The interval interacts with the pending period

This is the part that catches people out. The pending period is checked at evaluation time, so it's effectively rounded up to a multiple of the interval.

A rule with `for: 1m` in a group evaluated every 5 minutes doesn't fire after 1 minute. It fires on the second consecutive evaluation where the condition holds—up to 10 minutes after the problem started.

Keep the interval comfortably below the pending period. As a rule of thumb, aim for the pending period to span at least three or four evaluations, so a single missed or noisy evaluation doesn't decide the outcome.

The plugin warns about this directly. If you set an evaluation interval longer than the pending period of rules inside it, it tells you the interval exceeds the pending period of some rules and that alerts may fire immediately.

{{< admonition type="note" >}}
This evaluation interval belongs to a rule group and controls how often rules run. It's unrelated to the Alertmanager group interval, which controls how often notifications are sent. Refer to [Group alert notifications](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/notifications/group-alert-notifications/).
{{< /admonition >}}

## Rules run in order

Within a group, rules are evaluated sequentially, top to bottom. Different groups can run in parallel, but a single group is ordered.

This matters when one rule depends on another. If an alerting rule uses a metric produced by a recording rule, the recording rule has to be in the same group and listed before it—otherwise the alerting rule reads whatever the previous cycle produced, or nothing at all on the first run.

The plugin's group edit page lets you drag rules to reorder them, which is how you fix a dependency that's in the wrong order.

## Group size and timing

A group has to finish evaluating before its next cycle starts. If a group holds many expensive rules and takes longer than its interval to run, evaluations start to lag and alerts arrive late.

If that happens, split the group. Several smaller groups evaluate in parallel; one large group doesn't.

The rule detail page shows **Evaluation Time**, which is how long the last evaluation took, and **Last Evaluation**, which is when it happened. Comparing evaluation time against the interval is the quickest way to spot a group that's running out of headroom.
