import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Field, Input, Stack, Combobox } from '@grafana/ui';
import { t } from '@grafana/i18n';
import type { TimeInterval } from '@grafana/external-alertmanager/vanilla';
import { IANA_TIMEZONES } from '../utils/timezones';
import { MutationError } from '../../../access-control/components/MutationError';

export const TimeIntervalFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  weekdays: z.string().optional(),
  daysOfMonth: z.string().optional(),
  months: z.string().optional(),
  years: z.string().optional(),
  location: z.string().optional(),
});

export type TimeIntervalFormData = z.infer<typeof TimeIntervalFormSchema>;

interface TimeIntervalFormFieldsProps {
  timeInterval?: TimeInterval;
  onSubmit: (data: TimeIntervalFormData) => void | Promise<void>;
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
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<TimeIntervalFormData>({
    resolver: zodResolver(TimeIntervalFormSchema),
    defaultValues: {
      name: '',
      startTime: '00:00',
      endTime: '23:59',
      weekdays: undefined,
      daysOfMonth: undefined,
      months: undefined,
      years: undefined,
      location: 'UTC',
    },
  });

  // Populate form when editing and data is loaded
  useEffect(() => {
    if (timeInterval) {
      const firstInterval = timeInterval.time_intervals?.[0];
      reset({
        name: timeInterval.name,
        startTime: firstInterval?.times?.[0]?.start_time || '00:00',
        endTime: firstInterval?.times?.[0]?.end_time || '23:59',
        weekdays: firstInterval?.weekdays?.join(', '),
        daysOfMonth: firstInterval?.days_of_month?.join(', '),
        months: firstInterval?.months?.join(', '),
        years: firstInterval?.years?.join(', '),
        location: firstInterval?.location || 'UTC',
      });
    }
  }, [timeInterval, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
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

        <Field
          noMargin
          label={t('time-intervals.form.start-time-label', 'Start Time')}
          description={t('time-intervals.form.start-time-description', 'Start time in HH:MM format')}
          invalid={!!errors.startTime}
          error={errors.startTime?.message}
          required
        >
          <Input {...register('startTime')} placeholder={t('time-intervals.form.start-time-placeholder', '00:00')} />
        </Field>

        <Field
          noMargin
          label={t('time-intervals.form.end-time-label', 'End Time')}
          description={t('time-intervals.form.end-time-description', 'End time in HH:MM format')}
          invalid={!!errors.endTime}
          error={errors.endTime?.message}
          required
        >
          <Input {...register('endTime')} placeholder={t('time-intervals.form.end-time-placeholder', '23:59')} />
        </Field>

        <Field
          noMargin
          label={t('time-intervals.form.weekdays-label', 'Weekdays')}
          description={t(
            'time-intervals.form.weekdays-description',
            'Comma-separated list (e.g., monday, tuesday, wednesday)'
          )}
          invalid={!!errors.weekdays}
          error={errors.weekdays?.message}
        >
          <Input
            {...register('weekdays')}
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
          invalid={!!errors.daysOfMonth}
          error={errors.daysOfMonth?.message}
        >
          <Input
            {...register('daysOfMonth')}
            placeholder={t('time-intervals.form.days-of-month-placeholder', '1, 15, -1')}
          />
        </Field>

        <Field
          noMargin
          label={t('time-intervals.form.months-label', 'Months')}
          description={t('time-intervals.form.months-description', 'Comma-separated list (e.g., january, february)')}
          invalid={!!errors.months}
          error={errors.months?.message}
        >
          <Input
            {...register('months')}
            placeholder={t('time-intervals.form.months-placeholder', 'january, february')}
          />
        </Field>

        <Field
          noMargin
          label={t('time-intervals.form.years-label', 'Years')}
          description={t('time-intervals.form.years-description', 'Comma-separated list (e.g., 2024, 2025)')}
          invalid={!!errors.years}
          error={errors.years?.message}
        >
          <Input {...register('years')} placeholder={t('time-intervals.form.years-placeholder', '2024, 2025')} />
        </Field>

        <Field
          noMargin
          label={t('time-intervals.form.location-label', 'Location/Timezone')}
          description={t('time-intervals.form.location-description', 'IANA timezone (e.g., UTC, America/New_York)')}
          invalid={!!errors.location}
          error={errors.location?.message}
        >
          <Controller
            name="location"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Combobox
                options={IANA_TIMEZONES}
                value={IANA_TIMEZONES.find((tz) => tz.value === value) || IANA_TIMEZONES[0]}
                onChange={(option) => onChange(option.value)}
                placeholder={t('time-intervals.form.location-placeholder', 'UTC')}
                isClearable={false}
              />
            )}
          />
        </Field>

        <Stack direction="row" gap={2}>
          <Button type="submit" disabled={isLoading}>
            {submitButtonText ||
              (isLoading
                ? isEditMode
                  ? t('time-intervals.form.updating', 'Updating...')
                  : t('time-intervals.form.creating', 'Creating...')
                : isEditMode
                  ? t('time-intervals.form.update-button', 'Update Time Interval')
                  : t('time-intervals.form.create-button', 'Create Time Interval'))}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
            {cancelButtonText || t('time-intervals.form.cancel-button', 'Cancel')}
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
