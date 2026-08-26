import React from 'react';
import { useController, useFormContext, type ControllerRenderProps } from 'react-hook-form';
import { Checkbox, Field, Input, TextArea } from '@grafana/ui';

import type { ReceiverFormValues } from '../../utils/receiverFormSchema';

/** Path to a field inside one integration's settings, e.g. `integrations.0.settings.webhook_url`. */
export type IntegrationFieldPath = `integrations.${number}.settings.${string}`;

type FieldApi = ControllerRenderProps<ReceiverFormValues, IntegrationFieldPath>;

/**
 * The validation message for a field, if it has one.
 *
 * Every component here reads it the same way, so an input that can't show its error is not
 * something you can accidentally write - which is the whole point of going through these.
 */
function useFieldError(name: IntegrationFieldPath) {
  const { formState, getFieldState } = useFormContext<ReceiverFormValues>();
  return getFieldState(name, formState).error?.message;
}

/**
 * A labelled field for a control that isn't a plain input - a checkbox, a combobox, a list editor.
 *
 * Those need `useController` because there is no DOM input to hand to `register`. Plain text
 * inputs don't: see `TextField`.
 */
export function ControlledField({
  name,
  label,
  description,
  required = false,
  children,
}: {
  name: IntegrationFieldPath;
  label: string;
  description?: string;
  required?: boolean;
  children: (field: FieldApi) => React.ReactElement;
}) {
  const { field } = useController<ReceiverFormValues, IntegrationFieldPath>({ name });
  const error = useFieldError(name);
  return (
    <Field noMargin label={label} description={description} required={required} invalid={Boolean(error)} error={error}>
      {children(field)}
    </Field>
  );
}

export function TextField({
  name,
  label,
  type = 'text',
  description,
  placeholder,
  inputMode,
  required = false,
}: {
  name: IntegrationFieldPath;
  label: string;
  type?: string;
  description?: string;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  required?: boolean;
}) {
  const { register } = useFormContext<ReceiverFormValues>();
  const error = useFieldError(name);
  return (
    <Field noMargin label={label} description={description} required={required} invalid={Boolean(error)} error={error}>
      <Input {...register(name)} type={type} placeholder={placeholder} inputMode={inputMode} aria-label={label} />
    </Field>
  );
}

export function TextAreaField({ name, label, rows = 3 }: { name: IntegrationFieldPath; label: string; rows?: number }) {
  const { register } = useFormContext<ReceiverFormValues>();
  const error = useFieldError(name);
  return (
    <Field noMargin label={label} invalid={Boolean(error)} error={error}>
      <TextArea {...register(name)} rows={rows} aria-label={label} />
    </Field>
  );
}

export function CheckboxField({
  name,
  label,
  defaultChecked = false,
}: {
  name: IntegrationFieldPath;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <ControlledField name={name} label={label}>
      {({ value, onChange, onBlur }) => (
        <Checkbox
          checked={(typeof value === 'boolean' ? value : undefined) ?? defaultChecked}
          onChange={(event) => onChange(event.currentTarget.checked)}
          onBlur={onBlur}
          aria-label={label}
        />
      )}
    </ControlledField>
  );
}
