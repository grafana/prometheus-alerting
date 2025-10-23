import { css } from '@emotion/css';
import React from 'react';
import { useFormContext } from 'react-hook-form';

import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Field, TextArea, useStyles2 } from '@grafana/ui';

import { RuleFormValues } from '../types';
import { RuleEditorSection } from './RuleEditorSection';

/**
 * Recording rule editor
 * This is a simplified version that uses a textarea for PromQL/LogQL expressions
 * TODO: Integrate with data source's QueryEditor component for rich editing experience with visualization
 */
export const RecordingRuleEditor = () => {
  const styles = useStyles2(getStyles);
  const {
    register,
    formState: { errors },
  } = useFormContext<RuleFormValues>();

  return (
    <RuleEditorSection
      stepNo={2}
      title={t('alerting.recording-rule-editor.title-define-query', 'Define recording rule query')}
      description={t(
        'alerting.recording-rule-editor.description',
        'Write a PromQL or LogQL expression that will be evaluated and stored as a new time series.'
      )}
      fullWidth
    >
      <Field
        label={t('alerting.recording-rule-editor.label-expression', 'Expression')}
        description={t(
          'alerting.recording-rule-editor.description-expression',
          'The query expression in PromQL or LogQL format'
        )}
        error={errors.expression?.message}
        invalid={!!errors.expression}
        required
      >
        <TextArea
          {...register('expression', {
            required: t('alerting.recording-rule-editor.message.expression-required', 'Expression is required.'),
          })}
          rows={10}
          className={styles.textarea}
          placeholder={t(
            'alerting.recording-rule-editor.placeholder-expression',
            'Example: sum(rate(http_requests_total[5m])) by (job)'
          )}
        />
      </Field>
    </RuleEditorSection>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  textarea: css({
    fontFamily: theme.typography.fontFamilyMonospace,
  }),
});
