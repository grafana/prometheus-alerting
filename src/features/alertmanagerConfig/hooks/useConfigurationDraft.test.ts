import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from '@rstest/core';

import { useConfigurationDraft } from './useConfigurationDraft';

describe('useConfigurationDraft', () => {
  it('starts on the configuration it was given', () => {
    const { result } = renderHook(() => useConfigurationDraft('route:\n'));

    expect(result.current.value).toBe('route:\n');
    expect(result.current.hasChanges).toBe(false);
  });

  it('reports changes once somebody edits', () => {
    const { result } = renderHook(() => useConfigurationDraft('route:\n'));

    act(() => result.current.setValue('route: edited\n'));

    expect(result.current.value).toBe('route: edited\n');
    expect(result.current.hasChanges).toBe(true);
  });

  it('goes back to the stored configuration on discard', () => {
    const { result } = renderHook(() => useConfigurationDraft('route:\n'));

    act(() => result.current.setValue('route: edited\n'));
    act(() => result.current.discard());

    expect(result.current.value).toBe('route:\n');
    expect(result.current.hasChanges).toBe(false);
  });

  it('follows a new configuration from the server while there are no edits', () => {
    const { result, rerender } = renderHook(({ configuration }) => useConfigurationDraft(configuration), {
      initialProps: { configuration: 'route:\n' },
    });

    rerender({ configuration: 'route: from-server\n' });

    expect(result.current.value).toBe('route: from-server\n');
  });

  it('keeps unsaved edits when a new configuration arrives from the server', () => {
    const { result, rerender } = renderHook(({ configuration }) => useConfigurationDraft(configuration), {
      initialProps: { configuration: 'route:\n' },
    });

    act(() => result.current.setValue('route: mine\n'));
    rerender({ configuration: 'route: from-server\n' });

    expect(result.current.value).toBe('route: mine\n');
    expect(result.current.hasChanges).toBe(true);
  });

  it('discards to whatever the server last sent, not the original', () => {
    const { result, rerender } = renderHook(({ configuration }) => useConfigurationDraft(configuration), {
      initialProps: { configuration: 'route:\n' },
    });

    act(() => result.current.setValue('route: mine\n'));
    rerender({ configuration: 'route: from-server\n' });
    act(() => result.current.discard());

    expect(result.current.value).toBe('route: from-server\n');
    expect(result.current.hasChanges).toBe(false);
  });
});
