---
title: Troubleshooting
description: Resolve common problems with the Prometheus Alerting plugin, from missing pages and read-only rules to alerts that fire without notifying anyone and templates that render empty.
keywords:
  - troubleshooting
  - errors
  - permissions
  - read-only
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 200
review_date: '2026-08-19'
---

# Troubleshooting

Common problems, roughly in the order you're likely to hit them.

## The plugin is empty or pages are missing

**Some pages are missing from the navigation.** Pages you can't read are hidden rather than shown and refused. Check the user's role against the table in [Configure access control](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/set-up/configure-rbac/).

**All the Alertmanager pages are missing.** These need an Alertmanager data source, which is separate from your Prometheus or Mimir data source. Without one they don't appear. Refer to [Configure data sources](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/set-up/configure-data-sources/).

**No data sources appear on the Rules page.** The plugin reads rules from Prometheus and Loki data source types, which covers Mimir and Cortex since they register as Prometheus. Built-in data sources such as `-- Grafana --` are excluded by design.

## Cannot load rules for this data source

The data source exists but its rules can't be read. Check, in order:

1. The data source URL points at something serving the Prometheus rules API.
1. Grafana can reach that URL—network policies and authentication both apply.
1. The endpoint actually implements the API. The plugin's error suggests checking whether the data source supports the Prometheus API, which is the usual cause.

Other data sources keep working, so this error appears next to the failing source rather than replacing the whole page.

## Rules are read-only

The rule detail page shows **⚠ Ruler API Unavailable (Read-only)**, and edit actions are missing.

This is expected for vanilla Prometheus, which loads rules from files on disk and has no API to write them back. It isn't a permissions problem and granting more permissions won't change it. To edit rules from the UI you need a backend with a writable ruler, such as Mimir, Cortex, or Loki.

You can still use **Export** to copy the rule definition out.

## Changes can't be saved

Work through the possibilities in this order:

1. **Missing write permission.** Refer to [Configure access control](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/set-up/configure-rbac/).
1. **Read-only backend**, as above.
1. **Conflicting matchers on a route.** The plugin rejects a route whose matchers conflict with an existing sibling, because one could never match. Check whether an equivalent route already exists.
1. **Duplicate name.** Receiver and template names have to be unique.

## A rule was saved but doesn't appear

Rules take a few seconds to propagate to the ruler. The plugin says the rule is being propagated and refreshes on its own. The same applies after deleting.

If it hasn't appeared after a minute, reload the page and check the rule list filters—an active filter can hide a rule that saved successfully.

## A rule exists but never fires

Check in this order:

1. **Rule health.** A rule in error health isn't evaluating at all, and **Last Error** says why. This is the most common cause and the easiest to miss.
1. **The query.** Open the **Query** tab and click **View in Explore**. If it returns nothing when you expect a problem, the expression is wrong.
1. **The pending period against the evaluation interval.** A pending period shorter than the group's interval doesn't behave the way it reads. Refer to [Rule groups and evaluation](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/alert-rule-evaluation/rule-groups/).
1. **Last Evaluation.** If it's older than the interval, the group is lagging or has stopped.

## An alert fires but no notification arrives

The alert being firing on the **Rules** page only means the ruler is sending it. Work down the chain:

1. **Is it on the Alerts page?** If not, the ruler is sending to a different Alertmanager than the one selected in the picker. This is the most common cause, and the easiest to overlook when several Alertmanagers are configured.
1. **Is it suppressed?** Open the alert. The drawer names the silence, inhibition rule, or time interval responsible.
1. **Which receiver did it go to?** The **Receiver** column shows what actually matched, which is often not the route you expected.
1. **Is the receiver itself working?** Alertmanager considers its job done once it has attempted delivery, so a stale Slack webhook or rotated PagerDuty key produces no visible error here. Check the receiving system.

Refer to [View active notifications](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/monitor-status/view-active-notifications/).

## Too many alerts arrive at once

Usually grouping rather than the rules. Check `group_by` on the route—grouping by too many labels splits one incident into many notifications. Refer to [Group alert notifications](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/notifications/group-alert-notifications/).

If one rule is producing hundreds of instances, the expression probably needs aggregating. Refer to [High-cardinality alerts](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/examples/high-cardinality-alerts/).

## Notifications repeat too often

Check **Repeat interval** on the route. It controls how often an unchanged group is sent again, and a short value here is the usual cause.

If lowering it made no difference, check **Group interval** as well. Repeats are only considered when Alertmanager checks a group, so a repeat interval shorter than the group interval has no extra effect. Refer to [Group alert notifications](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/notifications/group-alert-notifications/).

## Templates render as empty or wrong

There's no preview, so mistakes appear in sent notifications.

- **Empty output**—usually a lost context. Check that `{{ template "name" . }}` includes the trailing dot, and that `.` inside a `range` refers to what you think.
- **A field that's sometimes empty**—probably `.CommonLabels`, which only holds labels shared by every alert in the group. Use `.GroupLabels`, or read the label per alert inside a range.

Refer to [Template reference](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/configure-notifications/template-notifications/reference/).

## Get help

- [Grafana community forum](https://community.grafana.com/)
- [Report issues on GitHub](https://github.com/grafana/prometheus-alerting/issues)
