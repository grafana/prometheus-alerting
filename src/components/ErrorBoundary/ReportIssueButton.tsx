import React from 'react';

import { t } from '@grafana/i18n';
import { LinkButton } from '@grafana/ui';

import { buildReportIssueUrl } from '../../utils/reportIssue';

interface ReportIssueButtonProps {
  error: Error | null;
  componentStack?: string | null;
  size?: 'sm' | 'md';
  variant?: 'primary' | 'secondary';
}

/**
 * Opens a prefilled GitHub issue for this repository with the stack trace and environment details
 * of the crash, so users can report it in one click.
 */
export function ReportIssueButton({ error, componentStack, size = 'md', variant = 'primary' }: ReportIssueButtonProps) {
  const href = buildReportIssueUrl({
    error,
    componentStack,
    location: typeof window === 'undefined' ? undefined : window.location.href,
  });

  return (
    <LinkButton href={href} target="_blank" rel="noopener noreferrer" icon="github" size={size} variant={variant}>
      {t('alerting.error-boundary.report-issue', 'Report this issue on GitHub')}
    </LinkButton>
  );
}
