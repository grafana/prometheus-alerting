import { isEmpty } from 'lodash';

export function labelsSize(labels?: Record<string, string>) {
  if (isEmpty(labels)) {
    return 0;
  }

  return Object.keys(labels).filter((key) => !isPrivateLabelKey(key)).length;
}

export function isPrivateLabelKey(labelKey: string) {
  return labelKey.startsWith('__');
}

