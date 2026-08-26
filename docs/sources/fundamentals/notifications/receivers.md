---
title: Receivers
description: Understand what an Alertmanager receiver is, which notification integrations it can hold, and why renaming or deleting one affects the routes that reference it by name.
keywords:
  - alertmanager
  - receivers
  - integrations
  - email
  - slack
  - pagerduty
  - webhook
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 200
review_date: '2026-08-19'
---

# Receivers

A receiver is a named destination for notifications. Routes refer to receivers by name, which is the only thing that connects the routing tree to the outside world.

## A receiver holds integrations

A receiver isn't a single destination. It's a named set of **integrations**, each one a configured connection to a notification system. A receiver with a Slack integration and a PagerDuty integration sends to both whenever it's used.

A receiver with no integrations is valid configuration and delivers nothing. The plugin points this out when you create one, since it's rarely what you want.

## Supported integration types

The plugin can configure these integration types:

| Integration     | Sends to                      |
| --------------- | ----------------------------- |
| Email           | An SMTP server                |
| Slack           | A Slack channel via webhook   |
| PagerDuty       | A PagerDuty service           |
| OpsGenie        | OpsGenie                      |
| Pushover        | Pushover                      |
| Discord         | A Discord channel via webhook |
| Microsoft Teams | A Teams channel via webhook   |
| Telegram        | A Telegram chat               |
| VictorOps       | VictorOps                     |
| Webex           | Webex                         |
| WeChat          | WeChat                        |
| Amazon SNS      | An SNS topic                  |
| Webhook         | Any HTTP endpoint you control |

If the Alertmanager configuration contains an integration type the plugin doesn't know how to render, it says so rather than hiding it, so you won't silently lose configuration by editing a receiver that contains one.

## Resolved notifications

Each integration has a **send resolved** option, controlling whether a notification is also sent when the alert stops firing.

Turning it on is useful for chat-style integrations, where a resolved message closes the loop. It's often unwanted for paging integrations, which usually resolve incidents through their own mechanism.

## Naming matters

Routes reference receivers by name, so the name is effectively an interface. Renaming a receiver breaks every route pointing at it.

The plugin guards the related case: deleting a receiver still used by routes warns you first, and says how many routes use it, because the result would be alerts routed to a receiver that no longer exists. The default receiver can't be deleted at all, since the default route always needs somewhere to send.

## Where notification content comes from

Receivers decide where a notification goes. What it looks like comes from templates. Refer to [Notification templates](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/configure-notifications/template-notifications/).
