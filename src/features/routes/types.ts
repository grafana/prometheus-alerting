import type { MatcherFieldValue } from '../../types/matcherFields';

export type { MatcherFieldValue, MatcherOperator } from '../../types/matcherFields';

/**
 * Form representation of a route for editing
 */
export interface FormAmRoute {
  id: string;
  object_matchers: MatcherFieldValue[];
  continue: boolean;
  receiver: string;
  overrideGrouping: boolean;
  groupBy?: string[];
  overrideTimings: boolean;
  groupWaitValue: string;
  groupIntervalValue: string;
  repeatIntervalValue: string;
  muteTimeIntervals: string[];
  activeTimeIntervals: string[];
  routes: FormAmRoute[];
}

/**
 * Common group by options for multiselect.
 * The '...' value is special Alertmanager syntax that disables grouping entirely,
 * meaning each alert instance gets its own separate notification.
 */
export const commonGroupByOptions = [
  { label: 'alertname', value: 'alertname' },
  { label: 'severity', value: 'severity' },
  { label: '... (disable grouping)', value: '...' },
];

/**
 * Position where a new route should be inserted relative to a reference route
 */
export type InsertPosition = 'above' | 'below' | 'child';

/**
 * Default empty route form values
 */
export const emptyRoute: FormAmRoute = {
  id: '',
  overrideGrouping: false,
  groupBy: [],
  object_matchers: [],
  routes: [],
  continue: false,
  receiver: '',
  overrideTimings: false,
  groupWaitValue: '',
  groupIntervalValue: '',
  repeatIntervalValue: '',
  muteTimeIntervals: [],
  activeTimeIntervals: [],
};
