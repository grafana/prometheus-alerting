import { css } from '@emotion/css';
import React from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Combobox, Field, Input, useStyles2 } from '@grafana/ui';

import { RuleFormType, RuleFormValues } from '../types';
import { timeOptions } from '../timeOptions';
import { GroupAndNamespaceFields } from './GroupAndNamespaceFields';
import { RuleEditorSection } from './RuleEditorSection';

export const CloudEvaluationBehavior = () => {
  const styles = useStyles2(getStyles);
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<RuleFormValues>();

  const type = useWatch({ control, name: 'type' });
  const dataSourceUid = useWatch({ control, name: 'dataSourceUid' });

  return (
    <RuleEditorSection
      stepNo={2}
      title={t('alerting.cloud-evaluation-behavior.title-set-evaluation-behavior', 'Set evaluation behavior')}
    >
      {type === RuleFormType.cloudAlerting && (
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
              render={({ field: { onChange, value, onBlur } }) => (
                <div className={styles.timeUnit}>
                  <Combobox
                    value={value}
                    options={timeOptions}
                    onChange={(option) => onChange(option?.value)}
                    onBlur={onBlur}
                    width={15}
                  />
                </div>
              )}
              control={control}
            />
          </div>
        </Field>
      )}

      {type === RuleFormType.cloudAlerting && (
        <Field
          label={t('alerting.cloud-evaluation-behavior.label-keep-firing-for', 'Keep firing for')}
          description={t(
            'alerting.cloud-evaluation-behavior.description-keep-firing-for',
            'How long the alert keeps firing after the condition stops being met. Leave empty to resolve as soon as the condition clears. Accepts compound durations, for example 1h30m.'
          )}
          invalid={!!errors.keepFiringFor?.message}
          error={errors.keepFiringFor?.message}
        >
          <Input
            id="keep-firing-for"
            {...register('keepFiringFor')}
            width={30}
            placeholder={t('alerting.cloud-evaluation-behavior.placeholder-keep-firing-for', '0s')}
          />
        </Field>
      )}

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
