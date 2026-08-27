function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isEmpty(value: unknown): boolean {
  return value === '' || value === null || value === undefined;
}

function removeEmptyValues(value: unknown): void {
  if (Array.isArray(value)) {
    for (let index = value.length - 1; index >= 0; index -= 1) {
      const child = value[index];
      removeEmptyValues(child);
      if (isEmpty(child) || (isRecord(child) && Object.keys(child).length === 0)) {
        value.splice(index, 1);
      }
    }
    return;
  }
  if (!isRecord(value)) {
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    removeEmptyValues(child);
    if (isEmpty(child) || (isRecord(child) && Object.keys(child).length === 0)) {
      Reflect.deleteProperty(value, key);
    }
  }
}

/** Mirrors Grafana core's cloud receiver cleanup while preserving false and zero. */
export function omitEmptyValues<T>(value: T): T {
  const copy = structuredClone(value);
  removeEmptyValues(copy);
  return copy;
}
