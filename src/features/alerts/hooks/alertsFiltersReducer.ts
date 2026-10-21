import { produce } from 'immer';

export interface FilterValues {
  receivers: string[];
  showActive: boolean;
  showUnprocessed: boolean;
  showSuppressed: boolean;
  labelInput: string;
}

export type FiltersAction = { type: 'update'; changes: Partial<FilterValues> } | { type: 'clear' };

export const initialFilters: FilterValues = {
  receivers: [],
  showActive: true,
  showUnprocessed: false,
  showSuppressed: false,
  labelInput: '',
};

export function filtersReducer(state: FilterValues, action: FiltersAction): FilterValues {
  return produce(state, (draft) => {
    switch (action.type) {
      case 'update':
        Object.assign(draft, action.changes);
        return;
      case 'clear':
        return initialFilters;
    }
  });
}
