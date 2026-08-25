---
title: Configure time intervals
description: Define recurring time windows that Alertmanager routes use to mute or allow notifications, learn how the fields combine, and why setting the timezone explicitly matters for a schedule.
keywords:
  - alertmanager
  - time intervals
  - mute timings
  - active timings
  - schedules
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 400
review_date: '2026-08-19'
---

# Configure time intervals

A time interval describes recurring windows of time. Routes use them to mute notifications during those windows, or to only notify inside them.

Unlike a silence, a time interval is a schedule rather than a one-off, and it doesn't expire.

## Create a time interval

1. Click **Time intervals**.
1. Click **Create time interval**.
1. Enter a **Name**. Routes refer to it by this name.
1. Fill in the fields that apply. Every field you leave empty means "any":

   | Field                 | Format                                                | Example                      |
   | --------------------- | ----------------------------------------------------- | ---------------------------- |
   | **Start Time**        | `HH:MM`                                               | `00:00`                      |
   | **End Time**          | `HH:MM`                                               | `23:59`                      |
   | **Weekdays**          | Comma-separated names                                 | `monday, tuesday, wednesday` |
   | **Days of Month**     | Comma-separated numbers, negatives count from the end | `1, 15, -1`                  |
   | **Months**            | Comma-separated names                                 | `january, february`          |
   | **Years**             | Comma-separated numbers                               | `2024, 2025`                 |
   | **Location/Timezone** | IANA timezone                                         | `UTC`, `America/New_York`    |

1. Click **Create Time Interval**.

A time interval can hold several time ranges, so one named interval can describe a schedule that differs across days.

## How the fields combine

All the fields you fill in have to match at once. Setting weekdays to `saturday, sunday` and leaving everything else blank means all day, every weekend, forever. Adding a start and end time narrows it to those hours of the weekend.

An interval with nothing filled in matches all the time, which mutes a route permanently if you attach it. That's rarely what anyone wants.

## Always set the timezone

{{< admonition type="caution" >}}
**Location/Timezone** decides what `09:00` means. Leaving it unset makes the interval depend on the Alertmanager server's timezone, which is usually UTC and rarely what whoever wrote "9 AM" had in mind. Set it explicitly, and set it to the timezone of the people the schedule is for—not the servers.
{{< /admonition >}}

Daylight saving is handled correctly when you use a named zone like `Europe/Berlin`. A fixed offset isn't, and drifts by an hour twice a year.

## Attach it to a route

A time interval does nothing until a route uses it. Open the route and reference the interval by name. Refer to [Configure routes](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/configure-notifications/configure-routes/).

A route can use an interval in two ways:

- **Mute**—don't notify during the window. Use for non-urgent alerts overnight.
- **Active**—only notify during the window. Use for a route that should only reach a team during their working hours.

## Edit or remove

1. Click **Time intervals**.
1. Select the interval.
1. Click **Edit**, or **Remove** and confirm.

Removing can't be undone. Check which routes reference the interval first—removing one that's still in use leaves the route referring to something that doesn't exist.

## Confirming it works

The **Alerts** page marks alerts suppressed this way as muted by a time interval, and says how many. If a time interval isn't behaving as expected, that label is the quickest confirmation of whether it's applying at all. Refer to [View active notifications](https://grafana.com/docs/plugins/grafana-prometheusalerting-app/latest/monitor-status/view-active-notifications/).
