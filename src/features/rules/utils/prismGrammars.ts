/**
 * PromQL and LogQL Prism grammars for syntax highlighting
 *
 * Adapted from Grafana Labs' open-source implementations:
 * - PromQL: https://github.com/grafana/grafana/blob/main/packages/grafana-prometheus/src/promql.ts
 * - LogQL: https://github.com/grafana/grafana/blob/main/public/app/plugins/datasource/loki/syntax.ts
 *
 * Copyright (c) Grafana Labs
 * Licensed under AGPL-3.0
 */

import Prism, { Grammar } from 'prismjs';

// PromQL operators and function names
const PROMQL_OPERATORS = ['by', 'group_left', 'group_right', 'ignoring', 'on', 'offset', 'without'];

const PROMQL_FUNCTIONS = [
  // Aggregation
  'avg',
  'bottomk',
  'count',
  'count_values',
  'group',
  'max',
  'min',
  'quantile',
  'stddev',
  'stdvar',
  'sum',
  'topk',
  // Trigonometric
  'acos',
  'acosh',
  'asin',
  'asinh',
  'atan',
  'atanh',
  'cos',
  'cosh',
  'sin',
  'sinh',
  'tan',
  'tanh',
  // Math
  'abs',
  'absent',
  'absent_over_time',
  'avg_over_time',
  'ceil',
  'changes',
  'clamp',
  'clamp_max',
  'clamp_min',
  'count_over_time',
  'day_of_month',
  'day_of_week',
  'day_of_year',
  'days_in_month',
  'delta',
  'deriv',
  'exp',
  'floor',
  'histogram_avg',
  'histogram_count',
  'histogram_fraction',
  'histogram_quantile',
  'histogram_stddev',
  'histogram_stdvar',
  'histogram_sum',
  'holt_winters',
  'hour',
  'idelta',
  'increase',
  'irate',
  'label_join',
  'label_replace',
  'last_over_time',
  'limitk',
  'limit_ratio',
  'ln',
  'log10',
  'log2',
  'mad_over_time',
  'max_over_time',
  'min_over_time',
  'minute',
  'month',
  'pi',
  'predict_linear',
  'present_over_time',
  'quantile_over_time',
  'rad',
  'rate',
  'resets',
  'round',
  'scalar',
  'sgn',
  'sort',
  'sort_by_label',
  'sort_by_label_desc',
  'sort_desc',
  'sqrt',
  'stddev_over_time',
  'stdvar_over_time',
  'sum_over_time',
  'time',
  'timestamp',
  'vector',
  'year',
];

// LogQL operators and function names
const LOGQL_AGGREGATION_OPERATORS = ['avg', 'bottomk', 'count', 'max', 'min', 'stddev', 'stdvar', 'sum', 'topk'];

const LOGQL_PIPE_PARSERS = ['json', 'regexp', 'logfmt', 'pattern', 'unpack'];

const LOGQL_PIPE_OPERATORS = ['unwrap', 'label_format', 'line_format'];

const LOGQL_RANGE_FUNCTIONS = [
  'avg_over_time',
  'bytes_over_time',
  'bytes_rate',
  'first_over_time',
  'last_over_time',
  'sum_over_time',
  'count_over_time',
  'max_over_time',
  'min_over_time',
  'quantile_over_time',
  'rate',
  'stddev_over_time',
  'stdvar_over_time',
];

const LOGQL_BUILT_IN_FUNCTIONS = ['vector'];

const LOGQL_FUNCTIONS = [...LOGQL_AGGREGATION_OPERATORS, ...LOGQL_RANGE_FUNCTIONS, ...LOGQL_BUILT_IN_FUNCTIONS];

// PromQL Grammar
export const promqlGrammar: Grammar = {
  comment: {
    pattern: /#.*/,
  },
  'context-aggregation': {
    pattern: /((by|without)\s*)\([^)]*\)/, // by ()
    lookbehind: true,
    inside: {
      'label-key': {
        pattern: /[^(),\s][^,)]*[^),\s]*/,
        alias: 'attr-name',
      },
      punctuation: /[()]/,
    },
  },
  'context-labels': {
    pattern: /\{[^}]*(?=}?)/,
    greedy: true,
    inside: {
      comment: {
        pattern: /#.*/,
      },
      'label-key': {
        pattern: /[a-z_]\w*(?=\s*(=|!=|=~|!~))/,
        alias: 'attr-name',
        greedy: true,
      },
      'label-value': {
        pattern: /"(?:\\.|[^\\"])*"/,
        greedy: true,
        alias: 'attr-value',
      },
      punctuation: /[{]/,
    },
  },
  function: new RegExp(`\\b(?:${PROMQL_FUNCTIONS.join('|')})(?=\\s*\\()`, 'i'),
  'context-range': [
    {
      pattern: /\[[^\]]*(?=])/, // [1m]
      inside: {
        'range-duration': {
          pattern: /\b\d+[smhdwy]\b/i,
          alias: 'number',
        },
      },
    },
    {
      pattern: /(offset\s+)\w+/, // offset 1m
      lookbehind: true,
      inside: {
        'range-duration': {
          pattern: /\b\d+[smhdwy]\b/i,
          alias: 'number',
        },
      },
    },
  ],
  idList: {
    pattern: /\d+(\|\d+)+/,
    alias: 'number',
  },
  number: /\b-?\d+((\.\d*)?([eE][+-]?\d+)?)?\b/,
  operator: new RegExp(`/[-+*/=%^~]|&&?|\\|?\\||!=?|<(?:=>?|<|>)?|>[>=]?|\\b(?:${PROMQL_OPERATORS.join('|')})\\b`, 'i'),
  punctuation: /[{};()`,.]/,
};

// LogQL Grammar
export const lokiGrammar: Grammar = {
  comment: {
    pattern: /#.*/,
  },
  'context-aggregation': {
    pattern: /((without|by)\s*)\([^)]*\)/, // by ()
    lookbehind: true,
    inside: {
      'label-key': {
        pattern: /[^(),\s][^,)]*[^),\s]*/,
        alias: 'attr-name',
      },
      punctuation: /[()]/,
    },
  },
  'context-labels': {
    pattern: /\{[^}]*(?=}?)/,
    greedy: true,
    inside: {
      comment: {
        pattern: /#.*/,
      },
      'label-key': {
        pattern: /[a-zA-Z_]\w*(?=\s*(=|!=|=~|!~))/,
        alias: 'attr-name',
        greedy: true,
      },
      'label-value': {
        pattern: /"(?:\\.|[^\\"])*"/,
        greedy: true,
        alias: 'attr-value',
      },
      punctuation: /[{]/,
    },
  },
  'context-pipe': {
    pattern: /\s\|[^=~]\s?\w*/i,
    inside: {
      'pipe-operator': {
        pattern: /\|/i,
        alias: 'operator',
      },
      'pipe-operations': {
        pattern: new RegExp(`${[...LOGQL_PIPE_PARSERS, ...LOGQL_PIPE_OPERATORS].join('|')}`, 'i'),
        alias: 'keyword',
      },
    },
  },
  function: new RegExp(`\\b(?:${LOGQL_FUNCTIONS.join('|')})(?=\\s*\\()`, 'i'),
  'context-range': [
    {
      pattern: /\[[^\]]*(?=\])/, // [1m]
      inside: {
        'range-duration': {
          pattern: /\b\d+[smhdwy]\b/i,
          alias: 'number',
        },
      },
    },
    {
      pattern: /(offset\s+)\w+/, // offset 1m
      lookbehind: true,
      inside: {
        'range-duration': {
          pattern: /\b\d+[smhdwy]\b/i,
          alias: 'number',
        },
      },
    },
  ],
  quote: {
    pattern: /"(?:\\.|[^\\"])*"/,
    alias: 'string',
    greedy: true,
  },
  backticks: {
    pattern: /`(?:\\.|[^\\`])*`/,
    alias: 'string',
    greedy: true,
  },
  number: /\b-?\d+((\.\d*)?([eE][+-]?\d+)?)?\b/,
  operator: /\s?(\|[=~]?|!=?|<(?:=>?|<|>)?|>[>=]?)\s?/i,
  punctuation: /[{}(),.]/,
};

// Register grammars with Prism
if (typeof Prism !== 'undefined') {
  Prism.languages.promql = promqlGrammar;
  Prism.languages.logql = lokiGrammar;
}
