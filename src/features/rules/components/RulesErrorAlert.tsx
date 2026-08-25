import { css } from '@emotion/css';
import React from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Alert, useStyles2 } from '@grafana/ui';

import { getRulesErrorFeedback } from '../utils/errorFeedback';

interface RulesErrorAlertProps {
  error: unknown;
  title: string;
}

/** Consistent error feedback for datasource-backed rule requests. */
export function RulesErrorAlert({ error, title }: RulesErrorAlertProps) {
  const styles = useStyles2(getStyles);
  const feedback = getRulesErrorFeedback(error, title);

  if (feedback.problems.length > 1) {
    return (
      <Alert severity="error" title={feedback.title}>
        <ul className={styles.problems}>
          {feedback.problems.map((problem, index) => (
            <li key={index}>{problem}</li>
          ))}
        </ul>
      </Alert>
    );
  }

  return (
    <Alert severity="error" title={feedback.title}>
      <span>{feedback.description}</span>
    </Alert>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  problems: css({
    margin: 0,
    paddingLeft: theme.spacing(2),
  }),
});
