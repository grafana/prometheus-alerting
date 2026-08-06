import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { AlertingPermission } from '../../../access-control/abilities';
import { PermissionDeniedError } from '../../../access-control/errors';
import { mockMimirAlertmanagerDs } from '../../../test/fixtures/datasources';
import { setCurrentUserPermissions, setMockGrafanaDataSources } from '../../../test/mocks/grafana-runtime';
import { createTestWrapper } from '../../../test/utils/test-wrapper';
import { useCreateSilence, useDeleteSilence } from './useSilences';

describe('silence mutation permissions', () => {
  beforeEach(() => {
    setMockGrafanaDataSources();
    setCurrentUserPermissions(AlertingPermission.InstancesRead);
  });

  it('rejects creating a silence without instance write permissions', async () => {
    const { result } = renderHook(() => useCreateSilence(), {
      wrapper: createTestWrapper(mockMimirAlertmanagerDs.uid),
    });
    const [createSilence] = result.current;

    await expect(createSilence({ matchers: [], startsAt: '', endsAt: '', createdBy: '', comment: '' })).rejects.toThrow(
      PermissionDeniedError
    );
  });

  it('rejects expiring a silence without instance write permissions', async () => {
    const { result } = renderHook(() => useDeleteSilence(), {
      wrapper: createTestWrapper(mockMimirAlertmanagerDs.uid),
    });
    const [expireSilence] = result.current;

    await expect(expireSilence('silence-1')).rejects.toThrow(PermissionDeniedError);
  });
});
