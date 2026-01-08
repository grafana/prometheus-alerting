import { css } from '@emotion/css';
import React from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Button, Field, Input, Stack, TextArea, useStyles2 } from '@grafana/ui';

import { RuleFormValues } from '../types';
import { RuleEditorSection } from './RuleEditorSection';

export const AnnotationsStep = () => {
  const styles = useStyles2(getStyles);
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = useFormContext<RuleFormValues>();

  const annotations = watch('annotations');

  const { fields, append, remove } = useFieldArray({ control, name: 'annotations' });

  return (
    <RuleEditorSection
      stepNo={4}
      title={t('alerting.annotations.title', 'Annotations')}
      description={t('alerting.annotations.description', 'Add more context to your alert notifications.')}
      fullWidth
    >
      <Stack direction="column" gap={1}>
        {fields.map((annotationField, index: number) => {
          const isUrl = annotations[index]?.key?.toLocaleLowerCase().endsWith('url');
          const ValueInputComponent = isUrl ? Input : TextArea;

          return (
            <div key={annotationField.id} className={styles.flexRow}>
              <div className={styles.fullWidth}>
                <Field
                  label={t('alerting.annotations-step.label-key', 'Key')}
                  error={errors.annotations?.[index]?.key?.message}
                  invalid={!!errors.annotations?.[index]?.key}
                >
                  <Input
                    {...register(`annotations.${index}.key`)}
                    placeholder={t('alerting.annotations-step.placeholder-key', 'Annotation key')}
                  />
                </Field>
                <div className={styles.annotationValueContainer}>
                  <Field
                    className={styles.field}
                    invalid={!!errors.annotations?.[index]?.value?.message}
                    error={errors.annotations?.[index]?.value?.message}
                    noMargin
                  >
                    <ValueInputComponent
                      data-testid={`annotation-value-${index}`}
                      className={isUrl ? undefined : styles.textarea}
                      {...register(`annotations.${index}.value`)}
                      placeholder={
                        isUrl ? 'https://' : t('alerting.annotations-step.placeholder-value', 'Annotation value')
                      }
                    />
                  </Field>
                  <Button
                    type="button"
                    className={styles.deleteAnnotationButton}
                    aria-label={t('alerting.annotations-step.aria-label-delete-annotation', 'delete annotation')}
                    icon="trash-alt"
                    variant="secondary"
                    onClick={() => remove(index)}
                  />
                </div>
              </div>
            </div>
          );
        })}

        <Stack direction="row" gap={1}>
          <Button
            icon="plus"
            type="button"
            variant="secondary"
            onClick={() => {
              append({ key: '', value: '' });
            }}
          >
            {t('alerting.annotations-step.add-custom-annotation', 'Add custom annotation')}
          </Button>
        </Stack>
      </Stack>
    </RuleEditorSection>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  textarea: css({
    height: '76px',
  }),
  field: css({
    marginBottom: theme.spacing(0.5),
  }),
  flexRow: css({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  }),
  deleteAnnotationButton: css({
    display: 'inline-block',
    marginTop: '10px',
    marginLeft: '10px',
  }),
  annotationValueContainer: css({
    display: 'flex',
  }),
  fullWidth: css({
    width: '100%',
  }),
});
