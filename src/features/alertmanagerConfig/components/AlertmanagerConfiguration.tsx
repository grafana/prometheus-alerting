import React, { useState } from 'react';

import { t } from '@grafana/i18n';
import { Stack, Tab, TabContent, TabsBar } from '@grafana/ui';

import { ResolvedConfigTab } from './ResolvedConfigTab';
import { SourceConfigTab } from './SourceConfigTab';

enum ActiveTab {
  Source = 'source',
  Resolved = 'resolved',
}

/**
 * The Alertmanager configuration, as two different documents.
 *
 * "Source" is what the Alertmanager has stored, which is the thing you edit. "Resolved" is what it
 * reports it is running, with defaults filled in and secrets redacted. They are far enough apart
 * that mixing them up would be costly, hence two clearly named tabs rather than one box.
 *
 * Each tab fetches its own document, so a status endpoint that is unavailable does not take the
 * editor down with it. That matters: a configuration the Alertmanager refuses to load is exactly
 * the one somebody needs to open and fix here.
 */
export function AlertmanagerConfiguration() {
  const [activeTab, setActiveTab] = useState<ActiveTab>(ActiveTab.Source);

  return (
    <Stack direction="column" gap={2}>
      <TabsBar>
        <Tab
          label={t('app-config.configuration.tabs.source', 'Source')}
          active={activeTab === ActiveTab.Source}
          onChangeTab={() => setActiveTab(ActiveTab.Source)}
        />
        <Tab
          label={t('app-config.configuration.tabs.resolved', 'Resolved')}
          active={activeTab === ActiveTab.Resolved}
          onChangeTab={() => setActiveTab(ActiveTab.Resolved)}
        />
      </TabsBar>

      <TabContent>
        {activeTab === ActiveTab.Source && <SourceConfigTab />}
        {activeTab === ActiveTab.Resolved && <ResolvedConfigTab />}
      </TabContent>
    </Stack>
  );
}
