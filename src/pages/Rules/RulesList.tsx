import React from 'react';
import { testIds } from '../../components/testIds';
import { PluginPage } from '@grafana/runtime';

function RulesPage() {
  return (
    <PluginPage>
      <div data-testid={testIds.rules.container}>
        <p>Rules</p>
      </div>
    </PluginPage>
  );
}

export default RulesPage;
