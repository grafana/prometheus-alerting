import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { skipToken } from '@reduxjs/toolkit/query';

import { t } from '@grafana/i18n';
import { getDataSourceSrv, PluginPage } from '@grafana/runtime';
import { Alert, LoadingPlaceholder } from '@grafana/ui';

import { useGetGroupsQuery } from '../../../api/rules/prometheus.endpoints';
import { useDiscoverFeaturesQuery } from '../../../api/rules/featureDiscovery.endpoints';
import { useGetRulerRuleGroupQuery } from '../../../api/rules/mimir.endpoints';
import { PLUGIN_BASE_URL, ROUTES } from '../../../constants';
import { DataSourceRuleGroupIdentifier } from '../../../types/rules';
import { groups } from '../../../utils/navigation';
import { DataSourceGroupLoader } from '../list/DataSourceGroupLoader';
import { GroupDetailsTitle } from '../components/GroupDetailsTitle';
import { GroupDetailsActions } from '../components/GroupDetailsActions';

type GroupPageRouteParams = {
  dataSourceUid?: string;
  namespace?: string;
  groupName?: string;
};

function GroupDetails() {
  const { dataSourceUid = '', namespace = '', groupName = '' } = useParams<GroupPageRouteParams>();

  // Get datasource name from the datasource service
  const dataSourceName = getDataSourceSrv().getInstanceSettings(dataSourceUid)?.name ?? '';

  // Feature discovery to get datasource capabilities
  const {
    data: dsFeatures,
    isLoading: isDsFeaturesLoading,
    error: dsFeaturesError,
  } = useDiscoverFeaturesQuery({ uid: dataSourceUid });

  // Fetch Prometheus group to get interval info
  const {
    data: promResponse,
    isLoading: isPromLoading,
    error: promError,
  } = useGetGroupsQuery({
    ruleSource: { uid: dataSourceUid },
    namespace: namespace,
    groupName: groupName,
  });

  // Fetch ruler group when ruler API is available
  const {
    data: rulerGroup,
    isLoading: isRulerLoading,
    error: rulerError,
  } = useGetRulerRuleGroupQuery(
    dsFeatures?.rulerApiEnabled
      ? {
          dataSourceUid: dataSourceUid,
          namespace: namespace,
          groupName: groupName,
        }
      : skipToken
  );

  const isLoading = isDsFeaturesLoading || isPromLoading || isRulerLoading;

  // Find the group from Prometheus response
  const promGroup = useMemo(() => {
    return promResponse?.data.groups.find((g) => g.file === namespace && g.name === groupName);
  }, [promResponse, namespace, groupName]);

  // Format the group interval for display
  const groupInterval = useMemo(() => {
    if (promGroup?.interval) {
      // Prometheus returns interval in seconds
      return `${promGroup.interval}s`;
    }
    if (rulerGroup?.interval) {
      return rulerGroup.interval;
    }
    return '1m'; // Default
  }, [promGroup?.interval, rulerGroup?.interval]);

  // Page navigation structure
  const pageNav = useMemo(() => {
    return {
      text: groupName,
      parentItem: {
        text: namespace,
        parentItem: {
          text: t('alerting.group-details.rules', 'Rules'),
          url: `${PLUGIN_BASE_URL}/${ROUTES.Rules}`,
        },
      },
    };
  }, [groupName, namespace]);

  // Build group identifier for DataSourceGroupLoader
  const groupIdentifier: DataSourceRuleGroupIdentifier = useMemo(() => {
    return {
      rulesSource: {
        uid: dataSourceUid,
        name: dataSourceName,
        ruleSourceType: 'datasource',
      },
      namespace: {
        name: namespace,
      },
      groupName: groupName,
      groupOrigin: 'datasource',
    };
  }, [dataSourceUid, dataSourceName, namespace, groupName]);

  if (isLoading) {
    return (
      <PluginPage pageNav={pageNav}>
        <LoadingPlaceholder text={t('alerting.group-details.loading', 'Loading group details...')} />
      </PluginPage>
    );
  }

  const hasError = dsFeaturesError || promError || rulerError;
  if (hasError) {
    return (
      <PluginPage pageNav={pageNav}>
        <Alert
          severity="error"
          title={t('alerting.group-details.error', 'Error loading group')}
        >
          {String(dsFeaturesError || promError || rulerError)}
        </Alert>
      </PluginPage>
    );
  }

  if (!promGroup && !rulerGroup) {
    return (
      <PluginPage pageNav={pageNav}>
        <Alert
          severity="warning"
          title={t('alerting.group-details.not-found', 'Group not found')}
        >
          {t(
            'alerting.group-details.not-found-message',
            'The group "{{groupName}}" in namespace "{{namespace}}" could not be found.',
            { groupName, namespace }
          )}
        </Alert>
      </PluginPage>
    );
  }

  const editPageLink = groups.editPageLink(dataSourceUid, namespace, groupName);

  return (
    <PluginPage
      pageNav={pageNav}
      renderTitle={(title) => <GroupDetailsTitle name={title} />}
      subTitle={t('alerting.group-details.subtitle', 'View alert and recording rules in this evaluation group')}
      info={[
        { label: t('alerting.group-details.namespace', 'Namespace'), value: namespace },
        { label: t('alerting.group-details.interval', 'Interval'), value: groupInterval },
      ]}
      actions={<GroupDetailsActions editLink={editPageLink} canEdit={dsFeatures?.rulerApiEnabled ?? false} />}
    >
      <ul role="tree">
        <DataSourceGroupLoader
          groupIdentifier={groupIdentifier}
          expectedRulesCount={promGroup?.rules.length}
          application={dsFeatures?.application}
          rulerApiEnabled={dsFeatures?.rulerApiEnabled}
        />
      </ul>
    </PluginPage>
  );
}

export default GroupDetails;
