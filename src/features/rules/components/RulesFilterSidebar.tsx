import { css, cx } from '@emotion/css';
import React, { useCallback, useEffect, useId, useRef } from 'react';
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form';

import { GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { Button, Icon, Input, MultiCombobox, Stack, useStyles2, useTheme2 } from '@grafana/ui';

import { useDataSourceOptions, useLabelOptions } from '../hooks/useRuleFilterOptions';
import { useRulesFilter } from '../hooks/useRulesFilter';
import { RulesFilter as RulesFilterType } from '../search/rulesSearchParser';

interface AdvancedFilters {
  dataSourceNames: string[];
  namespace: string;
  groupName: string;
  ruleName: string;
  labels: string[];
  ruleState: string | null;
  ruleType: string | null;
}

const emptyAdvancedFilters: AdvancedFilters = {
  dataSourceNames: [],
  namespace: '',
  groupName: '',
  ruleName: '',
  labels: [],
  ruleState: null,
  ruleType: null,
};

function filterStateToAdvancedFilters(filterState: RulesFilterType): AdvancedFilters {
  return {
    dataSourceNames: filterState.dataSourceNames ?? [],
    namespace: filterState.namespace ?? '',
    groupName: filterState.groupName ?? '',
    ruleName: filterState.ruleName ?? '',
    labels: filterState.labels ?? [],
    ruleState: filterState.ruleState ?? null,
    ruleType: filterState.ruleType ?? null,
  };
}

function advancedFiltersToRuleFilter(values: AdvancedFilters): RulesFilterType {
  return {
    dataSourceNames: values.dataSourceNames.length > 0 ? values.dataSourceNames : undefined,
    namespace: values.namespace || undefined,
    groupName: values.groupName || undefined,
    ruleName: values.ruleName || undefined,
    ruleState: values.ruleState ?? undefined,
    ruleType: values.ruleType ?? undefined,
    labels: values.labels.length > 0 ? values.labels : undefined,
  };
}

const SIDEBAR_WIDTH = 250;

/**
 * Persistent filter sidebar for the alert rule list.
 * All filters apply immediately on change.
 */
export function RulesFilterSidebar() {
  const styles = useStyles2(getStyles);
  const { hasActiveFilters, clearAll } = useRulesFilter();

  return (
    <aside className={styles.sidebar} aria-label={t('alerting.rules-filter-sidebar.aria-label', 'Filter rules')}>
      <Stack direction="column" gap={0}>
        <Stack direction="row" justifyContent="flex-end">
          <Button size="sm" variant="primary" fill="text" onClick={clearAll} disabled={!hasActiveFilters}>
            <Trans i18nKey="alerting.rules-filter-sidebar.clear-filters">Clear filters</Trans>
          </Button>
        </Stack>
        <FilterSidebarForm />
      </Stack>
    </aside>
  );
}

function FilterSidebarForm() {
  const { filterState, updateFilters } = useRulesFilter();
  const isApplyingRef = useRef(false);

  const dataSourceOptions = useDataSourceOptions();
  const { labelOptions } = useLabelOptions();

  const ruleNameId = useId();
  const labelsId = useId();
  const stateId = useId();
  const typeId = useId();
  const namespaceId = useId();
  const groupId = useId();
  const dataSourceId = useId();

  const defaultValues = filterStateToAdvancedFilters(filterState);

  const methods = useForm<AdvancedFilters>({ defaultValues });
  const { reset, control, register } = methods;

  // Sync form when filterState changes externally (e.g. search query typed in top bar)
  useEffect(() => {
    if (isApplyingRef.current) {
      return;
    }
    reset(filterStateToAdvancedFilters(filterState));
  }, [filterState, reset]);

  // Watch all values and apply immediately on change
  const values = useWatch({ control });

  const applyFilters = useCallback(
    (nextValues: Partial<AdvancedFilters>) => {
      isApplyingRef.current = true;

      const merged: AdvancedFilters = { ...emptyAdvancedFilters, ...nextValues };
      const ruleFilter = advancedFiltersToRuleFilter(merged);
      updateFilters(ruleFilter);

      // Reset the flag after the next render cycle
      setTimeout(() => {
        isApplyingRef.current = false;
      }, 0);
    },
    [updateFilters]
  );

  // Apply on every change of any field value
  const prevValuesRef = useRef<Partial<AdvancedFilters>>(defaultValues);
  useEffect(() => {
    if (JSON.stringify(values) !== JSON.stringify(prevValuesRef.current)) {
      prevValuesRef.current = values;
      applyFilters(values);
    }
  }, [values, applyFilters]);

  return (
    <FormProvider {...methods}>
      <form>
        <Stack direction="column" gap={2}>
          <SidebarSection>
            <SidebarField
              htmlFor={ruleNameId}
              label={<Trans i18nKey="alerting.rules-filter.rule-name-label">Rule name</Trans>}
            >
              <Input
                id={ruleNameId}
                {...register('ruleName')}
                placeholder={t('alerting.rule-list.filter-sidebar.rule-name-placeholder', 'Filter by name...')}
                data-testid="rule-name-filter-input"
              />
            </SidebarField>

            <SidebarField htmlFor={labelsId} label={<Trans i18nKey="alerting.rules-filter.labels-label">Labels</Trans>}>
              <Controller
                name="labels"
                control={control}
                render={({ field }) => (
                  <MultiCombobox
                    id={labelsId}
                    options={labelOptions}
                    value={field.value}
                    onChange={(selections) => field.onChange(selections.map((s) => s.value))}
                    placeholder={t('alerting.rules-filter.labels-placeholder', 'Select labels')}
                    portalContainer={document.body}
                  />
                )}
              />
            </SidebarField>

            <SidebarField htmlFor={stateId} label={<Trans i18nKey="alerting.rules-filter.state-label">State</Trans>}>
              <Controller
                name="ruleState"
                control={control}
                render={({ field }) => (
                  <ToggleButtonGroup<AdvancedFilters['ruleState']>
                    id={stateId}
                    value={field.value}
                    onChange={field.onChange}
                    options={[
                      { label: t('common.all', 'All'), value: null },
                      {
                        label: t('alerting.rules.state.firing', 'Firing'),
                        value: 'firing',
                        icon: 'exclamation-circle' as const,
                        color: 'error' as const,
                      },
                      {
                        label: t('alerting.rules.state.normal', 'Normal'),
                        value: 'normal',
                        icon: 'check-circle' as const,
                        color: 'success' as const,
                      },
                      {
                        label: t('alerting.rules.state.pending', 'Pending'),
                        value: 'pending',
                        icon: 'circle' as const,
                        color: 'warning' as const,
                      },
                    ]}
                  />
                )}
              />
            </SidebarField>

            <SidebarField htmlFor={typeId} label={<Trans i18nKey="alerting.rules-filter.type-label">Type</Trans>}>
              <Controller
                name="ruleType"
                control={control}
                render={({ field }) => (
                  <ToggleButtonGroup<AdvancedFilters['ruleType']>
                    id={typeId}
                    value={field.value}
                    onChange={field.onChange}
                    options={[
                      { label: t('common.all', 'All'), value: null },
                      { label: t('alerting.rules.type.alert', 'Alert rule'), value: 'alerting' },
                      { label: t('alerting.rules.type.recording', 'Recording rule'), value: 'recording' },
                    ]}
                  />
                )}
              />
            </SidebarField>
          </SidebarSection>

          <SidebarDivider />

          <SidebarSection>
            <SidebarField
              htmlFor={namespaceId}
              label={<Trans i18nKey="alerting.rules-filter.namespace-label">Namespace</Trans>}
            >
              <Input
                id={namespaceId}
                {...register('namespace')}
                placeholder={t('alerting.rule-list.filter-sidebar.namespace-placeholder', 'Filter by namespace...')}
                data-testid="namespace-filter-input"
              />
            </SidebarField>

            <SidebarField htmlFor={groupId} label={<Trans i18nKey="alerting.rules-filter.group-label">Group</Trans>}>
              <Input
                id={groupId}
                {...register('groupName')}
                placeholder={t('alerting.rule-list.filter-sidebar.group-placeholder', 'Filter by group...')}
                data-testid="group-filter-input"
              />
            </SidebarField>
          </SidebarSection>

          <SidebarDivider />

          <SidebarSection>
            <SidebarField
              htmlFor={dataSourceId}
              label={<Trans i18nKey="alerting.rules-filter.data-source-label">Data source</Trans>}
            >
              <Controller
                name="dataSourceNames"
                control={control}
                render={({ field }) => (
                  <MultiCombobox
                    id={dataSourceId}
                    options={dataSourceOptions}
                    value={field.value}
                    onChange={(selections) => field.onChange(selections.map((s) => s.value))}
                    placeholder={t('alerting.rules-filter.data-source-placeholder', 'Select data sources')}
                    portalContainer={document.body}
                  />
                )}
              />
            </SidebarField>
          </SidebarSection>
        </Stack>
      </form>
    </FormProvider>
  );
}

function SidebarSection({ children }: { children: React.ReactNode }) {
  const styles = useStyles2(getStyles);
  return (
    <div className={styles.section}>
      <Stack direction="column" gap={1.5}>
        {children}
      </Stack>
    </div>
  );
}

function SidebarDivider() {
  const styles = useStyles2(getStyles);
  return <div className={styles.divider} />;
}

function SidebarField({
  htmlFor,
  label,
  children,
}: {
  htmlFor: string;
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  const styles = useStyles2(getStyles);
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel} htmlFor={htmlFor}>
        {label}
      </label>
      <div>{children}</div>
    </div>
  );
}

interface ToggleOption<T> {
  label: string;
  value: T;
  icon?: React.ComponentProps<typeof Icon>['name'];
  color?: 'error' | 'success' | 'warning' | 'info' | 'primary';
}

interface ToggleButtonGroupProps<T> {
  id?: string;
  options: Array<ToggleOption<T>>;
  value: T;
  onChange: (value: T) => void;
}

function ToggleButtonGroup<T>({ id, options, value, onChange }: ToggleButtonGroupProps<T>) {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();

  const colorMap: Record<NonNullable<ToggleOption<T>['color']>, string> = {
    error: theme.colors.error.text,
    success: theme.colors.success.text,
    warning: theme.colors.warning.text,
    info: theme.colors.info.text,
    primary: theme.colors.primary.text,
  };

  return (
    <div id={id} role="group">
      <Stack direction="column" gap={0.5}>
        {options.map((opt) => {
          const isActive = opt.value === value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              className={cx(styles.toggleButton, isActive && styles.toggleButtonActive)}
              onClick={() => onChange(opt.value)}
            >
              {opt.icon && (
                <span
                  className={styles.toggleButtonIcon}
                  style={{ color: opt.color ? colorMap[opt.color] : undefined, display: 'flex' }}
                >
                  <Icon name={opt.icon} size="sm" />
                </span>
              )}
              <span className={styles.toggleButtonLabel}>{opt.label}</span>
            </button>
          );
        })}
      </Stack>
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    sidebar: css({
      width: SIDEBAR_WIDTH,
      borderRight: `1px solid ${theme.colors.border.weak}`,
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      paddingRight: theme.spacing(2),
      paddingBottom: theme.spacing(2),
    }),
    section: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
    }),
    divider: css({
      borderTop: `1px solid ${theme.colors.border.weak}`,
      flexShrink: 0,
    }),
    field: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.5),
    }),
    fieldLabel: css({
      marginBottom: 0,
      color: theme.colors.text.secondary,
      fontSize: theme.typography.bodySmall.fontSize,
    }),
    toggleButton: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(0.75),
      width: '100%',
      padding: `${theme.spacing(0.5)} ${theme.spacing(0.75)}`,
      background: 'none',
      border: `1px solid transparent`,
      borderRadius: theme.shape.radius.default,
      cursor: 'pointer',
      color: theme.colors.text.secondary,
      textAlign: 'left',
      '&:hover': {
        background: theme.colors.action.hover,
        color: theme.colors.text.primary,
      },
    }),
    toggleButtonActive: css({
      background: theme.colors.action.selected,
      color: theme.colors.text.primary,
    }),
    toggleButtonIcon: css({
      flexShrink: 0,
    }),
    toggleButtonLabel: css({
      fontSize: theme.typography.bodySmall.fontSize,
    }),
  };
}
