import React from 'react';

import { t } from '@grafana/i18n';
import { Alert, Box } from '@grafana/ui';

/** Accessible feedback for routes and actions denied by Grafana RBAC. */
export function PermissionDenied() {
  return (
    <Box padding={2}>
      <Alert severity="error" title={t('common.permission-denied.title', 'Permission denied')}>
        {t('common.permission-denied.description', 'You do not have the required permissions to access this page.')}
      </Alert>
    </Box>
  );
}
