import React, { useState } from 'react';
import { Alert, Button, Field, Input, Combobox, type ComboboxOption, TextArea, Stack } from '@grafana/ui';
import { AlertmanagerPage } from '../../components/AlertmanagerPage';
import { alertmanagerApi } from '../../api/alertmanager.endpoints';
import { useAlertmanager } from '../../hooks/useAlertmanager';
import { SilenceFormSchema, type SilenceFormData } from './silenceFormSchema';
import type { PostableSilence } from '@grafana/external-alertmanager/vanilla';
import { ROUTES } from '../../constants';
import { prefixRoute } from '../../utils/utils.routing';
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
  ];
  const { uid: dataSourceUID } = useAlertmanager();
  const [postSilence, { isLoading, error: mutationError }] = (alertmanagerApi as any).endpoints.postSilences.useMutation();

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

  const [formData, setFormData] = useState<SilenceFormData>({
    matchers: [{ name: '', value: '', isRegex: false, isEqual: true }],
    startsAt: formatDateTimeLocal(now),
    endsAt: formatDateTimeLocal(oneHourLater),
    createdBy: '',
    comment: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleMatcherChange = (index: number, field: keyof MatcherFormData, value: string | boolean) => {
    const newMatchers = [...formData.matchers];
    newMatchers[index] = { ...newMatchers[index], [field]: value };
    setFormData({ ...formData, matchers: newMatchers });

    // Clear validation error for this field
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`matchers.${index}.${field}`];
      return newErrors;
    });
  };

  const handleOperatorChange = (index: number, option: ComboboxOption) => {
    const operatorValue = option.value;
    const newMatchers = [...formData.matchers];
    if (operatorValue === 'equal') {
      newMatchers[index] = { ...newMatchers[index], isRegex: false, isEqual: true };
    } else if (operatorValue === 'notEqual') {
      newMatchers[index] = { ...newMatchers[index], isRegex: false, isEqual: false };
    } else if (operatorValue === 'regex') {
      newMatchers[index] = { ...newMatchers[index], isRegex: true, isEqual: true };
    }
    setFormData({ ...formData, matchers: newMatchers });
  };

  const getOperatorOption = (matcher: MatcherFormData): ComboboxOption => {
    if (matcher.isRegex) {
      return operatorOptions[2];
    }
    if (matcher.isEqual === false) {
      return operatorOptions[1];
    }
    return operatorOptions[0];
  };

  const addMatcher = () => {
    setFormData({
      ...formData,
      matchers: [...formData.matchers, { name: '', value: '', isRegex: false, isEqual: true }],
    });
  };

  const removeMatcher = (index: number) => {
    const newMatchers = formData.matchers.filter((_, i) => i !== index);
    setFormData({ ...formData, matchers: newMatchers });
  };

  const handleFieldChange = (field: keyof SilenceFormData, value: string) => {
    setFormData({ ...formData, [field]: value });

    // Clear validation error for this field
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    // Validate form data with Zod
    const result = SilenceFormSchema.safeParse(formData);

    if (!result.success) {
      // Convert Zod errors to a more user-friendly format
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        errors[path] = issue.message;
      });
      setValidationErrors(errors);
      return;
    }

    // Convert datetime-local format to ISO 8601
    const postableData: PostableSilence = {
      matchers: result.data.matchers,
      startsAt: new Date(result.data.startsAt).toISOString(),
      endsAt: new Date(result.data.endsAt).toISOString(),
      createdBy: result.data.createdBy,
      comment: result.data.comment,
    };

    try {
      await postSilence({ dataSourceUID, postableSilence: postableData }).unwrap();
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

  return (
    <AlertmanagerPage>
      <div style={{ maxWidth: '800px' }}>
        <h2>{t('silences.create.title', 'Create Silence')}</h2>

        {mutationError && (
          <Alert title={t('silences.create.error-title', 'Error creating silence')} severity="error">
            {mutationError instanceof Error ? mutationError.message : t('silences.create.error-message', 'Failed to create silence')}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <h3>{t('silences.create.matchers-title', 'Matchers')}</h3>
            <p style={{ color: '#999', fontSize: '14px', marginBottom: '16px' }}>
              {t('silences.create.matchers-description', 'Define label matchers to determine which alerts this silence will affect')}
            </p>

            {formData.matchers.map((matcher, index) => (
              <Stack key={index} direction="row" gap={1} alignItems="flex-start" wrap={false}>
                <Field
                  label={index === 0 ? t('silences.create.label-name', 'Label Name') : undefined}
                  invalid={!!validationErrors[`matchers.${index}.name`]}
                  error={validationErrors[`matchers.${index}.name`]}
                  style={{ flex: 1, minWidth: '150px' }}
                >
                  <Input
                    placeholder={t('silences.create.label-name-placeholder', 'e.g., alertname')}
                    value={matcher.name}
                    onChange={(e) => handleMatcherChange(index, 'name', e.currentTarget.value)}
                  />
                </Field>

                <Field
                  label={index === 0 ? t('silences.create.operator', 'Operator') : undefined}
                  style={{ width: '180px' }}
                >
                  <Combobox
                    options={operatorOptions}
                    value={getOperatorOption(matcher)}
                    onChange={(option) => handleOperatorChange(index, option)}
                  />
                </Field>

                <Field
                  label={index === 0 ? t('silences.create.label-value', 'Label Value') : undefined}
                  invalid={!!validationErrors[`matchers.${index}.value`]}
                  error={validationErrors[`matchers.${index}.value`]}
                  style={{ flex: 1, minWidth: '150px' }}
                >
                  <Input
                    placeholder={matcher.isRegex ? t('silences.create.label-value-placeholder-regex', 'e.g., .*warning.*') : t('silences.create.label-value-placeholder', 'e.g., HighMemoryUsage')}
                    value={matcher.value}
                    onChange={(e) => handleMatcherChange(index, 'value', e.currentTarget.value)}
                  />
                </Field>

                <div style={{ paddingTop: index === 0 ? '32px' : '0' }}>
                  <Button
                    variant="secondary"
                    icon="trash-alt"
                    aria-label={t('silences.create.remove-matcher', 'Remove matcher')}
                    onClick={() => removeMatcher(index)}
                    disabled={formData.matchers.length === 1}
                    type="button"
                  />
                </div>
              </Stack>
            ))}

            <Button
              variant="secondary"
              icon="plus"
              onClick={addMatcher}
              type="button"
              style={{ marginTop: '8px' }}
            >
              {t('silences.create.add-matcher', 'Add Matcher')}
            </Button>

            {validationErrors['matchers'] && (
              <div style={{ color: '#e02f44', fontSize: '12px', marginTop: '8px' }}>
                {validationErrors['matchers']}
              </div>
            )}
          </div>

          <Field
            label={t('silences.create.starts-at', 'Start Time')}
            description={t('silences.create.starts-at-description', 'When the silence should begin')}
            invalid={!!validationErrors['startsAt']}
            error={validationErrors['startsAt']}
          >
            <Input
              type="datetime-local"
              value={formData.startsAt}
              onChange={(e) => handleFieldChange('startsAt', e.currentTarget.value)}
            />
          </Field>

          <Field
            label={t('silences.create.ends-at', 'End Time')}
            description={t('silences.create.ends-at-description', 'When the silence should expire')}
            invalid={!!validationErrors['endsAt']}
            error={validationErrors['endsAt']}
          >
            <Input
              type="datetime-local"
              value={formData.endsAt}
              onChange={(e) => handleFieldChange('endsAt', e.currentTarget.value)}
            />
          </Field>

          <Field
            label={t('silences.create.created-by', 'Created By')}
            description={t('silences.create.created-by-description', 'Your name or identifier')}
            invalid={!!validationErrors['createdBy']}
            error={validationErrors['createdBy']}
          >
            <Input
              placeholder={t('silences.create.created-by-placeholder', 'e.g., john.doe@example.com')}
              value={formData.createdBy}
              onChange={(e) => handleFieldChange('createdBy', e.currentTarget.value)}
            />
          </Field>

          <Field
            label={t('silences.create.comment', 'Comment')}
            description={t('silences.create.comment-description', 'Reason for creating this silence')}
            invalid={!!validationErrors['comment']}
            error={validationErrors['comment']}
          >
            <TextArea
              placeholder={t('silences.create.comment-placeholder', 'e.g., Planned maintenance window')}
              value={formData.comment}
              onChange={(e) => handleFieldChange('comment', e.currentTarget.value)}
              rows={3}
            />
          </Field>

          <Stack gap={2}>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t('silences.create.creating', 'Creating...') : t('silences.create.submit', 'Create Silence')}
            </Button>
            <Button variant="secondary" onClick={handleCancel} type="button" disabled={isLoading}>
              {t('silences.create.cancel', 'Cancel')}
            </Button>
          </Stack>
        </form>
      </div>
    </AlertmanagerPage>
  );
}

export default SilenceForm;
