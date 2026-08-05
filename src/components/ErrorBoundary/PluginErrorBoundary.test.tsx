import React from 'react';
import { render, screen } from '@testing-library/react';

import { PluginErrorBoundary } from './PluginErrorBoundary';

function Boom(): React.ReactElement {
  throw new Error('kaboom');
}

describe('PluginErrorBoundary', () => {
  // React logs caught errors to the console, which we don't want in the test output
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <PluginErrorBoundary boundaryName="test">
        <span>all good</span>
      </PluginErrorBoundary>
    );

    expect(screen.getByText('all good')).toBeInTheDocument();
  });

  it('renders a report link with the error prefilled when a child crashes', async () => {
    render(
      <PluginErrorBoundary boundaryName="test">
        <Boom />
      </PluginErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: /report this issue on github/i });
    const href = new URL(link.getAttribute('href') ?? '');

    expect(href.origin + href.pathname).toBe('https://github.com/grafana/prometheus-alerting/issues/new');
    expect(href.searchParams.get('title')).toBe('Crash: kaboom');
    expect(href.searchParams.get('body')).toContain('kaboom');
    // the component stack tells us which component threw
    expect(href.searchParams.get('body')).toContain('Boom');
  });
});
