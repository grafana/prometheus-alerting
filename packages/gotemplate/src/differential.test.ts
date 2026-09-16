import { describe, expect, it } from 'vitest';
import { readCorpus, readOracle } from './corpus.test-helpers';
import { validateTemplate } from './index';
import { wrapTemplateForSave } from './wrap';

/**
 * Checks our parser against real Go on the shared corpus.
 *
 * The expected answers in testdata/expected.json were produced by running each
 * template through Go's own text/template, so this is a comparison against the
 * thing Mimir actually uses -- not against our idea of what Go does. Regenerate
 * it with `pnpm oracle:refresh` after changing the corpus.
 *
 * Two kinds of disagreement, and they matter very differently:
 *
 *   - We reject something Go accepts. This blocks somebody from saving a
 *     template that works, so it has to be zero.
 *   - We accept something Go rejects. A broken template still gets through,
 *     which is what happens today anyway. Tolerable, but tracked below so it
 *     can only shrink and never quietly grow.
 */

interface Case {
  name: string;
  source: string;
  goAccepts: boolean;
  goError: string;
}

function buildCases(): Case[] {
  const corpus = readCorpus();
  const oracle = readOracle();
  const cases: Case[] = [];

  for (const entry of corpus) {
    const wrapped = wrapTemplateForSave('wrapped', entry.source);
    for (const [name, source] of [
      [entry.name, entry.source],
      [`${entry.name}#wrapped`, wrapped.text],
    ] as const) {
      const expected = oracle.results[name];
      if (!expected) {
        throw new Error(`no recorded Go result for ${name}; run \`pnpm oracle:refresh\``);
      }
      cases.push({ name, source, goAccepts: expected.ok, goError: expected.err ?? '' });
    }
  }

  return cases;
}

type Outcome =
  | { kind: 'accepted' }
  | { kind: 'rejected'; message: string; line: number }
  | { kind: 'crashed'; message: string };

function run(source: string): Outcome {
  try {
    const problem = validateTemplate(source);
    return problem ? { kind: 'rejected', message: problem.message, line: problem.line } : { kind: 'accepted' };
  } catch (error) {
    return { kind: 'crashed', message: error instanceof Error ? error.message : String(error) };
  }
}

const cases = buildCases();

describe('parser agrees with Go about what is broken', () => {
  const falsePositives: string[] = [];
  const falseNegatives: string[] = [];
  const crashes: string[] = [];
  const differentLine: string[] = [];

  for (const c of cases) {
    const outcome = run(c.source);
    if (outcome.kind === 'crashed') {
      crashes.push(`${c.name}: ${outcome.message}`);
    } else if (outcome.kind === 'rejected' && c.goAccepts) {
      falsePositives.push(`${c.name}: we say "${outcome.message}", Go parses it fine`);
    } else if (outcome.kind === 'accepted' && !c.goAccepts) {
      falseNegatives.push(`${c.name}: Go says "${stripPrefix(c.goError)}"`);
    } else if (outcome.kind === 'rejected' && !c.goAccepts) {
      const goLine = lineOf(c.goError);
      if (goLine !== undefined && goLine !== outcome.line) {
        differentLine.push(`${c.name}: we say line ${outcome.line}, Go says line ${goLine}`);
      }
    }
  }

  it('never rejects a template Go accepts', () => {
    expect(falsePositives).toEqual([]);
  });

  it('never crashes', () => {
    expect(crashes).toEqual([]);
  });

  it('misses only the known set of Go checks', () => {
    expect(falseNegatives.sort()).toMatchSnapshot();
  });

  it('points at the same line as Go, apart from the known cases', () => {
    // We don't claim Go's exact wording, but the line number is what puts the
    // message next to the right part of the template, so drift here is worth
    // seeing.
    expect(differentLine.sort()).toMatchSnapshot();
  });

  it('covers a meaningful corpus', () => {
    expect(cases.length).toBeGreaterThan(300);
    expect(cases.filter((c) => !c.goAccepts).length).toBeGreaterThan(100);
  });
});

/** Go prefixes its parse errors with `template: <name>:<line>: `. */
function stripPrefix(goError: string): string {
  const match = /^template: [^:]*:\d+:\s*(.*)$/s.exec(goError);
  return match ? match[1] : goError;
}

/** Pulls the line number out of that same prefix. */
function lineOf(goError: string): number | undefined {
  const match = /^template: [^:]*:(\d+):/.exec(goError);
  return match ? Number(match[1]) : undefined;
}
