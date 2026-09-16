import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface CorpusEntry {
  name: string;
  source: string;
}

export interface OracleResult {
  ok: boolean;
  err?: string;
}

export interface OracleOutput {
  version: number;
  goVersion: string;
  funcs: string[];
  results: Record<string, OracleResult>;
}

const testdataDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'testdata');

/**
 * Reads Go's txtar format: a line like `-- name --` starts a new entry, and
 * everything up to the next one is its content. Anything before the first
 * marker is a comment. This mirrors parseTxtar in oracle/main.go -- both sides
 * have to split the corpus the same way or the comparison is meaningless.
 */
export function parseTxtar(data: string): CorpusEntry[] {
  const entries: CorpusEntry[] = [];
  let name: string | undefined;
  let lines: string[] = [];

  const flush = () => {
    if (name !== undefined) {
      entries.push({ name, source: joinLines(lines) });
    }
    lines = [];
  };

  for (const line of data.split('\n')) {
    const marker = txtarMarker(line);
    if (marker !== undefined) {
      flush();
      name = marker;
      continue;
    }
    if (name !== undefined) {
      lines.push(line);
    }
  }
  flush();

  return entries;
}

function txtarMarker(line: string): string | undefined {
  const trimmed = line.endsWith('\r') ? line.slice(0, -1) : line;
  if (!trimmed.startsWith('-- ') || !trimmed.endsWith(' --')) {
    return undefined;
  }
  const name = trimmed.slice(3, -3).trim();
  return name === '' ? undefined : name;
}

function joinLines(lines: string[]): string {
  let end = lines.length;
  while (end > 0 && lines[end - 1] === '') {
    end--;
  }
  if (end === 0) {
    return '';
  }
  return lines.slice(0, end).join('\n') + '\n';
}

export function readCorpus(): CorpusEntry[] {
  return parseTxtar(readFileSync(join(testdataDir, 'corpus.txtar'), 'utf8'));
}

export function readOracle(): OracleOutput {
  return JSON.parse(readFileSync(join(testdataDir, 'expected.json'), 'utf8'));
}
