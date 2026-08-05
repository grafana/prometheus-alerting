import { useEffect, useState } from 'react';

import { getAppPluginVersion } from '@grafana/runtime';

import pluginJson from '../plugin.json';

/**
 * Version of this plugin as reported by Grafana. `null` until it resolves — the version in
 * `plugin.json` is only substituted at build time, so it can't be read from the source.
 */
export function useAppPluginVersion(): string | null {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getAppPluginVersion(pluginJson.id)
      .then((resolved) => {
        if (active) {
          setVersion(resolved);
        }
      })
      .catch(() => {
        // the version is a nice-to-have in bug reports, not worth surfacing an error for
      });

    return () => {
      active = false;
    };
  }, []);

  return version;
}
