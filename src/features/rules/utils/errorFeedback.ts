import { t } from '@grafana/i18n';

import { extractErrorMessage, isForbiddenError } from '../../../utils/errors';

export interface RulesErrorFeedback {
  title: string;
  /** The whole message as a single string, with the problems separated by newlines. */
  description: string;
  /**
   * One entry per problem the backend complained about. Backends like Mimir reject a rule group
   * by listing every problem it found, so there is often more than one. Always holds at least one
   * entry, and joining it with newlines gives you `description` back.
   */
  problems: string[];
}

/** Returns consistent user-facing feedback for datasource-backed rule requests. */
export function getRulesErrorFeedback(error: unknown, fallbackTitle: string): RulesErrorFeedback {
  if (isForbiddenError(error)) {
    return toFeedback(
      t('alerting.rules-error.permission-denied', 'Permission denied'),
      t(
        'alerting.rules-error.permission-denied-description',
        'You do not have permission to access rules from this data source.'
      )
    );
  }

  return toFeedback(fallbackTitle, extractErrorMessage(error));
}

function toFeedback(title: string, message: string): RulesErrorFeedback {
  const problems = splitRulerProblems(message);
  const listed = problems.length > 0 ? problems : [t('alerting.rules-error.unknown', 'An unknown error occurred')];

  return { title, description: listed.join('\n'), problems: listed };
}

/**
 * Mimir tells you what is wrong with a rule group in a plain text body, one problem per line, and
 * each line starts with where the problem sits in the YAML we sent it:
 *
 *     10:13: group "group-3", rule 1, "my-rule": invalid recording rule name: my-rule
 *
 * Nobody editing a rule in the UI ever sees that YAML, so the line and column are just noise.
 * Drop them and hand back one readable entry per problem.
 */
export function splitRulerProblems(message: string): string[] {
  return message
    .split('\n')
    .map((line) => line.trim().replace(/^\d+:\d+:\s*/, ''))
    .filter((line) => line.length > 0);
}
