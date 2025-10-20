import { css } from '@emotion/css';
import React, { useEffect, useRef, useState } from 'react';
import { Controller, FormProvider, SubmitHandler, useForm, useFormContext } from 'react-hook-form';

import { GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import {
  Box,
  Button,
  Combobox,
  FilterInput,
  Input,
  Label,
  MultiCombobox,
  RadioButtonGroup,
  Stack,
  useStyles2,
} from '@grafana/ui';

import { RulesFilter as RulesFilterType } from '../search/rulesSearchParser';
import { useRulesFilter } from '../hooks/useRulesFilter';
import { useDataSourceOptions, useLabelOptions, useNamespaceAndGroupOptions } from '../hooks/useRuleFilterOptions';

const radioGroupCompactClass = css({ width: 'max-content' });

interface AdvancedFilters {
  dataSourceNames: string[];
  namespace: string | null;
  groupName: string | null;
  ruleName: string;
  labels: string[];
  ruleState: string | null;
  ruleType: string | null;
}

const emptyAdvancedFilters: AdvancedFilters = {
  dataSourceNames: [],
  namespace: null,
  groupName: null,
  ruleName: '',
  labels: [],
  ruleState: null,
  ruleType: null,
};

function filterStateToAdvancedFilters(filterState: RulesFilterType): AdvancedFilters {
  return {
    dataSourceNames: filterState.dataSourceNames || [],
    namespace: filterState.namespace || null,
    groupName: filterState.groupName || null,
    ruleName: filterState.ruleName || '',
    labels: filterState.labels || [],
    ruleState: filterState.ruleState || null,
    ruleType: filterState.ruleType || null,
  };
}

function advancedFiltersToRuleFilter(values: AdvancedFilters): RulesFilterType {
  return {
    dataSourceNames: values.dataSourceNames.length > 0 ? values.dataSourceNames : undefined,
    namespace: values.namespace || undefined,
    groupName: values.groupName || undefined,
    ruleName: values.ruleName || undefined,
    ruleState: values.ruleState || undefined,
    ruleType: values.ruleType || undefined,
    labels: values.labels.length > 0 ? values.labels : undefined,
  };
}

export function RulesFilter() {
  const styles = useStyles2(getStyles);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const { searchQuery, updateFilters, setSearchQuery, filterState } = useRulesFilter();
  const popupRef = useRef<HTMLDivElement>(null);

  const { control, setValue, handleSubmit } = useForm<{ query: string }>({
    defaultValues: {
      query: searchQuery,
    },
  });

  useEffect(() => {
    setValue('query', searchQuery);
  }, [searchQuery, setValue]);

  const submitHandler: SubmitHandler<{ query: string }> = (values) => {
    // When user submits the search input, just update the search query
    // The parsing will be handled by useRulesFilter
    setSearchQuery(values.query);
  };

  const handleAdvancedFilters: SubmitHandler<AdvancedFilters> = (values) => {
    const newFilter = advancedFiltersToRuleFilter(values);
    updateFilters(newFilter);
    setIsPopupOpen(false);
  };

  const handleClearFilters = () => {
    updateFilters(advancedFiltersToRuleFilter(emptyAdvancedFilters));
    setSearchQuery(undefined);
  };

  const handleOnToggle = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  // Handle outside clicks to close the popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isPopupOpen && popupRef.current && event.target instanceof Node && !popupRef.current.contains(event.target)) {
        // Check if click is on a portal element (combobox dropdown)
        if (event.target instanceof Element) {
          const isPortalClick =
            event.target.closest('[data-popper-placement]') || event.target.closest('[role="listbox"]');

          if (!isPortalClick) {
            setIsPopupOpen(false);
          }
        } else {
          setIsPopupOpen(false);
        }
      }
    };

    if (isPopupOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPopupOpen]);

  const filterButtonLabel = t('alerting.rules-filter.filter-label', 'Filter');

  return (
    <Stack direction="row" alignItems="center" gap={1}>
      <Box flex={1}>
        <form onSubmit={handleSubmit(submitHandler)}>
          <Controller
            name="query"
            control={control}
            render={({ field }) => (
              <FilterInput
                id="rulesSearchInput"
                data-testid="search-query-input"
                placeholder={t('alerting.rules-filter.search-placeholder', 'Search by name or enter filter query...')}
                onChange={(next) => {
                  field.onChange(next);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === 'NumpadEnter') {
                    event.preventDefault();
                    handleSubmit(submitHandler)();
                  }
                }}
                onBlur={() => {
                  setSearchQuery(field.value);
                }}
                value={field.value}
              />
            )}
          />
        </form>
      </Box>
      {isPopupOpen && (
        <div
          ref={popupRef}
          className={styles.popup}
          role="dialog"
          aria-label={t('alerting.rules-filter.filter-options-label', 'Filter options')}
        >
          <FilterOptions
            onSubmit={handleAdvancedFilters}
            onClear={handleClearFilters}
            filterState={filterState}
            onClose={() => setIsPopupOpen(false)}
          />
        </div>
      )}
      <Button name="filter" icon="filter" variant="secondary" aria-label={filterButtonLabel} onClick={handleOnToggle}>
        {filterButtonLabel}
      </Button>
    </Stack>
  );
}

interface FilterOptionsProps {
  onSubmit: SubmitHandler<AdvancedFilters>;
  onClear: () => void;
  filterState: RulesFilterType;
  onClose: () => void;
}

function FilterOptions({ onSubmit, onClear, filterState, onClose }: FilterOptionsProps) {
  const styles = useStyles2(getStyles);
  const isManualResetRef = useRef(false);

  const defaultValues = filterStateToAdvancedFilters(filterState);
  const dataSourceOptions = useDataSourceOptions();
  const { namespaceOptions, groupOptions } = useNamespaceAndGroupOptions();
  const { labelOptions } = useLabelOptions();

  const methods = useForm<AdvancedFilters>({
    defaultValues,
  });
  const { handleSubmit, reset } = methods;

  // Update form values when filterState changes
  useEffect(() => {
    if (isManualResetRef.current) {
      isManualResetRef.current = false;
      return;
    }

    const newDefaultValues = filterStateToAdvancedFilters(filterState);
    reset(newDefaultValues);
  }, [filterState, reset]);

  const submitAdvancedFilters = handleSubmit(onSubmit);

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={submitAdvancedFilters}
        onReset={() => {
          isManualResetRef.current = true;
          reset(emptyAdvancedFilters);
          onClear();
        }}
      >
        <Stack direction="column" alignItems="end" gap={2}>
          <div className={styles.grid}>
            <DataSourceField dataSourceOptions={dataSourceOptions} />
            <NamespaceField namespaceOptions={namespaceOptions} />
            <GroupField groupOptions={groupOptions} />
            <RuleNameField />
            <LabelsField labelOptions={labelOptions} />
            <RuleStateField />
            <RuleTypeField />
          </div>
          <Stack direction="row" alignItems="center" gap={1}>
            <Button type="reset" variant="secondary" data-testid="filter-clear-button">
              <Trans i18nKey="common.clear">Clear</Trans>
            </Button>
            <Button type="submit" data-testid="filter-apply-button">
              <Trans i18nKey="common.apply">Apply</Trans>
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              <Trans i18nKey="common.close">Close</Trans>
            </Button>
          </Stack>
        </Stack>
      </form>
    </FormProvider>
  );
}

function DataSourceField({ dataSourceOptions }: { dataSourceOptions: Array<{ label: string; value: string }> }) {
  const { control } = useFormContext<AdvancedFilters>();
  return (
    <>
      <Label>
        <Trans i18nKey="alerting.rules-filter.data-source-label">Data source</Trans>
      </Label>
      <Controller
        name="dataSourceNames"
        control={control}
        render={({ field }) => (
          <MultiCombobox
            options={dataSourceOptions}
            value={field.value}
            onChange={(selections) => field.onChange(selections.map((s) => s.value))}
            placeholder={t('alerting.rules-filter.data-source-placeholder', 'Select data sources')}
            width="auto"
            minWidth={40}
            maxWidth={80}
          />
        )}
      />
    </>
  );
}

function NamespaceField({
  namespaceOptions,
}: {
  namespaceOptions: (inputValue: string) => Promise<Array<{ label: string; value: string }>>;
}) {
  const { control } = useFormContext<AdvancedFilters>();
  return (
    <>
      <Label>
        <Trans i18nKey="alerting.rules-filter.namespace-label">Namespace</Trans>
      </Label>
      <Controller
        name="namespace"
        control={control}
        render={({ field }) => {
          return (
            <Combobox<string>
              placeholder={t('alerting.rules-filter.namespace-placeholder', 'Select namespace')}
              options={namespaceOptions}
              onChange={(option) => field.onChange(option?.value || null)}
              value={field.value}
              isClearable
            />
          );
        }}
      />
    </>
  );
}

function GroupField({
  groupOptions,
}: {
  groupOptions: (inputValue: string) => Promise<Array<{ label: string; value: string }>>;
}) {
  const { control } = useFormContext<AdvancedFilters>();
  return (
    <>
      <Label>
        <Trans i18nKey="alerting.rules-filter.group-label">Evaluation group</Trans>
      </Label>
      <Controller
        name="groupName"
        control={control}
        render={({ field }) => {
          return (
            <Combobox<string>
              placeholder={t('alerting.rules-filter.group-placeholder', 'Select group')}
              options={groupOptions}
              onChange={(option) => field.onChange(option?.value || null)}
              value={field.value}
              isClearable
            />
          );
        }}
      />
    </>
  );
}

function RuleNameField() {
  const { register } = useFormContext<AdvancedFilters>();
  return (
    <>
      <Label>
        <Trans i18nKey="alerting.rules-filter.rule-name-label">Rule name</Trans>
      </Label>
      <Input {...register('ruleName')} data-testid="rule-name-input" />
    </>
  );
}

function LabelsField({
  labelOptions,
}: {
  labelOptions: (inputValue: string) => Promise<Array<{ label: string; value: string }>>;
}) {
  const { control } = useFormContext<AdvancedFilters>();
  return (
    <>
      <Label>
        <Trans i18nKey="alerting.rules-filter.labels-label">Labels</Trans>
      </Label>
      <Controller
        name="labels"
        control={control}
        render={({ field }) => (
          <MultiCombobox
            options={labelOptions}
            value={field.value}
            onChange={(selections) => field.onChange(selections.map((s) => s.value))}
            placeholder={t('alerting.rules-filter.labels-placeholder', 'Select labels')}
            width="auto"
            minWidth={40}
            maxWidth={80}
          />
        )}
      />
    </>
  );
}

function RuleStateField() {
  const { control } = useFormContext<AdvancedFilters>();
  return (
    <>
      <Label>
        <Trans i18nKey="alerting.rules-filter.state-label">State</Trans>
      </Label>
      <Controller
        name="ruleState"
        control={control}
        render={({ field }) => (
          <RadioButtonGroup<AdvancedFilters['ruleState']>
            options={[
              { label: t('common.all', 'All'), value: null },
              { label: t('alerting.rules.state.firing', 'Firing'), value: 'firing' },
              { label: t('alerting.rules.state.normal', 'Normal'), value: 'normal' },
              { label: t('alerting.rules.state.pending', 'Pending'), value: 'pending' },
            ]}
            value={field.value}
            onChange={field.onChange}
            fullWidth={false}
            className={radioGroupCompactClass}
          />
        )}
      />
    </>
  );
}

function RuleTypeField() {
  const { control } = useFormContext<AdvancedFilters>();
  return (
    <>
      <Label>
        <Trans i18nKey="alerting.rules-filter.type-label">Type</Trans>
      </Label>
      <Controller
        name="ruleType"
        control={control}
        render={({ field }) => (
          <RadioButtonGroup<AdvancedFilters['ruleType']>
            options={[
              { label: t('common.all', 'All'), value: null },
              { label: t('alerting.rules.type.alert', 'Alert rule'), value: 'alerting' },
              { label: t('alerting.rules.type.recording', 'Recording rule'), value: 'recording' },
            ]}
            value={field.value}
            onChange={field.onChange}
            fullWidth={false}
            className={radioGroupCompactClass}
          />
        )}
      />
    </>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    popup: css({
      position: 'absolute',
      right: 0,
      top: '100%',
      marginTop: theme.spacing(1),
      zIndex: theme.zIndex.dropdown,
      backgroundColor: theme.colors.background.primary,
      border: `1px solid ${theme.colors.border.weak}`,
      borderRadius: theme.shape.radius.default,
      boxShadow: theme.shadows.z3,
      padding: theme.spacing(2),
      minWidth: '400px',
    }),
    grid: css({
      display: 'grid',
      gridTemplateColumns: 'auto 1fr',
      alignItems: 'center',
      gap: theme.spacing(2),
    }),
  };
}
