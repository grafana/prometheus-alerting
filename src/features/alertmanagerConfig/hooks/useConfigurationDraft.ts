import { useCallback, useState } from 'react';

interface ConfigurationDraft {
  /** The text currently in the editor. */
  value: string;
  /** Called by the editor as somebody types. */
  setValue: (next: string) => void;
  /** Whether the editor holds something other than what the server has. */
  hasChanges: boolean;
  /** Throws the edits away and goes back to what the server has. */
  discard: () => void;
}

/**
 * Holds the text somebody is editing next to the configuration the server gave us.
 *
 * The queries refetch when the browser tab regains focus, so the stored configuration can change
 * underneath the editor. We follow that change, unless there are unsaved edits, which we must not
 * throw away.
 */
export function useConfigurationDraft(configuration: string): ConfigurationDraft {
  const [value, setValue] = useState(configuration);
  // The configuration the editor was last seeded from, so we can tell an edit of our own apart from
  // a change that arrived from the server.
  const [seeded, setSeeded] = useState(configuration);

  if (configuration !== seeded) {
    setSeeded(configuration);
    if (value === seeded) {
      setValue(configuration);
    }
  }

  const discard = useCallback(() => setValue(configuration), [configuration]);

  return { value, setValue, hasChanges: value !== configuration, discard };
}
