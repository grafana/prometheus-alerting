// A step of the pr-impact workflow, run by .github/workflows/pr-impact.yml.
// Not executable, so mise offers only the one task — `mise run pr-impact
// <number>` — rather than each step separately.
//
// There is no parsing here, on purpose. Claude writes three files, each holding
// one thing, so reading them is a trim, a split on tabs, and a file read.
//
// It used to pull all three out of Claude's chat message, where prose and data
// shared one channel and kept colliding — once when it wrapped the findings in
// a code fence and left the headings behind in the comment, once when it opened
// with "I have what I need to write the review comment now". Both were fixed by
// asking more firmly. Neither was fixed by construction. Now the summary is a
// file of its own that nothing looks inside, so there is nothing left to collide.

import { readFileSync } from 'node:fs';
import { setOutput, env, isMain } from './lib.mjs';

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
  const tier = readTier(read(env('TIER_FILE')));
  if (!tier) {
    console.error(`${env('TIER_FILE')} does not hold one of trivial, low, medium, high.`);
    process.exit(1);
  }

  const spots = readSpots(read(env('SPOTS_FILE')));
  const body = read(env('SUMMARY_FILE')).trim().slice(0, 4000);

  // Timings and the model come from the action's own transcript.
  const result = process.env.EXECUTION_FILE ? lastResult(process.env.EXECUTION_FILE) : undefined;

  console.error(`Claude rated this ${tier}, with ${spots.length} spot(s) to check`);
  setOutput({
    tier,
    spots: JSON.stringify(spots),
    body,
    model: modelUsed(result),
    took: humanDuration(result?.duration_ms),
  });
}
