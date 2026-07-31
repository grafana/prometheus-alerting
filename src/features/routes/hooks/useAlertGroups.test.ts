import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAlertGroups } from './useAlertGroups';

const mocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
}));

vi.mock('../../../hooks/useAlertmanager', () => ({
  useAlertmanager: () => ({
    uid: 'alertmanager-1',
    settings: { jsonData: { implementation: 'prometheus' } },
  }),
}));

vi.mock('../../../api/alertmanager/alertmanager.endpoints', () => ({
  alertmanagerApi: {
    endpoints: {
      getAlertGroups: {
        useQuery: mocks.useQuery,
      },
    },
  },
}));

describe('useAlertGroups', () => {
  beforeEach(() => {
    mocks.useQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined,
      refetch: vi.fn(),
    });
  });

  it('skips the alert-instances request when requested by the caller', () => {
    renderHook(() => useAlertGroups({ skip: true }));

    expect(mocks.useQuery).toHaveBeenCalledWith(
      {
        dataSourceUID: 'alertmanager-1',
        active: true,
        silenced: true,
        inhibited: true,
      },
      { skip: true }
    );
  });
});
