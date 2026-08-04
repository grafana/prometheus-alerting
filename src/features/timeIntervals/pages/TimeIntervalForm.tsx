import React from 'react';

import { t } from '@grafana/i18n';
import { locationService } from '@grafana/runtime';

import { AlertmanagerPage } from '../../../components/AlertmanagerPage';
import { MutationUnavailable } from '../../../access-control/components/MutationUnavailable';
import { ROUTES } from '../../../constants';
import { useAlertmanagerConfigMutationAbility } from '../../../hooks/useAlertmanagerConfigMutationAbility';
import { prefixRoute } from '../../../utils/utils.routing';
import { TimeIntervalFormFields, type TimeIntervalFormData } from '../components/TimeIntervalFormFields';
import { useAddTimeInterval } from '../hooks/useTimeIntervals';

function TimeIntervalForm() {
  const mutationAbility = useAlertmanagerConfigMutationAbility();
  const [addTimeInterval, { isLoading, error }] = useAddTimeInterval();

  const navigateToList = () => locationService.push(prefixRoute(ROUTES.TimeIntervals));

  const handleSubmit = async (data: TimeIntervalFormData) => {
    const timeInterval = {
      name: data.name,
      time_intervals: [
        {
          times: [{ start_time: data.startTime, end_time: data.endTime }],
          weekdays: data.weekdays ? data.weekdays.split(',').map((day) => day.trim()) : undefined,
          days_of_month: data.daysOfMonth ? data.daysOfMonth.split(',').map((day) => day.trim()) : undefined,
          months: data.months ? data.months.split(',').map((month) => month.trim()) : undefined,
          years: data.years ? data.years.split(',').map((year) => year.trim()) : undefined,
          location: data.location || undefined,
        },
      ],
    };

    try {
      await addTimeInterval(timeInterval);
      navigateToList();
    } catch (err) {
      console.error('Failed to create time interval:', err);
    }
  };

  return (
    <AlertmanagerPage>
      <div style={{ maxWidth: '600px' }}>
        <h2>{t('time-intervals.form.page-title', 'Create Time Interval')}</h2>
        {mutationAbility.granted ? (
          <TimeIntervalFormFields
            onSubmit={handleSubmit}
            onCancel={navigateToList}
            isLoading={isLoading}
            error={error}
          />
        ) : (
          <MutationUnavailable resource={t('time-intervals.resource-label', 'time intervals')} />
        )}
      </div>
    </AlertmanagerPage>
  );
}

export default TimeIntervalForm;
