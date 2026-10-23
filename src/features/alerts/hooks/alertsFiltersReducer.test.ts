import { filtersReducer, initialFilters } from './alertsFiltersReducer';

describe('filtersReducer', () => {
  it('merges updates into the current filters', () => {
    const state = filtersReducer(initialFilters, { type: 'update', changes: { showSuppressed: true } });

    expect(state).toEqual({ ...initialFilters, showSuppressed: true });
  });

  it('resets every filter on clear', () => {
    const changed = {
      receivers: ['email'],
      showActive: false,
      showUnprocessed: true,
      showSuppressed: true,
      labelInput: 'a=b',
    };

    expect(filtersReducer(changed, { type: 'clear' })).toEqual(initialFilters);
  });
});
