/**
 * Matcher operator types for label matching
 * These match the operators used in Alertmanager routing matchers
 */
export enum MatcherOperator {
  equal = '=',
  notEqual = '!=',
  regex = '=~',
  notRegex = '!~',
}

/**
 * Matcher field value for forms
 */
export interface MatcherFieldValue {
  name: string;
  value: string;
  operator: MatcherOperator;
}

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
 * Empty matcher for form field arrays
 */
export const emptyArrayFieldMatcher: MatcherFieldValue = {
  name: '',
  value: '',
  operator: MatcherOperator.equal,
};

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
