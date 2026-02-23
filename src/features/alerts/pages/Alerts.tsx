import { Trans } from '@grafana/i18n';
import React from 'react';
import { AlertmanagerPage } from '../../../components/AlertmanagerPage';
import { testIds } from '../../../components/testIds';

function Alerts() {
  return (
    <AlertmanagerPage>
      <div data-testid={testIds.alerts.container}>
        <Trans i18nKey="pages.alerts.active-notifications">Active notifications</Trans>
      </div>
    </AlertmanagerPage>
  );
}

export default Alerts;
