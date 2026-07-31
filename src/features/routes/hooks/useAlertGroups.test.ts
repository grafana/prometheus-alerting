import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockAlertmanagerDs } from '../../../test/fixtures/datasources';
import { useAlertGroups } from './useAlertGroups';

function requireDataSourceUID(dataSource: { uid?: string }): string {
  if (!dataSource.uid) {
    throw new Error('Expected the test data source to have a UID');
  }

  return dataSource.uid;
}

const alertmanagerUID = requireDataSourceUID(mockAlertmanagerDs);

const mocks = vi.hoisted(() => ({
  dataSourceUID: '',
  useQuery: vi.fn(),
}));

vi.mock('../../../hooks/useAlertmanager', () => ({
  useAlertmanager: () => ({
    uid: mocks.dataSourceUID,
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
    mocks.dataSourceUID = alertmanagerUID;
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
        dataSourceUID: alertmanagerUID,
        active: true,
        silenced: true,
        inhibited: true,
      },
      { skip: true }
    );
  });
});
