import { describe, expect, it } from '@rstest/core';
import { readOracle } from './corpus.test-helpers';
import { KNOWN_TEMPLATE_FUNCS } from './funcs';

describe('known template functions', () => {
  it('matches the list the oracle validated against', () => {
    // If these drift apart, the expected answers in expected.json were
    // produced with a different set of functions than we'd check against, and
    // the differential test stops meaning anything.
    expect([...KNOWN_TEMPLATE_FUNCS].sort()).toEqual(readOracle().funcs);
  });
});
