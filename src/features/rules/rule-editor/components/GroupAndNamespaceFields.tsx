import React, { useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { t } from '@grafana/i18n';
import { Combobox, Field, Stack, type ComboboxOption } from '@grafana/ui';

import { RuleFormValues } from '../types';
import { useNamespacesAndGroups } from '../hooks/useNamespacesAndGroups';

interface Props {
  dataSourceUid: string | null;
}

export const GroupAndNamespaceFields = ({ dataSourceUid }: Props) => {
  const {
    control,
    watch,
    formState: { errors },
    setValue,
  } = useFormContext<RuleFormValues>();

  const { namespaceGroups, isLoading } = useNamespacesAndGroups(dataSourceUid);

  const namespace = watch('namespace');

  const namespaceOptions: Array<ComboboxOption<string>> = useMemo(
    () =>
      Array.from(namespaceGroups.keys()).map((namespace) => ({
        label: namespace,
        value: namespace,
      })),
    [namespaceGroups]
  );

  const groupOptions: Array<ComboboxOption<string>> = useMemo(
    () => (namespace && namespaceGroups.get(namespace)?.map((group) => ({ label: group, value: group }))) || [],
    [namespace, namespaceGroups]
  );

  return (
    <Stack direction="row" gap={3}>
      <Field
        data-testid="namespace-picker"
        label={t('alerting.group-and-namespace-fields.namespace-picker-label-namespace', 'Namespace')}
        description={t(
          'alerting.group-and-namespace-fields.namespace-picker-description',
          'Type to search for an existing namespace or create a new one'
        )}
        error={errors.namespace?.message}
        invalid={!!errors.namespace?.message}
      >
        <Controller
          render={({ field: { onChange, value, ref, ...field } }) => {
            const selectedOption = namespaceOptions.find((opt) => opt.value === value);
            return (
              <Combobox
                {...field}
                value={selectedOption?.value ? selectedOption : value ? { label: value, value } : undefined}
                onChange={(option) => {
                  setValue('group', ''); // Reset group if namespace changes
                  onChange(option?.value ?? '');
                }}
                createCustomValue
                options={namespaceOptions}
                width={42}
                loading={isLoading}
                disabled={isLoading}
                placeholder={t(
                  'alerting.group-and-namespace-fields.namespace-placeholder',
                  'Select or create namespace'
                )}
              />
            );
          }}
          name="namespace"
          control={control}
          rules={{
            required: { value: true, message: t('alerting.group-and-namespace-fields.message.required', 'Required.') },
          }}
        />
      </Field>
      <Field
        data-testid="group-picker"
        label={t('alerting.group-and-namespace-fields.group-picker-label-group', 'Group')}
        description={t(
          'alerting.group-and-namespace-fields.group-picker-description',
          'Type to search for an existing group or create a new one'
        )}
        error={errors.group?.message}
        invalid={!!errors.group?.message}
      >
        <Controller
          render={({ field: { value, ref, ...field } }) => {
            const selectedOption = groupOptions.find((opt) => opt.value === value);
            return (
              <Combobox
                {...field}
                value={selectedOption?.value ? selectedOption : value ? { label: value, value } : undefined}
                options={groupOptions}
                width={42}
                onChange={(option) => {
                  setValue('group', option?.value ?? '');
                }}
                createCustomValue
                loading={isLoading}
                disabled={isLoading || !namespace}
                placeholder={t('alerting.group-and-namespace-fields.group-placeholder', 'Select or create group')}
              />
            );
          }}
          name="group"
          control={control}
          rules={{
            required: { value: true, message: t('alerting.group-and-namespace-fields.message.required', 'Required.') },
          }}
        />
      </Field>
    </Stack>
  );
};
