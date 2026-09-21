import React from 'react';
import { setDataSourceSrv } from '@grafana/runtime';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import { createMockDataSourceSrv } from '../../../test/mocks/grafana-runtime';
import { TestMemoryRouter } from '../../../test/utils/test-wrapper';

import { RulesFilter } from './RulesFilter';
import { RulesFilterSidebar } from './RulesFilterSidebar';

function LocationSearch() {
  const { search } = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid="location-search">{search}</output>
      <button onClick={() => navigate(-1)}>Back</button>
      <button onClick={() => navigate(1)}>Forward</button>
    </>
  );
}

function renderSidebar(initialSearch: string, previousSearch?: string) {
  const initialEntries =
    previousSearch === undefined ? [`/rules${initialSearch}`] : [`/rules${previousSearch}`, `/rules${initialSearch}`];
  render(
    <TestMemoryRouter initialEntries={initialEntries}>
      <RulesFilter />
      <RulesFilterSidebar />
      <LocationSearch />
    </TestMemoryRouter>
  );
}

describe('RulesFilterSidebar', () => {
  beforeEach(() => {
    setDataSourceSrv(createMockDataSourceSrv());
  });

  it('shows free text from the search query as the rule name without rewriting the URL', async () => {
    renderSidebar('?search=ErrorRate');

    expect(await screen.findByTestId('rule-name-filter-input')).toHaveValue('ErrorRate');
    expect(screen.getByTestId('location-search')).toHaveTextContent('?search=ErrorRate');
  });

  it('leaves free text typed in the search input untouched', async () => {
    const user = userEvent.setup();
    renderSidebar('');

    await user.type(screen.getByTestId('search-query-input'), 'ErrorRate');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByTestId('rule-name-filter-input')).toHaveValue('ErrorRate');
    });
    expect(screen.getByTestId('location-search')).toHaveTextContent('?search=ErrorRate');
  });

  it('writes a rule filter to the URL when the rule name is typed in the sidebar', async () => {
    const user = userEvent.setup();
    renderSidebar('');

    await user.type(screen.getByTestId('rule-name-filter-input'), 'Error');

    expect(screen.getByTestId('location-search')).toBeEmptyDOMElement();
    await waitFor(() => {
      expect(screen.getByTestId('location-search')).toHaveTextContent('?search=rule%3AError');
    });
  });

  it('applies discrete filters immediately without losing text waiting to be applied', async () => {
    const user = userEvent.setup();
    renderSidebar('');

    await user.type(screen.getByTestId('rule-name-filter-input'), 'Error');
    expect(screen.getByTestId('location-search')).toBeEmptyDOMElement();

    await user.click(screen.getByRole('button', { name: 'Firing' }));

    expect(screen.getByTestId('location-search')).toHaveTextContent('?search=rule%3AError+state%3Afiring');
  });

  it('syncs with back and forward navigation and still accepts sidebar edits', async () => {
    const user = userEvent.setup();
    renderSidebar('?search=ErrorRate', '?search=namespace%3Aprod');

    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByTestId('namespace-filter-input')).toHaveValue('prod');
    expect(screen.getByTestId('rule-name-filter-input')).toHaveValue('');
    expect(screen.getByTestId('location-search')).toHaveTextContent('?search=namespace%3Aprod');

    await user.click(screen.getByRole('button', { name: 'Forward' }));
    expect(screen.getByTestId('namespace-filter-input')).toHaveValue('');
    expect(screen.getByTestId('rule-name-filter-input')).toHaveValue('ErrorRate');
    expect(screen.getByTestId('location-search')).toHaveTextContent('?search=ErrorRate');

    await user.type(screen.getByTestId('namespace-filter-input'), 'dev');
    await waitFor(() => {
      expect(screen.getByTestId('location-search')).toHaveTextContent('?search=ErrorRate+namespace%3Adev');
    });
  });

  it('keeps applying filters after the search query changes outside the sidebar', async () => {
    const user = userEvent.setup();
    renderSidebar('');

    await user.type(screen.getByTestId('namespace-filter-input'), 'prod');
    await waitFor(() => {
      expect(screen.getByTestId('location-search')).toHaveTextContent('?search=namespace%3Aprod');
    });

    await user.clear(screen.getByTestId('search-query-input'));
    await user.type(screen.getByTestId('search-query-input'), 'ErrorRate');
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(screen.getByTestId('namespace-filter-input')).toHaveValue('');
    });
    expect(screen.getByTestId('location-search')).toHaveTextContent('?search=ErrorRate');

    await user.type(screen.getByTestId('namespace-filter-input'), 'prod');
    await waitFor(() => {
      expect(screen.getByTestId('location-search')).toHaveTextContent('?search=ErrorRate+namespace%3Aprod');
    });
  });
});
