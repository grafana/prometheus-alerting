import React, { useEffect, useMemo, useState } from 'react';

import { groupBy, isEmpty } from 'lodash';

import { t } from '@grafana/i18n';
import { Button, Icon, Stack, Text } from '@grafana/ui';

import { DataSourceRuleGroupIdentifier, DataSourceRulesSourceIdentifier, RuleGroup } from '../../../types/rules';
import { getApiGroupPageSize, FRONTED_GROUPED_PAGE_SIZE } from '../../../utils/paginationLimits';
import { groups } from '../../../utils/navigation';

import { NamespaceYamlDrawer } from '../namespace-yaml/components/NamespaceYamlDrawer';
import { DataSourceGroupLoader } from './DataSourceGroupLoader';
import { DataSourceSection, DataSourceSectionProps } from './components/DataSourceSection';
import { GroupIntervalIndicator } from './components/GroupIntervalMetadata';
import { ListGroup } from './components/ListGroup';
import { ListSection } from './components/ListSection';
import { LoadMoreButton } from './components/LoadMoreButton';
import { NoRulesFound } from './components/NoRulesFound';
import { groupFilter as groupFilterFn } from './hooks/filters';
import {
  useReportDataSourceError,
  useReportEmptyDataSource,
  useReportHealthyDataSource,
} from './hooks/useDataSourceErrors';
import { toIndividualRuleGroups, usePrometheusGroupsGenerator } from './hooks/prometheusGroupsGenerator';
import { useLazyLoadPrometheusGroups } from './hooks/useLazyLoadPrometheusGroups';

interface LoaderProps extends Required<Pick<DataSourceSectionProps, 'application'>> {
  rulesSourceIdentifier: DataSourceRulesSourceIdentifier;
  rulerApiEnabled: boolean;
  groupFilter?: string;
  namespaceFilter?: string;
  /** When true, return null instead of rendering when there are no matching results */
  hideOnEmpty?: boolean;
}

export function PaginatedDataSourceLoader({
  rulesSourceIdentifier,
  application,
  rulerApiEnabled,
  groupFilter,
  namespaceFilter,
  hideOnEmpty = false,
}: LoaderProps) {
  const key = `${rulesSourceIdentifier.uid}-${groupFilter}-${namespaceFilter}`;

  // Key is crucial. It resets the generator when filters change.
  return (
    <PaginatedGroupsLoader
      key={key}
      rulesSourceIdentifier={rulesSourceIdentifier}
      application={application}
      rulerApiEnabled={rulerApiEnabled}
      groupFilter={groupFilter}
      namespaceFilter={namespaceFilter}
      hideOnEmpty={hideOnEmpty}
    />
  );
}

function PaginatedGroupsLoader({
  rulesSourceIdentifier,
  application,
  rulerApiEnabled,
  groupFilter,
  namespaceFilter,
  hideOnEmpty = false,
}: LoaderProps) {
  // If there are filters, we don't want to populate the cache to avoid performance issues
  // Filtering may trigger multiple HTTP requests, which would populate the cache with a lot of groups hurting performance
  const hasFilters = Boolean(groupFilter || namespaceFilter);

  const { uid, name } = rulesSourceIdentifier;
  const prometheusGroupsGenerator = usePrometheusGroupsGenerator();
  const [viewingYamlNamespace, setViewingYamlNamespace] = useState<string | null>(null);

  // If there are no filters we can match one frontend page to one API page.
  // However, if there are filters, we need to fetch more groups from the API to populate one frontend page
  const apiGroupPageSize = getApiGroupPageSize(hasFilters);

  const [generator] = useState(() =>
    toIndividualRuleGroups(prometheusGroupsGenerator(rulesSourceIdentifier, apiGroupPageSize))
  );

  useEffect(() => {
    return () => {
      generator.return();
    };
  }, [generator]);

  const filterFn = useMemo(
    () => (group: RuleGroup) =>
      groupFilterFn(group, {
        namespace: namespaceFilter,
        groupName: groupFilter,
      }),
    [namespaceFilter, groupFilter]
  );

  const { isLoading, groups, hasReceivedGroups, hasMoreGroups, fetchMoreGroups, error } = useLazyLoadPrometheusGroups(
    generator,
    FRONTED_GROUPED_PAGE_SIZE,
    filterFn
  );

  const hasNoRules = isEmpty(groups) && !isLoading;
  const groupsByNamespace = useMemo(() => groupBy(groups, 'file'), [groups]);

  // Judge the data source by what it sent (`hasReceivedGroups`), not by `groups`, which only holds the
  // filter matches. A later page failing after some groups loaded is not reported as a failure.
  useReportDataSourceError(uid, hasReceivedGroups ? undefined : error);
  // `hasMoreGroups` stays true until the last page, so we don't report "empty" before the first request.
  // Only this view reports "empty", the list view leaves it to us.
  useReportEmptyDataSource(uid, !error && !hasReceivedGroups && !hasMoreGroups);
  // Clears what an earlier view reported
  useReportHealthyDataSource(uid, hasReceivedGroups);

  // Hide datasource section when filters are active and there are no matching results
  if (hideOnEmpty && hasNoRules) {
    return null;
  }

  return (
    <DataSourceSection name={name} application={application} uid={uid} isLoading={isLoading} error={error}>
      <Stack direction="column" gap={0}>
        {Object.entries(groupsByNamespace).map(([namespace, groups]) => (
          <ListSection
            key={namespace}
            title={
              <Stack direction="row" gap={1} alignItems="center">
                <Icon name="folder" />{' '}
                <Text variant="body" element="h3">
                  {namespace}
                </Text>
              </Stack>
            }
            actions={
              rulerApiEnabled ? (
                <Button
                  variant="secondary"
                  size="sm"
                  icon="file-alt"
                  aria-label={t('alerting.namespace-yaml.view-aria-label', 'View YAML for namespace {{namespace}}', {
                    namespace,
                  })}
                  onClick={() => setViewingYamlNamespace(namespace)}
                >
                  {t('alerting.namespace-yaml.view', 'View YAML')}
                </Button>
              ) : null
            }
          >
            {groups.map((group) => (
              <RuleGroupListItem
                key={`${rulesSourceIdentifier.uid}-${namespace}-${group.name}`}
                group={group}
                rulesSourceIdentifier={rulesSourceIdentifier}
                namespaceName={namespace}
                application={application}
                rulerApiEnabled={rulerApiEnabled}
              />
            ))}
          </ListSection>
        ))}
        {hasMoreGroups && !hasNoRules && (
          // this div will make the button not stretch
          <div>
            <LoadMoreButton loading={isLoading} onClick={fetchMoreGroups} />
          </div>
        )}
        {hasNoRules && <NoRulesFound />}
      </Stack>
      {viewingYamlNamespace && (
        <NamespaceYamlDrawer
          dataSourceUid={uid}
          namespace={viewingYamlNamespace}
          onClose={() => setViewingYamlNamespace(null)}
        />
      )}
    </DataSourceSection>
  );
}

interface RuleGroupListItemProps extends Required<Pick<DataSourceSectionProps, 'application'>> {
  group: RuleGroup;
  rulesSourceIdentifier: DataSourceRulesSourceIdentifier;
  namespaceName: string;
  rulerApiEnabled: boolean;
}

function RuleGroupListItem({
  rulesSourceIdentifier,
  group,
  namespaceName,
  application,
  rulerApiEnabled,
}: RuleGroupListItemProps) {
  const groupIdentifier: DataSourceRuleGroupIdentifier = useMemo(
    () => ({
      rulesSource: rulesSourceIdentifier,
      namespace: { name: namespaceName },
      groupName: group.name,
    }),
    [rulesSourceIdentifier, namespaceName, group.name]
  );

  return (
    <ListGroup
      key={group.name}
      name={group.name}
      href={groups.detailsPageLink(rulesSourceIdentifier.uid, namespaceName, group.name)}
      isOpen={false}
      metaRight={<GroupIntervalIndicator seconds={group.interval} />}
    >
      <DataSourceGroupLoader
        groupIdentifier={groupIdentifier}
        expectedRulesCount={group.rules.length}
        application={application}
        rulerApiEnabled={rulerApiEnabled}
      />
    </ListGroup>
  );
}
