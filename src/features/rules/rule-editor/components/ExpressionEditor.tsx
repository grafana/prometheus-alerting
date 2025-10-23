import { css } from '@emotion/css';
import React from 'react';
import { useFormContext } from 'react-hook-form';

import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Field, TextArea, useStyles2 } from '@grafana/ui';

import { RuleFormValues } from '../types';
import { RuleEditorSection } from './RuleEditorSection';

/**
 * Expression editor for alerting rules
 * This is a simplified version that uses a textarea for PromQL/LogQL expressions
 * TODO: Integrate with data source's QueryEditor component for rich editing experience
 */
export const ExpressionEditor = () => {
  const styles = useStyles2(getStyles);
  const {
    register,
    formState: { errors },
  } = useFormContext<RuleFormValues>();

  return (
    <RuleEditorSection
      stepNo={2}
      title={t('alerting.expression-editor.title-define-query', 'Define query and alert condition')}
      description={t(
        'alerting.expression-editor.description',
        'Write a PromQL or LogQL expression that returns time series data.'
      )}
      fullWidth
    >
      <Field
        label={t('alerting.expression-editor.label-expression', 'Expression')}
        description={t(
          'alerting.expression-editor.description-expression',
          'The query expression in PromQL or LogQL format'
        )}
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
          placeholder={t(
            'alerting.expression-editor.placeholder-expression',
            'Example: rate(http_requests_total[5m]) > 0.5'
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
