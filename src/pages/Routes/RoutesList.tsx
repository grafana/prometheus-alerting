import React from 'react';
import { testIds } from '../../components/testIds';
import { PluginPage } from '@grafana/runtime';

function RoutesPage() {
  return (
    <PluginPage>
      <div data-testid={testIds.routes.container}>
        <p>Routes</p>
      </div>
    </PluginPage>
  );
}

export default RoutesPage;
