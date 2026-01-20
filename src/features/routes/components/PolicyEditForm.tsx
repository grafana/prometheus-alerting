import { css } from '@emotion/css';
import React, { useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';

import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { RouteWithID } from '@grafana/external-alertmanager/mimir';
import { Trans, t } from '@grafana/i18n';
import {
  Badge,
  Button,
  Combobox,
  ComboboxOption,
  Field,
  IconButton,
  Input,
  MultiSelect,
  Stack,
  Switch,
  useStyles2,
} from '@grafana/ui';

import { FormAmRoute, MatcherOperator, commonGroupByOptions, emptyArrayFieldMatcher } from '../types';
import { amRouteToFormAmRoute, isValidPromDuration } from '../utils/routeTransform';
import { ReceiverSelector } from './ReceiverSelector';

const matcherOperatorOptions: Array<ComboboxOption<MatcherOperator>> = [
  { label: '=', value: MatcherOperator.equal },
  { label: '!=', value: MatcherOperator.notEqual },
  { label: '=~', value: MatcherOperator.regex },
  { label: '!~', value: MatcherOperator.notRegex },
];

export interface PolicyEditFormProps {
  route: RouteWithID;
  onSubmit: (values: Partial<FormAmRoute>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function PolicyEditForm({ route, onSubmit, onCancel, isSubmitting = false }: PolicyEditFormProps) {
  const styles = useStyles2(getStyles);
  const [groupByOptions, setGroupByOptions] = useState<Array<SelectableValue<string>>>(
    (route.group_by ?? []).map((g) => ({ label: g, value: g }))
  );

  const formAmRoute = amRouteToFormAmRoute(route);

  const {
    handleSubmit,
    control,
    register,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormAmRoute>({
    defaultValues: formAmRoute,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'object_matchers',
  });

  const handleFormSubmit = (values: FormAmRoute) => {
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <input type="hidden" {...register('id')} />
      
      <Stack direction="column" gap={2}>
        <div>
          <div className={styles.sectionLabel}>
            <Trans i18nKey="routes.edit.matching-labels">Matching labels</Trans>
          </div>
          
          {fields.length === 0 && (
            <Badge
              color="orange"
              className={styles.noMatchersWarning}
              icon="exclamation-triangle"
              text={t(
                'routes.edit.no-matchers-warning',
                'If no matchers are specified, this route will handle all alert instances.'
              )}
            />
          )}
          
          {fields.length > 0 && (
            <div className={styles.matchersContainer}>
              {fields.map((field, index) => (
                <Stack direction="row" key={field.id} alignItems="center" gap={1}>
                  <Field
                    label={t('routes.edit.label', 'Label')}
                    invalid={!!errors.object_matchers?.[index]?.name}
                    error={errors.object_matchers?.[index]?.name?.message}
                  >
                    <Input
                      {...register(`object_matchers.${index}.name`, {
                        required: t('routes.edit.field-required', 'Required'),
                      })}
                      placeholder={t('routes.edit.label-placeholder', 'label')}
                    />
                  </Field>
                  
                  <Field label={t('routes.edit.operator', 'Operator')}>
                    <Controller
                      render={({ field: { onChange, value } }) => {
                        const selectedOption = matcherOperatorOptions.find((opt) => opt.value === value);
                        return (
                          <Combobox
                            value={selectedOption}
                            options={matcherOperatorOptions}
                            onChange={(option) => onChange(option?.value)}
                            width={12}
                          />
                        );
                      }}
                      control={control}
                      name={`object_matchers.${index}.operator`}
                    />
                  </Field>
                  
                  <Field
                    label={t('routes.edit.value', 'Value')}
                    invalid={!!errors.object_matchers?.[index]?.value}
                    error={errors.object_matchers?.[index]?.value?.message}
                  >
                    <Input
                      {...register(`object_matchers.${index}.value`)}
                      placeholder={t('routes.edit.value-placeholder', 'value')}
                    />
                  </Field>
                  
                  <IconButton
                    tooltip={t('routes.edit.remove-matcher', 'Remove matcher')}
                    name="trash-alt"
                    onClick={() => remove(index)}
                    aria-label={t('routes.edit.remove-matcher', 'Remove matcher')}
                  />
                </Stack>
              ))}
            </div>
          )}
          
          <Button
            className={styles.addMatcherBtn}
            icon="plus"
            onClick={() => append(emptyArrayFieldMatcher)}
            variant="secondary"
            type="button"
            size="sm"
          >
            <Trans i18nKey="routes.edit.add-matcher">Add matcher</Trans>
          </Button>
        </div>

        {/* Receiver */}
        <Field
          label={t('routes.edit.receiver', 'Receiver')}
          description={t('routes.edit.receiver-description', 'The receiver to send notifications to')}
        >
          <Controller
            name="receiver"
            control={control}
            render={({ field: { onChange, value } }) => (
              <ReceiverSelector value={value} onChange={(val) => onChange(val ?? '')} />
            )}
          />
        </Field>

        {/* Continue Matching */}
        <Field
          label={t('routes.edit.continue', 'Continue matching subsequent sibling nodes')}
          description={t(
            'routes.edit.continue-description',
            'If enabled, matching will continue to subsequent sibling policies'
          )}
        >
          <Switch id="continue-toggle" {...register('continue')} />
        </Field>

        {/* Override Grouping */}
        <Field label={t('routes.edit.override-grouping', 'Override grouping')}>
          <Switch id="override-grouping-toggle" {...register('overrideGrouping')} />
        </Field>
        
        {watch('overrideGrouping') && (
          <Field
            label={t('routes.edit.group-by', 'Group by')}
            description={t(
              'routes.edit.group-by-description',
              'Combine alerts into a single notification by grouping by the same label values.'
            )}
          >
            <Controller
              render={({ field: { onChange, ref, ...fieldProps } }) => (
                <MultiSelect
                  {...fieldProps}
                  allowCustomValue
                  onCreateOption={(opt: string) => {
                    setGroupByOptions((opts) => [...opts, { label: opt, value: opt }]);
                    setValue('groupBy', [...(fieldProps.value || []), opt]);
                  }}
                  onChange={(value) => onChange(value.map((v) => v.value))}
                  options={[...commonGroupByOptions, ...groupByOptions]}
                  aria-label={t('routes.edit.group-by-aria', 'Group by')}
                />
              )}
              control={control}
              name="groupBy"
            />
          </Field>
        )}

        {/* Override Timings */}
        <Field label={t('routes.edit.override-timings', 'Override general timings')}>
          <Switch id="override-timings-toggle" {...register('overrideTimings')} />
        </Field>
        
        {watch('overrideTimings') && (
          <>
            <Field
              label={t('routes.edit.group-wait', 'Group wait')}
              description={t(
                'routes.edit.group-wait-description',
                'How long to wait before sending the first notification for a group'
              )}
              invalid={!!errors.groupWaitValue}
              error={errors.groupWaitValue?.message}
            >
              <Input
                {...register('groupWaitValue', {
                  validate: (v) => !v || isValidPromDuration(v) || 'Invalid duration format',
                })}
                placeholder="30s"
              />
            </Field>
            
            <Field
              label={t('routes.edit.group-interval', 'Group interval')}
              description={t(
                'routes.edit.group-interval-description',
                'How long to wait before sending notifications about new alerts in a group'
              )}
              invalid={!!errors.groupIntervalValue}
              error={errors.groupIntervalValue?.message}
            >
              <Input
                {...register('groupIntervalValue', {
                  validate: (v) => !v || isValidPromDuration(v) || 'Invalid duration format',
                })}
                placeholder="5m"
              />
            </Field>
            
            <Field
              label={t('routes.edit.repeat-interval', 'Repeat interval')}
              description={t(
                'routes.edit.repeat-interval-description',
                'Minimum time between repeated notifications for the same alert'
              )}
              invalid={!!errors.repeatIntervalValue}
              error={errors.repeatIntervalValue?.message}
            >
              <Input
                {...register('repeatIntervalValue', {
                  validate: (v) => !v || isValidPromDuration(v) || 'Invalid duration format',
                })}
                placeholder="4h"
              />
            </Field>
          </>
        )}

        {/* Mute Timings */}
        <Field
          label={t('routes.edit.mute-timings', 'Mute timings')}
          description={t('routes.edit.mute-timings-description', 'Mute notifications during specific time intervals')}
        >
          <Controller
            render={({ field: { onChange, ref, value, ...fieldProps } }) => (
              <MultiSelect
                {...fieldProps}
                value={(value ?? []).map((v) => ({ label: v, value: v }))}
                allowCustomValue
                onCreateOption={(opt: string) => {
                  setValue('muteTimeIntervals', [...(value || []), opt]);
                }}
                onChange={(selected) => onChange(selected.map((v) => v.value))}
                options={[]}
                placeholder={t('routes.edit.mute-timings-placeholder', 'Select or type mute timing names')}
              />
            )}
            control={control}
            name="muteTimeIntervals"
          />
        </Field>

        <Stack direction="row" gap={2}>
          <Button type="submit" disabled={isSubmitting} icon={isSubmitting ? 'spinner' : undefined}>
            <Trans i18nKey="routes.edit.save">Save</Trans>
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            <Trans i18nKey="routes.edit.cancel">Cancel</Trans>
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  sectionLabel: css({
    fontWeight: theme.typography.fontWeightMedium,
    marginBottom: theme.spacing(1),
  }),
  matchersContainer: css({
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing(1.5, 2),
    paddingBottom: 0,
    marginBottom: theme.spacing(1),
    borderRadius: theme.shape.radius.default,
  }),
  noMatchersWarning: css({
    padding: theme.spacing(1, 2),
    marginBottom: theme.spacing(1),
  }),
  addMatcherBtn: css({
    marginBottom: theme.spacing(2),
  }),
});
