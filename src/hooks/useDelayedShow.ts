import { useState } from 'react';

import { useTimeoutEffect } from '@react-hookz/web';

/** Only turns true once `value` has been true for `delayMs`, and turns false straight away. */
export function useDelayedShow(value: boolean, delayMs: number): boolean {
  const [shown, setShown] = useState(false);

  if (!value && shown) {
    setShown(false);
  }

  // Passing `undefined` as the delay turns the timer off, so it only runs while `value` is true
  useTimeoutEffect(() => setShown(true), value ? delayMs : undefined);

  return value && shown;
}
