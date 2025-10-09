import React from 'react';
import { testIds } from '../components/testIds';
import { PluginPage } from '@grafana/runtime';

function PageOne() {
  return (
    <PluginPage>
      <div data-testid={testIds.landing.container}>landing page for Prometheus alerting plugin</div>
    </PluginPage>
  );
}

export default PageOne;
