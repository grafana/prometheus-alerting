/**
 * Type-level checks for the form paths `IntegrationFormValues` produces.
 *
 * These are checked by `tsc` (`pnpm typecheck`), not by the test runner: rstest has no
 * `expectTypeOf`, so the same assertions are written with two small helper types. Get one wrong
 * and the project stops typechecking. This isn't a `.test.ts` file because there is nothing to
 * run — a test runner would just report a file with no tests in it.
 */
import type { FieldPath, FieldPathByValue } from 'react-hook-form';

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

/** Fails to compile unless `Value` is `true`. */
type Assert<Value extends true> = Value;
type Extends<A, B> = [A] extends [B] ? true : false;
type DoesNotExtend<A, B> = Extends<A, B> extends false ? true : false;

// Declared receiver fields are reachable as form paths.
export type DeclaredIsAPath = Assert<Extends<`integrations.${number}.settings.declared`, FormPath>>;
export type NestedIsAPath = Assert<Extends<`integrations.${number}.settings.nested.enabled`, FormPath>>;
export type ItemNameIsAPath = Assert<Extends<`integrations.${number}.settings.items.${number}.name`, FormPath>>;
export type HeaderIsAPath = Assert<Extends<`integrations.${number}.settings.headers.${string}`, FormPath>>;

// The loose-object index signature must not turn every string into a valid path.
export type UndeclaredIsNotAPath = Assert<DoesNotExtend<`integrations.${number}.settings.not_declared`, FormPath>>;

// Paths are typed by value, so only the boolean field counts as a boolean path.
export type NestedIsABooleanPath = Assert<Extends<`integrations.${number}.settings.nested.enabled`, BooleanPath>>;
export type DeclaredIsNotABooleanPath = Assert<DoesNotExtend<`integrations.${number}.settings.declared`, BooleanPath>>;
