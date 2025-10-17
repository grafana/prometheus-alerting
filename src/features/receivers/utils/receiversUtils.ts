import { type Receiver } from '@grafana/external-alertmanager/vanilla';

/**
 * Generates a human-readable description of a ContactPoint by summarizing its integrations.
 * If the ContactPoint has no integrations, it returns an empty placeholder text.
 *
 * For integrations, it counts the occurrences of each type and formats them as a comma-separated list.
 * Multiple integrations of the same type are indicated with a count in parentheses.
 *
 * @param receiver - The Receiver object to describe
 * @returns A string description of the Receiver's integrations
 */
export function getContactPointDescription(receiver: Receiver): string {
  const integrationCounts: Record<string, number> = {};

  const countIntegration = (type: string, count: number) => {
    if (count > 0) {
      integrationCounts[type] = count;
    }
  };

  countIntegration('email', receiver.email_configs?.length ?? 0);
  countIntegration('slack', receiver.slack_configs?.length ?? 0);
  countIntegration('pagerduty', receiver.pagerduty_configs?.length ?? 0);
  countIntegration('webhook', receiver.webhook_configs?.length ?? 0);
  countIntegration('opsgenie', receiver.opsgenie_configs?.length ?? 0);
  countIntegration('wechat', receiver.wechat_configs?.length ?? 0);
  countIntegration('pushover', receiver.pushover_configs?.length ?? 0);
  countIntegration('victorops', receiver.victorops_configs?.length ?? 0);
  countIntegration('sns', receiver.sns_configs?.length ?? 0);
  countIntegration('telegram', receiver.telegram_configs?.length ?? 0);
  countIntegration('discord', receiver.discord_configs?.length ?? 0);
  countIntegration('webex', receiver.webex_configs?.length ?? 0);
  countIntegration('msteams', receiver.msteams_configs?.length ?? 0);

  if (Object.keys(integrationCounts).length === 0) {
    return '<empty contact point>';
  }

  const description = Object.entries(integrationCounts)
    .map(([type, count]) => {
      // either "email" or "email (2)" but not "email (1)"
      return count > 1 ? `${type} (${count})` : type;
    })
    .join(', ');

  return description;
}
