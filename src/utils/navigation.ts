import { ALERTMANAGER_QUERY_PARAM, PLUGIN_BASE_URL, ROUTES } from '../constants';
import { DataSourceRuleIdentifier, stringifyIdentifier } from '@grafana/external-rules/identifiers';
import { config } from '@grafana/runtime';
import { urlUtil } from '@grafana/data';
import { isPrivateLabelKey } from './labels';

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

/**
 * Matcher format for silence creation
 */
export interface SilenceMatcher {
  name: string;
  value: string;
  isRegex?: boolean;
  isEqual?: boolean;
}

export const silences = {
  /**
   * Generate a link to create a new silence with pre-filled matchers
   */
  createPageLink(matchers?: SilenceMatcher[]): string {
    if (!matchers || matchers.length === 0) {
      return `${PLUGIN_BASE_URL}/${ROUTES.CreateSilence}`;
    }
    const params = new URLSearchParams({
      matchers: JSON.stringify(matchers),
    });
    return `${PLUGIN_BASE_URL}/${ROUTES.CreateSilence}?${params.toString()}`;
  },

  /**
   * Generate a link to create a silence for a specific rule by alertname
   */
  createForRuleLink(alertName: string, additionalLabels?: Record<string, string>): string {
    const matchers: SilenceMatcher[] = [{ name: 'alertname', value: alertName, isRegex: false, isEqual: true }];

    if (additionalLabels) {
      Object.entries(additionalLabels).forEach(([name, value]) => {
        matchers.push({ name, value, isRegex: false, isEqual: true });
      });
    }

    return silences.createPageLink(matchers);
  },

  /**
   * Generate a link to create a silence that matches exactly one alert instance.
   *
   * Every label the instance carries becomes an equality matcher, so the silence only
   * suppresses that instance and not its siblings in the same group.
   */
  createForAlertInstanceLink(labels: Record<string, string>): string {
    const matchers: SilenceMatcher[] = Object.entries(labels)
      .filter(([name]) => !isPrivateLabelKey(name))
      .map(([name, value]) => ({ name, value, isRegex: false, isEqual: true }));

    return silences.createPageLink(matchers);
  },

  /**
   * Generate a link to the silences list, optionally narrowed to specific silence IDs.
   */
  listPageLink(silenceIds?: string[]): string {
    if (!silenceIds || silenceIds.length === 0) {
      return `${PLUGIN_BASE_URL}/${ROUTES.Silences}`;
    }
    const params = new URLSearchParams({ silenceIds: silenceIds.join(',') });
    return `${PLUGIN_BASE_URL}/${ROUTES.Silences}?${params.toString()}`;
  },
};

export const routes = {
  /**
   * Generate a link to the routes page of an Alertmanager, optionally opening the drawer for one
   * route. Route IDs come from attachRouteIds and change whenever the route's content changes,
   * so a link to a route that has since been edited just lands on the page.
   */
  listPageLink(alertmanagerUid: string, routeId?: string): string {
    const params = new URLSearchParams({ [ALERTMANAGER_QUERY_PARAM]: alertmanagerUid });
    if (routeId) {
      params.set('routeId', routeId);
    }
    return `${PLUGIN_BASE_URL}/${ROUTES.Routes}?${params.toString()}`;
  },
};

export const timeIntervals = {
  /**
   * Generate a link to the time intervals page of an Alertmanager, optionally opening the drawer
   * for one interval. Time intervals are identified by their name, which is unique within an
   * Alertmanager.
   */
  listPageLink(alertmanagerUid: string, name?: string): string {
    const params = new URLSearchParams({ [ALERTMANAGER_QUERY_PARAM]: alertmanagerUid });
    if (name) {
      params.set('name', name);
    }
    return `${PLUGIN_BASE_URL}/${ROUTES.TimeIntervals}?${params.toString()}`;
  },
};

export function createExploreLink(dataSourceUid: string, query: string, dataSourceType = 'prometheus'): string {
  return urlUtil.renderUrl(`${config.appSubUrl}/explore`, {
    left: JSON.stringify({
      datasource: dataSourceUid,
      queries: [{ refId: 'A', datasource: { uid: dataSourceUid, type: dataSourceType }, expr: query }],
      range: { from: 'now-1h', to: 'now' },
    }),
  });
}
