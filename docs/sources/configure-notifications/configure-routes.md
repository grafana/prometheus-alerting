---
title: Configure routes
description: Build the Alertmanager routing tree that decides which receiver each alert goes to, order sibling routes correctly, and use the continue option to send one alert to two receivers.
keywords:
  - alertmanager
  - routes
  - routing tree
  - matchers
  - grouping
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 100
review_date: '2026-08-19'
---

# Configure routes

The **Routes** page renders the Alertmanager routing tree. Each route has matchers, a receiver, and optional grouping and timing settings, and child routes inherit from their parent.

For how matching works, refer to [The routing tree](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/notifications/routing-tree/).

## View a route

Select any route in the tree to open a drawer showing its configuration, matchers, and child routes. The drawer says how many children the route has, which is worth checking before you change or delete anything.

The plugin annotates two cases directly in the tree:

- A route with no matchers is marked as matching all labels. The default route is always like this.
- A route with **continue** enabled is marked as continuing to match other routes.

## Add a route

1. Click **Routes**.
1. Select the route that should be the parent. To add a top-level route, select the default route.
1. Click to add a child route.
1. Add **matchers**—a label name, an operator, and a value. Click **Add matcher** for more. All matchers on a route have to match.
1. Select a **Receiver**. Leave it unset to inherit the parent's.
1. Optionally set **Group by**, **Group wait**, **Group interval**, and **Repeat interval**. Unset fields inherit from the parent. Refer to [Group alert notifications](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/notifications/group-alert-notifications/).
1. Optionally enable **Continue matching subsequent sibling nodes** to let matching carry on past this route.
1. Save.

## Order routes carefully

Sibling routes are checked top to bottom, and the first match wins among them. A general route placed above a specific one swallows everything the specific route was meant to catch.

Put your most specific routes first, and keep the broad catch-alls last.

## Send one alert to two places

Routing takes a single branch, so an alert normally reaches exactly one receiver. Enable **continue** on a route to change that: after it matches and sends, matching continues with the following siblings.

This is how you page on-call and post to a chat channel for the same alert.

## Edit or delete a route

Open the route's drawer and click **Edit** or **Delete**.

{{< admonition type="caution" >}}
Deleting a route deletes all of its children. The confirmation says how many will go with it. There's no undo—the change is written straight to the Alertmanager configuration.
{{< /admonition >}}

## Conflicting matchers

The plugin rejects a route whose matchers conflict with an existing sibling, since one of them could never match anything. If you see this, check whether an equivalent route already exists rather than working around the error.

## Test your routing

The **Alerts** page shows the receiver each alert was routed to. After changing the tree, find a current alert and confirm it landed where you intended—this is faster and more reliable than reasoning about the tree on paper. Refer to [View active notifications](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/monitor-status/view-active-notifications/).
