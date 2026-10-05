import React from 'react';
import { setDataSourceSrv } from '@grafana/runtime';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, rs } from '@rstest/core';

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
  return render(
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

  it('writes the health filter to the URL', async () => {
    const user = userEvent.setup();
    renderSidebar('');

    await user.click(screen.getByRole('button', { name: 'Error' }));

    expect(screen.getByTestId('location-search')).toHaveTextContent('?search=health%3Aerror');
  });

  it('uses only the latest text edit after a trailing debounce', async () => {
    rs.useFakeTimers();
    renderSidebar('');

    try {
      const ruleName = screen.getByTestId('rule-name-filter-input');
      fireEvent.change(ruleName, { target: { value: 'Error' } });
      act(() => {
        rs.advanceTimersByTime(250);
      });
      fireEvent.change(ruleName, { target: { value: 'ErrorX' } });

      act(() => {
        rs.advanceTimersByTime(499);
      });
      expect(screen.getByTestId('location-search')).toBeEmptyDOMElement();

      act(() => {
        rs.advanceTimersByTime(1);
      });
      expect(screen.getByTestId('location-search')).toHaveTextContent('?search=rule%3AErrorX');
    } finally {
      rs.clearAllTimers();
      rs.useRealTimers();
    }
  });

  it('cancels a pending text edit when a discrete filter applies it immediately', async () => {
    rs.useFakeTimers();
    renderSidebar('');

    try {
      fireEvent.change(screen.getByTestId('rule-name-filter-input'), { target: { value: 'Error' } });
      fireEvent.click(screen.getByRole('button', { name: 'Firing' }));
      expect(screen.getByTestId('location-search')).toHaveTextContent('?search=rule%3AError+state%3Afiring');

      act(() => {
        rs.advanceTimersByTime(500);
      });
      expect(screen.getByTestId('location-search')).toHaveTextContent('?search=rule%3AError+state%3Afiring');
    } finally {
      rs.clearAllTimers();
      rs.useRealTimers();
    }
  });

  it('applies an edit that returns to the default text value', () => {
    rs.useFakeTimers();
    renderSidebar('?search=rule%3AError');

    try {
      const ruleName = screen.getByTestId('rule-name-filter-input');
      fireEvent.change(ruleName, { target: { value: 'ErrorX' } });
      fireEvent.change(ruleName, { target: { value: 'Error' } });
      act(() => {
        rs.advanceTimersByTime(500);
      });

      expect(screen.getByTestId('location-search')).toHaveTextContent('?search=rule%3AError');
    } finally {
      rs.clearAllTimers();
      rs.useRealTimers();
    }
  });

  it('clears an existing text filter after the debounce', () => {
    rs.useFakeTimers();
    renderSidebar('?search=rule%3AError');

    try {
      fireEvent.change(screen.getByTestId('rule-name-filter-input'), { target: { value: '' } });
      act(() => {
        rs.advanceTimersByTime(500);
      });

      expect(screen.getByTestId('location-search')).toBeEmptyDOMElement();
    } finally {
      rs.clearAllTimers();
      rs.useRealTimers();
    }
  });

  it('cancels pending sidebar text when the URL changes externally', async () => {
    rs.useFakeTimers();
    renderSidebar('?search=Latency', '?search=namespace%3Aprod');

    try {
      fireEvent.change(screen.getByTestId('rule-name-filter-input'), { target: { value: 'Error' } });
      fireEvent.click(screen.getByRole('button', { name: 'Back' }));
      fireEvent.click(screen.getByRole('button', { name: 'Forward' }));

      act(() => {
        rs.advanceTimersByTime(500);
      });
      expect(screen.getByTestId('location-search')).toHaveTextContent('?search=Latency');
      expect(screen.getByTestId('rule-name-filter-input')).toHaveValue('Latency');
    } finally {
      rs.clearAllTimers();
      rs.useRealTimers();
    }
  });

  it('cancels pending sidebar text when an external search clear resets the form', () => {
    rs.useFakeTimers();
    renderSidebar('?search=rule%3AError');

    try {
      fireEvent.change(screen.getByTestId('rule-name-filter-input'), { target: { value: 'ErrorX' } });
      fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
      act(() => {
        rs.advanceTimersByTime(500);
      });

      expect(screen.getByTestId('location-search')).toBeEmptyDOMElement();
      expect(screen.getByTestId('rule-name-filter-input')).toHaveValue('');
    } finally {
      rs.clearAllTimers();
      rs.useRealTimers();
    }
  });

  it('cancels a pending callback when the sidebar unmounts', () => {
    rs.useFakeTimers();
    const { unmount } = renderSidebar('');

    try {
      fireEvent.change(screen.getByTestId('rule-name-filter-input'), { target: { value: 'Error' } });
      unmount();
      expect(() => {
        act(() => {
          rs.advanceTimersByTime(500);
        });
      }).not.toThrow();
    } finally {
      rs.clearAllTimers();
      rs.useRealTimers();
    }
  });

  it('serializes an ambiguous edited rule name as an explicit rule filter', () => {
    rs.useFakeTimers();
    renderSidebar('?search=ErrorRate');

    try {
      fireEvent.change(screen.getByTestId('rule-name-filter-input'), { target: { value: 'type:recording' } });
      act(() => {
        rs.advanceTimersByTime(500);
      });

      expect(screen.getByTestId('location-search')).toHaveTextContent('?search=rule%3Atype%3Arecording');
      expect(screen.getByTestId('rule-name-filter-input')).toHaveValue('type:recording');
    } finally {
      rs.clearAllTimers();
      rs.useRealTimers();
    }
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

    await waitFor(() => {
      expect(screen.getByTestId('search-query-input')).toHaveValue('namespace:prod');
    });
    await user.clear(screen.getByTestId('search-query-input'));
    await waitFor(() => {
      expect(screen.getByTestId('location-search')).toBeEmptyDOMElement();
    });
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
