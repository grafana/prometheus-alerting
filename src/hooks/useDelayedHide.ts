import { useState } from 'react';

import { useTimeoutEffect } from '@react-hookz/web';

/** Follows `value`, except that turning false waits `delayMs` and is cancelled if it turns true again. */
export function useDelayedHide(value: boolean, delayMs: number): boolean {
  const [delayed, setDelayed] = useState(value);

  // Remember straight away that it was on, a timer could miss a value that is only true very briefly
  if (value && !delayed) {
    setDelayed(true);
  }

  // Passing `undefined` as the delay turns the timer off, so it only runs while `value` is false
  useTimeoutEffect(() => setDelayed(false), value ? undefined : delayMs);

  return value || delayed;
}
