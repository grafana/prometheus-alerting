import React from 'react';
import { useLocation } from 'react-router-dom';

import { PluginErrorBoundary } from './PluginErrorBoundary';

/**
 * Page-level error boundary that resets itself when the user navigates elsewhere, so a crash on
 * one page doesn't leave the whole plugin stuck on an error screen.
 */
export function RouteErrorBoundary({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <PluginErrorBoundary boundaryName="plugin-route" style="page" dependencies={[location.pathname]}>
      {children}
    </PluginErrorBoundary>
  );
}
