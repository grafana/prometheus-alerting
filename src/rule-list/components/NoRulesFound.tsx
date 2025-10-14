import React from 'react';

import { css } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';
import { Text, useStyles2 } from '@grafana/ui';

export const NoRulesFound = () => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.noRules}>
      <Text color="secondary">No rules found</Text>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  noRules: css({
    margin: theme.spacing(1.5, 0, 0.5, 4),
  }),
});
