import { css } from '@emotion/css';
import React, { useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';

import { GrafanaTheme2 } from '@grafana/data';
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
  MultiCombobox,
  Stack,
  Switch,
  useStyles2,
} from '@grafana/ui';

import { useTimeIntervals } from '../../timeIntervals/hooks/useTimeIntervals';
import { FormAmRoute, MatcherOperator, commonGroupByOptions, emptyArrayFieldMatcher } from '../types';
import { amRouteToFormAmRoute, isValidPromDuration } from '../utils/routeTransform';
import { ReceiverSelector } from './ReceiverSelector';
import { RouteTimingSummary } from './RouteTimingSummary';

const matcherOperatorOptions: Array<ComboboxOption<MatcherOperator>> = [
  { label: '=', value: MatcherOperator.equal },
  { label: '!=', value: MatcherOperator.notEqual },
  { label: '=~', value: MatcherOperator.regex },
  { label: '!~', value: MatcherOperator.notRegex },
];

export interface RouteEditFormProps {
  route: RouteWithID;
  onSubmit: (values: Partial<FormAmRoute>) => void;
  onCancel: () => void;
  isRoot?: boolean;
  isSubmitting?: boolean;
}

export function RouteEditForm({ route, onSubmit, onCancel, isRoot = false, isSubmitting = false }: RouteEditFormProps) {
  const styles = useStyles2(getStyles);
  const [groupByOptions, setGroupByOptions] = useState<Array<ComboboxOption<string>>>(
    (route.group_by ?? []).map((g) => ({ label: g, value: g }))
  );
  const { timeIntervals } = useTimeIntervals();
  const timeIntervalOptions = timeIntervals.map(({ name }) => ({ label: name, value: name }));

  const formAmRoute = amRouteToFormAmRoute(route);

  const {
    handleSubmit,
    control,
    register,
    formState: { errors },
  } = useForm<FormAmRoute>({
    defaultValues: formAmRoute,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'object_matchers',
  });

  const overrideGrouping = useWatch({ control, name: 'overrideGrouping' });
  const overrideTimings = useWatch({ control, name: 'overrideTimings' });
  const muteTimeIntervals = useWatch({ control, name: 'muteTimeIntervals' }) ?? [];
  const activeTimeIntervals = useWatch({ control, name: 'activeTimeIntervals' }) ?? [];

  const handleFormSubmit = (values: FormAmRoute) => {
    const submittedValues: Partial<FormAmRoute> = { ...values };

    if (isRoot) {
      delete submittedValues.muteTimeIntervals;
      delete submittedValues.activeTimeIntervals;
    }

    onSubmit(submittedValues);
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
            'If enabled, matching will continue to subsequent sibling routes'
          )}
        >
          <Switch id="continue-toggle" {...register('continue')} />
        </Field>

        {/* Override Grouping */}
        <Field label={t('routes.edit.override-grouping', 'Override grouping')}>
          <Switch id="override-grouping-toggle" {...register('overrideGrouping')} />
        </Field>

        {overrideGrouping && (
          <Field
            label={t('routes.edit.group-by', 'Group by')}
            description={t(
              'routes.edit.group-by-description',
              'Combine alerts into a single notification by grouping by the same label values.'
            )}
          >
            <Controller
              render={({ field: { onChange, onBlur, value } }) => (
                <MultiCombobox
                  value={value ?? []}
                  createCustomValue
                  onChange={(selected) => {
                    const knownValues = new Set([
                      ...commonGroupByOptions.map((o) => o.value),
                      ...groupByOptions.map((o) => o.value),
                    ]);
                    const newOpts = selected.filter((o) => !knownValues.has(o.value));
                    if (newOpts.length) {
                      setGroupByOptions((opts) => [
                        ...opts,
                        ...newOpts.map((o) => ({ label: o.label ?? o.value, value: o.value })),
                      ]);
                    }
                    onChange(selected.map((v) => v.value));
                  }}
                  onBlur={onBlur}
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

        {overrideTimings && (
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
                  validate: (v) =>
                    !v || isValidPromDuration(v) || t('routes.edit.invalid-duration', 'Invalid duration format'),
                })}
                placeholder={t('routes.edit.group-wait-placeholder', '30s')}
              />
            </Field>

            <Field
              label={t('routes.edit.group-interval', 'Group interval')}
              description={t(
                'routes.edit.group-interval-description',
                'How long between checks for changes in a group, after the first notification'
              )}
              invalid={!!errors.groupIntervalValue}
              error={errors.groupIntervalValue?.message}
            >
              <Input
                {...register('groupIntervalValue', {
                  validate: (v) =>
                    !v || isValidPromDuration(v) || t('routes.edit.invalid-duration', 'Invalid duration format'),
                })}
                placeholder={t('routes.edit.group-interval-placeholder', '5m')}
              />
            </Field>

            <Field
              label={t('routes.edit.repeat-interval', 'Repeat interval')}
              description={t(
                'routes.edit.repeat-interval-description',
                'How long before an unchanged group is sent again. Rounded up to the next group interval.'
              )}
              invalid={!!errors.repeatIntervalValue}
              error={errors.repeatIntervalValue?.message}
            >
              <Input
                {...register('repeatIntervalValue', {
                  validate: (v) =>
                    !v || isValidPromDuration(v) || t('routes.edit.invalid-duration', 'Invalid duration format'),
                })}
                placeholder={t('routes.edit.repeat-interval-placeholder', '4h')}
              />
            </Field>
          </>
        )}

        {!isRoot && (
          <>
            {/* Mute Timings */}
            <Field
              label={t('routes.edit.mute-timings', 'Mute timings')}
              description={t(
                'routes.edit.mute-timings-description',
                'Notifications are not sent while any selected interval matches.'
              )}
            >
              <Controller
                render={({ field: { onChange, onBlur, value } }) => (
                  <MultiCombobox
                    value={value ?? []}
                    onChange={(selected) => onChange(selected.map((v) => v.value))}
                    onBlur={onBlur}
                    options={timeIntervalOptions}
                    placeholder={t('routes.edit.mute-timings-placeholder', 'Select mute timings')}
                  />
                )}
                control={control}
                name="muteTimeIntervals"
              />
            </Field>

            {/* Active Timings */}
            <Field
              label={t('routes.edit.active-timings', 'Active timings')}
              description={t(
                'routes.edit.active-timings-description',
                'Notifications are sent only while at least one selected interval matches.'
              )}
            >
              <Controller
                render={({ field: { onChange, onBlur, value } }) => (
                  <MultiCombobox
                    value={value ?? []}
                    onChange={(selected) => onChange(selected.map((v) => v.value))}
                    onBlur={onBlur}
                    options={timeIntervalOptions}
                    placeholder={t('routes.edit.active-timings-placeholder', 'Select active timings')}
                  />
                )}
                control={control}
                name="activeTimeIntervals"
              />
            </Field>

            <RouteTimingSummary
              muteTimeIntervalNames={muteTimeIntervals}
              activeTimeIntervalNames={activeTimeIntervals}
              timeIntervals={timeIntervals}
            />
          </>
        )}

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
