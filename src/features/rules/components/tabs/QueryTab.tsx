import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { getDataSourceSrv } from '@grafana/runtime';
import { Highlight, Prism } from 'prism-react-renderer';

// Import and register grammars
import '../../utils/prismGrammars';

interface Props {
  query: string;
  dataSourceUid: string;
}

export function QueryTab({ query, dataSourceUid }: Props) {
  const styles = useStyles2(getStyles);

  // Get datasource type to determine language
  const dsSettings = getDataSourceSrv().getInstanceSettings(dataSourceUid);
  const dataSourceType = dsSettings?.type ?? 'prometheus';
  const language = dataSourceType === 'loki' ? 'logql' : 'promql';

  return (
    // <div className={styles.container}>
    <Highlight prism={Prism} code={query} language={language}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre className={` ${className}`} style={style}>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
    // </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.default,
    backgroundColor: theme.colors.background.primary,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  }),
  codeBlock: css({
    margin: 0,
    padding: theme.spacing(1.5),
    fontSize: theme.typography.code.fontSize,
    fontFamily: theme.typography.fontFamilyMonospace,
    lineHeight: 1.5,
    overflow: 'auto',
    whiteSpace: 'pre',
    flex: 1,

    // Grafana's Prism syntax highlighting colors (from slate.ts)
    // Comments
    '& .token.comment, & .token.block-comment, & .token.prolog, & .token.doctype, & .token.cdata': {
      color: theme.colors.text.secondary,
    },

    // Variables and entities
    '& .token.variable, & .token.entity': {
      color: theme.colors.text.primary,
    },

    // Properties, tags, constants (red)
    '& .token.property, & .token.tag, & .token.constant, & .token.symbol, & .token.deleted, & .token.attr-name, & .token.label-key':
      {
        color: theme.colors.error.text,
      },

    // Strings and selectors (green)
    '& .token.attr-value, & .token.selector, & .token.string, & .token.char, & .token.builtin, & .token.inserted, & .token.label-value, & .token.quote, & .token.backticks':
      {
        color: theme.colors.success.text,
      },

    // Numbers, booleans, operators (pink/magenta)
    '& .token.boolean, & .token.number, & .token.operator, & .token.url, & .token.range-duration': {
      color: '#fe85fc',
    },

    // Functions, keywords (blue/primary)
    '& .token.function, & .token.function-name, & .token.atrule, & .token.keyword, & .token.class-name, & .token.pipe-operations':
      {
        color: theme.colors.primary.text,
      },

    // Punctuation (orange)
    '& .token.punctuation, & .token.regex, & .token.important, & .token.pipe-operator': {
      color: theme.visualization.getColorByName('orange'),
    },

    '& .token.important': {
      fontWeight: 'normal',
    },

    '& .token.bold': {
      fontWeight: 'bold',
    },

    '& .token.italic': {
      fontStyle: 'italic',
    },

    '& .namespace': {
      opacity: 0.7,
    },
  }),
});
