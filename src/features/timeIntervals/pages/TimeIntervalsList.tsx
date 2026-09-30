import React, { useState } from 'react';
import Skeleton from 'react-loading-skeleton';

import type { TimeInterval } from '@grafana/external-alertmanager/vanilla';
import { t } from '@grafana/i18n';
import { Box, Button, EmptyState, FilterInput, LinkButton, Pagination, Stack, Text } from '@grafana/ui';

import { isAbilityAllowed } from '../../../access-control/abilities';
import { AlertmanagerError } from '../../../components/AlertmanagerError';
import { AlertmanagerPage } from '../../../components/AlertmanagerPage';
import { testIds } from '../../../components/testIds';
import { ViewState } from '../../../components/ViewState';
import { DEFAULT_PAGE_SIZE, ROUTES } from '../../../constants';
import { useAlertmanagerConfigMutationAbility } from '../../../hooks/useAlertmanagerConfigMutationAbility';
import { usePagination } from '../../../hooks/usePagination';
import { prefixRoute } from '../../../utils/utils.routing';
import { TimeIntervalDrawer } from '../components/TimeIntervalDrawer';
import { TimeIntervalScheduleDetails } from '../components/TimeIntervalScheduleDetails';
import { useTimeIntervals } from '../hooks/useTimeIntervals';

function TimeIntervalsPage() {
  const { timeIntervals, isLoading, error, isSuccess } = useTimeIntervals();
  const canMutateTimeIntervals = isAbilityAllowed(useAlertmanagerConfigMutationAbility());
  const [selectedTimeInterval, setSelectedTimeInterval] = useState<TimeInterval | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredTimeIntervals = normalizedSearchQuery
    ? timeIntervals.filter(({ name }) => name.toLowerCase().includes(normalizedSearchQuery))
    : timeIntervals;
  const { page, onPageChange, numberOfPages, pageItems } = usePagination(filteredTimeIntervals, DEFAULT_PAGE_SIZE);

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    onPageChange(1);
  };

  return (
    <AlertmanagerPage
      subTitle={t('time-intervals.page-subtitle', 'Define time windows for muting or activating notifications')}
    >
      <Stack direction="row" gap={2} alignItems="center" justifyContent="space-between" wrap="wrap">
        <Box flex="1 1 280px" maxWidth="400px">
          <FilterInput
            value={searchQuery}
            onChange={handleSearchQueryChange}
            escapeRegex={false}
            aria-label={t('time-intervals.search-label', 'Search time intervals by name')}
            placeholder={t('time-intervals.search-placeholder', 'Search time intervals')}
          />
        </Box>
        {canMutateTimeIntervals && (
          <LinkButton href={prefixRoute(ROUTES.CreateTimeInterval)}>
            {t('time-intervals.create-button', 'Create time interval')}
          </LinkButton>
        )}
      </Stack>
      <Box marginTop={2} data-testid={testIds.timeIntervals.container}>
        <ViewState
          isLoading={isLoading}
          isSuccess={isSuccess}
          error={error}
          isEmpty={timeIntervals.length === 0}
          loading={
            <Stack direction="column" gap={1}>
              <Skeleton height={120} count={3} />
            </Stack>
          }
          renderError={
            <AlertmanagerError
              error={error}
              title={t('time-intervals.error-loading-title', 'Error loading time intervals')}
            />
          }
          empty={
            <EmptyState
              message={t(
                'time-intervals.no-time-intervals-message',
                'No time intervals are configured in the Alertmanager.'
              )}
              variant="call-to-action"
            />
          }
        >
          {filteredTimeIntervals.length === 0 ? (
            <EmptyState
              message={t('time-intervals.no-search-results', 'No time intervals match your search.')}
              variant="not-found"
            />
          ) : (
            <Stack direction="column" gap={2}>
              {pageItems.map((timeInterval) => (
                <Box key={timeInterval.name} padding={2} borderColor="weak" borderStyle="solid" borderRadius="default">
                  <Stack direction="column" gap={2}>
                    <Stack direction="row" gap={2} alignItems="center" justifyContent="space-between">
                      <Text element="h2" variant="h4">
                        {timeInterval.name}
                      </Text>
                      <Button variant="secondary" size="sm" onClick={() => setSelectedTimeInterval(timeInterval)}>
                        {t('time-intervals.view-button', 'View')}
                      </Button>
                    </Stack>
                    <TimeIntervalScheduleDetails timeInterval={timeInterval} />
                  </Stack>
                </Box>
              ))}
              <Pagination
                currentPage={page}
                numberOfPages={numberOfPages}
                onNavigate={onPageChange}
                hideWhenSinglePage
              />
            </Stack>
          )}
        </ViewState>
      </Box>
      {selectedTimeInterval && (
        <TimeIntervalDrawer
          timeInterval={selectedTimeInterval}
          onClose={() => {
            setSelectedTimeInterval(null);
          }}
        />
      )}
    </AlertmanagerPage>
  );
}

export default TimeIntervalsPage;
