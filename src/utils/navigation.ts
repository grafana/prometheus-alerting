/**
 * Navigation utilities for rule-related pages
 */

export const groups = {
  /**
   * Generate a link to the details page for a rule group
   */
  detailsPageLink(dataSourceUid: string, namespace: string, groupName: string): string {
    return `/alerting/${dataSourceUid}/${encodeURIComponent(namespace)}/${encodeURIComponent(groupName)}`;
  },
};
