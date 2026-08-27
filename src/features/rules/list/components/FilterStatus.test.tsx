import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FilterStatus, type FilterProgressState } from './FilterStatus';

describe('FilterStatus', () => {
  it('does not report a result count while searching', () => {
    render(<FilterStatus state="searching" numberOfRules={0} onCancel={vi.fn()} />);

    expect(screen.getByText('Searching for rules...')).toBeInTheDocument();
    expect(screen.queryByText(/found 0 rules/i)).not.toBeInTheDocument();
  });

  it.each<[FilterProgressState, string]>([
    ['done', 'No more results – found 10 rules'],
    ['aborted', 'Search cancelled – found 10 rules'],
  ])('reports the settled result count when the search is %s', (state, message) => {
    render(<FilterStatus state={state} numberOfRules={10} onCancel={vi.fn()} />);

    expect(screen.getByText(message)).toBeInTheDocument();
  });
});
