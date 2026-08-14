import { describe, expect, it } from 'vitest';

import type { RulerRuleGroupDTO } from '../vanilla';

import type { RulerBackend } from './types';

/**
 * The behavioural contract every {@link RulerBackend} must satisfy, regardless of what its
 * backend's native API looks like.
 *
 * Flavors can differ enormously below this line -- a future backend might rewrite a whole
 * namespace file as one document instead of writing per rule group, or apply changes
 * asynchronously. The app above the line assumes none of that. Run this suite against every
 * flavor so a new backend cannot quietly disagree with the one the UI was built against.
 *
 * `createBackend` receives a fresh, empty store on each call.
 */
export function describeRulerBackend(name: string, createBackend: () => RulerBackend | Promise<RulerBackend>) {
  const group = (groupName: string, ...ruleNames: string[]): RulerRuleGroupDTO => ({
    name: groupName,
    interval: '1m',
    rules: ruleNames.map((alert) => ({ alert, expr: 'up == 0' })),
  });

  describe(`RulerBackend contract: ${name}`, () => {
    it('reads back a group it has written', async () => {
      const backend = await createBackend();
      await backend.upsertRuleGroup('ns', group('group-a', 'AlertOne'));

      expect(await backend.getRuleGroup('ns', 'group-a')).toMatchObject({
        name: 'group-a',
        rules: [{ alert: 'AlertOne', expr: 'up == 0' }],
      });
    });

    it('replaces a group in place on upsert without disturbing its siblings', async () => {
      const backend = await createBackend();
      await backend.upsertRuleGroup('ns', group('group-a', 'AlertOne'));
      await backend.upsertRuleGroup('ns', group('group-b', 'AlertTwo'));

      await backend.upsertRuleGroup('ns', group('group-a', 'AlertOne', 'AlertThree'));

      expect(await backend.getRuleGroup('ns', 'group-a')).toMatchObject({
        rules: [{ alert: 'AlertOne' }, { alert: 'AlertThree' }],
      });
      expect(await backend.getRuleGroup('ns', 'group-b')).toMatchObject({ rules: [{ alert: 'AlertTwo' }] });
    });

    it('keeps namespaces separate', async () => {
      const backend = await createBackend();
      await backend.upsertRuleGroup('ns-one', group('shared', 'AlertOne'));
      await backend.upsertRuleGroup('ns-two', group('shared', 'AlertTwo'));

      expect(await backend.getRuleGroup('ns-one', 'shared')).toMatchObject({ rules: [{ alert: 'AlertOne' }] });
      expect(await backend.getRuleGroup('ns-two', 'shared')).toMatchObject({ rules: [{ alert: 'AlertTwo' }] });
    });

    it('rejects with a not-found error for a group that does not exist', async () => {
      const backend = await createBackend();

      await expect(backend.getRuleGroup('ns', 'absent')).rejects.toMatchObject({ status: 404 });
    });

    it('deletes a group and leaves its siblings in place', async () => {
      const backend = await createBackend();
      await backend.upsertRuleGroup('ns', group('group-a', 'AlertOne'));
      await backend.upsertRuleGroup('ns', group('group-b', 'AlertTwo'));

      await backend.deleteRuleGroup('ns', 'group-a');

      await expect(backend.getRuleGroup('ns', 'group-a')).rejects.toMatchObject({ status: 404 });
      expect(await backend.getRuleGroup('ns', 'group-b')).toMatchObject({ rules: [{ alert: 'AlertTwo' }] });
    });

    it('deletes the last group in a namespace', async () => {
      const backend = await createBackend();
      await backend.upsertRuleGroup('ns', group('only', 'AlertOne'));

      await backend.deleteRuleGroup('ns', 'only');

      expect(await backend.getAllRules()).not.toHaveProperty(['ns', 0]);
    });

    it('returns every namespace and group from getAllRules', async () => {
      const backend = await createBackend();
      await backend.upsertRuleGroup('ns-one', group('group-a', 'AlertOne'));
      await backend.upsertRuleGroup('ns-one', group('group-b', 'AlertTwo'));
      await backend.upsertRuleGroup('ns-two', group('group-c', 'AlertThree'));

      const all = await backend.getAllRules();

      expect(Object.keys(all).sort()).toEqual(['ns-one', 'ns-two']);
      expect(all['ns-one'].map((g) => g.name).sort()).toEqual(['group-a', 'group-b']);
      expect(all['ns-two'].map((g) => g.name)).toEqual(['group-c']);
    });

    it('returns an empty config when nothing is configured', async () => {
      const backend = await createBackend();

      expect(await backend.getAllRules()).toEqual({});
    });
  });
}
