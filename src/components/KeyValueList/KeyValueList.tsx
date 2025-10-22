import { css } from '@emotion/css';
import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { useStyles2 } from '@grafana/ui';

interface KeyValuePairProps {
  label: string;
  value: string | number | boolean | undefined | null;
}

export function KeyValuePair({ label, value }: KeyValuePairProps) {
  const styles = useStyles2(getStyles);

  const displayValue = () => {
    if (value === undefined || value === null || value === '') {
      return t('key-value-list.empty-value', '(not set)');
    }
    if (typeof value === 'boolean') {
      return value ? t('key-value-list.true', 'Yes') : t('key-value-list.false', 'No');
    }
    return String(value);
  };

  return (
    <div className={styles.keyValuePair}>
      <dt className={styles.label}>{label}</dt>
      <span className={styles.dots}></span>
      <dd className={styles.value}>{displayValue()}</dd>
    </div>
  );
}

interface KeyValueListProps {
  items: Array<{ label: string; value: string | number | boolean | undefined | null }>;
}

export function KeyValueList({ items }: KeyValueListProps) {
  const styles = useStyles2(getStyles);

  return (
    <dl className={styles.keyValueList}>
      {items.map(({ label, value }, index) => (
        <KeyValuePair key={`${label}-${index}`} label={label} value={value} />
      ))}
    </dl>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  keyValueList: css({
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
  }),
  keyValuePair: css({
    display: 'flex',
    alignItems: 'baseline',
    gap: theme.spacing(1),
    minHeight: theme.spacing(3),
  }),
  label: css({
    margin: 0,
    flexShrink: 0,
    textAlign: 'left',
  }),
  dots: css({
    flex: 1,
    borderBottom: `2px dotted ${theme.colors.border.weak}`,
    minWidth: theme.spacing(2),
    height: '1px',
    marginBottom: theme.spacing(0.5),
  }),
  value: css({
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text.primary,
    whiteSpace: 'preserve',
    margin: 0,
    wordBreak: 'break-all',
    textAlign: 'right',
  }),
});
