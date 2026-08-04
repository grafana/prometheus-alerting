import React, { useState, useCallback, useMemo } from 'react';
import Skeleton from 'react-loading-skeleton';
import { css } from '@emotion/css';

import { testIds } from '../../../components/testIds';
import { InteractiveTable, EmptyState, Button } from '@grafana/ui';
import { useTemplates, Template } from '../hooks/useTemplates';
import { t, Trans } from '@grafana/i18n';
import { DEFAULT_PAGE_SIZE } from '../../../constants';
import { AlertmanagerPage } from '../../../components/AlertmanagerPage';
import { ViewState } from '../../../components/ViewState';
import { TemplateDrawer, DrawerMode } from '../components/TemplateDrawer';
import { useHasConfigurationAPI } from '../../../hooks/useHasConfigurationAPI';
import { getAlertmanagerConfigMutationAbility } from '../../../access-control/abilities.alertmanager';
import { isAbilityAllowed } from '../../../access-control/abilities';
import { TemplatesError } from '../components/TemplatesError';

function TemplatesPage() {
  const { templates, isLoading, error, refetch, isSuccess } = useTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(DrawerMode.View);
  const hasConfigurationAPI = useHasConfigurationAPI();
  const canMutateTemplates = isAbilityAllowed(getAlertmanagerConfigMutationAbility(hasConfigurationAPI));

  const existingTemplateNames = useMemo(() => templates.map((t: Template) => t.name), [templates]);

  const handleTemplateClick = useCallback((template: Template) => {
    setSelectedTemplate(template);
    setDrawerMode(DrawerMode.View);
  }, []);

  const handleCreateTemplate = useCallback(() => {
    setSelectedTemplate(null);
    setDrawerMode(DrawerMode.Add);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setSelectedTemplate(null);
    setDrawerMode(DrawerMode.View);
  }, []);

  const handleSaved = useCallback(() => {
    refetch();
  }, [refetch]);

  const clickableCellStyles = css({
    cursor: 'pointer',
  });

  const columns = [
    {
      id: 'name',
      header: t('templates.column.name', 'Template Name'),
      cell: ({ row: { original } }: { row: { original: Template } }) => (
        <div className={clickableCellStyles} onClick={() => handleTemplateClick(original)}>
          <code style={{ padding: '4px 8px' }}>{original.name}</code>
        </div>
      ),
    },
    {
      id: 'preview',
      header: t('templates.column.preview', 'Preview'),
      cell: ({ row: { original } }: { row: { original: Template } }) => {
        // Show first line or truncated content as preview
        const preview = original.content
          ? original.content.split('\n')[0].substring(0, 60) + (original.content.length > 60 ? '...' : '')
          : '—';
        return (
          <div
            className={clickableCellStyles}
            onClick={() => handleTemplateClick(original)}
            style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '12px' }}
          >
            {preview}
          </div>
        );
      },
    },
  ];

  const isDrawerOpen = selectedTemplate !== null || (canMutateTemplates && drawerMode === DrawerMode.Add);

  return (
    <AlertmanagerPage
      subTitle={t('templates.page-subtitle', 'Customize notification message templates')}
      actions={
        canMutateTemplates && (
          <Button icon="plus" onClick={handleCreateTemplate}>
            <Trans i18nKey="templates.create-button">Create template</Trans>
          </Button>
        )
      }
    >
      <div data-testid={testIds.templates.container}>
        <ViewState
          isLoading={isLoading}
          isSuccess={isSuccess}
          error={error}
          isEmpty={templates.length === 0}
          loading={
            <div>
              <Skeleton height={50} style={{ marginBottom: '10px' }} />
              <Skeleton height={80} count={3} style={{ marginBottom: '5px' }} />
            </div>
          }
          renderError={<TemplatesError error={error} />}
          empty={
            <EmptyState
              message={t('templates.no-templates-message', 'No templates are configured in the Alertmanager.')}
              variant="call-to-action"
              button={
                canMutateTemplates && (
                  <Button icon="plus" onClick={handleCreateTemplate}>
                    <Trans i18nKey="templates.create-button">Create template</Trans>
                  </Button>
                )
              }
            />
          }
        >
          <InteractiveTable
            columns={columns}
            data={templates}
            getRowId={(row) => row.name}
            pageSize={DEFAULT_PAGE_SIZE}
          />
        </ViewState>
      </div>

      {isDrawerOpen && (
        <TemplateDrawer
          template={selectedTemplate}
          existingTemplateNames={existingTemplateNames}
          onClose={handleDrawerClose}
          onSaved={handleSaved}
          initialMode={drawerMode}
        />
      )}
    </AlertmanagerPage>
  );
}

export default TemplatesPage;
