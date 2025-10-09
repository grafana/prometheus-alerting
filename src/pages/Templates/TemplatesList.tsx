import React from 'react';
import { testIds } from '../../components/testIds';
import { PluginPage } from '@grafana/runtime';

function TemplatesPage() {
  return (
    <PluginPage>
      <div data-testid={testIds.templates.container}>
        <p>Templates</p>
      </div>
    </PluginPage>
  );
}

export default TemplatesPage;
