import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { t } from '@grafana/i18n';
import { FilterInput } from '@grafana/ui';

import { useRulesFilter } from '../hooks/useRulesFilter';

export function RulesFilter() {
  const { searchQuery, setSearchQuery } = useRulesFilter();

  const { control, setValue, handleSubmit } = useForm<{ query: string }>({
    defaultValues: {
      query: searchQuery,
    },
  });

  useEffect(() => {
    setValue('query', searchQuery);
  }, [searchQuery, setValue]);

  const submitHandler = (values: { query: string }) => {
    setSearchQuery(values.query);
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)}>
      <Controller
        name="query"
        control={control}
        render={({ field }) => (
          <FilterInput
            id="rulesSearchInput"
            data-testid="search-query-input"
            placeholder={t('alerting.rules-filter.search-placeholder', 'Search by name or enter filter query...')}
            escapeRegex={false}
            onChange={(next) => {
              field.onChange(next);
              if (!next) {
                setSearchQuery(undefined);
              }
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
  );
}
