---
title: View active notifications
description: Confirm which receiver an alert was routed to and find out why a notification was suppressed, using the Alerts page to see what Alertmanager decided rather than what you configured.
keywords:
  - alertmanager
  - routing
  - silenced
  - inhibited
  - muted
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 400
review_date: '2026-08-19'
---

# View active notifications

The **Alerts** page is also the tool for answering routing and suppression questions, because it shows what Alertmanager decided rather than what you configured.

## Confirm where an alert was routed

The **Receiver** column shows the receiver each alert group was sent to.

Use it after any change to the routing tree. Reading a tree and predicting which route matches is error-prone—sibling ordering and inherited settings both catch people out—while this column reports what actually happened. Refer to [Configure routes](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/configure-notifications/configure-routes/).

You can also filter by receiver, which answers the opposite question: what is this receiver currently being sent?

## Find out why a notification wasn't sent

Alerts in the **Suppressed** state are firing but not notifying. Open the alert to see which mechanism applied:

| The drawer shows           | Meaning                         | Where to fix it                                                                                                                                |
| -------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Silenced by a silence      | A silence matches this alert    | [Create a silence](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/configure-notifications/create-silence/)             |
| Inhibited by an inhibition | Another alert is suppressing it | [Configure inhibition rules](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/configure-notifications/inhibition-rules/) |
| Muted by a time interval   | A route is muted right now      | [Configure time intervals](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/configure-notifications/time-intervals/)     |

The drawer names the specific silence, inhibition, or interval, so you can go and change the right one rather than guessing.

## A routing checklist

When an alert fired but nobody heard about it, work through it in this order:

1. **Is the alert on the Alerts page at all?** If not, the ruler isn't reaching this Alertmanager, or you're looking at the wrong one in the picker.
1. **Is it suppressed?** The drawer names the cause.
1. **Which receiver did it go to?** If it's not the one you expected, the routing tree matched a different branch.
1. **Is the receiver configured correctly?** Routing can be right while the integration itself fails—a stale Slack webhook, a rotated PagerDuty key.

The first three are answered on this page. The fourth is the one it can't tell you about, since Alertmanager considers its job done once it has attempted delivery.

## Alerts that resolve

An alert disappears from the page once it stops firing and its grouping timers lapse. There's no history here—this page is a live view of what Alertmanager holds right now.

For history, use the notification system on the receiving end, or query the alert metrics in your monitoring backend.
