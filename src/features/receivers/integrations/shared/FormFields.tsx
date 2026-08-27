import React from 'react';
import {
  useController,
  useFormContext,
  type ControllerRenderProps,
  type FieldPath,
  type FieldPathByValue,
  type FieldValues,
} from 'react-hook-form';
import { Checkbox, Field, Input, TextArea } from '@grafana/ui';

/**
 * Builds the form fields for one integration, tied to that integration's own settings type.
 *
 * Call it once at module scope and destructure what you need. Field names are then checked against
 * the schema - a typo, or a checkbox pointed at a string, is a compile error rather than an input
 * that quietly edits nothing.
 *
 * Every field here shows its own validation message, so there is nowhere left to forget it.
 */
export function createFormFields<Values extends FieldValues>() {
  type TextPath = FieldPathByValue<Values, string | undefined>;
  type BooleanPath = FieldPathByValue<Values, boolean | undefined>;

  /** The validation message for a field, if it has one. */
  function useFieldError(name: FieldPath<Values>) {
    const { formState, getFieldState } = useFormContext<Values>();
    return getFieldState(name, formState).error?.message;
  }

  function TextField({
    name,
    label,
    type = 'text',
    description,
    placeholder,
    inputMode,
    required = false,
  }: {
    name: TextPath;
    label: string;
    type?: string;
    description?: string;
    placeholder?: string;
    inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
    required?: boolean;
  }) {
    const { register } = useFormContext<Values>();
    const error = useFieldError(name);
    return (
      <Field
        noMargin
        label={label}
        description={description}
        required={required}
        invalid={Boolean(error)}
        error={error}
      >
        <Input {...register(name)} type={type} placeholder={placeholder} inputMode={inputMode} aria-label={label} />
      </Field>
    );
  }

  function TextAreaField({ name, label, rows = 3 }: { name: TextPath; label: string; rows?: number }) {
    const { register } = useFormContext<Values>();
    const error = useFieldError(name);
    return (
      <Field noMargin label={label} invalid={Boolean(error)} error={error}>
        <TextArea {...register(name)} rows={rows} aria-label={label} />
      </Field>
    );
  }

  function CheckboxField({
    name,
    label,
    defaultChecked = false,
  }: {
    name: BooleanPath;
    label: string;
    defaultChecked?: boolean;
  }) {
    const { control } = useFormContext<Values>();
    const { field } = useController<Values, BooleanPath>({ name, control });
    const error = useFieldError(name);
    return (
      <Field noMargin label={label} invalid={Boolean(error)} error={error}>
        <Checkbox
          checked={(typeof field.value === 'boolean' ? field.value : undefined) ?? defaultChecked}
          onChange={(event) => field.onChange(event.currentTarget.checked)}
          onBlur={field.onBlur}
          aria-label={label}
        />
      </Field>
    );
  }

  /**
   * A labelled field for a control that isn't a plain input - a combobox, a list editor.
   *
   * Those need `useController` because there is no DOM input to hand to `register`. The value
   * handed to the render prop is typed from the field name.
   */
  function ControlledField<Name extends FieldPath<Values>>({
    name,
    label,
    description,
    required = false,
    children,
  }: {
    name: Name;
    label: string;
    description?: string;
    required?: boolean;
    children: (field: ControllerRenderProps<Values, Name>) => React.ReactElement;
  }) {
    const { control } = useFormContext<Values>();
    const { field } = useController<Values, Name>({ name, control });
    const error = useFieldError(name);
    return (
      <Field
        noMargin
        label={label}
        description={description}
        required={required}
        invalid={Boolean(error)}
        error={error}
      >
        {children(field)}
      </Field>
    );
  }

  return { TextField, TextAreaField, CheckboxField, ControlledField };
}
