import { describe, expect, it } from '@rstest/core';

import { getYamlProblems } from './yamlProblems';

describe('getYamlProblems', () => {
  it('finds nothing wrong with valid YAML', () => {
    expect(getYamlProblems('route:\n  receiver: default\n')).toEqual([]);
  });

  it('says where the problem is', () => {
    const [problem] = getYamlProblems('route:\n  receiver: default\nduplicate: 1\nduplicate: 2\n');

    expect(problem.startLineNumber).toBe(4);
    expect(problem.startColumn).toBe(1);
  });

  it('reports the line the parser noticed the problem on, which can be after the cause', () => {
    // The unterminated sequence is on line 3, but the parser only knows once it reads line 4.
    const [problem] = getYamlProblems("route:\n  receiver: default\n  group_by: ['bad'\n  routes: []\n");

    expect(problem.startLineNumber).toBe(4);
  });

  it('reports every problem, not just the first', () => {
    const problems = getYamlProblems("route:\n  group_by: ['bad'\n  routes: []\nduplicate: 1\nduplicate: 2\n");

    expect(problems).toHaveLength(2);
  });

  it('leaves the position and the excerpt out of the message', () => {
    const [problem] = getYamlProblems('duplicate: 1\nduplicate: 2\n');

    expect(problem.message).toBe('Map keys must be unique');
  });
});
