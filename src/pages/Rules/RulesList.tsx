import React from 'react';

import { PluginPage } from '@grafana/runtime';

import { testIds } from '../../components/testIds';
import { GroupedView } from '../../rule-list/GroupedView';

function RulesPage() {
  return (
    <PluginPage>
      <div data-testid={testIds.rules.container}>
        <GroupedView />
      </div>
    </PluginPage>
  );
}

export default RulesPage;
