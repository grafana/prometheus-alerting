import React, { useState } from 'react';
import { Tab, TabsBar, TabContent, Stack } from '@grafana/ui';
import { t } from '@grafana/i18n';
import { PromRuleDTO, PromRuleGroupDTO, RulerRuleDTO, RulerRuleGroupDTO } from '@grafana/external-rules/vanilla';

import { QueryTab } from './tabs/QueryTab';
import { InstancesTab } from './tabs/InstancesTab';
import { DetailsTab } from './tabs/DetailsTab';

interface Props {
  promRule: PromRuleDTO;
  rulerRule?: RulerRuleDTO;
  promGroup?: PromRuleGroupDTO;
  rulerGroup?: RulerRuleGroupDTO | null;
  dataSourceUid: string;
  namespace: string;
  groupName: string;
  hasRulerApi: boolean;
}

enum ActiveTab {
  Query = 'query',
  Instances = 'instances',
  Details = 'details',
}

export function RuleDetailsView({
  promRule,
  rulerRule,
  promGroup,
  rulerGroup,
  dataSourceUid,
  namespace,
  groupName,
  hasRulerApi,
}: Props) {
  const [activeTab, setActiveTab] = useState<ActiveTab>(ActiveTab.Query);

  const isAlertingRule = promRule.type === 'alerting';

  // Field selection with preference for ruler data when available
  const query = rulerRule?.expr ?? promRule.query;

  return (
    <Stack direction="column" gap={2}>
      <TabsBar>
        <Tab
          label={t('rule-details.tabs.query', 'Query')}
          active={activeTab === ActiveTab.Query}
          onChangeTab={() => setActiveTab(ActiveTab.Query)}
        />
        {isAlertingRule && (
          <Tab
            label={t('rule-details.tabs.instances', 'Instances')}
            active={activeTab === ActiveTab.Instances}
            onChangeTab={() => setActiveTab(ActiveTab.Instances)}
            counter={promRule.type === 'alerting' ? promRule.alerts?.length : undefined}
          />
        )}
        <Tab
          label={t('rule-details.tabs.details', 'Details')}
          active={activeTab === ActiveTab.Details}
          onChangeTab={() => setActiveTab(ActiveTab.Details)}
        />
      </TabsBar>

      <TabContent>
        {activeTab === ActiveTab.Query && <QueryTab query={query} dataSourceUid={dataSourceUid} />}
        {activeTab === ActiveTab.Instances && isAlertingRule && <InstancesTab promRule={promRule} />}
        {activeTab === ActiveTab.Details && (
          <DetailsTab
            promRule={promRule}
            rulerRule={rulerRule}
            promGroup={promGroup}
            rulerGroup={rulerGroup}
            hasRulerApi={hasRulerApi}
          />
        )}
      </TabContent>
    </Stack>
  );
}
