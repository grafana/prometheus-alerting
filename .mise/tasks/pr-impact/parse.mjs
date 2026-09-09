// A step of the pr-impact workflow, run by .github/workflows/pr-impact.yml.
// Not executable, so mise offers only the one task — `mise run pr-impact
// <number>` — rather than each step separately.
//
// Splits Claude's final message into the summary to post and the findings to
// act on, and hands them to the posting job.
//
// The split is positional, not by content. Only the unbroken run of labelled
// lines at the very end counts as findings; everything above it is the summary
// and is never looked at. That is what keeps the two from colliding — the
// summary can hold headings, code fences, even the word "Impact", and none of
// it can be mistaken for a finding.

import { readFileSync } from 'node:fs';
import { setOutput, env, isMain, TIERS } from './lib.mjs';

const LABELLED = /^(impact|spot):/i;
const IMPACT = /^impact:\s*(\w+)\s*$/i;
const MAX_SPOTS = 8;

// tier, file, line, reason. Everything a spot has to be true for is in the
// pattern: one of the two tiers we act on, a file name, a line number that is
// not zero, and a reason that is not empty. A line that is not all four of
// those does not match and is left out, so there is nothing else to check.
// The reason is last and takes the rest of the line. Case and stray spaces are
// tolerated, because losing a spot to either would be silent.
const SPOT = /^spot:\s*(medium|high)\s*\|\s*([^|]+?)\s*\|\s*([1-9][0-9]*)\s*\|\s*(.+?)\s*$/i;

export function readFindings(message) {
  const lines = message.split('\n').map((line) => line.replace(/\r$/, ''));

  // Walk back from the end for as long as the lines are labelled or blank.
  let start = lines.length;
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line === '') {
      continue;
    }
    if (!LABELLED.test(line)) {
      break;
    }
    start = i;
  }

  const labelled = lines.slice(start).map((line) => line.trim());
  const impact = labelled
    .map((line) => IMPACT.exec(line))
    .filter(Boolean)
    .map(([, tier]) => tier.toLowerCase())
    .filter((tier) => TIERS.includes(tier));

  const spots = labelled
    .map((line) => SPOT.exec(line))
    .filter(Boolean)
    .slice(0, MAX_SPOTS)
    .map(([, tier, path, line, why]) => ({ tier: tier.toLowerCase(), path, line: Number(line), why }));

  return {
    tier: impact.at(-1) ?? null,
    spots,
    summary: lines.slice(0, start).join('\n').trim().slice(0, 4000),
  };
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
  const transcript = JSON.parse(readFileSync(executionFile, 'utf8'));
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
  const result = lastResult(env('EXECUTION_FILE'));
  const { tier, spots, summary } = readFindings(result?.result ?? '');

  if (!tier) {
    console.error('No IMPACT line at the end of what Claude said. It said:');
    console.error(result?.result ?? '(nothing)');
    process.exit(1);
  }

  console.error(`Claude rated this ${tier}, with ${spots.length} spot(s) to check`);

  setOutput({
    tier,
    spots: JSON.stringify(spots),
    model: modelUsed(result),
    took: humanDuration(result?.duration_ms),
    summary,
  });
}
