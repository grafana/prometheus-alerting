import { describe, expect, it } from '@rstest/core';
import { validateTemplate, validateTemplateForSave } from './index';

describe('validateTemplate', () => {
  it('accepts a template that parses', () => {
    expect(validateTemplate('{{ define "t" }}{{ .Status | toUpper }}{{ end }}')).toBeUndefined();
  });

  it('accepts an empty template', () => {
    expect(validateTemplate('')).toBeUndefined();
  });

  it('reports an action that is never closed', () => {
    // Go blames the point where it ran out of input rather than where the
    // action started, and reports the line it reached -- here, past the
    // trailing newline. The differential test pins this to Go's own answer.
    expect(validateTemplate('hello\n{{ .Status\n')).toEqual({
      message: 'unclosed action',
      line: 3,
      column: 1,
    });
  });

  it('reports a missing end', () => {
    expect(validateTemplate('{{ if .A }}yes')?.message).toBeTruthy();
  });
});

describe('validateTemplateForSave', () => {
  it('accepts content that will be wrapped', () => {
    expect(validateTemplateForSave('my-template', '{{ .Status }}')).toBeUndefined();
  });

  it('accepts the content the form starts a new template with', () => {
    expect(validateTemplateForSave('my-template', '{{ define "my-template" }}\n  \n{{ end }}')).toBeUndefined();
  });

  it('shifts the line and column back onto the content the author typed', () => {
    // Wrapping adds a {{ define }} line above and indents by two, so what
    // parses as line 3 column 6 is line 2 column 4 to the author.
    expect(validateTemplateForSave('t', 'one\n{{ 0x }}\nthree')).toMatchObject({ line: 2, column: 4 });
  });

  it('does not shift the line when the content already has its own define', () => {
    expect(validateTemplateForSave('t', '{{ define "t" }}\n{{ .Status\n{{ end }}')).toMatchObject({ line: 3 });
  });

  it('never points past the end of what the author typed', () => {
    // This one actually breaks on the {{ end }} the wrapper added, which is
    // not a line the author can see, so it has to be pinned back onto theirs.
    const problem = validateTemplateForSave('t', 'one\ntwo\n{{ .Status');

    expect(problem?.line).toBe(3);
  });

  it('never points before the start of what the author typed', () => {
    const problem = validateTemplateForSave('t', '{{ end }}');

    expect(problem?.line).toBe(1);
    expect(problem?.column).toBeGreaterThanOrEqual(1);
  });
});
