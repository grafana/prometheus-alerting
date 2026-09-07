import { Scalar, parseDocument, isMap, stringify as stringifyYaml } from 'yaml';

import { initialAlertmanagerConfiguration } from './alertmanagerConfiguration';

const ALERTMANAGER_CONFIG_KEY = 'alertmanager_config';

/**
 * Mimir stores the user configuration as a YAML document that looks like this:
 *
 * ```yaml
 * template_files:
 *   default.tmpl: |
 *     {{ define "x" }}...{{ end }}
 * alertmanager_config: |
 *   # a comment
 *   route:
 *     receiver: default
 * ```
 *
 * The two functions below move that inner `alertmanager_config` string in and out of the document
 * without touching anything else. They exist so the configuration editor can show people exactly
 * what Mimir has stored – comments, key order, quoting and all – and save exactly what they typed.
 * Going through the zod schemas instead would reformat the config on every save, and would refuse
 * to open a config the schemas don't recognise, which is the config somebody most needs to edit.
 */

/** Returns the stored `alertmanager_config` YAML, exactly as Mimir has it. */
export function readAlertmanagerConfigYaml(document: string): string {
  const parsed = parseDocument(document);
  const contents = parsed.contents;

  const node: unknown = isMap(contents) ? contents.get(ALERTMANAGER_CONFIG_KEY, true) : undefined;
  const value: unknown = node instanceof Scalar ? node.value : node;

  // Mimir hands back an empty (or missing) config for a tenant it has never seen. Give people
  // something to edit instead of a blank editor, the same way the parsed read path does.
  if (typeof value !== 'string' || value.trim() === '') {
    return stringifyYaml(initialAlertmanagerConfiguration.alertmanager_config);
  }

  return value;
}

/**
 * Returns the document with its `alertmanager_config` replaced. Everything else in the document –
 * `template_files`, and any key Mimir might add that we don't know about – is left as it was.
 */
export function writeAlertmanagerConfigYaml(document: string, alertmanagerConfig: string): string {
  const parsed = parseDocument(document);

  // A tenant with no configuration yet has nothing to merge into, so start a document from scratch.
  if (!isMap(parsed.contents)) {
    return stringifyYaml({
      template_files: {},
      [ALERTMANAGER_CONFIG_KEY]: alertmanagerConfig,
    });
  }

  parsed.set(ALERTMANAGER_CONFIG_KEY, alertmanagerConfig);

  return String(parsed);
}
