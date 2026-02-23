import { describe, it, expect } from 'vitest';
import { addUniqueIdentifier } from './utils';

describe('addUniqueIdentifier', () => {
  it('assigns "0" as the root id', () => {
    const result = addUniqueIdentifier({ receiver: 'default' });
    expect(result.id).toBe('0');
  });

  it('assigns positional ids to children', () => {
    const result = addUniqueIdentifier({
      receiver: 'default',
      routes: [{ receiver: 'a' }, { receiver: 'b' }],
    });
    expect(result.routes![0].id).toBe('0.0');
    expect(result.routes![1].id).toBe('0.1');
  });

  it('assigns ids recursively to grandchildren', () => {
    const result = addUniqueIdentifier({
      receiver: 'default',
      routes: [
        {
          receiver: 'a',
          routes: [{ receiver: 'a1' }, { receiver: 'a2' }],
        },
      ],
    });
    expect(result.routes![0].routes![0].id).toBe('0.0.0');
    expect(result.routes![0].routes![1].id).toBe('0.0.1');
  });

  it('returns empty routes array when no children', () => {
    const result = addUniqueIdentifier({ receiver: 'default' });
    expect(result.routes).toEqual([]);
  });

  it('preserves all original route properties', () => {
    const result = addUniqueIdentifier({ receiver: 'default', matchers: ['foo=bar'], continue: true });
    expect(result.receiver).toBe('default');
    expect(result.matchers).toEqual(['foo=bar']);
    expect(result.continue).toBe(true);
  });
});
