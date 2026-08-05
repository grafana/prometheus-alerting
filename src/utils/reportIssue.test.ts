import { buildIssueBody, buildIssueTitle, buildReportIssueUrl, GITHUB_NEW_ISSUE_URL } from './reportIssue';

function errorWithStack(message: string, stack: string): Error {
  const error = new Error(message);
  error.stack = stack;
  return error;
}

describe('buildIssueTitle', () => {
  it('uses the first line of the error message', () => {
    expect(buildIssueTitle(new Error('Cannot read property foo\nat bar'))).toBe('Crash: Cannot read property foo');
  });

  it('falls back when there is no error', () => {
    expect(buildIssueTitle(null)).toBe('Crash: unknown error');
  });

  it('truncates very long messages', () => {
    const title = buildIssueTitle(new Error('x'.repeat(500)));
    expect(title.length).toBeLessThan(300);
    expect(title).toContain('truncated');
  });
});

describe('buildIssueBody', () => {
  it('includes the stack trace, component stack and environment', () => {
    const body = buildIssueBody({
      error: errorWithStack('boom', 'Error: boom\n    at Component (App.tsx:1:1)'),
      componentStack: '\n    in Component\n    in App',
      location: 'http://localhost:3000/a/grafana-prometheusalerting-app/rules',
    });

    expect(body).toContain('at Component (App.tsx:1:1)');
    expect(body).toContain('in Component');
    expect(body).toContain('- Location: http://localhost:3000/a/grafana-prometheusalerting-app/rules');
    expect(body).toContain('- Grafana version:');
    expect(body).toContain('- Plugin version:');
  });

  it('omits the component stack section when there is none', () => {
    const body = buildIssueBody({ error: new Error('boom'), componentStack: null });
    expect(body).not.toContain('Component stack');
  });

  it('handles a missing error', () => {
    expect(buildIssueBody({ error: null })).toContain('No error details available');
  });
});

describe('buildReportIssueUrl', () => {
  it('points at the repository issue form with title, body and label', () => {
    const url = new URL(buildReportIssueUrl({ error: new Error('boom') }));

    expect(`${url.origin}${url.pathname}`).toBe(GITHUB_NEW_ISSUE_URL);
    expect(url.searchParams.get('title')).toBe('Crash: boom');
    expect(url.searchParams.get('labels')).toBe('bug');
    expect(url.searchParams.get('body')).toContain('boom');
  });

  it('truncates the body so the URL stays within GitHub limits', () => {
    const url = buildReportIssueUrl({
      error: errorWithStack('boom', 'Error: boom\n' + '    at someVeryLongFrameName (file.tsx:1:1)\n'.repeat(500)),
    });

    expect(url.length).toBeLessThanOrEqual(6000);
    expect(new URL(url).searchParams.get('body')).toContain('truncated');
  });
});
