// A step of the pr-impact workflow, run by .github/workflows/pr-impact.yml.
// Not executable, so mise offers only the one task — `mise run pr-impact
// <number>` — rather than each step separately.
//
// Claude writes three files, each holding one thing, so reading them is a trim,
// a split on tabs, and a file read. This step checks the rating is one of the
// four words and writes down the model and duration, which live in the action's
// transcript rather than in Claude's files. The posting job reads the rest.
//
// It used to pull all three out of Claude's chat message, where prose and data
// shared one channel and kept colliding — once when it wrapped the findings in
// a code fence and left the headings behind in the comment, once when it opened
// with "I have what I need to write the review comment now". Both were fixed by
// asking more firmly. Neither was fixed by construction. Now the summary is a
// file of its own that nothing looks inside, so there is nothing left to collide.

import { readFileSync, writeFileSync } from 'node:fs';
import { env, isMain } from './lib.mjs';

const TIERS = new Set(['trivial', 'low', 'medium', 'high']);
const MAX_SPOTS = 8;

const read = (path) => readFileSync(path, 'utf8');

/** One word. */
export function readTier(text) {
  const tier = text.trim().toLowerCase();
  return TIERS.has(tier) ? tier : null;
}

/** Four tab-separated columns per line. A line that isn't that shape is dropped. */
export function readSpots(text) {
  return text
    .split('\n')
    .filter((line) => line.trim() !== '')
    .slice(0, MAX_SPOTS)
    .map((line) => line.split('\t'))
    .filter((columns) => columns.length >= 4)
    .map(([tier, path, line, ...reason]) => ({
      tier: tier.trim().toLowerCase(),
      path: path.trim(),
      line: Number(line.trim()),
      // Rejoin in case a reason contained a tab anyway.
      why: reason.join(' ').trim(),
    }))
    .filter(
      (spot) =>
        Number.isInteger(spot.line) &&
        spot.line > 0 &&
        (spot.tier === 'medium' || spot.tier === 'high') &&
        spot.path !== '' &&
        spot.why !== ''
    );
}

/** How long the run took, for a reader rather than a parser: 48s, 2m 05s. */
export function humanDuration(ms) {
  if (!Number.isFinite(ms) || ms <= 0) {
    return '';
  }
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ${String(seconds % 60).padStart(2, '0')}s`;
  }
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}

function lastResult(executionFile) {
  const transcript = JSON.parse(read(executionFile));
  return transcript.filter((entry) => entry.type === 'result').at(-1);
}

/**
 * Which model actually answered. The transcript records usage per concrete
 * model id, which is more use for tracking than the alias we asked for, but the
 * shape is not guaranteed — fall back to what the workflow requested.
 */
function modelUsed(result) {
  const usage = result?.modelUsage;
  const named = usage && typeof usage === 'object' ? Object.keys(usage) : [];
  return named.length > 0 ? named.join(', ') : (process.env.CLAUDE_MODEL ?? '');
}

if (isMain(import.meta.url)) {
  // Only checks that Claude wrote something usable, and records the two facts
  // that live in the transcript rather than in its files. Everything else is
  // read straight from the files by the job that posts.
  const tier = readTier(readFileSync(env('TIER_FILE'), 'utf8'));
  if (!tier) {
    console.error(`${env('TIER_FILE')} does not hold one of trivial, low, medium, high.`);
    process.exit(1);
  }

  const result = lastResult(env('EXECUTION_FILE'));
  writeFileSync(env('META_FILE'), `${modelUsed(result)}\t${humanDuration(result?.duration_ms)}\n`);

  console.error(`Claude rated this ${tier}`);
}
