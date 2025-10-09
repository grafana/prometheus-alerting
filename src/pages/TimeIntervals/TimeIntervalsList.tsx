import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { testIds } from '../../components/testIds';
import { PluginPage } from '@grafana/runtime';
import { Alert, Card } from '@grafana/ui';
import { useTimeIntervals } from '../../hooks/useTimeIntervals';
import { css } from '@emotion/css';
import { Trans, t } from '@grafana/i18n';

function TimeIntervalsPage() {
  const { timeIntervals, isLoading, error } = useTimeIntervals();

  const cardStyle = css`
    margin-bottom: 10px;
  `;

  const listStyle = css`
    list-style: none;
    padding-left: 0;
    margin: 8px 0;
  `;

  const listItemStyle = css`
    padding: 4px 0;
  `;

  const formatTimeRange = (times?: Array<{ start_time: string; end_time: string }>) => {
    if (!times || times.length === 0) {
      return t('time-intervals.all-day', 'All day');
    }
    return times.map((t) => `${t.start_time} - ${t.end_time}`).join(', ');
  };

  const formatList = (items?: string[]) => {
    if (!items || items.length === 0) {
      return t('time-intervals.all', 'All');
    }
    return items.join(', ');
  };

  return (
    <PluginPage>
      <div data-testid={testIds.timeIntervals.container}>
        {isLoading && (
          <div>
            <Skeleton height={50} style={{ marginBottom: '10px' }} />
            <Skeleton height={120} count={3} style={{ marginBottom: '5px' }} />
          </div>
        )}
        {error && (
          <Alert title={t('time-intervals.error-loading-title', 'Error loading time intervals')} severity="error">
            {error instanceof Error
              ? error.message
              : t('time-intervals.error-loading-message', 'Failed to fetch time intervals')}
          </Alert>
        )}
        {!isLoading && timeIntervals.length > 0 && (
          <div>
            {timeIntervals.map((interval, index) => (
              <div key={index} className={cardStyle}>
                <Card>
                  <Card.Heading>{interval.name}</Card.Heading>
                  <Card.Meta>
                    {interval.time_intervals && interval.time_intervals.length > 0 ? (
                      <ul className={listStyle}>
                        {interval.time_intervals.map((ti, tiIndex) => (
                          <li key={tiIndex} className={listItemStyle}>
                            <div>
                              <strong>
                                <Trans i18nKey="time-intervals.times-label">Times:</Trans>
                              </strong>{' '}
                              {formatTimeRange(ti.times)}
                            </div>
                            {ti.weekdays && ti.weekdays.length > 0 && (
                              <div>
                                <strong>
                                  <Trans i18nKey="time-intervals.weekdays-label">Weekdays:</Trans>
                                </strong>{' '}
                                {formatList(ti.weekdays)}
                              </div>
                            )}
                            {ti.days_of_month && ti.days_of_month.length > 0 && (
                              <div>
                                <strong>
                                  <Trans i18nKey="time-intervals.days-of-month-label">Days of Month:</Trans>
                                </strong>{' '}
                                {formatList(ti.days_of_month)}
                              </div>
                            )}
                            {ti.months && ti.months.length > 0 && (
                              <div>
                                <strong>
                                  <Trans i18nKey="time-intervals.months-label">Months:</Trans>
                                </strong>{' '}
                                {formatList(ti.months)}
                              </div>
                            )}
                            {ti.years && ti.years.length > 0 && (
                              <div>
                                <strong>
                                  <Trans i18nKey="time-intervals.years-label">Years:</Trans>
                                </strong>{' '}
                                {formatList(ti.years)}
                              </div>
                            )}
                            {ti.location && (
                              <div>
                                <strong>
                                  <Trans i18nKey="time-intervals.location-label">Location:</Trans>
                                </strong>{' '}
                                {ti.location}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div>
                        <Trans i18nKey="time-intervals.no-intervals-defined">No time intervals defined</Trans>
                      </div>
                    )}
                  </Card.Meta>
                </Card>
              </div>
            ))}
          </div>
        )}
        {!isLoading && timeIntervals.length === 0 && !error && (
          <Alert title={t('time-intervals.no-time-intervals-title', 'No time intervals found')} severity="info">
            <Trans i18nKey="time-intervals.no-time-intervals-message">
              No time intervals are configured in the Alertmanager.
            </Trans>
          </Alert>
        )}
      </div>
    </PluginPage>
  );
}

export default TimeIntervalsPage;
