import { renderHook } from '@testing-library/react';
import { CoreApp } from '@grafana/data';
import { SceneRefreshPicker } from '@grafana/scenes';
import { describe, expect, it } from '@rstest/core';

import { useQueryPreview } from './useQueryPreview';

describe('useQueryPreview', () => {
  it('provides a range query for automatic execution and the standard refresh controls', () => {
    const { result, rerender } = renderHook(() => useQueryPreview('prometheus', 'up'));
    const scene = result.current;
    expect(scene.state.$data?.state).toMatchObject({
      datasource: { uid: 'prometheus' },
      queries: [{ refId: 'A', expr: 'up', instant: false, range: true, queryType: 'range' }],
    });
    expect(scene.enrichDataRequest()).toEqual({ app: CoreApp.UnifiedAlerting });
    expect(scene.state.controls?.some((control) => control instanceof SceneRefreshPicker)).toBe(true);
    rerender();
    expect(result.current).toBe(scene);
  });

  it('updates the preview when the expression or datasource changes and skips blank expressions', () => {
    const { result, rerender } = renderHook(({ uid, expr }) => useQueryPreview(uid, expr), {
      initialProps: { uid: 'prometheus', expr: 'up' },
    });
    rerender({ uid: 'loki', expr: 'sum(rate({job="grafana"}[5m]))' });
    expect(result.current.state.$data?.state).toMatchObject({
      datasource: { uid: 'loki' },
      queries: [{ expr: 'sum(rate({job="grafana"}[5m]))', queryType: 'range' }],
    });
    rerender({ uid: 'loki', expr: '  ' });
    expect(result.current.state.$data?.state).toMatchObject({ queries: [] });
  });
});
