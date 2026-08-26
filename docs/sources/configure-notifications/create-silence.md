---
title: Create a silence
description: Temporarily stop notifications for the alert instances that match a set of label matchers, check what a silence covers, and expire or recreate one in the Prometheus Alerting plugin.
keywords:
  - alertmanager
  - silences
  - mute
  - matchers
  - maintenance
labels:
  products:
    - oss
    - enterprise
    - cloud
weight: 300
review_date: '2026-08-19'
---

# Create a silence

Silences stop notifications for alert instances matching a set of label matchers. The alert keeps firing and stays visible; only the notification is suppressed.

Silences need the `alert.instances.external:read` and `alert.instances.external:write` permissions, which are separate from the notification permissions used by the rest of this section.

## Create a silence

1. Click **Silences**.
1. Click **Create Silence**.
1. Under **Matchers**, add at least one matcher: a **Label Name**, an **Operator**, and a **Label Value**. Click **Add Matcher** for more. All matchers have to match for an alert to be silenced.
1. Choose a **Time Mode**:
   - **Relative**: enter a **Duration** such as `2h`, `1d`, `30m`, or `1w`.
   - **Absolute**: pick an explicit **Start Time** and **End Time**.
1. Enter **Created By**, so people know who to ask about it later.
1. Enter a **Comment** explaining why. This is the field that makes a silence understandable to someone finding it a week later.
1. Click **Create Silence**.

### Operators

| Operator | Meaning         |
| -------- | --------------- |
| `=`      | Equal           |
| `!=`     | Not equal       |
| `=~`     | Regex match     |
| `!~`     | Regex not match |

## Silence from an alert or a rule

Rather than typing matchers by hand, start from the thing you want to silence. The rule actions include **Silence notifications**, which opens the silence form pre-filled with matchers for that rule.

This is both faster and safer. Hand-written matchers are easy to get subtly wrong, and a matcher that's too broad silences far more than you meant.

## Check what a silence covers

Open a silence and select the **Affected Alerts** tab. It lists the alerts the silence is currently suppressing, with a count.

Do this after creating any silence with regex matchers. If the tab is empty when you expected matches, either the matchers don't match anything or the silence hasn't started yet. The plugin says as much: no alerts matching can mean the silence expired, or that nothing matches the matchers you defined.

## Expire a silence

Silences aren't deleted, they're expired, and the record stays for audit purposes.

1. Click **Silences**.
1. Select the silence.
1. Click **Expire** and confirm.

Expiring takes effect immediately, and notifications resume for anything it was suppressing.

## Edit and recreate

**Edit** changes an existing silence in place.

**Recreate** opens the form pre-filled from an existing silence, which is how you extend one that has already expired. Expired silences can't be reactivated, so you make a new one from the same definition.

## Find silences

The silence list is filtered by matcher. Searching for `foo="bar"` finds silences with the label `foo` and value `bar`, matching on label name and value only, so it finds both `foo="bar"` and `foo!="bar"`. Regex search is supported too.

By default only active silences are listed. Enable **Show inactive silences** to include expired ones.

## Good practice

- **Always fill in the comment.** A silence with no explanation is one nobody dares remove.
- **Prefer short durations.** A silence that outlives the problem hides real alerts. Extend a short silence rather than opening with a long one.
- **Be specific with matchers.** Silencing on `severity=warning` alone suppresses every warning in the system.
- **Review inactive silences periodically.** A recurring silence usually means a rule needs fixing rather than muting.
