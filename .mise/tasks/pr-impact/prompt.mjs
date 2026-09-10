// A step of the pr-impact workflow, run by .github/workflows/pr-impact.yml.
// Not executable, so mise offers only the one task — `mise run pr-impact
// <number>` — rather than each step separately.
//
// Builds what Claude is asked. The wording lives in .github/prompts/pr-impact.md
// and is the same every run; only the repository, the PR number and the diff
// change, and they go at the end so the unchanging part in front of them can be
// cached between runs.
//
// The diff is handed over rather than left for Claude to fetch. Told to find
// the PR itself, it spends turns re-running `gh pr diff` through sed and grep
// hunting for line numbers — one run did that thirteen times. Supplying it
// costs the same tokens and removes the hunt.
//
// The local runner calls buildPrompt too, so there is one copy of this and a
// run on your machine sends Claude exactly what CI would.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gh, setOutput, env, isMain } from './lib.mjs';

const WORDING = fileURLToPath(new URL('../../../.github/prompts/pr-impact.md', import.meta.url));

// The whole prompt is handed to the action as one shell argument, and Linux
// refuses a single argument over MAX_ARG_STRLEN, which is 131072 bytes. Go over
// and the step dies before it starts, with "Argument list too long" and nothing
// pointing at the prompt.
//
// So the ceiling has to cover the entire prompt, not just the diff: the wording
// file alone is around 5 KB. And it has to be counted in bytes, because that is
// what the kernel counts -- a diff full of non-ASCII is longer in bytes than it
// is in characters.
//
// 100000 leaves comfortable headroom under the real limit. Claude is told when a
// diff was cut, and a rating made on part of a diff cannot come out below
// medium -- see post.mjs.
const PROMPT_LIMIT = 100000;

const encoder = new TextEncoder();

function byteLength(text) {
  return encoder.encode(text).length;
}

/** Cuts `text` to at most `maxBytes`, without splitting a character in half. */
function sliceBytes(text, maxBytes) {
  const bytes = encoder.encode(text);
  if (bytes.length <= maxBytes) {
    return text;
  }
  // fatal: false makes the decoder drop a trailing partial character rather
  // than replacing it with U+FFFD.
  return new TextDecoder('utf-8', { fatal: false, ignoreBOM: true })
    .decode(bytes.subarray(0, maxBytes))
    .replace(/�$/, '');
}

export function buildPrompt({ repo, pr }) {
  const diff = gh(['pr', 'diff', String(pr), '--repo', repo]);

  const head = [readFileSync(WORDING, 'utf8'), `Repository: ${repo}`, `PR number: ${pr}`, ''];
  // The longer of the two intros, so the budget is right either way.
  const intro = 'The diff follows.\nIt was too long to include whole, so it stops part way through.';
  const budget = PROMPT_LIMIT - byteLength([...head, intro, '', '', ''].join('\n'));

  const truncated = byteLength(diff) > budget;

  const text = [
    ...head,
    truncated ? intro : 'The diff follows.',
    '',
    truncated ? sliceBytes(diff, budget) : diff,
    '',
  ].join('\n');

  return { text, truncated };
}

if (isMain(import.meta.url)) {
  setOutput(buildPrompt({ repo: env('GH_REPO'), pr: env('PR_NUMBER') }));
}
