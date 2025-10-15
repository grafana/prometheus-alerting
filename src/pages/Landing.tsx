import React from 'react';
import { testIds } from '../components/testIds';
import { PluginPage } from '@grafana/runtime';

function Landing() {
  return (
    <PluginPage>
      <div data-testid={testIds.landing.container}></div>
    </PluginPage>
  );
}

export default Landing;
