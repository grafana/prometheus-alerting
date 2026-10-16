import React, { useEffect } from 'react';
import { Controller, useFieldArray, useForm, useFormContext, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Combobox, Field, FieldSet, Input, Stack } from '@grafana/ui';
import { t } from '@grafana/i18n';
import type { TimeInterval } from '@grafana/external-alertmanager/vanilla';
import { IANA_TIMEZONES } from '../utils/timezones';
import {
  blankInterval,
  blankTimeIntervalFormData,
  formDataToTimeInterval,
  timeIntervalToFormData,
  TimeIntervalFormSchema,
  type TimeIntervalFormData,
} from '../utils/form';
import { MutationError } from '../../../access-control/components/MutationError';

interface TimeIntervalFormFieldsProps {
  timeInterval?: TimeInterval;
  onSubmit: (timeInterval: TimeInterval) => void | Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  error?: unknown;
  submitButtonText?: string;
  cancelButtonText?: string;
  showNameField?: boolean;
}

export function TimeIntervalFormFields({
  timeInterval,
  onSubmit,
  onCancel,
  isLoading,
  error,
  submitButtonText,
  cancelButtonText,
  showNameField = true,
}: TimeIntervalFormFieldsProps) {
  const isEditMode = Boolean(timeInterval);

  const formAPI = useForm<TimeIntervalFormData>({
    resolver: zodResolver(TimeIntervalFormSchema),
    defaultValues: timeInterval ? timeIntervalToFormData(timeInterval) : blankTimeIntervalFormData(),
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = formAPI;

  const {
    fields: intervals,
    append: appendInterval,
    remove: removeInterval,
  } = useFieldArray({ control, name: 'intervals' });

  // Repopulate the form when editing and the time interval arrives (or changes)
  useEffect(() => {
    if (timeInterval) {
      reset(timeIntervalToFormData(timeInterval));
    }
  }, [timeInterval, reset]);

  const defaultSubmitButtonText = isLoading
    ? isEditMode
      ? t('time-intervals.form.updating', 'Updating...')
      : t('time-intervals.form.creating', 'Creating...')
    : isEditMode
      ? t('time-intervals.form.update-button', 'Update Time Interval')
      : t('time-intervals.form.create-button', 'Create Time Interval');

  return (
    <FormProvider {...formAPI}>
      <form onSubmit={handleSubmit((data) => onSubmit(formDataToTimeInterval(data)))}>
        <Stack direction="column" gap={2}>
          <MutationError
            error={error}
            fallbackTitle={
              isEditMode
                ? t('time-intervals.form.error-updating-title', 'Error updating time interval')
                : t('time-intervals.form.error-title', 'Error creating time interval')
            }
            resource={t('time-intervals.resource-label', 'time intervals')}
          />

          {showNameField && (
            <Field
              noMargin
              label={t('time-intervals.form.name-label', 'Name')}
              description={t('time-intervals.form.name-description', 'A unique name for this time interval')}
              invalid={!!errors.name}
              error={errors.name?.message}
              required
            >
              <Input
                {...register('name')}
                placeholder={t('time-intervals.form.name-placeholder', 'my-time-interval')}
                disabled={isEditMode}
              />
            </Field>
          )}

          {intervals.map((interval, index) => (
            <IntervalFields
              key={interval.id}
              index={index}
              onRemove={intervals.length > 1 ? () => removeInterval(index) : undefined}
            />
          ))}

          <Stack direction="row" gap={2}>
            <Button type="button" variant="secondary" icon="plus" onClick={() => appendInterval(blankInterval())}>
              {t('time-intervals.form.add-interval', 'Add interval')}
            </Button>
          </Stack>

          <Stack direction="row" gap={2}>
            <Button type="submit" disabled={isLoading}>
              {submitButtonText ?? defaultSubmitButtonText}
            </Button>
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
              {cancelButtonText ?? t('time-intervals.form.cancel-button', 'Cancel')}
            </Button>
          </Stack>
        </Stack>
      </form>
    </FormProvider>
  );
}

interface IntervalFieldsProps {
  index: number;
  /** Omitted for the last remaining interval — a time interval needs at least one. */
  onRemove?: () => void;
}

/**
 * One interval: when it applies (weekdays, days of month, months, years, timezone) and the times
 * of day it covers. An interval with no times at all covers the whole day.
 */
function IntervalFields({ index, onRemove }: IntervalFieldsProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<TimeIntervalFormData>();

  const {
    fields: times,
    append: appendTime,
    remove: removeTime,
  } = useFieldArray({ control, name: `intervals.${index}.times` });

  const intervalErrors = errors.intervals?.[index];

  return (
    <FieldSet label={t('time-intervals.form.interval-number', 'Interval {{number}}', { number: index + 1 })}>
      <Stack direction="column" gap={2}>
        {times.map((time, timeIndex) => (
          <Stack key={time.id} direction="row" gap={1} alignItems="flex-end">
            <Field
              noMargin
              label={timeIndex === 0 ? t('time-intervals.form.start-time-label', 'Start Time') : undefined}
              description={
                timeIndex === 0
                  ? t('time-intervals.form.start-time-description', 'Start time in HH:MM format')
                  : undefined
              }
              invalid={!!intervalErrors?.times?.[timeIndex]?.start_time}
              error={intervalErrors?.times?.[timeIndex]?.start_time?.message}
              required
            >
              <Input
                {...register(`intervals.${index}.times.${timeIndex}.start_time`)}
                placeholder={t('time-intervals.form.start-time-placeholder', '00:00')}
                aria-label={t('time-intervals.form.start-time-aria-label', 'Start time {{number}}', {
                  number: timeIndex + 1,
                })}
              />
            </Field>
            <Field
              noMargin
              label={timeIndex === 0 ? t('time-intervals.form.end-time-label', 'End Time') : undefined}
              description={
                timeIndex === 0 ? t('time-intervals.form.end-time-description', 'End time in HH:MM format') : undefined
              }
              invalid={!!intervalErrors?.times?.[timeIndex]?.end_time}
              error={intervalErrors?.times?.[timeIndex]?.end_time?.message}
              required
            >
              <Input
                {...register(`intervals.${index}.times.${timeIndex}.end_time`)}
                placeholder={t('time-intervals.form.end-time-placeholder', '23:59')}
                aria-label={t('time-intervals.form.end-time-aria-label', 'End time {{number}}', {
                  number: timeIndex + 1,
                })}
              />
            </Field>
            <Button
              type="button"
              variant="secondary"
              icon="trash-alt"
              onClick={() => removeTime(timeIndex)}
              tooltip={t('time-intervals.form.remove-time-range', 'Remove time range')}
              aria-label={t('time-intervals.form.remove-time-range-numbered', 'Remove time range {{number}}', {
                number: timeIndex + 1,
              })}
            />
          </Stack>
        ))}

        <Stack direction="row" gap={2}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon="plus"
            onClick={() => appendTime({ start_time: '00:00', end_time: '23:59' })}
          >
            {t('time-intervals.form.add-time-range', 'Add time range')}
          </Button>
        </Stack>

        <Field
          noMargin
          label={t('time-intervals.form.weekdays-label', 'Weekdays')}
          description={t(
            'time-intervals.form.weekdays-description',
            'Comma-separated list (e.g., monday, tuesday, wednesday)'
          )}
        >
          <Input
            {...register(`intervals.${index}.weekdays`)}
            placeholder={t('time-intervals.form.weekdays-placeholder', 'monday, tuesday, wednesday')}
          />
        </Field>

        <Field
          noMargin
          label={t('time-intervals.form.days-of-month-label', 'Days of Month')}
          description={t(
            'time-intervals.form.days-of-month-description',
            'Comma-separated list of days (e.g., 1, 15, -1 for last day)'
          )}
        >
          <Input
            {...register(`intervals.${index}.daysOfMonth`)}
            placeholder={t('time-intervals.form.days-of-month-placeholder', '1, 15, -1')}
          />
        </Field>

        <Field
          noMargin
          label={t('time-intervals.form.months-label', 'Months')}
          description={t('time-intervals.form.months-description', 'Comma-separated list (e.g., january, february)')}
        >
          <Input
            {...register(`intervals.${index}.months`)}
            placeholder={t('time-intervals.form.months-placeholder', 'january, february')}
          />
        </Field>

        <Field
          noMargin
          label={t('time-intervals.form.years-label', 'Years')}
          description={t('time-intervals.form.years-description', 'Comma-separated list (e.g., 2024, 2025)')}
        >
          <Input
            {...register(`intervals.${index}.years`)}
            placeholder={t('time-intervals.form.years-placeholder', '2024, 2025')}
          />
        </Field>

        <Field
          noMargin
          label={t('time-intervals.form.location-label', 'Location/Timezone')}
          description={t('time-intervals.form.location-description', 'IANA timezone (e.g., UTC, America/New_York)')}
          invalid={!!intervalErrors?.location}
          error={intervalErrors?.location?.message}
        >
          <Controller
            name={`intervals.${index}.location`}
            control={control}
            render={({ field: { onChange, value } }) => {
              const selectedTimezone = IANA_TIMEZONES.find((timezone) => timezone.value === value);
              const options =
                value && !selectedTimezone ? [{ label: value, value }, ...IANA_TIMEZONES] : IANA_TIMEZONES;

              return (
                <Combobox
                  options={options}
                  value={value ?? null}
                  onChange={(option) => onChange(option?.value)}
                  placeholder={t('time-intervals.form.location-placeholder', 'UTC')}
                  isClearable
                  aria-label={t('time-intervals.form.location-label', 'Location/Timezone')}
                />
              );
            }}
          />
        </Field>

        {onRemove && (
          <Stack direction="row" gap={2}>
            <Button type="button" variant="secondary" icon="trash-alt" onClick={onRemove}>
              {t('time-intervals.form.remove-interval', 'Remove interval')}
            </Button>
          </Stack>
        )}
      </Stack>
    </FieldSet>
  );
}
