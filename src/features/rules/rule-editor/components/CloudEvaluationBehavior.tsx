import { css } from '@emotion/css';
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { getDataSourceSrv } from '@grafana/runtime';
import { Field, Input, Select, useStyles2 } from '@grafana/ui';

import { RuleFormType, RuleFormValues } from '../types';
import { timeOptions } from '../timeOptions';
import { GroupAndNamespaceFields } from './GroupAndNamespaceFields';
import { RuleEditorSection } from './RuleEditorSection';

export const CloudEvaluationBehavior = () => {
  const styles = useStyles2(getStyles);
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext<RuleFormValues>();

  const type = watch('type');
  const dataSourceName = watch('dataSourceName');

  // Get data source UID from the name
  const dataSourceUid = dataSourceName ? getDataSourceSrv().getInstanceSettings(dataSourceName)?.uid ?? null : null;

  return (
    <RuleEditorSection
      stepNo={2}
      title={t('alerting.cloud-evaluation-behavior.title-set-evaluation-behavior', 'Set evaluation behavior')}
    >
      <Field
        label={t('alerting.cloud-evaluation-behavior.label-pending-period', 'Pending period')}
        description={t(
          'alerting.cloud-evaluation-behavior.description-pending-period',
          'Period during which the threshold condition must be met to trigger an alert. Selecting "None" triggers the alert immediately once the condition is met.'
        )}
      >
        <div className={styles.flexRow}>
          <Field invalid={!!errors.forTime?.message} error={errors.forTime?.message} className={styles.inlineField}>
            <Input
              {...register('forTime', {
                valueAsNumber: true,
                min: {
                  value: 0,
                  message: t(
                    'alerting.cloud-evaluation-behavior.message.must-be-positive',
                    'Must be a positive number.'
                  ),
                },
              })}
              width={8}
              type="number"
              min={0}
            />
          </Field>
          <Controller
            name="forTimeUnit"
            render={({ field: { onChange, ref, ...field } }) => (
              <Select
                {...field}
                options={timeOptions}
                onChange={(value) => onChange(value?.value)}
                width={15}
                className={styles.timeUnit}
              />
            )}
            control={control}
          />
        </div>
      </Field>

      {/* Namespace and Group fields */}
      {type === RuleFormType.cloudAlerting && dataSourceUid && (
        <GroupAndNamespaceFields dataSourceUid={dataSourceUid} />
      )}
      {type === RuleFormType.cloudRecording && dataSourceUid && (
        <GroupAndNamespaceFields dataSourceUid={dataSourceUid} />
      )}
    </RuleEditorSection>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  inlineField: css({
    marginBottom: 0,
  }),
  flexRow: css({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  }),
  timeUnit: css({
    marginLeft: theme.spacing(0.5),
  }),
});
