import React from 'react';

import { testIds } from '../../components/testIds';
import { GroupedView } from '../../rule-list/GroupedView';
import { AlertmanagerPage } from '../../components/AlertmanagerPage';

function RulesPage() {
  return (
    <AlertmanagerPage>
      <div data-testid={testIds.rules.container}>
        <GroupedView />
      </div>
    </AlertmanagerPage>
  );
}

export default RulesPage;
