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

import { rulerApi } from '../../../../api/rules/mimir.endpoints';
import { rules as rulesNav } from '../../../../utils/navigation';

const { useUpsertRuleGroupMutation } = rulerApi;

import { RuleFormValues, RuleFormType } from '../types';
import { defaultFormValuesForRuleType } from '../formDefaults';
import { formValuesToRulerRuleDTO } from '../formTransform';
import { isCloudAlertingRuleByType } from '../ruleTypeHelpers';
import { useProduceNewRuleGroup } from '../hooks/useProduceNewRuleGroup';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { createRuleFormSchema } from '../validation';
import { addRuleAction, updateRuleAction } from '../ruleGroupReducer';

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
  const [upsertRuleGroup, { isLoading: isSaving }] = useUpsertRuleGroupMutation();
  const [produceNewRuleGroup] = useProduceNewRuleGroup();

  // Initialize data source UID from existing rule identifier (when editing) or prefill (when cloning)
  const initialUid = existingRuleIdentifier?.uid ?? prefill?.dataSourceUid ?? null;

  const [currentDataSourceUid, setCurrentDataSourceUid] = useState<string | null>(initialUid);

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
    console.log('Form submitted with values:', values);
    console.log('Current data source UID:', currentDataSourceUid);
    console.log('Existing rule identifier (for edit mode):', existingRuleIdentifier);

    try {
      // Data source UID validation (not in form values)
      if (!currentDataSourceUid) {
        console.error('No data source selected');
        throw new Error('No data source selected');
      }

      // All other validations are handled by Zod schema
      // Convert form values to RulerRuleDTO
      console.log('Converting form values to RulerRuleDTO...');
      const ruleDTO: RulerRuleDTO = formValuesToRulerRuleDTO(values);
      console.log('RulerRuleDTO:', ruleDTO);

      // Determine which action to use
      const action = existingRuleIdentifier
        ? updateRuleAction({ identifier: existingRuleIdentifier, rule: ruleDTO })
        : addRuleAction({ rule: ruleDTO, groupName: values.group });

      console.log('Action to apply:', action.type);

      // Use the hook to safely fetch and update the rule group
      console.log('Producing new rule group...');
      const newRuleGroup = await produceNewRuleGroup(
        currentDataSourceUid,
        values.namespace,
        values.group,
        [action] // Pass actions array
      );

      console.log('New rule group produced with', newRuleGroup.rules.length, 'rules:', newRuleGroup);

      // Submit to API
      console.log('Submitting to API...');
      const result = await upsertRuleGroup({
        dataSourceUid: currentDataSourceUid,
        namespace: values.namespace,
        payload: newRuleGroup,
      }).unwrap();
      console.log('API call successful:', result);

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
      // TODO: Show error notification
      alert(`Failed to save rule: ${error instanceof Error ? error.message : String(error)}`);
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
});
