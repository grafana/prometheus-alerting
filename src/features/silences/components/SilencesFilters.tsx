import { css } from '@emotion/css';
import { chain, isEqual, reject } from 'lodash';
import React, { useRef, useState } from 'react';

import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { t } from '@grafana/i18n';
import { AdHocFiltersComboboxRenderer } from '@grafana/scenes';
import { Checkbox, Icon, Stack, Tooltip, useStyles2 } from '@grafana/ui';
import {
  type GettableSilence,
  matcherToObjectMatcher,
  parsePromQLStyleMatcherLooseSafe,
} from '@grafana/external-alertmanager/vanilla';

import { useURLSearchParams } from '../../../hooks/useURLSearchParams';
import { prometheusExpressionBuilder, type SilenceFilter } from '../utils/prometheusExpressionBuilder';

interface SilencesFiltersProps {
  silences: GettableSilence[];
  showInactive: boolean;
  onShowInactiveChange: (show: boolean) => void;
}

export function SilencesFilters({ silences, showInactive, onShowInactiveChange }: SilencesFiltersProps) {
  const styles = useStyles2(getStyles);
  const controller = useSilenceFiltersController(silences);

  return (
    <Stack direction="row" alignItems="center" gap={1} wrap="wrap">
      <div className={styles.comboboxWrapper}>
        <AdHocFiltersComboboxRenderer controller={controller} />
      </div>
      <Tooltip
        content={
          <div>
            <p>{t('silences.filter.tooltip-description', 'Search silences by matcher label and value.')}</p>
            <p>
              {t('silences.filter.tooltip-exact', 'Exact match:')} <code>{'severity="critical"'}</code>
            </p>
            <p>
              {t('silences.filter.tooltip-regex', 'Regex match:')} <code>{'env=~"prod.*"'}</code>
            </p>
            <p>
              {t(
                'silences.filter.tooltip-note',
                'Searches by label name and value only. For example, foo="bar" finds all silences with label foo and value bar — both foo="bar" and foo!="bar".'
              )}
            </p>
          </div>
        }
      >
        <Icon name="info-circle" size="sm" />
      </Tooltip>
      <Checkbox
        label={t('silences.show-inactive', 'Show inactive silences')}
        value={showInactive}
        onChange={(e) => onShowInactiveChange(e.currentTarget.checked)}
      />
    </Stack>
  );
}

function getSilenceMatcherOperators(): Array<SelectableValue<string>> {
  return [
    { label: '=', value: '=', description: t('silences.operator.equals', 'Equals') },
    { label: '!=', value: '!=', description: t('silences.operator.not-equal', 'Not equal') },
    { label: '=~', value: '=~', description: t('silences.operator.matches-regex', 'Matches regex') },
    { label: '!~', value: '!~', description: t('silences.operator.not-matches-regex', 'Does not match regex') },
  ];
}

/**
 * Hook that owns all filter state — including URL sync — and returns a controller
 * object duck-typed to satisfy AdHocFiltersComboboxRenderer.
 */
function useSilenceFiltersController(silences: GettableSilence[]) {
  const silencesRef = useRef(silences);
  silencesRef.current = silences;

  const [searchParams, updateSearchParams] = useURLSearchParams();
  const queryString = searchParams.get('queryString') ?? '';

  const [filters, setFilters] = useState<SilenceFilter[]>(() =>
    parsePromQLStyleMatcherLooseSafe(queryString).map((m) => {
      const [, operator] = matcherToObjectMatcher(m);
      return { key: m.name, operator, value: m.value };
    })
  );
  const [wip, setWip] = useState<SilenceFilter | undefined>({ key: '', operator: '=', value: '' });

  function commitFilters(newFilters: SilenceFilter[]): void {
    setFilters(newFilters);
    const expr = prometheusExpressionBuilder(newFilters);
    updateSearchParams({ queryString: expr || undefined });
  }

  return {
    // Exposed for the component to derive hasFilters without re-importing useURLSearchParams
    queryString,

    useState() {
      return {
        filters,
        wip,
        readOnly: false,
        allowCustomValue: true,
        supportsMultiValueOperators: false,
        inputPlaceholder: t('silences.filter.search-by-matchers', 'Search by matchers'),
      };
    },

    async getKeys(_currentKey: string | null): Promise<Array<SelectableValue<string>>> {
      return chain(silencesRef.current)
        .flatMap((s) => s.matchers ?? [])
        .map('name')
        .uniq()
        .map((k) => ({ label: k, value: k }))
        .value();
    },

    async getValuesFor(filter: SilenceFilter): Promise<Array<SelectableValue<string>>> {
      return chain(silencesRef.current)
        .flatMap((s) => s.matchers ?? [])
        .filter({ name: filter.key })
        .map('value')
        .uniq()
        .map((v) => ({ label: v, value: v }))
        .value();
    },

    getOperators(): Array<SelectableValue<string>> {
      return getSilenceMatcherOperators();
    },

    updateFilter(filter: SilenceFilter, update: Partial<SilenceFilter>): void {
      if (filter === wip) {
        if ('value' in update && update.value !== '') {
          const newFilters = [...filters, { ...wip, ...update }];
          commitFilters(newFilters);
          setWip(undefined);
        } else {
          setWip({ ...wip, ...update });
        }
        return;
      }

      commitFilters(filters.map((f) => (isEqual(f, filter) ? { ...f, ...update } : f)));
    },

    updateFilters(newFilters: SilenceFilter[]): void {
      commitFilters(newFilters);
    },

    removeFilter(filter: SilenceFilter): void {
      commitFilters(reject(filters, (f) => isEqual(f, filter)));
    },

    removeLastFilter(): void {
      if (filters.length > 0) {
        commitFilters(filters.slice(0, -1));
      }
    },

    handleComboboxBackspace(filter: SilenceFilter): void {
      const index = filters.findIndex((f) => isEqual(f, filter));
      if (index > 0) {
        setFilters(filters.map((f, i) => ({ ...f, forceEdit: i === index - 1 })));
      }
    },

    addWip(): void {
      setWip({ key: '', operator: '=', value: '' });
    },

    updateToMatchAll(filter: SilenceFilter): void {
      this.updateFilter(filter, { operator: '=~', value: '.*' });
    },

    restoreOriginalFilter(_filter: SilenceFilter): void {},

    clearAll(): void {
      setFilters([]);
      setWip({ key: '', operator: '=', value: '' });
      updateSearchParams({ queryString: undefined });
    },
  };
}

const getStyles = (_theme: GrafanaTheme2) => ({
  comboboxWrapper: css({
    minWidth: '360px',
    flexGrow: 1,
  }),
});
