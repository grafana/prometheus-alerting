import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DataSourceErrorsProvider, useReportDataSourceError } from '../hooks/useDataSourceErrors';

import { DataSourceErrorsFooter } from './DataSourceErrorsStatus';

const fetchError = { status: 500, data: { message: 'connection refused' } };
const forbiddenError = { status: 403, data: {} };

function ErrorReporter({ uid, name, error }: { uid: string; name: string; error?: unknown }) {
  useReportDataSourceError(uid, name, error);
  return null;
}

function renderFooter(children: React.ReactNode) {
  return render(
    <DataSourceErrorsProvider>
      {children}
      <DataSourceErrorsFooter />
    </DataSourceErrorsProvider>
  );
}

describe('DataSourceErrorsStatus', () => {
  it('renders nothing when no data source reported an error', () => {
    renderFooter(<ErrorReporter uid="prom" name="Prometheus" />);

    expect(screen.queryByText(/reported errors/)).not.toBeInTheDocument();
  });

  it('summarises the number of failing data sources', () => {
    renderFooter(
      <>
        <ErrorReporter uid="prom" name="Prometheus" error={fetchError} />
        <ErrorReporter uid="mimir" name="Mimir" error={forbiddenError} />
      </>
    );

    expect(screen.getByText('2 data sources reported errors')).toBeInTheDocument();
  });

  it('shows the error message of every failing data source in a drawer', async () => {
    renderFooter(
      <>
        <ErrorReporter uid="prom" name="Prometheus" error={fetchError} />
        <ErrorReporter uid="mimir" name="Mimir" error={forbiddenError} />
      </>
    );

    await userEvent.click(screen.getByRole('button', { name: 'View details' }));

    const drawer = screen.getByRole('dialog');
    expect(drawer).toHaveTextContent('Prometheus');
    expect(drawer).toHaveTextContent('connection refused');
    expect(drawer).toHaveTextContent('Mimir');
    expect(drawer).toHaveTextContent('You do not have permission to access rules from this data source.');
  });

  it('shows the message of a bodyless failure once, without a generic title', async () => {
    renderFooter(
      <ErrorReporter uid="prom" name="Prometheus" error={{ status: 502, statusText: 'Bad Gateway', data: {} }} />
    );

    await userEvent.click(screen.getByRole('button', { name: 'View details' }));

    expect(screen.queryByText('Cannot load rules for this data source')).not.toBeInTheDocument();
    expect(screen.getAllByText(/HTTP 502 Bad Gateway/)).toHaveLength(1);
  });

  it('stops reporting an error once it is resolved', () => {
    const { rerender } = renderFooter(<ErrorReporter uid="prom" name="Prometheus" error={fetchError} />);

    // Translations are not loaded in tests, so the plural form falls back to the default value
    expect(screen.getByText(/^1 data sources? reported/)).toBeInTheDocument();

    rerender(
      <DataSourceErrorsProvider>
        <ErrorReporter uid="prom" name="Prometheus" />
        <DataSourceErrorsFooter />
      </DataSourceErrorsProvider>
    );

    expect(screen.queryByText(/reported errors/)).not.toBeInTheDocument();
  });
});
