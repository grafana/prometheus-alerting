import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { TestMemoryRouter } from '../../../test/utils/test-wrapper';

import { RulesFilter } from './RulesFilter';
import { RulesFilterSidebar } from './RulesFilterSidebar';

vi.mock('../hooks/useRuleFilterOptions', () => ({
  useDataSourceOptions: () => [],
  useLabelOptions: () => ({ labelOptions: [] }),
}));

function LocationSearch() {
  const { search } = useLocation();
  return <output data-testid="location-search">{search}</output>;
}

function renderSidebar(initialSearch: string) {
  render(
    <TestMemoryRouter initialEntries={[`/rules${initialSearch}`]}>
      <RulesFilter />
      <RulesFilterSidebar />
      <LocationSearch />
    </TestMemoryRouter>
  );
}

describe('RulesFilterSidebar', () => {
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

    await waitFor(() => {
      expect(screen.getByTestId('location-search')).toHaveTextContent('?search=rule%3AError');
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
      expect(screen.getByTestId('location-search')).toHaveTextContent('?search=namespace%3Aprod+rule%3AErrorRate');
    });
  });
});
