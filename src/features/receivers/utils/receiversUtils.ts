import { type Receiver } from '@grafana/external-alertmanager/vanilla';
import { getAllIntegrationTypes, getIntegrationCount } from './integrationIcons';

export interface IntegrationCount {
  type: string;
  count: number;
}

/**
 * Gets all integration types and their counts for a receiver.
 * @param receiver - The Receiver object to analyze
 * @returns An array of integration types and counts
 */
export function getReceiverIntegrations(receiver: Receiver): IntegrationCount[] {
  const integrations: IntegrationCount[] = [];

  for (const type of getAllIntegrationTypes()) {
    const count = getIntegrationCount(receiver, type);
    if (count > 0) {
      integrations.push({ type, count });
    }
  }

  return integrations;
}

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

  for (const type of getAllIntegrationTypes()) {
    const count = getIntegrationCount(receiver, type);
    if (count > 0) {
      integrationCounts[type] = count;
    }
  }

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
