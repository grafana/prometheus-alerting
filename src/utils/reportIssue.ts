import { config } from '@grafana/runtime';

export const GITHUB_REPO_URL = 'https://github.com/grafana/prometheus-alerting';
export const GITHUB_NEW_ISSUE_URL = `${GITHUB_REPO_URL}/issues/new`;

/**
 * GitHub rejects requests with very long URLs (HTTP 414). Keep the generated URL comfortably
 * below that limit by truncating the stack traces we embed in the issue body.
 */
const MAX_URL_LENGTH = 6000;
const TRUNCATION_NOTICE = '\n… (truncated, please paste the full stack trace from the browser console)';

interface ReportIssueOptions {
  error: Error | null;
  componentStack?: string | null;
  /** Where the crash happened, e.g. the current route */
  location?: string;
  /** Version of this plugin, see `useAppPluginVersion()` */
  pluginVersion?: string | null;
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  return value.slice(0, Math.max(0, maxLength - TRUNCATION_NOTICE.length)) + TRUNCATION_NOTICE;
}

export function buildIssueTitle(error: Error | null): string {
  const message = error?.message?.split('\n')[0]?.trim();
  return message ? `Crash: ${truncate(message, 120)}` : 'Crash: unknown error';
}

export function buildIssueBody({ error, componentStack, location, pluginVersion }: ReportIssueOptions): string {
  const environment = [
    `- Plugin version: ${pluginVersion ?? 'unknown'}`,
    `- Grafana version: ${config.buildInfo?.version ?? 'unknown'} (${config.buildInfo?.edition ?? 'unknown'})`,
    `- Location: ${location ?? 'unknown'}`,
    `- User agent: ${typeof navigator === 'undefined' ? 'unknown' : navigator.userAgent}`,
  ].join('\n');

  const sections = [
    '### What happened?',
    '',
    'The plugin crashed with the error below. <!-- Please add any steps to reproduce. -->',
    '',
    '### Environment',
    '',
    environment,
    '',
    '### Error',
    '',
    '```',
    error?.stack || error?.message || 'No error details available',
    '```',
  ];

  if (componentStack) {
    sections.push('', '### Component stack', '', '```', componentStack.trim(), '```');
  }

  return sections.join('\n');
}

/**
 * Build a GitHub "new issue" URL with the crash details prefilled, so users can report a crash
 * without having to copy stack traces around by hand.
 */
export function buildReportIssueUrl(options: ReportIssueOptions): string {
  const title = buildIssueTitle(options.error);
  const body = buildIssueBody(options);

  const url = (issueBody: string) => {
    const params = new URLSearchParams({ title, body: issueBody, labels: 'bug' });
    return `${GITHUB_NEW_ISSUE_URL}?${params.toString()}`;
  };

  // URL-encoding expands the body by an unpredictable amount (up to ~3x for stack traces), so
  // shrink it until the encoded URL fits instead of guessing a character budget up front.
  let budget = body.length;
  let candidate = url(body);

  while (candidate.length > MAX_URL_LENGTH && budget > 0) {
    const overflow = candidate.length - MAX_URL_LENGTH;
    budget = Math.max(0, budget - Math.max(Math.ceil(overflow / 3), 1));
    candidate = url(truncate(body, budget));
  }

  return candidate;
}
