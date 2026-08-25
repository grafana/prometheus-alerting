import { initialAlertmanagerConfiguration } from '@grafana/external-alertmanager/mimir';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { describe, expect, it, vi } from 'vitest';

import { loadMimirUserConfiguration } from './mimir.utils';

const dataSourceUID = 'mimir-alertmanager';

describe('loadMimirUserConfiguration', () => {
  it('returns an editable initial configuration for an uninitialized tenant', async () => {
    const error = {
      status: 404,
      data: 'alertmanager storage object not found',
    } satisfies FetchBaseQueryError;
    const baseQuery = vi.fn().mockResolvedValue({ error });

    const result = await loadMimirUserConfiguration(dataSourceUID, baseQuery);

    expect(baseQuery).toHaveBeenCalledOnce();
    expect(result).toEqual({ data: initialAlertmanagerConfiguration });
  });

  it('parses an initialized tenant configuration', async () => {
    const baseQuery = vi.fn().mockResolvedValue({
      data: `template_files: {}
alertmanager_config: |
  route:
    receiver: default
  receivers:
    - name: default
`,
    });

    const result = await loadMimirUserConfiguration(dataSourceUID, baseQuery);

    expect(result).toMatchObject({
      data: {
        alertmanager_config: {
          route: { receiver: 'default' },
          receivers: [{ name: 'default' }],
        },
        template_files: {},
      },
    });
  });

  it('preserves errors unrelated to tenant initialization', async () => {
    const error = { status: 403, data: 'access denied' } satisfies FetchBaseQueryError;
    const baseQuery = vi.fn().mockResolvedValue({ error });

    const result = await loadMimirUserConfiguration(dataSourceUID, baseQuery);

    expect(result).toEqual({ error });
  });
});
