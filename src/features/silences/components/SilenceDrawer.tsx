import React, { useState } from 'react';
import { t } from '@grafana/i18n';
import { Stack, Text, Badge, Tab, TabsBar } from '@grafana/ui';
import type { GettableSilence } from '@grafana/external-alertmanager/vanilla';
import { DrawerWithFooter } from '../../../components/DrawerWithFooter';
import { SilenceDrawerView } from './SilenceDrawerView';
import { SilenceDrawerEdit } from './SilenceDrawerEdit';

enum ActiveTab {
  Configuration = 'configuration',
  AffectedAlerts = 'affected-alerts',
}

interface SilenceDrawerProps {
  silence: GettableSilence | null;
  onClose: () => void;
}

export function SilenceDrawer({ silence, onClose }: SilenceDrawerProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>(ActiveTab.Configuration);

  if (!silence) {
    return null;
  }

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  const handleEditSuccess = () => {
    setIsEditMode(false);
    onClose();
  };

  const drawerTabs = !isEditMode ? (
    <TabsBar>
      <Tab
        label={t('silences.drawer.tabs.configuration', 'Configuration')}
        active={activeTab === ActiveTab.Configuration}
        onChangeTab={() => setActiveTab(ActiveTab.Configuration)}
      />
      <Tab
        label={t('silences.drawer.tabs.affected-alerts', 'Affected Alerts')}
        active={activeTab === ActiveTab.AffectedAlerts}
        onChangeTab={() => setActiveTab(ActiveTab.AffectedAlerts)}
      />
    </TabsBar>
  ) : undefined;

  return (
    <DrawerWithFooter
      title={
        <Stack direction="column" gap={0}>
          <Text variant="bodySmall" color="secondary">
            {t('silences.drawer.title', 'Silence')}
          </Text>
          <Stack direction="row" gap={1} alignItems="center">
            <Text variant="h2">{silence.id}</Text>
            <Badge
              text={silence.status.state}
              color={silence.status.state === 'active' ? 'green' : silence.status.state === 'pending' ? 'blue' : 'red'}
            />
          </Stack>
        </Stack>
      }
      onClose={onClose}
      width={600}
      tabs={drawerTabs}
    >
      {isEditMode ? (
        <SilenceDrawerEdit silence={silence} onCancel={handleCancelEdit} onSuccess={handleEditSuccess} />
      ) : (
        <SilenceDrawerView silence={silence} activeTab={activeTab} onEdit={handleEdit} onClose={onClose} />
      )}
    </DrawerWithFooter>
  );
}
