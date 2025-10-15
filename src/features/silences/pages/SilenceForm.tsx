import React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Button,
  Field,
  Input,
  Combobox,
  type ComboboxOption,
  TextArea,
  Stack,
  RadioButtonGroup,
} from '@grafana/ui';
import { AlertmanagerPage } from '../../../components/AlertmanagerPage';
import { useCreateSilence } from '../hooks/useSilences';
import { SilenceFormSchema, type SilenceFormData } from '../utils/silenceFormSchema';
import type { PostableSilence } from '@grafana/external-alertmanager/vanilla';
import { ROUTES } from '../../../constants';
import { prefixRoute } from '../../../utils/utils.routing';
import { parsePrometheusDuration } from '../../../utils/time.utils';
import { t } from '@grafana/i18n';
import { locationService } from '@grafana/runtime';

interface MatcherFormData {
  name: string;
  value: string;
  isRegex: boolean;
  isEqual?: boolean;
}

function SilenceForm() {
  const operatorOptions: ComboboxOption[] = [
    { label: t('silences.create.operator-equal', '= (Equal)'), value: 'equal' },
    { label: t('silences.create.operator-not-equal', '!= (Not Equal)'), value: 'notEqual' },
    { label: t('silences.create.operator-regex', '=~ (Regex Match)'), value: 'regex' },
    { label: t('silences.create.operator-regex-not-equal', '!~ (Regex Not Match)'), value: 'regexNotEqual' },
  ];

  const [createSilence, { isLoading, error: mutationError }] = useCreateSilence();

  // Get current time and 1 hour from now as defaults
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SilenceFormData>({
    resolver: zodResolver(SilenceFormSchema),
    defaultValues: {
      matchers: [{ name: '', value: '', isRegex: false, isEqual: true }],
      timeMode: 'relative',
      duration: '2h',
      startsAt: formatDateTimeLocal(now),
      endsAt: formatDateTimeLocal(oneHourLater),
      createdBy: '',
      comment: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'matchers',
  });

  const matchers = watch('matchers');
  const timeMode = watch('timeMode');

  const getOperatorOption = (matcher: MatcherFormData): ComboboxOption => {
    if (matcher.isRegex && matcher.isEqual === false) {
      return operatorOptions[3]; // !~ (Regex Not Match)
    }
    if (matcher.isRegex) {
      return operatorOptions[2]; // =~ (Regex Match)
    }
    if (matcher.isEqual === false) {
      return operatorOptions[1]; // != (Not Equal)
    }
    return operatorOptions[0]; // = (Equal)
  };

  const onSubmit = async (data: SilenceFormData) => {
    let startsAt: string;
    let endsAt: string;

    if (data.timeMode === 'relative') {
      // Calculate absolute times from relative duration
      const startDate = new Date();
      const durationMs = parsePrometheusDuration(data.duration!);
      const endDate = new Date(startDate.getTime() + durationMs);

      startsAt = startDate.toISOString();
      endsAt = endDate.toISOString();
    } else {
      // Use absolute times
      startsAt = new Date(data.startsAt!).toISOString();
      endsAt = new Date(data.endsAt!).toISOString();
    }

    const postableData: PostableSilence = {
      matchers: data.matchers,
      startsAt,
      endsAt,
      createdBy: data.createdBy,
      comment: data.comment,
    };

    try {
      await createSilence(postableData);
      // Navigate back to silences list on success
      locationService.push(prefixRoute(ROUTES.Silences));
    } catch (err) {
      // Error will be handled by the mutationError state
      console.error('Failed to create silence:', err);
    }
  };

  const handleCancel = () => {
    locationService.push(prefixRoute(ROUTES.Silences));
  };

  const addMatcher = () => {
    append({ name: '', value: '', isRegex: false, isEqual: true });
  };

  return (
    <AlertmanagerPage>
      <div style={{ maxWidth: '800px' }}>
        <Stack direction="column" gap={2}>
          <h3>{t('silences.create.matchers-title', 'Matchers')}</h3>
          <p style={{ color: '#999', fontSize: '14px' }}>
            {t(
              'silences.create.matchers-description',
              'Define label matchers to determine which alerts this silence will affect'
            )}
          </p>

          {/* form error */}
          {mutationError && (
            <Alert title={t('silences.create.error-title', 'Error creating silence')} severity="error">
              {mutationError instanceof Error
                ? mutationError.message
                : t('silences.create.error-message', 'Failed to create silence')}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack direction="column" gap={2}>
              <Stack direction="column" alignItems="flex-start" gap={0}>
                <Stack direction="column" gap={0}>
                  {fields.map((field, index) => (
                    <Stack key={field.id} direction="row" gap={1} alignItems="flex-start" wrap={false}>
                      <Field
                        label={index === 0 ? t('silences.create.label-name', 'Label Name') : undefined}
                        invalid={!!errors.matchers?.[index]?.name}
                        error={errors.matchers?.[index]?.name?.message}
                        style={{ flex: 1, minWidth: '150px' }}
                      >
                        <Input
                          {...register(`matchers.${index}.name`)}
                          placeholder={t('silences.create.label-name-placeholder', 'e.g., alertname')}
                        />
                      </Field>

                      <Field
                        label={index === 0 ? t('silences.create.operator', 'Operator') : undefined}
                        style={{ width: '180px' }}
                      >
                        <Controller
                          name={`matchers.${index}.isRegex`}
                          control={control}
                          render={({ field: { onChange } }) => (
                            <Controller
                              name={`matchers.${index}.isEqual`}
                              control={control}
                              render={({ field: { onChange: onEqualChange } }) => (
                                <Combobox
                                  options={operatorOptions}
                                  value={getOperatorOption(matchers[index])}
                                  onChange={(option) => {
                                    const operatorValue = option.value;
                                    if (operatorValue === 'equal') {
                                      onChange(false);
                                      onEqualChange(true);
                                    } else if (operatorValue === 'notEqual') {
                                      onChange(false);
                                      onEqualChange(false);
                                    } else if (operatorValue === 'regex') {
                                      onChange(true);
                                      onEqualChange(true);
                                    } else if (operatorValue === 'regexNotEqual') {
                                      onChange(true);
                                      onEqualChange(false);
                                    }
                                  }}
                                />
                              )}
                            />
                          )}
                        />
                      </Field>

                      <Field
                        label={index === 0 ? t('silences.create.label-value', 'Label Value') : undefined}
                        invalid={!!errors.matchers?.[index]?.value}
                        error={errors.matchers?.[index]?.value?.message}
                        style={{ flex: 1, minWidth: '150px' }}
                      >
                        <Input
                          {...register(`matchers.${index}.value`)}
                          placeholder={
                            matchers[index]?.isRegex
                              ? t('silences.create.label-value-placeholder-regex', 'e.g., .*warning.*')
                              : t('silences.create.label-value-placeholder', 'e.g., HighMemoryUsage')
                          }
                        />
                      </Field>

                      <div style={{ paddingTop: index === 0 ? '20px' : '0' }}>
                        <Button
                          variant="secondary"
                          icon="trash-alt"
                          aria-label={t('silences.create.remove-matcher', 'Remove matcher')}
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                          type="button"
                        />
                      </div>
                    </Stack>
                  ))}
                </Stack>

                <Button variant="secondary" icon="plus" onClick={addMatcher} type="button">
                  {t('silences.create.add-matcher', 'Add Matcher')}
                </Button>
              </Stack>

              {errors.matchers && typeof errors.matchers.message === 'string' && (
                <div style={{ color: '#e02f44', fontSize: '12px' }}>{errors.matchers.message}</div>
              )}

              <Field noMargin label={t('silences.create.time-mode', 'Time Mode')}>
                <Controller
                  name="timeMode"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <RadioButtonGroup
                      options={[
                        { label: t('silences.create.time-mode-relative', 'Relative'), value: 'relative' },
                        { label: t('silences.create.time-mode-absolute', 'Absolute'), value: 'absolute' },
                      ]}
                      value={value}
                      onChange={onChange}
                    />
                  )}
                />
              </Field>

              {timeMode === 'relative' ? (
                <Field
                  noMargin
                  label={t('silences.create.duration', 'Duration')}
                  description={t(
                    'silences.create.duration-description',
                    'How long the silence should last (e.g., 2h, 1d, 30m)'
                  )}
                  invalid={!!errors.duration}
                  error={errors.duration?.message}
                >
                  <Input
                    {...register('duration')}
                    placeholder={t('silences.create.duration-placeholder', 'e.g., 2h, 1d, 30m, 1w')}
                  />
                </Field>
              ) : (
                <>
                  <Field
                    noMargin
                    label={t('silences.create.starts-at', 'Start Time')}
                    description={t('silences.create.starts-at-description', 'When the silence should begin')}
                    invalid={!!errors.startsAt}
                    error={errors.startsAt?.message}
                  >
                    <Input {...register('startsAt')} type="datetime-local" />
                  </Field>

                  <Field
                    noMargin
                    label={t('silences.create.ends-at', 'End Time')}
                    description={t('silences.create.ends-at-description', 'When the silence should expire')}
                    invalid={!!errors.endsAt}
                    error={errors.endsAt?.message}
                  >
                    <Input {...register('endsAt')} type="datetime-local" />
                  </Field>
                </>
              )}

              <Field
                noMargin
                label={t('silences.create.created-by', 'Created By')}
                description={t('silences.create.created-by-description', 'Your name or identifier')}
                invalid={!!errors.createdBy}
                error={errors.createdBy?.message}
              >
                <Input
                  {...register('createdBy')}
                  placeholder={t('silences.create.created-by-placeholder', 'e.g., john.doe@example.com')}
                />
              </Field>

              <Field
                noMargin
                label={t('silences.create.comment', 'Comment')}
                description={t('silences.create.comment-description', 'Reason for creating this silence')}
                invalid={!!errors.comment}
                error={errors.comment?.message}
              >
                <TextArea
                  {...register('comment')}
                  placeholder={t('silences.create.comment-placeholder', 'e.g., Planned maintenance window')}
                  rows={3}
                />
              </Field>

              <Stack gap={2}>
                <Button type="submit" disabled={isLoading}>
                  {isLoading
                    ? t('silences.create.creating', 'Creating...')
                    : t('silences.create.submit', 'Create Silence')}
                </Button>
                <Button variant="secondary" onClick={handleCancel} type="button" disabled={isLoading}>
                  {t('silences.create.cancel', 'Cancel')}
                </Button>
              </Stack>
            </Stack>
          </form>
        </Stack>
      </div>
    </AlertmanagerPage>
  );
}

export default SilenceForm;
