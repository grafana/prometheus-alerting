import { parseDocument } from 'yaml';

export interface YamlProblem {
  /** What the parser said, without the position and excerpt it appends. */
  message: string;
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

/**
 * Everything the YAML parser found wrong, and where.
 *
 * Uses parseDocument rather than parse because it collects every problem instead of throwing on
 * the first one, so somebody fixing a configuration can see all of them at once.
 */
export function getYamlProblems(value: string): YamlProblem[] {
  return parseDocument(value).errors.map((error) => {
    const [start, end] = error.linePos ?? [];
    const startLineNumber = start?.line ?? 1;
    const startColumn = start?.col ?? 1;

    return {
      // The parser appends "at line 4, column 3:" and the line it is talking about, which only
      // repeats what the mark in the editor and the line number in the summary already say.
      message: error.message.split(' at line ')[0],
      startLineNumber,
      startColumn,
      endLineNumber: end?.line ?? startLineNumber,
      endColumn: end?.col ?? startColumn + 1,
    };
  });
}
