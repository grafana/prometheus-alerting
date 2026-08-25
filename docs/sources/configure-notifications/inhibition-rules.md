---
title: Configure inhibition rules
description: Suppress notifications for one set of alerts while a more important alert is firing, using source matchers, target matchers, and equal labels to keep the suppression correctly scoped.
keywords:
  - alertmanager
  - inhibit rules
  - inhibition
  - suppress
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 500
review_date: '2026-08-19'
---

# Configure inhibition rules

An inhibition rule suppresses one set of alerts while another is firing. It's how you avoid being told about fifty symptoms when one cause explains all of them.

## How inhibition works

An inhibition rule has three parts:

- **Source matchers**—identify the alert that does the suppressing.
- **Target matchers**—identify the alerts that get suppressed.
- **Equal labels**—labels that must have the _same value_ on both for the suppression to apply.

While at least one alert matching the source is firing, any alert matching the target with the same values for the equal labels is suppressed.

The equal labels are what keeps inhibition from being far too broad. Without them, a critical alert anywhere would suppress warnings everywhere.

## A worked example

A data center goes offline. You want the data center alert, not one alert per service inside it.

| Field           | Value                 |
| --------------- | --------------------- |
| Source matchers | `severity = critical` |
| Target matchers | `severity = warning`  |
| Equal labels    | `datacenter`          |

While a critical alert is firing for `datacenter=eu-west`, warnings for `datacenter=eu-west` are suppressed. Warnings in `datacenter=us-east` are untouched, because their `datacenter` value doesn't match.

Drop `datacenter` from the equal labels and one critical alert anywhere silences every warning everywhere—which is the classic way to make inhibition dangerous.

## Create an inhibition rule

1. Click **Inhibit Rules**.
1. Click **Add inhibit rule**.
1. Add **Source Matchers**.
1. Add **Target Matchers**.
1. Add **Equal Labels**—the label names that have to match on both sides.
1. Save.

## Edit or remove

Select a rule to open its drawer, which shows its source matchers, target matchers, and equal labels. From there click **Edit**, or **Remove** and confirm. Removing can't be undone.

## Things to watch for

**Both sides need the labels.** If the source alerts carry `datacenter` but the target alerts don't, they can never be equal, and the rule quietly never fires. Consistent labeling across rules is what makes inhibition work. Refer to [Labels and annotations](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/fundamentals/alert-rules/labels-and-annotations/).

**An alert can inhibit itself.** If your source and target matchers both match the same alert, it suppresses itself. Make sure the two sets are genuinely disjoint—usually by matching on different severity levels.

**Suppression is invisible unless you look.** An inhibited alert sends no notification. The **Alerts** page marks it as inhibited and says how many inhibitions apply, which is the only routine way to notice. Refer to [View active notifications](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/monitor-status/view-active-notifications/).

## Inhibition compared with silences and time intervals

|                     | Driven by            | Expires                   | Use for                              |
| ------------------- | -------------------- | ------------------------- | ------------------------------------ |
| **Inhibition rule** | Another alert firing | No—standing configuration | Cause-and-symptom relationships      |
| **Silence**         | A person creating it | Yes, at a set time        | A known issue or planned maintenance |
| **Time interval**   | The clock            | No—recurring schedule     | Quiet hours                          |
