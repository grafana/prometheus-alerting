import { css } from '@emotion/css';
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { DataSourceInstanceSettings, GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Field, Input, TextArea, useStyles2, Stack } from '@grafana/ui';

import { RuleFormValues } from '../types';
import { RuleEditorSection } from './RuleEditorSection';
import { CloudRulesSourcePicker } from './CloudRulesSourcePicker';
import { isCloudRecordingRuleByType } from '../ruleTypeHelpers';

export interface RuleDefinitionSectionProps {
  onChangeCloudDatasource: (datasourceUid: string) => void;
}

export const RuleDefinitionSection = ({ onChangeCloudDatasource }: RuleDefinitionSectionProps) => {
  const styles = useStyles2(getStyles);
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<RuleFormValues>();

  const type = watch('type');

  const isRecording = isCloudRecordingRuleByType(type);

  return (
    <RuleEditorSection
      stepNo={1}
      title={
        isRecording
          ? t('alerting.rule-definition.title-recording', 'Define recording rule')
          : t('alerting.rule-definition.title-alerting', 'Define alert rule')
      }
      description={
        isRecording
          ? t(
              'alerting.rule-definition.description-recording',
              'Name your rule, select a data source, and write the query expression.'
            )
          : t(
              'alerting.rule-definition.description-alerting',
              'Name your rule, select a data source, and define the query and alert condition.'
            )
      }
      fullWidth
    >
      <Stack direction="column" gap={2}>
        {/* Rule Name */}
        <Field
          label={t('alerting.rule-name-input.label-rule-name', 'Rule name')}
          error={errors.name?.message}
          invalid={!!errors.name}
          required
        >
          <Input
            id="rule-name"
            {...register('name', {
              required: t('alerting.rule-name-input.message.rule-name-is-required', 'Rule name is required.'),
            })}
            autoFocus
            placeholder={t(
              'alerting.rule-name-input.placeholder-give-your-alert-a-name',
              'Give your alert rule a name'
            )}
          />
        </Field>

        {/* Data Source Selector */}
        <Field
          label={t('alerting.cloud-data-source-selector.label', 'Data source')}
          error={errors.dataSourceName?.message}
          invalid={!!errors.dataSourceName?.message}
          required
        >
          <Controller
            render={({ field: { onChange, ref, ...field } }) => (
              <CloudRulesSourcePicker
                {...field}
                onChange={(ds: DataSourceInstanceSettings) => {
                  // Reset expression when changing data sources
                  setValue('expression', '');
                  onChange(ds?.name ?? null);
                  onChangeCloudDatasource(ds?.uid ?? '');
                }}
              />
            )}
            name="dataSourceName"
            control={control}
            rules={{
              required: {
                value: true,
                message: t(
                  'alerting.cloud-data-source-selector.message.please-select-a-data-source',
                  'Please select a data source'
                ),
              },
            }}
          />
        </Field>

        {/* Query Expression */}
        <Field
          label={t('alerting.expression-editor.label-expression', 'Expression')}
          error={errors.expression?.message}
          invalid={!!errors.expression}
          required
        >
          <TextArea
            {...register('expression', {
              required: t('alerting.expression-editor.message.expression-required', 'Expression is required.'),
            })}
            rows={10}
            className={styles.textarea}
          />
        </Field>
      </Stack>
    </RuleEditorSection>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  textarea: css({
    fontFamily: theme.typography.fontFamilyMonospace,
    fontSize: theme.typography.fontSize,
  }),
});
