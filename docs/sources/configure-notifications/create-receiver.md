---
title: Create a receiver
description: Add and manage Alertmanager receivers such as email, Slack, PagerDuty, and webhooks, choose whether to send resolved notifications, and understand what renaming or deleting one breaks.
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

# Create a receiver

A receiver is a named set of integrations. Routes refer to receivers by name, so a receiver is the bridge between your routing tree and the outside world.

## Create a receiver

1. Click **Receivers**.
1. Click **Create receiver**.
1. Enter a **Name**. Names have to be unique—the plugin tells you if one is already taken.
1. Click **Add integration** and select an **Integration type**.
1. Fill in the fields for that integration. Required fields are marked, and the form won't submit until they're filled.
1. Optionally enable **Send resolved** to also notify when the alert stops firing.
1. Add more integrations if the receiver should notify several places.
1. Click **Create receiver**.

A receiver with no integrations saves successfully and delivers nothing. The plugin points this out, since it's almost never intentional.

## Supported integrations

Email, Slack, PagerDuty, OpsGenie, Pushover, Discord, Microsoft Teams, Telegram, VictorOps, Webex, WeChat, Amazon SNS, and generic webhooks.

Each type has its own fields. A few of the common ones:

| Integration     | Key fields                                                        |
| --------------- | ----------------------------------------------------------------- |
| Email           | **To**, **From**, **SMTP host**, and optional SMTP authentication |
| Slack           | **API URL** (the webhook URL) and **Channel**                     |
| PagerDuty       | **Routing key**—the integration key from the PagerDuty service    |
| Microsoft Teams | **Webhook URL**                                                   |
| Webhook         | The endpoint URL, plus HTTP configuration                         |

If the Alertmanager configuration contains an integration type the plugin doesn't know, it says the type isn't supported rather than hiding it. Take care editing such a receiver—the plugin can show you that the integration exists, but not its fields.

## Choosing send resolved

Turn it on for chat-style integrations, where a resolved message usefully closes the loop.

Leave it off for paging integrations that manage incident lifecycle themselves. PagerDuty and OpsGenie resolve incidents through their own APIs, and a second resolved notification is redundant noise.

## Edit a receiver

1. Click **Receivers**.
1. Select the receiver.
1. Click **Edit**.
1. Change what you need and click **Update receiver**.

{{< admonition type="caution" >}}
Renaming a receiver doesn't update the routes pointing at it. Update those routes first, or the rename leaves them referring to a receiver that no longer exists. Refer to [Configure routes](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/configure-notifications/configure-routes/).
{{< /admonition >}}

## Delete a receiver

1. Select the receiver.
1. Click **Delete** and confirm.

If routes still use the receiver, the plugin warns you and says how many, because deleting it means those alerts have nowhere to go.

The default receiver can't be deleted. The default route always needs somewhere to send, so the plugin refuses rather than leaving the configuration invalid.

## Verify it works

Receivers are only exercised when a notification is actually sent, so a configuration error tends to surface at the worst moment. The plugin has no way to send a test notification, so the check is to wait for a real alert: after one fires, open the **Alerts** page and confirm the **Receiver** column shows the receiver you expect, then confirm the notification arrived in the receiving system.
