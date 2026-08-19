---
title: Group alert notifications
description: Learn how Alertmanager batches related alerts into a single notification.
keywords:
  - alertmanager
  - grouping
  - group_by
  - group_wait
  - group_interval
  - repeat_interval
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 300
review_date: '2027-08-19'
---

# Group alert notifications

Grouping is what stops a broad outage from producing hundreds of separate notifications. Alertmanager batches related alerts and sends one notification describing all of them.

## Group by

**Group by** names the labels that define a group. Alerts with the same values for those labels land in the same group and share a notification.

Grouping by `alertname` and `cluster` means all `InstanceDown` alerts in one cluster arrive as a single notification listing every affected instance. Fifty failing machines become one message instead of fifty.

The choice is a trade-off:

- **Group by few labels**—fewer, larger notifications. Good for reducing noise, but individual alerts are easier to overlook inside a long list.
- **Group by many labels**—more, smaller notifications. Each is specific, but a wide outage floods the channel.

Grouping by nothing at all puts every alert into one group, which produces a single notification per route no matter what's happening.

## The three timers

Three settings control when a group's notification is sent. They look similar and are easy to confuse. The key to keeping them straight is that Alertmanager works on a repeating cycle for each group, rather than reacting to each alert as it arrives. Every group runs its own cycle, independently of the others.

**Group wait**—how long Alertmanager waits between creating a new group and sending its first notification. Nothing goes out during this window, which gives related alerts a chance to arrive and be batched together, and gives inhibition rules a chance to take effect. Defaults to 30 seconds.

**Group interval**—how long between one check of a group and the next, after the first notification. The timer restarts at each check, not when an alert arrives. Defaults to 5 minutes.

**Repeat interval**—how long before an unchanged group is sent again, as a reminder that something is still broken. Defaults to 4 hours.

The one people most often get wrong is the group interval. It isn't a delay that starts when a new alert shows up; it's a fixed cycle. An alert joining just before a check goes out almost immediately, and one joining just after waits nearly the full interval.

### What happens at each check

After the first notification, Alertmanager checks the group every group interval. It sends a notification if any of the following is true:

- A new alert has started firing in the group.
- Every alert in the group has resolved.
- An alert has resolved and the receiver has **Send resolved** turned on.
- Nothing has changed, but the repeat interval has passed since the last notification.

Otherwise nothing is sent, and the group is checked again one group interval later.

### A worked sequence

With group wait 30s, group interval 5m, and repeat interval 4h:

| Time            | What happens                                                                                                          |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| 0:00            | The first alert arrives and creates the group. Nothing is sent.                                                       |
| 0:30            | Group wait elapses. The first notification goes out, covering everything that arrived in those 30 seconds.            |
| 2:00            | A second alert joins the group. Nothing is sent yet.                                                                  |
| 5:30            | Next check. The group changed, so a notification goes out.                                                            |
| 10:30, 15:30, … | Checks continue every 5 minutes. Nothing has changed and 4 hours have not passed, so nothing is sent.                 |
| 4:05:30         | The first check at or after 4 hours since the last notification. The repeat interval has passed, so it is sent again. |

{{< admonition type="note" >}}
A repeat interval shorter than the group interval has no extra effect. Repeats are only considered at a check, so the soonest a notification can repeat is at the next group interval. A repeat interval of 1 minute with a group interval of 5 minutes gives you a repeat every 5 minutes.
{{< /admonition >}}

## Where these are set

All four settings live on routes, and child routes inherit them from their parent. Setting them on the default route establishes the baseline; override them on a child route where a particular class of alert needs different behavior.

In the plugin they appear on the route edit form as **Group by**, **Group wait**, **Group interval**, and **Repeat interval**. Refer to [Configure routes](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/configure-notifications/configure-routes/).
