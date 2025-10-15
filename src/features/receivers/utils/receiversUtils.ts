import { type Receiver } from '@grafana/external-alertmanager/vanilla';

/**
 * Calculates the total number of integration configurations for a receiver.
 *
 * A receiver can have multiple types of integrations (email, slack, pagerduty, etc.),
 * and each integration type can have multiple configurations.
 *
 * @param receiver - The receiver object to count configurations for
 * @returns The total number of integration configurations across all types
 */
export function getTotalReceiverConfigs(receiver: Receiver): number {
  let total = 0;

  if (receiver.email_configs) {
    total += receiver.email_configs.length;
  }
  if (receiver.slack_configs) {
    total += receiver.slack_configs.length;
  }
  if (receiver.pagerduty_configs) {
    total += receiver.pagerduty_configs.length;
  }
  if (receiver.webhook_configs) {
    total += receiver.webhook_configs.length;
  }
  if (receiver.opsgenie_configs) {
    total += receiver.opsgenie_configs.length;
  }
  if (receiver.wechat_configs) {
    total += receiver.wechat_configs.length;
  }
  if (receiver.pushover_configs) {
    total += receiver.pushover_configs.length;
  }
  if (receiver.victorops_configs) {
    total += receiver.victorops_configs.length;
  }
  if (receiver.sns_configs) {
    total += receiver.sns_configs.length;
  }
  if (receiver.telegram_configs) {
    total += receiver.telegram_configs.length;
  }
  if (receiver.discord_configs) {
    total += receiver.discord_configs.length;
  }
  if (receiver.webex_configs) {
    total += receiver.webex_configs.length;
  }
  if (receiver.msteams_configs) {
    total += receiver.msteams_configs.length;
  }

  return total;
}
