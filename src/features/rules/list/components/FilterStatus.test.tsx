import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, rs } from '@rstest/core';

import { FilterStatus, type FilterProgressState } from './FilterStatus';

describe('FilterStatus', () => {
  it('updates the result count while searching', () => {
    const onCancel = rs.fn();
    const { rerender } = render(<FilterStatus state="searching" numberOfRules={0} onCancel={onCancel} />);

    expect(screen.getByText('Search in progress. Found 0 rules so far')).toBeInTheDocument();

    rerender(<FilterStatus state="searching" numberOfRules={10} onCancel={onCancel} />);

    expect(screen.getByText('Search in progress. Found 10 rules so far')).toBeInTheDocument();
  });

  it.each<[FilterProgressState, string]>([
    ['done', 'No more results – found 10 rules'],
    ['aborted', 'Search cancelled – found 10 rules'],
  ])('reports the settled result count when the search is %s', (state, message) => {
    render(<FilterStatus state={state} numberOfRules={10} onCancel={rs.fn()} />);

    expect(screen.getByText(message)).toBeInTheDocument();
  });
});
