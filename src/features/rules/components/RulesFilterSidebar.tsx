import { css, cx } from '@emotion/css';
import debounce from 'lodash/debounce';
import React, { useEffect, useId } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { Button, Divider, Icon, Input, MultiCombobox, Stack, useStyles2, useTheme2 } from '@grafana/ui';

import { useDataSourceOptions, useLabelOptions } from '../hooks/useRuleFilterOptions';
import { HiddenDataSourcesLink } from '../list/components/DataSourcesStatus';
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
  ruleHealth: string | null;
}

function filterStateToAdvancedFilters(filterState: RulesFilterType): AdvancedFilters {
  return {
    dataSourceNames: filterState.dataSourceNames ?? [],
    namespace: filterState.namespace ?? '',
    groupName: filterState.groupName ?? '',
    ruleName: filterState.ruleName ?? '',
    labels: filterState.labels ?? [],
    ruleState: filterState.ruleState ?? null,
    ruleType: filterState.ruleType ?? null,
    ruleHealth: filterState.ruleHealth ?? null,
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
    ruleHealth: values.ruleHealth ?? undefined,
    labels: values.labels.length > 0 ? values.labels : undefined,
  };
}

const SIDEBAR_WIDTH = 250;
const TEXT_FILTER_DEBOUNCE_MS = 500;
const TEXT_FILTER_NAMES = new Set<string>(['ruleName', 'namespace', 'groupName'] satisfies Array<
  keyof AdvancedFilters
>);

function isTextFilter(name?: string): boolean {
  return name !== undefined && TEXT_FILTER_NAMES.has(name);
}

/**
 * Persistent filter sidebar for the alert rule list.
 * Text filters defer URL updates until typing pauses; discrete filters apply immediately.
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

  const dataSourceOptions = useDataSourceOptions();
  const { labelOptions } = useLabelOptions();

  const ruleNameId = useId();
  const labelsId = useId();
  const stateId = useId();
  const typeId = useId();
  const healthId = useId();
  const namespaceId = useId();
  const groupId = useId();
  const dataSourceId = useId();

  const { reset, control, register, subscribe } = useForm<AdvancedFilters>({
    defaultValues: filterStateToAdvancedFilters(filterState),
  });

  const applyFilters = React.useCallback(
    (values: AdvancedFilters) => updateFilters(advancedFiltersToRuleFilter(values)),
    [updateFilters]
  );
  const applyTextFilters = React.useMemo(() => debounce(applyFilters, TEXT_FILTER_DEBOUNCE_MS), [applyFilters]);

  // Sync the form with filters changed elsewhere, such as the search query typed in the top bar.
  useEffect(() => {
    applyTextFilters.cancel();
    reset(filterStateToAdvancedFilters(filterState));
  }, [applyTextFilters, filterState, reset]);

  // Text fields wait for typing to pause. Discrete controls apply immediately and include any text
  // already entered, so changing one cannot discard a pending text edit.
  useEffect(() => {
    return subscribe({
      formState: { isDirty: true, values: true },
      callback: ({ isDirty, name, values }) => {
        applyTextFilters.cancel();
        if (!isDirty) {
          return;
        }

        if (isTextFilter(name)) {
          applyTextFilters(values);
          return;
        }

        applyFilters(values);
      },
    });
  }, [applyFilters, applyTextFilters, subscribe]);

  useEffect(() => () => applyTextFilters.cancel(), [applyTextFilters]);

  return (
    <form>
      <Stack direction="column" gap={2}>
        {/* First, so the note about hidden data sources is visible without scrolling */}
        <Stack direction="column" gap={1.5}>
          <SidebarField
            htmlFor={dataSourceId}
            label={<Trans i18nKey="alerting.rules-filter.data-source-label">Data source</Trans>}
            labelAside={<HiddenDataSourcesLink />}
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
                />
              )}
            />
          </SidebarField>
        </Stack>

        <Divider spacing={0} />

        <Stack direction="column" gap={1.5}>
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

          <SidebarField htmlFor={healthId} label={<Trans i18nKey="alerting.rules-filter.health-label">Health</Trans>}>
            <Controller
              name="ruleHealth"
              control={control}
              render={({ field }) => (
                <ToggleButtonGroup<AdvancedFilters['ruleHealth']>
                  id={healthId}
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { label: t('common.all', 'All'), value: null },
                    {
                      label: t('alerting.rules.health.ok', 'OK'),
                      value: 'ok',
                      icon: 'check-circle' as const,
                      color: 'success' as const,
                    },
                    {
                      label: t('alerting.rules.health.error', 'Error'),
                      value: 'error',
                      icon: 'times-circle' as const,
                      color: 'error' as const,
                    },
                  ]}
                />
              )}
            />
          </SidebarField>
        </Stack>

        <Divider spacing={0} />

        <Stack direction="column" gap={1.5}>
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
        </Stack>
      </Stack>
    </form>
  );
}

function SidebarField({
  htmlFor,
  label,
  labelAside,
  children,
}: {
  htmlFor: string;
  label: React.ReactNode;
  /** Shown on the same line as the label, e.g. a note about the options */
  labelAside?: React.ReactNode;
  children: React.ReactNode;
}) {
  const styles = useStyles2(getStyles);
  return (
    <div className={styles.field}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <label className={styles.fieldLabel} htmlFor={htmlFor}>
          {label}
        </label>
        {labelAside}
      </Stack>
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
