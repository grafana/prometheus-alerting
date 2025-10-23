import React from 'react';
import Skeleton from 'react-loading-skeleton';

import { testIds } from '../../../components/testIds';
import { Alert, InteractiveTable, EmptyState } from '@grafana/ui';
import { useTemplates } from '../hooks/useTemplates';
import { t } from '@grafana/i18n';
import { DEFAULT_PAGE_SIZE } from '../../../constants';
import { AlertmanagerPage } from '../../../components/AlertmanagerPage';

interface TemplateRow {
  path: string;
}

function TemplatesPage() {
  const { templates, isLoading, error } = useTemplates();

  // Convert string array to object array for InteractiveTable
  const templateRows: TemplateRow[] = templates.map((template) => ({ path: template }));

  const columns = [
    {
      id: 'path',
      header: t('templates.column.path', 'Template Path'),
      cell: ({ row: { original } }: { row: { original: TemplateRow } }) => (
        <code style={{ padding: '4px 8px' }}>{original.path}</code>
      ),
    },
  ];

  return (
    <AlertmanagerPage>
      <div data-testid={testIds.templates.container}>
        {isLoading && (
          <div>
            <Skeleton height={50} style={{ marginBottom: '10px' }} />
            <Skeleton height={80} count={3} style={{ marginBottom: '5px' }} />
          </div>
        )}
        {error && (
          <Alert title={t('templates.error-loading-title', 'Error loading templates')} severity="error">
            {error instanceof Error ? error.message : t('templates.error-loading-message', 'Failed to fetch templates')}
          </Alert>
        )}
        {!isLoading && templates.length > 0 && !error && (
          <InteractiveTable
            columns={columns}
            data={templateRows}
            getRowId={(row) => row.path}
            pageSize={DEFAULT_PAGE_SIZE}
          />
        )}
        {!isLoading && templates.length === 0 && !error && (
          <EmptyState
            message={t('templates.no-templates-message', 'No templates are configured in the Alertmanager.')}
            variant="call-to-action"
          />
        )}
      </div>
    </AlertmanagerPage>
  );
}

export default TemplatesPage;
