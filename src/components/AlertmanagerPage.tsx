import React, { ComponentProps } from 'react';
import { PluginPage } from '@grafana/runtime';
import { AlertmanagerPicker } from './AlertmanagerPicker/AlertmanagerPicker';

/**
 * Wrapper component for Alertmanager pages that provides:
 * - PluginPage layout
 * - Alertmanager data source selector dropdown in the actions area
 * - Automatic state management for selected alertmanager
 *
 * Usage:
 * ```tsx
 * <AlertmanagerPage>
 *   <YourPageContent />
 * </AlertmanagerPage>
 * ```
 */
export function AlertmanagerPage({ children, ...props }: ComponentProps<typeof PluginPage>) {
  return (
    <PluginPage actions={<AlertmanagerPicker />} {...props}>
      {children}
    </PluginPage>
  );
}
