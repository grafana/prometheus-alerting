import React from 'react';
import { useLocation } from 'react-router-dom';

import { PluginErrorBoundary } from '../ErrorBoundary/PluginErrorBoundary';

/** Catches render errors anywhere in the plugin's page tree, so a broken page can't blank out Grafana. */
export function AppErrorBoundary({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  return (
    // A caught error is only cleared when `dependencies` changes. Without it one failed render would
    // pin the error page in place for the rest of the session, since navigating to a healthy route
    // wouldn't reset the boundary – keying on the path lets the next navigation recover.
    <PluginErrorBoundary boundaryName="app-root" style="page" dependencies={[pathname]}>
      {children}
    </PluginErrorBoundary>
  );
}
