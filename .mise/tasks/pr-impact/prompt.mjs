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

// Diffs longer than this are cut. Two of the last sixty PRs would be, and both
// touch paths the floor already holds at high, so nothing is lost that would
// change a rating. Claude is told when it happens, and a rating made on part of
// a diff cannot come out below medium — see post.mjs.
const DIFF_LIMIT = 120000;

export function buildPrompt({ repo, pr }) {
  const diff = gh(['pr', 'diff', String(pr), '--repo', repo]);
  const truncated = diff.length > DIFF_LIMIT;

  const text = [
    readFileSync(WORDING, 'utf8'),
    `Repository: ${repo}`,
    `PR number: ${pr}`,
    '',
    truncated
      ? 'The diff follows.\nIt was too long to include whole, so it stops part way through.'
      : 'The diff follows.',
    '',
    diff.slice(0, DIFF_LIMIT),
    '',
  ].join('\n');

  return { text, truncated };
}

if (isMain(import.meta.url)) {
  setOutput(buildPrompt({ repo: env('GH_REPO'), pr: env('PR_NUMBER') }));
}
