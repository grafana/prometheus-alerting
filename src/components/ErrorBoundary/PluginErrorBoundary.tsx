import React, { useCallback } from 'react';

import { t, Trans } from '@grafana/i18n';
import { Alert, Box, Button, ErrorWithStack, ErrorBoundary, Stack, Text } from '@grafana/ui';

import { logError } from '../../analytics';
import { copyToClipboard } from '../../utils/clipboard';
import { buildIssueBody } from '../../utils/reportIssue';

import { ReportIssueButton } from './ReportIssueButton';

interface PluginErrorBoundaryProps {
  children: React.ReactNode;
  /** Name of the boundary, used when reporting the error to Faro */
  boundaryName: string;
  /** 'page' renders a standalone error page, 'alertbox' renders an inline alert. Default 'alertbox' */
  style?: 'page' | 'alertbox';
  /** Re-render the children when any of these values change, e.g. the current route */
  dependencies?: unknown[];
  /** Optional description shown above the stack trace */
  message?: React.ReactNode;
}

/**
 * Catches crashes in its children and shows the stack trace along with a button that opens a
 * prefilled GitHub issue, so users can report the crash without copying anything by hand.
 */
export function PluginErrorBoundary({
  children,
  boundaryName,
  style = 'alertbox',
  dependencies,
  message,
}: PluginErrorBoundaryProps) {
  // @grafana/ui's error boundary pushes to the host Faro instance directly, which loses all plugin
  // attribution. Routing through our monitoring logger instead tags the error with the plugin source,
  // module and version, so it can be told apart from core Grafana's errors.
  const logBoundaryError = useCallback((error: Error) => logError(error, { boundary: boundaryName }), [boundaryName]);

  return (
    <ErrorBoundary boundaryName={boundaryName} dependencies={dependencies} errorLogger={logBoundaryError}>
      {({ error, errorInfo }) => {
        if (!error && !errorInfo) {
          return children;
        }

        const title = t('alerting.error-boundary.title', 'Something went wrong');
        const description = message ?? (
          <Trans i18nKey="alerting.error-boundary.message">
            An unexpected error occurred and this part of the page could not be displayed. Reporting the issue helps us
            fix it.
          </Trans>
        );

        const actions = <ErrorActions error={error} errorInfo={errorInfo} />;
        const stack = (
          <ErrorWithStack
            error={error}
            errorInfo={errorInfo}
            title={t('alerting.error-boundary.stack-title', 'Error details')}
          />
        );

        if (style === 'page') {
          return (
            <Box paddingY={4} paddingX={2}>
              <Stack direction="column" gap={2} alignItems="flex-start">
                <Text element="h2" variant="h3">
                  {title}
                </Text>
                <Text color="secondary">{description}</Text>
                {actions}
                {stack}
              </Stack>
            </Box>
          );
        }

        return (
          <Alert title={title} severity="error">
            <Stack direction="column" gap={2} alignItems="flex-start">
              <Text>{description}</Text>
              {actions}
              {stack}
            </Stack>
          </Alert>
        );
      }}
    </ErrorBoundary>
  );
}

function ErrorActions({ error, errorInfo }: { error: Error | null; errorInfo: React.ErrorInfo | null }) {
  const componentStack = errorInfo?.componentStack;

  return (
    <Stack direction="row" gap={1} wrap="wrap">
      <ReportIssueButton error={error} componentStack={componentStack} />
      <Button
        variant="secondary"
        icon="copy"
        onClick={() =>
          copyToClipboard(
            buildIssueBody({ error, componentStack, location: window.location.href }),
            t('alerting.error-boundary.copy-details-success', 'Error details copied to clipboard')
          )
        }
      >
        <Trans i18nKey="alerting.error-boundary.copy-details">Copy error details</Trans>
      </Button>
      <Button variant="secondary" icon="sync" onClick={() => window.location.reload()}>
        <Trans i18nKey="alerting.error-boundary.reload">Reload page</Trans>
      </Button>
    </Stack>
  );
}
