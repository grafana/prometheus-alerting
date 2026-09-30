import React from 'react';
import { useLocation } from 'react-router-dom';
import { ErrorBoundaryAlert } from '@grafana/ui';
import { logError } from '../../analytics';

/**
 * @grafana/ui's error boundary pushes to the host Faro instance directly, which loses all plugin
 * attribution. Routing through our monitoring logger instead tags the error with the plugin source,
 * module and version, so it can be told apart from core Grafana's errors.
 */
function logBoundaryError(error: Error) {
  logError(error, { boundary: 'app-root' });
}

/** Catches render errors anywhere in the plugin's page tree, so a broken page can't blank out Grafana. */
export function AppErrorBoundary({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  return (
    // A caught error is only cleared when `dependencies` changes. Without it one failed render would
    // pin the error page in place for the rest of the session, since navigating to a healthy route
    // wouldn't reset the boundary – keying on the path lets the next navigation recover.
    <ErrorBoundaryAlert style="page" errorLogger={logBoundaryError} dependencies={[pathname]}>
      {children}
    </ErrorBoundaryAlert>
  );
}
