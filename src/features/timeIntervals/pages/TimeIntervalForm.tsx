import React from 'react';

import { t } from '@grafana/i18n';
import { locationService } from '@grafana/runtime';

import type { TimeInterval } from '@grafana/external-alertmanager/vanilla';

import { AlertmanagerPage } from '../../../components/AlertmanagerPage';
import { MutationUnavailable } from '../../../access-control/components/MutationUnavailable';
import { ROUTES } from '../../../constants';
import { useAlertmanagerConfigMutationAbility } from '../../../hooks/useAlertmanagerConfigMutationAbility';
import { prefixRoute } from '../../../utils/utils.routing';
import { TimeIntervalFormFields } from '../components/TimeIntervalFormFields';
import { useAddTimeInterval } from '../hooks/useTimeIntervals';

function TimeIntervalForm() {
  const mutationAbility = useAlertmanagerConfigMutationAbility();
  const [addTimeInterval, { isLoading, error }] = useAddTimeInterval();

  const navigateToList = () => locationService.push(prefixRoute(ROUTES.TimeIntervals));

  const handleSubmit = async (timeInterval: TimeInterval) => {
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
