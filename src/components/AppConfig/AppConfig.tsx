import React from 'react';
import { AppPluginMeta, PluginConfigPageProps } from '@grafana/data';
import { FieldSet, LoadingPlaceholder, Alert } from '@grafana/ui';
import { t } from '@grafana/i18n';
import { DataSourceError } from '../AlertmanagerError';
import { testIds } from '../testIds';
import { KeyValueList } from '../KeyValueList/KeyValueList';
import { alertmanagerApi } from '../../api/alertmanager/alertmanager.endpoints';
import { useAlertmanagerSafe, type AlertmanagerHookResult } from '../../hooks/useAlertmanager';
import { StoreProvider } from '../StoreProvider/StoreProvider';
import { sharedStore } from '../../store/store';
import { AlertmanagerPicker } from '../AlertmanagerPicker/AlertmanagerPicker';
import { ClusterStatus } from './ClusterStatus';
import { AlertmanagerConfiguration } from '../../features/alertmanagerConfig/components/AlertmanagerConfiguration';
import type { PeerStatus } from '@grafana/external-alertmanager/vanilla';

type AppPluginSettings = {};

export interface AppConfigProps extends PluginConfigPageProps<AppPluginMeta<AppPluginSettings>> {}

const AppConfigStatusContent = ({ alertmanager }: { alertmanager: AlertmanagerHookResult }) => {
  const {
    data: status,
    isLoading,
    error,
  } = alertmanagerApi.endpoints.getStatus.useQuery({ dataSourceUID: alertmanager.uid });

  if (isLoading) {
    return <LoadingPlaceholder text={t('app-config.loading', 'Loading Alertmanager status...')} />;
  }

  if (error) {
    return <DataSourceError error={error} title={t('app-config.error.title', 'Error loading Alertmanager status')} />;
  }

  if (!status) {
    return (
      <Alert title={t('app-config.no-data.title', 'No data')} severity="info">
        {t('app-config.no-data.message', 'No Alertmanager status data available.')}
      </Alert>
    );
  }

  const statusItems = [{ label: t('app-config.status.uptime', 'Uptime'), value: status.uptime }];

  const peers = (status.cluster.peers ?? []).map((peer: PeerStatus, idx: number) => ({
    label: t('app-config.cluster.peer', `Peer ${idx + 1}`),
    value: `${peer.name} (${peer.address})`,
  }));

  const clusterItems = [
    { label: t('app-config.cluster.name', 'Name'), value: status.cluster.name ?? '-' },
    { label: t('app-config.cluster.status', 'Status'), value: <ClusterStatus status={status.cluster.status} /> },
    ...peers,
  ];

  const versionItems = [
    { label: t('app-config.version.version', 'Version'), value: status.versionInfo.version },
    { label: t('app-config.version.revision', 'Revision'), value: status.versionInfo.revision },
    { label: t('app-config.version.branch', 'Branch'), value: status.versionInfo.branch },
    { label: t('app-config.version.build-user', 'Build User'), value: status.versionInfo.buildUser },
    { label: t('app-config.version.build-date', 'Build Date'), value: status.versionInfo.buildDate },
    { label: t('app-config.version.go-version', 'Go Version'), value: status.versionInfo.goVersion },
  ];

  return (
    <>
      <FieldSet label={t('app-config.status.title', 'Status')}>
        <KeyValueList items={statusItems} />
      </FieldSet>
      <FieldSet label={t('app-config.cluster-status.title', 'Cluster Status')}>
        <KeyValueList items={clusterItems} />
      </FieldSet>
      <FieldSet label={t('app-config.version-information.title', 'Version Information')}>
        <KeyValueList items={versionItems} />
      </FieldSet>
    </>
  );
};

/**
 * The Alertmanager configuration, kept outside the status fieldsets on purpose. The status endpoint
 * can be unavailable while the stored configuration is perfectly readable, and that is exactly when
 * somebody needs to get at the configuration to fix it.
 */
const AppConfigConfiguration = () => {
  return (
    <FieldSet label={t('app-config.api-settings.title', 'Configuration')}>
      <AlertmanagerConfiguration />
    </FieldSet>
  );
};

const AppConfigContent = ({ plugin }: AppConfigProps) => {
  const alertmanager = useAlertmanagerSafe();

  // Neither section below has anything to read without an Alertmanager to read it from, so the
  // warning stands in for both of them rather than each one guarding separately and rendering
  // nothing at all.
  return (
    <div data-testid={testIds.appConfig.container}>
      <FieldSet label={t('app-config.alertmanager-selection.title', 'Alertmanager')}>
        <AlertmanagerPicker alwaysShow />
      </FieldSet>
      {alertmanager ? (
        <>
          <AppConfigConfiguration />
          <AppConfigStatusContent alertmanager={alertmanager} />
        </>
      ) : (
        <Alert title={t('app-config.no-alertmanager.title', 'No Alertmanager configured')} severity="warning">
          {t(
            'app-config.no-alertmanager.message',
            'No Alertmanager data sources are configured. Please configure at least one Alertmanager data source to use this plugin.'
          )}
        </Alert>
      )}
    </div>
  );
};

const AppConfig = (props: AppConfigProps) => (
  <StoreProvider store={sharedStore}>
    <AppConfigContent {...props} />
  </StoreProvider>
);

export default AppConfig;
