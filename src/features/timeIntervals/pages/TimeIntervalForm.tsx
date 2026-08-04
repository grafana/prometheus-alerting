import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Field, Input, Stack } from '@grafana/ui';
import Skeleton from 'react-loading-skeleton';

import { AlertmanagerPage } from '../../../components/AlertmanagerPage';
import { ROUTES } from '../../../constants';
import { prefixRoute } from '../../../utils/utils.routing';
import { t, Trans } from '@grafana/i18n';
import { locationService } from '@grafana/runtime';
import { z } from 'zod';
import { useTimeIntervals, useAddTimeInterval, useUpdateTimeInterval } from '../hooks/useTimeIntervals';
import type { TimeInterval } from '@grafana/external-alertmanager/vanilla';
import { useHasConfigurationAPI } from '../../../hooks/useHasConfigurationAPI';
import { getAlertmanagerConfigMutationAbility } from '../../../access-control/abilities.alertmanager';
import { isAbilityAllowed } from '../../../access-control/abilities';
import { TimeIntervalMutationUnavailable, TimeIntervalsError } from '../components/TimeIntervalsError';
import { getTimeIntervalMutationErrorFeedback } from '../utils/errorFeedback';

const TimeIntervalFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  weekdays: z.string().optional(),
  daysOfMonth: z.string().optional(),
  months: z.string().optional(),
  years: z.string().optional(),
  location: z.string().optional(),
});

type TimeIntervalFormData = z.infer<typeof TimeIntervalFormSchema>;

function TimeIntervalForm() {
  const { name } = useParams<{ name: string }>();
  const isEditMode = Boolean(name);
  const hasConfigurationAPI = useHasConfigurationAPI();
  const mutationAbility = getAlertmanagerConfigMutationAbility(hasConfigurationAPI);
  const canMutateTimeIntervals = isAbilityAllowed(mutationAbility);
  const { timeIntervals, isLoading: isLoadingTimeIntervals, error: loadError } = useTimeIntervals();
  const [addTimeInterval, { isLoading: isAdding, error: addError, isSuccess: isAddSuccess }] = useAddTimeInterval();
  const [updateTimeInterval, { isLoading: isUpdating, error: updateError, isSuccess: isUpdateSuccess }] =
    useUpdateTimeInterval();

  const isLoading = isAdding || isUpdating;
  const mutationError = addError || updateError;
  const isSuccess = isAddSuccess || isUpdateSuccess;
  const mutationErrorFeedback = mutationError
    ? getTimeIntervalMutationErrorFeedback(
        mutationError,
        isEditMode
          ? t('time-intervals.form.error-updating-title', 'Error updating time interval')
          : t('time-intervals.form.error-title', 'Error creating time interval')
      )
    : undefined;

  const existingTimeInterval = isEditMode ? timeIntervals.find((ti: TimeInterval) => ti.name === name) : undefined;

  const {
    register,
    handleSubmit,
    reset,
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
    if (isEditMode && existingTimeInterval) {
      const firstInterval = existingTimeInterval.time_intervals?.[0];
      reset({
        name: existingTimeInterval.name,
        startTime: firstInterval?.times?.[0]?.start_time || '00:00',
        endTime: firstInterval?.times?.[0]?.end_time || '23:59',
        weekdays: firstInterval?.weekdays?.join(', '),
        daysOfMonth: firstInterval?.days_of_month?.join(', '),
        months: firstInterval?.months?.join(', '),
        years: firstInterval?.years?.join(', '),
        location: firstInterval?.location || 'UTC',
      });
    }
  }, [isEditMode, existingTimeInterval, reset]);

  const onSubmit = async (data: TimeIntervalFormData) => {
    if (!canMutateTimeIntervals) {
      return;
    }

    try {
      const timeInterval = {
        name: data.name,
        time_intervals: [
          {
            times: [
              {
                start_time: data.startTime,
                end_time: data.endTime,
              },
            ],
            weekdays: data.weekdays ? data.weekdays.split(',').map((d) => d.trim()) : undefined,
            days_of_month: data.daysOfMonth ? data.daysOfMonth.split(',').map((d) => d.trim()) : undefined,
            months: data.months ? data.months.split(',').map((m) => m.trim()) : undefined,
            years: data.years ? data.years.split(',').map((y) => y.trim()) : undefined,
            location: data.location || undefined,
          },
        ],
      };

      if (isEditMode && name) {
        await updateTimeInterval(timeInterval, name);
      } else {
        await addTimeInterval(timeInterval);
      }

      // Navigate back to time intervals list on success
      locationService.push(prefixRoute(ROUTES.TimeIntervals));
    } catch (err) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} time interval:`, err);
    }
  };

  if (!canMutateTimeIntervals) {
    return (
      <AlertmanagerPage>
        <div style={{ maxWidth: '600px' }}>
          <h2>{t('time-intervals.form.page-title', 'Create Time Interval')}</h2>
          {loadError && (
            <TimeIntervalsError
              error={loadError}
              title={t('time-intervals.form.error-loading-title', 'Error loading time interval')}
            />
          )}
          <TimeIntervalMutationUnavailable ability={mutationAbility} />
        </div>
      </AlertmanagerPage>
    );
  }

  return (
    <AlertmanagerPage>
      <div style={{ maxWidth: '600px' }}>
        {isLoadingTimeIntervals && isEditMode ? (
          <Skeleton height={24} count={10} />
        ) : (
          <>
            <h2>
              {isEditMode
                ? t('time-intervals.form.edit-page-title', 'Edit Time Interval')
                : t('time-intervals.form.page-title', 'Create Time Interval')}
            </h2>
            {loadError && (
              <TimeIntervalsError
                error={loadError}
                title={t('time-intervals.form.error-loading-title', 'Error loading time interval')}
              />
            )}
            {isEditMode && !existingTimeInterval && !isLoadingTimeIntervals && !loadError && (
              <Alert title={t('time-intervals.form.not-found-title', 'Time interval not found')} severity="error">
                {t('time-intervals.form.not-found-message', 'The time interval "{{name}}" does not exist.', { name })}
              </Alert>
            )}
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack direction="column" gap={2}>
                {mutationErrorFeedback && (
                  <Alert title={mutationErrorFeedback.title} severity="error">
                    {mutationErrorFeedback.description}
                  </Alert>
                )}

                {isSuccess && (
                  <Alert
                    title={
                      isEditMode
                        ? t('time-intervals.form.success-updating-title', 'Time interval updated')
                        : t('time-intervals.form.success-title', 'Time interval created')
                    }
                    severity="success"
                  >
                    {isEditMode ? (
                      <Trans i18nKey="time-intervals.form.success-updating-message">
                        Time interval has been updated successfully.
                      </Trans>
                    ) : (
                      <Trans i18nKey="time-intervals.form.success-message">
                        Time interval has been created successfully.
                      </Trans>
                    )}
                  </Alert>
                )}

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

                <Field
                  noMargin
                  label={t('time-intervals.form.start-time-label', 'Start Time')}
                  description={t('time-intervals.form.start-time-description', 'Start time in HH:MM format')}
                  invalid={!!errors.startTime}
                  error={errors.startTime?.message}
                  required
                >
                  <Input
                    {...register('startTime')}
                    placeholder={t('time-intervals.form.start-time-placeholder', '00:00')}
                  />
                </Field>

                <Field
                  noMargin
                  label={t('time-intervals.form.end-time-label', 'End Time')}
                  description={t('time-intervals.form.end-time-description', 'End time in HH:MM format')}
                  invalid={!!errors.endTime}
                  error={errors.endTime?.message}
                  required
                >
                  <Input
                    {...register('endTime')}
                    placeholder={t('time-intervals.form.end-time-placeholder', '23:59')}
                  />
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
                  description={t(
                    'time-intervals.form.months-description',
                    'Comma-separated list (e.g., january, february)'
                  )}
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
                  <Input
                    {...register('years')}
                    placeholder={t('time-intervals.form.years-placeholder', '2024, 2025')}
                  />
                </Field>

                <Field
                  noMargin
                  label={t('time-intervals.form.location-label', 'Location/Timezone')}
                  description={t(
                    'time-intervals.form.location-description',
                    'IANA timezone (e.g., UTC, America/New_York)'
                  )}
                  invalid={!!errors.location}
                  error={errors.location?.message}
                >
                  <Input {...register('location')} placeholder={t('time-intervals.form.location-placeholder', 'UTC')} />
                </Field>

                <Stack direction="row" gap={2}>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading
                      ? isEditMode
                        ? t('time-intervals.form.updating', 'Updating...')
                        : t('time-intervals.form.creating', 'Creating...')
                      : isEditMode
                        ? t('time-intervals.form.update-button', 'Update Time Interval')
                        : t('time-intervals.form.create-button', 'Create Time Interval')}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => locationService.push(prefixRoute(ROUTES.TimeIntervals))}
                  >
                    {t('time-intervals.form.cancel-button', 'Cancel')}
                  </Button>
                </Stack>
              </Stack>
            </form>
          </>
        )}
      </div>
    </AlertmanagerPage>
  );
}

export default TimeIntervalForm;
