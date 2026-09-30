import { css } from '@emotion/css';
import React, { useMemo, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';

import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { locationService } from '@grafana/runtime';
import { Button, Stack, useStyles2 } from '@grafana/ui';

import type { RulerRuleDTO } from '@grafana/external-rules/vanilla';
import type { CloudRuleIdentifier } from '@grafana/external-rules/identifiers';
import { hashRulerRule } from '@grafana/external-rules/hashing';
import { getRuleName } from '@grafana/external-rules/utils';

import { rules as rulesNav } from '../../../../utils/navigation';
import { RulesErrorAlert } from '../../components/RulesErrorAlert';

import { RuleFormValues, RuleFormType } from '../types';
import { defaultFormValuesForRuleType } from '../formDefaults';
import { formValuesToRulerRuleDTO } from '../formTransform';
import { isCloudAlertingRuleByType } from '../ruleTypeHelpers';
import { useSaveRuleToGroup } from '../hooks/useSaveRuleToGroup';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { createRuleFormSchema } from '../validation';

import { RuleDefinitionSection } from './RuleDefinitionSection';
import { CloudEvaluationBehavior } from './CloudEvaluationBehavior';
import { LabelsField } from './LabelsField';
import { AnnotationsStep } from './AnnotationsStep';

interface Props {
  ruleType: RuleFormType;
  prefill?: Partial<RuleFormValues>;
  onCancel?: () => void;
  /** Identifier for the rule being edited (undefined for new rules) */
  existingRuleIdentifier?: CloudRuleIdentifier;
}

export const RuleForm = ({ ruleType, prefill, onCancel, existingRuleIdentifier }: Props) => {
  const styles = useStyles2(getStyles);
  const navigate = useNavigate();
  const [saveRuleToGroup, { isLoading: isSaving }] = useSaveRuleToGroup();

  // Initialize data source UID from existing rule identifier (when editing) or prefill (when cloning)
  const initialUid = existingRuleIdentifier?.uid ?? prefill?.dataSourceUid ?? null;

  const [currentDataSourceUid, setCurrentDataSourceUid] = useState<string | null>(initialUid);

  // The last failure from the Ruler, kept raw so the alert can decide how to present it
  const [submitError, setSubmitError] = useState<unknown>(null);

  // Create default form values, merging with prefill if provided
  const defaultValues: RuleFormValues = useMemo(() => {
    const defaults = defaultFormValuesForRuleType(ruleType);
    if (prefill) {
      return { ...defaults, ...prefill };
    }
    return defaults;
  }, [ruleType, prefill]);

  // Create the schema at runtime to ensure i18n translations are loaded
  const ruleFormSchema = useMemo(() => createRuleFormSchema(), []);

  const formAPI = useForm<RuleFormValues>({
    mode: 'onSubmit',
    defaultValues,
    shouldFocusError: true,
    resolver: zodResolver(ruleFormSchema),
  });

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = formAPI;

  // Warn about unsaved changes
  useUnsavedChanges(true);

  const type = useWatch({ control, name: 'type' });
  const isAlerting = isCloudAlertingRuleByType(type);

  const onChangeDataSource = (uid: string) => {
    setCurrentDataSourceUid(uid);
  };

  const onSubmit = async (values: RuleFormValues) => {
    setSubmitError(null);

    try {
      // Data source UID validation (not in form values)
      if (!currentDataSourceUid) {
        throw new Error('No data source selected');
      }

      // All other validations are handled by Zod schema
      // Convert form values to RulerRuleDTO
      const ruleDTO: RulerRuleDTO = formValuesToRulerRuleDTO(values);

      // Where the rule should end up. When any of these three differ from the rule's current
      // home this is a move, which the hook handles as an add followed by a delete.
      await saveRuleToGroup(
        { uid: currentDataSourceUid, namespace: values.namespace, groupName: values.group },
        ruleDTO,
        existingRuleIdentifier
      );

      // Build the rule identifier for navigation
      const ruleIdentifier: CloudRuleIdentifier = {
        type: 'cloud',
        uid: currentDataSourceUid,
        namespace: values.namespace,
        groupName: values.group,
        ruleName: getRuleName(ruleDTO),
        rulerRuleHash: hashRulerRule(ruleDTO),
      };

      // Navigate to rule details page (matches Grafana core behavior)
      // For new rules, the details page will show a consistency warning
      // while waiting for Prometheus to reflect the change
      locationService.push(rulesNav.detailsPageLink(ruleIdentifier));
    } catch (error) {
      console.error('Failed to save rule:', error);
      setSubmitError(error);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      // Default: navigate back
      navigate(-1);
    }
  };

  return (
    <FormProvider {...formAPI}>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <div className={styles.contentOuter}>
          <Stack direction="column" gap={0}>
            <div className={styles.sections}>
              {/* Step 1: Rule Definition (name, data source, query) */}
              <RuleDefinitionSection onChangeCloudDatasource={onChangeDataSource} />

              {/* Step 2: Evaluation Behavior (includes namespace/group) */}
              <CloudEvaluationBehavior />

              {/* Step 3: Labels */}
              <LabelsField />

              {/* Step 4: Annotations (alerting only) */}
              {isAlerting && <AnnotationsStep />}
            </div>

            {/* Whatever the Ruler rejected, shown next to the button that triggered the save */}
            {submitError !== null && (
              <div className={styles.submitError}>
                <RulesErrorAlert
                  error={submitError}
                  title={t('alerting.rule-form.submit-error', 'Failed to save rule')}
                />
              </div>
            )}

            {/* Actions */}
            <div className={styles.actions}>
              <Stack direction="row" alignItems="center" gap={2}>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting || isSaving}
                  icon={isSubmitting || isSaving ? 'spinner' : undefined}
                >
                  {t('alerting.rule-form.save', 'Save')}
                </Button>
                <Button type="button" variant="secondary" disabled={isSubmitting || isSaving} onClick={handleCancel}>
                  {t('alerting.rule-form.cancel', 'Cancel')}
                </Button>
              </Stack>
            </div>
          </Stack>
        </div>
      </form>
    </FormProvider>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  form: css({
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  }),
  contentOuter: css({
    background: theme.colors.background.primary,
    overflow: 'hidden',
    maxWidth: theme.breakpoints.values.xl,
    flex: 1,
    padding: theme.spacing(2),
  }),
  sections: css({
    // Container for form sections - allows :last-child selector to work properly
  }),
  actions: css({
    paddingTop: theme.spacing(2),
  }),
  submitError: css({
    paddingTop: theme.spacing(2),
  }),
});
