---
title: Alerts page
description: View the firing and suppressed alerts the selected Alertmanager currently holds, filter them by label, receiver, or state, and find out why a suppressed alert sent no notification.
keywords:
  - alerts page
  - firing
  - suppressed
  - unprocessed
  - filters
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 100
review_date: '2026-08-19'
---

# Alerts page

The **Alerts** page shows what the selected Alertmanager currently holds. It's the Alertmanager's view, so it shows alerts that have finished their pending period and been sent—pending alerts don't appear here.

## Alert states

Alerts are counted in three states, each available as a filter:

| State           | Meaning                                                                                |
| --------------- | -------------------------------------------------------------------------------------- |
| **Active**      | Firing and not suppressed. These generate notifications.                               |
| **Suppressed**  | Firing, but silenced, inhibited, or muted by a time interval. No notification is sent. |
| **Unprocessed** | Received but not yet processed. Normally transient.                                    |

A large suppressed count is worth a look. It usually means an over-broad silence or an inhibition rule doing more than intended, and both hide real problems.

## Reading the list

| Column         | Shows                                  |
| -------------- | -------------------------------------- |
| **State**      | Active, suppressed, or unprocessed     |
| **Labels**     | The alert's labels                     |
| **Alerts**     | How many alerts are in the group       |
| **Grouped by** | The labels this group was grouped by   |
| **Receiver**   | Which receiver the group was routed to |
| **Started**    | When it started firing                 |

The **Receiver** column is the one that answers "where did this go?"—it reflects the route that actually matched, not the route you think should have matched.

## Filter alerts

- **Filter by labels** accepts matchers such as `foo=bar` and `env=~prod.*`, so you can narrow by regex as well as exact value.
- **Filter by receiver** narrows to alerts routed to a particular receiver.
- The **Active**, **Suppressed**, and **Unprocessed** filters narrow by state.

## Alert details

Select an alert to open a drawer with:

- **Labels** and **Annotations**—the alert's identity, and what it says about itself.
- **Timing**—when it started, when it ends, and when it was last updated.
- **Receivers**—where it was routed.
- **Generator URL**—a link back to the rule in the source system.

If the alert is suppressed, the drawer names the cause: which silence silenced it, which inhibition rule inhibited it, or which time interval muted it. This is the fastest way to answer why a firing alert didn't page anyone.

## An empty page

If no alerts are listed, the plugin says none were found in the Alertmanager. That's expected when nothing is wrong, but it's also what a misconfiguration looks like.

To tell them apart, check the **Rules** page. Rules firing there but no alerts here means the ruler is sending to a different Alertmanager than the one selected. Refer to [Troubleshooting](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/guides/troubleshooting/).
