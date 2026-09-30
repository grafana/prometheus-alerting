// Unit tests for the parts of parse.mjs that split Claude's answer into a
// summary and findings. Run them with `mise run pr-impact:check`.
//
// Not executable, so mise doesn't offer it as a task of its own.
//
// Nothing here touches the network or a transcript file: every test hands
// readFindings a message and checks what comes back out.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { readFindings, humanDuration } from './parse.mjs';

test('the summary and the findings come apart at the last labelled line', () => {
  const { tier, spots, summary } = readFindings(
    [
      'This narrows a filter and writes nothing.',
      '',
      'SPOT: high | a.ts | 12 | this builds the matcher',
      'IMPACT: high',
    ].join('\n')
  );
  assert.equal(tier, 'high');
  assert.equal(summary, 'This narrows a filter and writes nothing.');
  assert.deepEqual(spots, [{ tier: 'high', path: 'a.ts', line: 12, why: 'this builds the matcher' }]);
});

test('a summary that talks about impact is not mistaken for a finding', () => {
  // Why only the end of the message counts: the summary is free to use the word
  // and to quote the format back in a fence, and neither can be read as a
  // rating. Anything looser would have to guess.
  const { tier, summary } = readFindings(
    ['Impact: this one is contained to the sidebar.', '', '```', 'IMPACT: trivial', '```', '', 'IMPACT: medium'].join(
      '\n'
    )
  );
  assert.equal(tier, 'medium');
  assert.match(summary, /contained to the sidebar/);
  assert.match(summary, /IMPACT: trivial/);
});

test('an answer with no labelled line at the end gives no tier', () => {
  // The run fails on this rather than guessing, and a re-run is the way out.
  assert.equal(readFindings('I could not work out what this PR does.').tier, null);
  assert.equal(readFindings('IMPACT: medium\n\nand some prose after it').tier, null);
});

test('a tier that is not one of ours is not a tier', () => {
  assert.equal(readFindings('IMPACT: catastrophic').tier, null);
});

test('a spot line that is not all four parts is dropped, not guessed at', () => {
  const { tier, spots } = readFindings(
    ['SPOT: high | a.ts | 12 |', 'SPOT: high | a.ts | 0 | line zero is no line', 'IMPACT: high'].join('\n')
  );
  assert.equal(tier, 'high');
  assert.deepEqual(spots, []);
});

test('how long it took, for a reader', () => {
  assert.equal(humanDuration(8000), '8s');
  assert.equal(humanDuration(125000), '2m 05s');
  assert.equal(humanDuration(0), '');
});
