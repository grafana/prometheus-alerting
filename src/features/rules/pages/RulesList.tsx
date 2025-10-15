import React from 'react';

import { testIds } from '../../../components/testIds';
import { GroupedView } from '../../../rule-list/GroupedView';
import { PluginPage } from '@grafana/runtime';

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
