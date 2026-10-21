import React, { useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton';

import { t } from '@grafana/i18n';
import { Box, Button, EmptyState, FilterInput, LinkButton, Pagination, Stack, Text } from '@grafana/ui';

import { isAbilityAllowed } from '../../../access-control/abilities';
import { AlertmanagerError } from '../../../components/AlertmanagerError';
import { AlertmanagerPage } from '../../../components/AlertmanagerPage';
import { testIds } from '../../../components/testIds';
import { ViewState } from '../../../components/ViewState';
import { ALERTMANAGER_QUERY_PARAM, DEFAULT_PAGE_SIZE, ROUTES } from '../../../constants';
import { useAlertmanagerConfigMutationAbility } from '../../../hooks/useAlertmanagerConfigMutationAbility';
import { usePagination } from '../../../hooks/usePagination';
import { useURLSearchParams } from '../../../hooks/useURLSearchParams';
import { useAlertmanager } from '../../../hooks/useAlertmanager';
import { prefixRoute } from '../../../utils/utils.routing';
import { TimeIntervalDrawer } from '../components/TimeIntervalDrawer';
import { TimeIntervalScheduleDetails } from '../components/TimeIntervalScheduleDetails';
import { useTimeIntervals } from '../hooks/useTimeIntervals';
import { useTimeIntervalUses } from '../hooks/useTimeIntervalUses';

function TimeIntervalsPage() {
  const { timeIntervals, isLoading, error, isSuccess } = useTimeIntervals();
  const canMutateTimeIntervals = isAbilityAllowed(useAlertmanagerConfigMutationAbility());
  // The interval open in the drawer lives in the URL (?name=), along with the Alertmanager it
  // belongs to, so the link can be shared
  const [searchParams, updateSearchParams] = useURLSearchParams();
  const { uid: alertmanagerUID } = useAlertmanager();
  const selectedName = searchParams.get('name');
  const selectedTimeInterval = selectedName ? timeIntervals.find(({ name }) => name === selectedName) : undefined;
  const [searchQuery, setSearchQuery] = useState('');
  // Only show the route counts once the routes have loaded, so "0 routes" never means "still loading"
  const { getUses, isSuccess: hasLoadedRoutes } = useTimeIntervalUses();

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredTimeIntervals = normalizedSearchQuery
    ? timeIntervals.filter(({ name }) => name.toLowerCase().includes(normalizedSearchQuery))
    : timeIntervals;
  const { page, onPageChange, numberOfPages, pageItems } = usePagination(filteredTimeIntervals, DEFAULT_PAGE_SIZE);

  // Drop a name that doesn't match any interval (renamed or deleted since the link was made, or
  // removed from here), so the URL doesn't keep pointing at an interval that isn't there
  useEffect(() => {
    if (selectedName && isSuccess && !timeIntervals.some(({ name }) => name === selectedName)) {
      updateSearchParams({ name: undefined, [ALERTMANAGER_QUERY_PARAM]: undefined });
    }
  }, [selectedName, isSuccess, timeIntervals, updateSearchParams]);

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
                      <Stack direction="row" gap={2} alignItems="center">
                        {hasLoadedRoutes && <RouteCount count={getUses(timeInterval.name).length} />}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            updateSearchParams({ name: timeInterval.name, [ALERTMANAGER_QUERY_PARAM]: alertmanagerUID })
                          }
                        >
                          {t('time-intervals.view-button', 'View')}
                        </Button>
                      </Stack>
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
          onClose={() => updateSearchParams({ name: undefined, [ALERTMANAGER_QUERY_PARAM]: undefined })}
        />
      )}
    </AlertmanagerPage>
  );
}

function RouteCount({ count }: { count: number }) {
  return (
    <Text color="secondary" variant="bodySmall">
      {count === 0
        ? t('time-intervals.in-use.none', 'No route uses this time interval')
        : t('time-intervals.route-count', 'Used by {{count}} route', { count })}
    </Text>
  );
}

export default TimeIntervalsPage;
