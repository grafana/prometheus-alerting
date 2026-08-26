import type { FieldPath, FieldPathByValue } from 'react-hook-form';
import { expectTypeOf, it } from 'vitest';

import type { IntegrationFormValues } from './integrationFormTypes';

type LooseSettings = {
  declared?: string;
  nested?: { enabled?: boolean; [key: string]: unknown };
  headers?: Record<string, string>;
  items?: Array<{ name?: string; [key: string]: unknown }>;
  [key: string]: unknown;
};

type FormValues = IntegrationFormValues<LooseSettings>;
type FormPath = FieldPath<FormValues>;
type BooleanPath = FieldPathByValue<FormValues, boolean | undefined>;

it('exposes declared receiver fields without loose-object catch-all paths', () => {
  expectTypeOf<`integrations.${number}.settings.declared`>().toExtend<FormPath>();
  expectTypeOf<`integrations.${number}.settings.nested.enabled`>().toExtend<FormPath>();
  expectTypeOf<`integrations.${number}.settings.items.${number}.name`>().toExtend<FormPath>();
  expectTypeOf<`integrations.${number}.settings.headers.${string}`>().toExtend<FormPath>();
  expectTypeOf<`integrations.${number}.settings.not_declared`>().not.toExtend<FormPath>();
  expectTypeOf<`integrations.${number}.settings.nested.enabled`>().toExtend<BooleanPath>();
  expectTypeOf<`integrations.${number}.settings.declared`>().not.toExtend<BooleanPath>();
});
