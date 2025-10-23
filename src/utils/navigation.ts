import { PLUGIN_BASE_URL } from '../constants';
import { DataSourceRuleIdentifier, stringifyIdentifier } from '@grafana/external-rules/identifiers';

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
