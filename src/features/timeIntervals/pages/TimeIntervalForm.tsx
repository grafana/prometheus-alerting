import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Field, Input, Stack } from '@grafana/ui';
import { AlertmanagerPage } from '../../../components/AlertmanagerPage';
import { useProduceNewAlertmanagerConfiguration } from '../../../hooks/useProduceNewAlertmanagerConfiguration';
import { addMuteTimingAction } from '../../../reducers/alertmanager/timeIntervals';
import { ROUTES } from '../../../constants';
import { prefixRoute } from '../../../utils/utils.routing';
import { t, Trans } from '@grafana/i18n';
import { locationService } from '@grafana/runtime';
import { z } from 'zod';

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
  const [produceNewConfig, { isLoading, error: mutationError, isSuccess }] = useProduceNewAlertmanagerConfiguration();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TimeIntervalFormData>({
    resolver: zodResolver(TimeIntervalFormSchema),
    defaultValues: {
      name: '',
      startTime: '00:00',
      endTime: '23:59',
      weekdays: '',
      daysOfMonth: '',
      months: '',
      years: '',
      location: 'UTC',
    },
  });

  const onSubmit = async (data: TimeIntervalFormData) => {
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
            weekdays: data.weekdays ? data.weekdays.split(',').map((d) => d.trim()) : [],
            days_of_month: data.daysOfMonth ? data.daysOfMonth.split(',').map((d) => d.trim()) : [],
            months: data.months ? data.months.split(',').map((m) => m.trim()) : [],
            years: data.years ? data.years.split(',').map((y) => y.trim()) : [],
            location: data.location || '',
          },
        ],
      };

      await produceNewConfig(addMuteTimingAction({ interval: timeInterval }));

      // Navigate back to time intervals list on success
      locationService.push(prefixRoute(ROUTES.TimeIntervals));
    } catch (err) {
      console.error('Failed to create time interval:', err);
    }
  };

  return (
    <AlertmanagerPage>
      <div style={{ maxWidth: '600px' }}>
        <h2>{t('time-intervals.form.page-title', 'Create Time Interval')}</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack direction="column" gap={3}>
            {mutationError ? (
              <Alert title={t('time-intervals.form.error-title', 'Error creating time interval')} severity="error">
                {mutationError instanceof Error
                  ? mutationError.message
                  : t('time-intervals.form.error-generic', 'An error occurred')}
              </Alert>
            ) : null}

            {isSuccess && (
              <Alert title={t('time-intervals.form.success-title', 'Time interval created')} severity="success">
                <Trans i18nKey="time-intervals.form.success-message">
                  Time interval has been created successfully.
                </Trans>
              </Alert>
            )}

            <Field
              label={t('time-intervals.form.name-label', 'Name')}
              description={t('time-intervals.form.name-description', 'A unique name for this time interval')}
              invalid={!!errors.name}
              error={errors.name?.message}
              required
            >
              <Input
                {...register('name')}
                placeholder={t('time-intervals.form.name-placeholder', 'my-time-interval')}
              />
            </Field>

            <Field
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
              label={t('time-intervals.form.end-time-label', 'End Time')}
              description={t('time-intervals.form.end-time-description', 'End time in HH:MM format')}
              invalid={!!errors.endTime}
              error={errors.endTime?.message}
              required
            >
              <Input {...register('endTime')} placeholder={t('time-intervals.form.end-time-placeholder', '23:59')} />
            </Field>

            <Field
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
              label={t('time-intervals.form.years-label', 'Years')}
              description={t('time-intervals.form.years-description', 'Comma-separated list (e.g., 2024, 2025)')}
              invalid={!!errors.years}
              error={errors.years?.message}
            >
              <Input {...register('years')} placeholder={t('time-intervals.form.years-placeholder', '2024, 2025')} />
            </Field>

            <Field
              label={t('time-intervals.form.location-label', 'Location/Timezone')}
              description={t('time-intervals.form.location-description', 'IANA timezone (e.g., UTC, America/New_York)')}
              invalid={!!errors.location}
              error={errors.location?.message}
            >
              <Input {...register('location')} placeholder={t('time-intervals.form.location-placeholder', 'UTC')} />
            </Field>

            <Stack direction="row" gap={2}>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? t('time-intervals.form.creating', 'Creating...')
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
      </div>
    </AlertmanagerPage>
  );
}

export default TimeIntervalForm;
