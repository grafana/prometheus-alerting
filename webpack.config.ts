import type { Configuration, RuleSetRule } from 'webpack';
import { merge } from 'webpack-merge';

import grafanaConfig, { type Env } from './.config/webpack/webpack.config';

const applyReactDevRuntimeException = (config: Configuration) => {
  const rules = config.module?.rules;
  if (!rules) {
    return;
  }

  for (const rule of rules as RuleSetRule[]) {
    if (typeof rule !== 'object' || rule == null) {
      continue;
    }

    if (rule.use && typeof rule.use === 'object' && 'loader' in rule.use && rule.use.loader === 'swc-loader') {
      const options = rule.use.options as { jsc?: { transform?: { react?: { development?: boolean } } } } | undefined;
      if (options?.jsc?.transform?.react) {
        // Force non-dev JSX output to keep compatibility with React 18 runtimes.
        options.jsc.transform.react.development = false;
      }
    }
  }
};

const config = async (env: Env): Promise<Configuration> => {
  const baseConfig = await grafanaConfig(env);

  if (env.development) {
    applyReactDevRuntimeException(baseConfig);
  }

  return merge(baseConfig, {
    // Externalize react/jsx-runtime for React 19 compatibility
    // Required to prevent __SECRET_INTERNALS crashes with @tanstack/react-query
    // See: https://grafana.com/blog/2025/01/22/react-19-is-coming-to-grafana-what-plugin-developers-need-to-know/
    // Requires Grafana >= 12.3.0
    externals: ['react/jsx-runtime', 'react/jsx-dev-runtime'],
  });
};

export default config;
