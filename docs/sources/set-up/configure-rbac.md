---
title: Configure access control
description: Control who can view and edit rules, silences, and Alertmanager configuration.
keywords:
  - rbac
  - permissions
  - access control
  - roles
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 300
review_date: '2027-08-19'
---

# Configure access control

Access is enforced through Grafana role-based access control (RBAC), using the same external alerting permissions that Grafana Alerting uses for data source-managed resources. The plugin defines no permissions of its own, so a user who can already manage external rules and Alertmanager configuration in Grafana can do the same here.

## Permissions

| Permission                           | Grants                                                                  |
| ------------------------------------ | ----------------------------------------------------------------------- |
| `alert.rules.external:read`          | Viewing alerting and recording rules                                    |
| `alert.rules.external:write`         | Creating, editing, cloning, and deleting rules and rule groups          |
| `alert.instances.external:read`      | Viewing alerts and silences                                             |
| `alert.instances.external:write`     | Creating, editing, recreating, and expiring silences                    |
| `alert.notifications.external:read`  | Viewing routes, receivers, templates, time intervals, and inhibit rules |
| `alert.notifications.external:write` | Editing routes, receivers, templates, time intervals, and inhibit rules |

## How permissions map to pages

Read permission controls whether a page is reachable at all. Write permission controls whether the create and edit actions on that page are offered.

| Page           | Needs to view                       | Needs to change                      |
| -------------- | ----------------------------------- | ------------------------------------ |
| Rules          | `alert.rules.external:read`         | `alert.rules.external:write`         |
| Alerts         | `alert.instances.external:read`     | Not applicable—the page is read-only |
| Silences       | `alert.instances.external:read`     | `alert.instances.external:write`     |
| Routes         | `alert.notifications.external:read` | `alert.notifications.external:write` |
| Receivers      | `alert.notifications.external:read` | `alert.notifications.external:write` |
| Templates      | `alert.notifications.external:read` | `alert.notifications.external:write` |
| Time intervals | `alert.notifications.external:read` | `alert.notifications.external:write` |
| Inhibit rules  | `alert.notifications.external:read` | `alert.notifications.external:write` |

Pages a user can't read are hidden from the plugin navigation rather than shown and then refused. Someone with only `alert.rules.external:read` sees a plugin containing rule pages and nothing else.

## Two reasons an action can be unavailable

An action can be missing for two quite different reasons, and it's worth telling them apart before granting anyone more access:

- **Insufficient permissions.** The user's role doesn't include the required permission. Granting the permission fixes it.
- **Not supported.** The data source itself can't do it—most commonly a vanilla Prometheus rules source with no writable ruler API. No amount of permission changes this; refer to [Configure data sources](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/set-up/configure-data-sources/).

## Assign permissions

These permissions are included in the built-in Grafana alerting roles. To grant them individually, create a custom role and assign it to a user, team, or service account.

For the full procedure, refer to [Manage RBAC roles](https://grafana.com/docs/grafana/latest/administration/roles-and-permissions/access-control/manage-rbac-roles/).

{{< admonition type="note" >}}
Custom roles require Grafana Enterprise or Grafana Cloud. On Grafana OSS, use the built-in roles.
{{< /admonition >}}

## Enabling the plugin is separate

Installing and enabling the app requires the Grafana **Admin** role, which is independent of the permissions above. Enabling it once makes the plugin available to everyone; what each person can then do is decided by the permissions in this table.
