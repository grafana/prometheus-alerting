import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

/**
 * Hook to warn users about unsaved changes when navigating away
 * Integrates with react-hook-form to detect dirty state
 */
export function useUnsavedChanges(enabled: boolean = true) {
  const formContext = useFormContext();
  const isDirty = formContext?.formState.isDirty ?? false;

  useEffect(() => {
    if (!enabled || !isDirty) {
      return;
    }

    // Browser native prompt when closing/refreshing tab
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Chrome requires returnValue to be set
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, isDirty]);

  return { isDirty };
}
