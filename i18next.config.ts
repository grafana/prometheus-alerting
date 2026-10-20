import { defineConfig } from 'i18next-cli';

import pluginJson from './src/plugin.json';

export default defineConfig({
  locales: pluginJson.languages,
  extract: {
    input: ['src/**/*.{ts,tsx}'],
    output: 'src/locales/{{language}}/{{namespace}}.json',
    defaultNS: pluginJson.id,
    functions: ['t', '*.t'],
    transComponents: ['Trans'],
    sort: true,
    indentation: 2,
    // Same as the old i18next-parser setup: when a default value changes in the code, update the
    // en-US file to match instead of keeping the old text.
    primaryLanguage: 'en-US',
  },
});
