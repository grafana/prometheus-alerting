---
title: The routing tree
description: Understand how Alertmanager walks the routing tree to pick a receiver, why the deepest match wins, how matchers and inheritance work, and what the continue option changes.
keywords:
  - alertmanager
  - routes
  - routing tree
  - matchers
  - continue
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 100
review_date: '2026-08-19'
---

# The routing tree

The routing tree decides which receiver an alert goes to. It's a tree of routes, each with matchers and a receiver, evaluated from the top.

## How matching works

Alertmanager starts at the **default route**, the root of the tree, and walks down:

1. Check each child route in order, top to bottom.
1. If a child's matchers all match the alert's labels, descend into it and repeat with its children.
1. When no child matches, the current route handles the alert and its receiver is used.

Two things follow from this, and both surprise people:

**The deepest match wins, not the first.** Matching keeps descending as long as children match. The receiver that ends up being used belongs to the last route matched, not the first.

**Only one branch is taken.** Once a route matches, its siblings further down the list are skipped. Order matters: put specific routes above general ones, or the general one swallows everything. Set `continue: true` on a route if you want matching to keep going into its siblings anyway. This is useful when you want an alert to notify more than one receiver.

The default route has no matchers, so it matches everything. It's the catch-all, and its receiver is what any alert nothing else claims will use. The plugin marks this explicitly, noting that the route matches all labels.

## Matchers

A matcher compares one label against a value:

| Operator | Meaning                           |
| -------- | --------------------------------- |
| `=`      | Equals                            |
| `!=`     | Not equal                         |
| `=~`     | Matches regular expression        |
| `!~`     | Does not match regular expression |

Multiple matchers on one route are combined with AND. Every one has to match.

Matchers only see labels. Annotations play no part in routing, which is why anything that needs to affect where an alert goes has to be a label. Refer to [Labels and annotations](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/alert-rules/labels-and-annotations/).

## Continue

Normally a matching route ends the search among its siblings. The **continue** option changes that: after this route matches, matching carries on with the following sibling routes.

This is how you send one alert to two places. A route matching `severity=critical` with continue enabled sends to PagerDuty and then lets a later route also send it to Slack.

Without continue, you can't deliver the same alert to two receivers through routing alone. The plugin flags routes with this enabled, noting that the route will continue matching other routes.

## Inherited settings

Child routes inherit from their parent: the receiver, the grouping, and the timing options. A child only needs to specify what it changes.

Practically, that means the default route is where you set sensible defaults for everything, and child routes override the pieces that differ.

## Working with routes in the plugin

The **Routes** page renders the tree. Selecting a route opens a drawer showing its configuration, its matchers, and how many child routes it has. From there you can edit or delete it.

Deleting a route deletes its children too. The plugin says how many will go with it before you confirm.
