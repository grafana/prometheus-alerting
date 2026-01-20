import React, { ComponentProps, ReactNode } from 'react';
import { PluginPage } from '@grafana/runtime';
import { Stack } from '@grafana/ui';
import { AlertmanagerPicker } from './AlertmanagerPicker/AlertmanagerPicker';

interface AlertmanagerPageProps extends Omit<ComponentProps<typeof PluginPage>, 'actions'> {
  /** Additional actions to display alongside the Alertmanager picker */
  actions?: ReactNode;
}

/**
 * Wrapper component for Alertmanager pages that provides:
 * - PluginPage layout
 * - Alertmanager data source selector dropdown in the actions area
 * - Automatic state management for selected alertmanager
 *
 * Usage:
 * ```tsx
 * <AlertmanagerPage actions={<Button>Create</Button>}>
 *   <YourPageContent />
 * </AlertmanagerPage>
 * ```
 */
export function AlertmanagerPage({ children, actions, ...props }: AlertmanagerPageProps) {
  return (
    <PluginPage
      actions={
        <Stack direction="row" gap={2} alignItems="center">
          {actions}
          <AlertmanagerPicker />
        </Stack>
      }
      {...props}
    >
      {children}
    </PluginPage>
  );
}
