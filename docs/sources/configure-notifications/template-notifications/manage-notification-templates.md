---
title: Manage notification templates
description: Create, edit, and delete Alertmanager notification templates.
keywords:
  - notification templates
  - create
  - edit
  - delete
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 100
review_date: '2027-08-19'
---

# Manage notification templates

Templates are stored in the Alertmanager configuration and referenced by name from a receiver's integration fields.

## Create a template

1. Click **Templates**.
1. Click **Create template**.
1. Enter a **Name**, conventionally ending in `.tmpl`, for example `slack-notification.tmpl`. Names have to be unique.
1. Enter the **Content**. Wrap each definition in `{{ define "name" }} ... {{ end }}`.
1. Click **Create template**.

The name of the file and the names you `define` inside it are different things. Receivers reference the _defined_ name, not the filename, so one file can hold several definitions used by different receivers.

## Use a template in a receiver

Defining a template changes nothing on its own. To apply it, reference the defined name from the relevant field on a receiver's integration—a Slack integration's title and text fields, for example.

Refer to [Create a receiver](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/configure-notifications/create-receiver/).

## Edit a template

1. Click **Templates**.
1. Select the template.
1. Click **Edit**.
1. Change the content and click **Update template**.

The list shows a preview of each template's content, which is usually enough to find the one you want without opening each.

## Delete a template

1. Select the template.
1. Click **Delete** and confirm.

Deleting can't be undone. Check that no receiver references any of the names defined in it—a receiver pointing at a definition that no longer exists falls back to the default formatting, quietly.

## Editing safely

Templates are only exercised when a notification is sent, so a mistake surfaces during an incident rather than at save time. Two habits help:

- Change one thing at a time, and confirm a real notification still looks right before moving on.
- Keep a working copy of a template's content before a substantial edit, so you can put it back quickly.

The editor is a plain text field, so it won't catch a syntax error for you. Refer to [Template language](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/configure-notifications/template-notifications/language/).
