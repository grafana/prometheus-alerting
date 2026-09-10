import { css } from '@emotion/css';
import React from 'react';
import {
  Controller,
  FieldArray,
  FieldArrayPath,
  FieldPath,
  FieldValues,
  UseFormReturn,
  useFieldArray,
  useFormState,
} from 'react-hook-form';

import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Button, Combobox, Field, IconButton, Input, Stack, type ComboboxOption, useStyles2 } from '@grafana/ui';

import { matcherOperators, type MatcherOperator } from '../types/matcherFields';

function getMatcherOperatorOptions(): Array<ComboboxOption<MatcherOperator>> {
  const descriptions: Record<MatcherOperator, string> = {
    [matcherOperators.equals]: t('matcher-field-array.operator-description.equals', 'Equals'),
    [matcherOperators.notEquals]: t('matcher-field-array.operator-description.not-equals', 'Does not equal'),
    [matcherOperators.matchesRegex]: t(
      'matcher-field-array.operator-description.matches-regex',
      'Matches regular expression'
    ),
    [matcherOperators.doesNotMatchRegex]: t(
      'matcher-field-array.operator-description.does-not-match-regex',
      'Does not match regular expression'
    ),
  };

  return Object.values(matcherOperators).map((operator) => ({
    label: operator,
    value: operator,
    description: descriptions[operator],
  }));
}

interface MatcherFieldArrayProps<TFieldValues extends FieldValues, TName extends FieldArrayPath<TFieldValues>> {
  control: UseFormReturn<TFieldValues>['control'];
  register: UseFormReturn<TFieldValues>['register'];
  getFieldState: UseFormReturn<TFieldValues>['getFieldState'];
  name: TName;
  newMatcher: FieldArray<TFieldValues, TName>;
  labels: {
    addMatcher: string;
    removeMatcher: string;
  };
  minRows?: number;
}

export function MatcherFieldArray<TFieldValues extends FieldValues, TName extends FieldArrayPath<TFieldValues>>({
  control,
  register,
  getFieldState,
  name,
  newMatcher,
  labels,
  minRows = 0,
}: MatcherFieldArrayProps<TFieldValues, TName>) {
  const styles = useStyles2(getStyles);
  const formState = useFormState({ control, name: name as FieldPath<TFieldValues> });
  const matcherOperatorOptions = getMatcherOperatorOptions();
  const sharedLabels = {
    label: t('matcher-field-array.label', 'Label'),
    labelPlaceholder: t('matcher-field-array.label-placeholder', 'label'),
    operator: t('matcher-field-array.operator', 'Operator'),
    value: t('matcher-field-array.value', 'Value'),
    valuePlaceholder: t('matcher-field-array.value-placeholder', 'value'),
    required: t('matcher-field-array.required', 'Required'),
  };
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <>
      {fields.length > 0 && (
        <div className={styles.matchersContainer}>
          {fields.map((field, index) => {
            const labelName = `${name}.${index}.name` as FieldPath<TFieldValues>;
            const operatorName = `${name}.${index}.operator` as FieldPath<TFieldValues>;
            const valueName = `${name}.${index}.value` as FieldPath<TFieldValues>;
            const labelState = getFieldState(labelName, formState);
            const valueState = getFieldState(valueName, formState);

            return (
              <Stack direction="row" key={field.id} alignItems="center" gap={1}>
                <Field label={sharedLabels.label} invalid={labelState.invalid} error={labelState.error?.message}>
                  <Input
                    {...register(labelName, { required: sharedLabels.required })}
                    placeholder={sharedLabels.labelPlaceholder}
                  />
                </Field>

                <Field label={sharedLabels.operator}>
                  <Controller
                    control={control}
                    name={operatorName}
                    render={({ field: { onChange, value } }) => {
                      const selectedOption = matcherOperatorOptions.find((option) => option.value === value);
                      return (
                        <Combobox
                          value={selectedOption}
                          options={matcherOperatorOptions}
                          onChange={(option) => onChange(option?.value)}
                          width={12}
                        />
                      );
                    }}
                  />
                </Field>

                <Field label={sharedLabels.value} invalid={valueState.invalid} error={valueState.error?.message}>
                  <Input {...register(valueName)} placeholder={sharedLabels.valuePlaceholder} />
                </Field>

                <IconButton
                  tooltip={labels.removeMatcher}
                  name="trash-alt"
                  onClick={() => remove(index)}
                  aria-label={labels.removeMatcher}
                  disabled={fields.length <= minRows}
                />
              </Stack>
            );
          })}
        </div>
      )}

      <Button
        className={styles.addMatcherButton}
        icon="plus"
        onClick={() => append(newMatcher)}
        variant="secondary"
        type="button"
        size="sm"
      >
        {labels.addMatcher}
      </Button>
    </>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  matchersContainer: css({
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing(1.5, 2),
    paddingBottom: 0,
    marginBottom: theme.spacing(1),
    borderRadius: theme.shape.radius.default,
  }),
  addMatcherButton: css({
    marginBottom: theme.spacing(2),
  }),
});
