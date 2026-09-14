import React, { type ReactElement } from 'react';
import { type UseFormRegisterReturn } from 'react-hook-form';

import { t } from '@grafana/i18n';
import { Box, Button, Combobox, Field, IconButton, Input, Stack, TextArea, type ComboboxOption } from '@grafana/ui';

import { matcherOperators, type MatcherOperator } from '@grafana/external-alertmanager/vanilla';

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

interface MatcherOperatorSelectProps {
  value: MatcherOperator;
  onChange: (operator: MatcherOperator) => void;
}

export function MatcherOperatorSelect({ value, onChange }: MatcherOperatorSelectProps) {
  const options = getMatcherOperatorOptions();
  const selectedOption = options.find((option) => option.value === value);

  return (
    <Combobox
      value={selectedOption}
      options={options}
      onChange={(option) => option && onChange(option.value)}
      width={12}
    />
  );
}

interface MatcherFieldRow {
  id: string;
  labelInput: UseFormRegisterReturn;
  operatorControl: ReactElement;
  valueInput: UseFormRegisterReturn;
  labelError?: string;
  valueError?: string;
}

interface MatcherFieldArrayProps {
  rows: MatcherFieldRow[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  labels: {
    addMatcher: string;
    removeMatcher: string;
  };
  minRows?: number;
  valueControl?: 'input' | 'textarea';
}

/**
 * Presentational matcher rows. React Hook Form paths are bound by each feature,
 * where their concrete form type can be checked without path casts.
 */
export function MatcherFieldArray({
  rows,
  onAdd,
  onRemove,
  labels,
  minRows = 0,
  valueControl = 'input',
}: MatcherFieldArrayProps) {
  const sharedLabels = {
    label: t('matcher-field-array.label', 'Label'),
    labelPlaceholder: t('matcher-field-array.label-placeholder', 'label'),
    operator: t('matcher-field-array.operator', 'Operator'),
    value: t('matcher-field-array.value', 'Value'),
    valuePlaceholder: t('matcher-field-array.value-placeholder', 'value'),
  };

  return (
    <>
      {rows.length > 0 && (
        <Box backgroundColor="secondary" paddingX={2} paddingTop={1.5} marginBottom={1} borderRadius="default">
          {rows.map((row, index) => (
            <Stack direction="row" key={row.id} alignItems="center" gap={1}>
              <Field label={sharedLabels.label} invalid={Boolean(row.labelError)} error={row.labelError}>
                <Input {...row.labelInput} placeholder={sharedLabels.labelPlaceholder} />
              </Field>

              <Field label={sharedLabels.operator}>{row.operatorControl}</Field>

              <Field label={sharedLabels.value} invalid={Boolean(row.valueError)} error={row.valueError}>
                {valueControl === 'textarea' ? (
                  <TextArea {...row.valueInput} placeholder={sharedLabels.valuePlaceholder} rows={1} />
                ) : (
                  <Input {...row.valueInput} placeholder={sharedLabels.valuePlaceholder} />
                )}
              </Field>

              <IconButton
                tooltip={labels.removeMatcher}
                name="trash-alt"
                onClick={() => onRemove(index)}
                aria-label={labels.removeMatcher}
                disabled={rows.length <= minRows}
              />
            </Stack>
          ))}
        </Box>
      )}

      <Box marginBottom={2}>
        <Button icon="plus" onClick={onAdd} variant="secondary" type="button" size="sm">
          {labels.addMatcher}
        </Button>
      </Box>
    </>
  );
}
