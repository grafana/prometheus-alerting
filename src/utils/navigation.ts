import { PLUGIN_BASE_URL, ROUTES } from '../constants';
import { DataSourceRuleIdentifier, stringifyIdentifier } from '@grafana/external-rules/identifiers';
import { config } from '@grafana/runtime';
import { urlUtil } from '@grafana/data';

/**
 * Navigation utilities for rule-related pages
 */

export const groups = {
  /**
   * Generate a link to the details page for a rule group
   */
  detailsPageLink(dataSourceUid: string, namespace: string, groupName: string): string {
    return `${PLUGIN_BASE_URL}/groups/${dataSourceUid}/${encodeURIComponent(namespace)}/${encodeURIComponent(
      groupName
    )}`;
  },

  /**
   * Generate a link to edit a rule group
   */
  editPageLink(dataSourceUid: string, namespace: string, groupName: string): string {
    return `${PLUGIN_BASE_URL}/groups/${dataSourceUid}/${encodeURIComponent(namespace)}/${encodeURIComponent(
      groupName
    )}/edit`;
  },
};

export const rules = {
  /**
   * Generate a link to view a specific rule's details
   */
  detailsPageLink(identifier: DataSourceRuleIdentifier): string {
    const id = stringifyIdentifier(identifier);
    return `${PLUGIN_BASE_URL}/rules/${encodeURIComponent(id)}`;
  },

  /**
   * Generate a link to edit a specific rule
   */
  editPageLink(identifier: DataSourceRuleIdentifier): string {
    const id = stringifyIdentifier(identifier);
    return `${PLUGIN_BASE_URL}/rules/${encodeURIComponent(id)}/edit`;
  },

  /**
   * Generate a link to clone/duplicate a specific rule
   */
  clonePageLink(identifier: DataSourceRuleIdentifier): string {
    const id = stringifyIdentifier(identifier);
    return `${PLUGIN_BASE_URL}/rules/new?copyFrom=${encodeURIComponent(id)}`;
  },

  /**
   * Generate a shareable link to view a rule (full URL)
   */
  shareLink(identifier: DataSourceRuleIdentifier): string {
    const detailsLink = rules.detailsPageLink(identifier);
    return `${window.location.origin}${detailsLink}`;
  },
};

/**
 * Creates a link to the rules list with search filters applied.
 * Follows the same pattern as Grafana core's createListFilterLink.
 *
 * @param values - Array of [key, value] pairs for filter parameters
 * @returns URL string with search query parameters

 */
export function createListFilterLink(values: Array<[string, string]>): string {
  const searchQuery = values.map(([key, value]) => `${key}:"${value}"`).join(' ');
  const params = new URLSearchParams({ search: searchQuery });
  return `${PLUGIN_BASE_URL}/${ROUTES.Rules}?${params.toString()}`;
}

export function createExploreLink(dataSourceUid: string, query: string, dataSourceType = 'prometheus'): string {
  return urlUtil.renderUrl(`${config.appSubUrl}/explore`, {
    left: JSON.stringify({
      datasource: dataSourceUid,
      queries: [{ refId: 'A', datasource: { uid: dataSourceUid, type: dataSourceType }, expr: query }],
      range: { from: 'now-1h', to: 'now' },
    }),
  });
}
