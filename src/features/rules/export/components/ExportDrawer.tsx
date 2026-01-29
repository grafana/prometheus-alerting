import React, { useState } from 'react';

import { t } from '@grafana/i18n';
import { Drawer, TabContent, TabsBar, Tab } from '@grafana/ui';

import { ExportFormat, exportProvidersList } from '../providers';

interface ExportDrawerProps {
  title?: string;
  onClose: () => void;
  children: (activeFormat: ExportFormat) => React.ReactNode;
}

export function ExportDrawer({ title, onClose, children }: ExportDrawerProps) {
  const [activeFormat, setActiveFormat] = useState<ExportFormat>('yaml');

  const drawerTitle = title ?? t('alerting.export.title', 'Export');
  const subtitle = t(
    'alerting.export.subtitle',
    'Select the format and download the file or copy the contents to clipboard'
  );

  return (
    <Drawer title={drawerTitle} subtitle={subtitle} onClose={onClose} size="md">
      <TabsBar>
        {exportProvidersList.map((provider) => (
          <Tab
            key={provider.format}
            label={provider.name}
            active={activeFormat === provider.format}
            onChangeTab={() => setActiveFormat(provider.format)}
          />
        ))}
      </TabsBar>
      <TabContent>{children(activeFormat)}</TabContent>
    </Drawer>
  );
}
