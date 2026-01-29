import React from 'react';
import { AppPluginMeta, PluginConfigPageProps } from '@grafana/data';
import { CodeEditor, FieldSet, LoadingPlaceholder, Alert } from '@grafana/ui';
import { t } from '@grafana/i18n';
import { testIds } from '../testIds';
import { KeyValueList } from '../KeyValueList';
import { alertmanagerApi } from '../../api/alertmanager/alertmanager.endpoints';
import { useAlertmanagerSafe } from '../../hooks/useAlertmanager';
import { StoreProvider } from '../StoreProvider/StoreProvider';
import { sharedStore } from '../../store/store';
import { AlertmanagerPicker } from '../AlertmanagerPicker/AlertmanagerPicker';
import { ClusterStatus } from './ClusterStatus';
import type { PeerStatus } from '@grafana/external-alertmanager/vanilla';

type AppPluginSettings = {};

export interface AppConfigProps extends PluginConfigPageProps<AppPluginMeta<AppPluginSettings>> {}

const AppConfigStatusContent = () => {
  const alertmanager = useAlertmanagerSafe();

  const {
    data: status,
    isLoading,
    error,
  } = alertmanagerApi.endpoints.getStatus.useQuery(
    { dataSourceUID: alertmanager?.uid ?? '' },
    { skip: !alertmanager?.uid }
  );

  if (!alertmanager) {
    return (
      <Alert title={t('app-config.no-alertmanager.title', 'No Alertmanager configured')} severity="warning">
        {t(
          'app-config.no-alertmanager.message',
          'No Alertmanager data sources are configured. Please configure at least one Alertmanager data source to use this plugin.'
        )}
      </Alert>
    );
  }

  if (isLoading) {
    return <LoadingPlaceholder text={t('app-config.loading', 'Loading Alertmanager status...')} />;
  }

  if (error) {
    return (
      <Alert title={t('app-config.error.title', 'Error loading Alertmanager status')} severity="error">
        {t(
          'app-config.error.message',
          'Failed to load Alertmanager status. Please check your data source configuration.'
        )}
      </Alert>
    );
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
      <FieldSet label={t('app-config.api-settings.title', 'Configuration file')}>
        <CodeEditor value={status.config.original} language={'yaml'} height={600} readOnly />
      </FieldSet>
    </>
  );
};

const AppConfigContent = ({ plugin }: AppConfigProps) => {
  return (
    <div data-testid={testIds.appConfig}>
      <FieldSet label={t('app-config.alertmanager-selection.title', 'Alertmanager')}>
        <AlertmanagerPicker alwaysShow />
      </FieldSet>
      <AppConfigStatusContent />
    </div>
  );
};

const AppConfig = (props: AppConfigProps) => (
  <StoreProvider store={sharedStore}>
    <AppConfigContent {...props} />
  </StoreProvider>
);

export default AppConfig;
