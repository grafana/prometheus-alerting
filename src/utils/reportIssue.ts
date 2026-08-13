import { config } from '@grafana/runtime';

import { pluginVersion } from '../analytics';

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

export function buildIssueBody({ error, componentStack, location }: ReportIssueOptions): string {
  const environment = [
    `- Plugin version: ${inlineCode(pluginVersion)}`,
    `- Grafana version: ${inlineCode(config.buildInfo?.version)} (${inlineCode(config.buildInfo?.edition)})`,
    `- Location: ${inlineCode(location)}`,
    `- User agent: ${inlineCode(typeof navigator === 'undefined' ? undefined : navigator.userAgent)}`,
  ].join('\n');

  const sections = [
    '### What happened?',
    '',
    'The plugin crashed with the error below. <!-- Please add any steps to reproduce. -->',
    '',
    '> [!IMPORTANT]',
    '> This report was generated automatically. Stack traces can contain data from your',
    '> Alertmanager or Prometheus configuration — please review it for anything sensitive',
    '> before submitting, since GitHub issues are public.',
    '',
    '### Environment',
    '',
    environment,
    '',
    '### Error',
    '',
    codeBlock(error?.stack || error?.message || 'No error details available'),
  ];

  if (componentStack) {
    sections.push('', '### Component stack', '', codeBlock(componentStack.trim()));
  }

  return sections.join('\n');
}

/**
 * Wrap untrusted multi-line content (stack traces) in a fenced code block. Error messages can
 * contain data from a data source, so the fence is made longer than any run of backticks in the
 * content — otherwise the content could close the fence and inject arbitrary markdown into the
 * report the user is about to submit.
 */
function codeBlock(content: string): string {
  const longestBacktickRun = Math.max(0, ...[...content.matchAll(/`+/g)].map((match) => match[0].length));
  const fence = '`'.repeat(Math.max(3, longestBacktickRun + 1));

  return [fence, content, fence].join('\n');
}

/**
 * Render an untrusted single-line value as inline code, stripping the characters it could use to
 * break out of it (backticks and newlines).
 */
function inlineCode(value: string | null | undefined): string {
  if (!value) {
    return '`unknown`';
  }

  const sanitized = truncate(value.replace(/[`\r\n]/g, ' '), 500);
  return `\`${sanitized}\``;
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
