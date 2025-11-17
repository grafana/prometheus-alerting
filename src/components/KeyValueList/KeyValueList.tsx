import { css } from '@emotion/css';
import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { useStyles2 } from '@grafana/ui';
import { JsonValue } from 'type-fest';

interface KeyValuePairProps {
  label: string;
  value?: JsonValue | React.ReactNode;
  children?: React.ReactNode;
}

export function KeyValuePair({ label, value, children }: KeyValuePairProps) {
  const styles = useStyles2(getStyles);

  // Check if value is a React element/node
  const isReactNode = React.isValidElement(value);

  const displayValue = () => {
    if (value === undefined || value === null || value === '') {
      return t('key-value-list.empty-value', '(not set)');
    }
    if (typeof value === 'boolean') {
      return value ? t('key-value-list.true', 'Yes') : t('key-value-list.false', 'No');
    }
    // If it's a React node, render it directly
    if (isReactNode) {
      return value;
    }
    return String(value);
  };

  // Check if value is a non-empty object (but not a React element)
  const isObject =
    !isReactNode &&
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).length > 0;

  // If children are provided, render as nested group
  if (children || isObject) {
    const childContent =
      children ||
      (isObject &&
        Object.entries(value)
          .filter(([, v]) => v !== undefined && v !== null && v !== '')
          .map(([key, val], index) => (
            <KeyValuePair key={`${key}-${index}`} label={key} value={val} />
          )));

    const itemCount = isObject ? Object.keys(value).length : 0;

    return (
      <div className={styles.nestedGroup}>
        <div className={styles.nestedHeader}>
          <dt className={styles.nestedLabel}>{label}</dt>
          <span className={styles.dots}></span>
          {itemCount > 0 && (
            <dd className={styles.nestedCount}>
              {t('key-value-list.nested-items-count', '{{count}} item(s)', { count: itemCount })}
            </dd>
          )}
        </div>
        <div className={styles.nestedItems}>{childContent}</div>
      </div>
    );
  }

  return (
    <div className={styles.keyValuePair}>
      <dt className={styles.label}>{label}</dt>
      <span className={styles.dots}></span>
      <dd className={styles.value}>{displayValue()}</dd>
    </div>
  );
}

interface KeyValueListProps {
  items: Array<{ label: string; value: JsonValue | React.ReactNode }>;
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
  nestedGroup: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  }),
  nestedHeader: css({
    display: 'flex',
    alignItems: 'baseline',
    gap: theme.spacing(1),
    minHeight: theme.spacing(3),
  }),
  nestedLabel: css({
    fontWeight: theme.typography.fontWeightMedium,
    color: theme.colors.text.primary,
    margin: 0,
    flexShrink: 0,
  }),
  nestedCount: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.disabled,
    fontStyle: 'italic',
    margin: 0,
  }),
  nestedItems: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    paddingLeft: theme.spacing(2),
    borderLeft: `1px solid ${theme.colors.border.weak}`,
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
    color: theme.colors.text.secondary,
    whiteSpace: 'preserve',
    margin: 0,
    wordBreak: 'break-all',
    textAlign: 'right',
  }),
});
