import { css } from '@emotion/css';
import React, { useMemo, useState } from 'react';
import { SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { useParams } from 'react-router-dom';

import { AppEvents, GrafanaTheme2 } from '@grafana/data';
import { RulerRuleGroupDTO } from '@grafana/external-rules/vanilla';
import { Trans, t } from '@grafana/i18n';
import { getAppEvents, locationService, PluginPage } from '@grafana/runtime';
import {
  Alert,
  Button,
  ConfirmModal,
  Field,
  Input,
  LinkButton,
  LoadingPlaceholder,
  Stack,
  useStyles2,
} from '@grafana/ui';

import { useDiscoverFeaturesQuery } from '../../../api/rules/featureDiscovery.endpoints';
import { rulerApi } from '../../../api/rules/mimir.endpoints';
import { PLUGIN_BASE_URL, ROUTES } from '../../../constants';

const { useGetRuleGroupQuery, useDeleteRuleGroupMutation, useUpsertRuleGroupMutation } = rulerApi;
import { useReturnTo } from '../../../hooks/useReturnTo';
import { extractErrorMessage } from '../../../utils/errors';
import { groups } from '../../../utils/navigation';

import { DraggableRulesTable, SwapOperation, applySwaps } from '../components/DraggableRulesTable';
import { EvaluationIntervalInput } from '../components/EvaluationIntervalInput';
import { useWaitForGroupConsistency } from '../hooks/useGroupConsistencyCheck';

type GroupEditPageRouteParams = {
  dataSourceUid?: string;
  namespace?: string;
  groupName?: string;
};

interface GroupEditFormData {
  namespace: string;
  name: string;
  interval: string;
}

function GroupEditPage() {
  const { dataSourceUid = '', namespace = '', groupName = '' } = useParams<GroupEditPageRouteParams>();

  // Feature discovery to get datasource capabilities
  const {
    data: dsFeatures,
    isLoading: isDsFeaturesLoading,
    error: dsFeaturesError,
  } = useDiscoverFeaturesQuery({ uid: dataSourceUid });

  // Fetch ruler group
  const {
    data: rulerGroup,
    isLoading: isRulerLoading,
    error: rulerError,
  } = useGetRuleGroupQuery(
    dsFeatures?.rulerApiEnabled
      ? {
          dataSourceUid: dataSourceUid,
          namespace: namespace,
          groupName: groupName,
        }
      : { dataSourceUid: '', namespace: '', groupName: '' },
    { skip: !dsFeatures?.rulerApiEnabled }
  );

  const isLoading = isDsFeaturesLoading || isRulerLoading;

  // Page navigation structure
  const pageNav = useMemo(() => {
    return {
      text: t('alerting.group-edit.page-title', 'Edit rule group'),
      parentItem: {
        text: groupName,
        url: groups.detailsPageLink(dataSourceUid, namespace, groupName),
        parentItem: {
          text: namespace,
          parentItem: {
            text: t('alerting.group-edit.rules', 'Rules'),
            url: `${PLUGIN_BASE_URL}/${ROUTES.Rules}`,
          },
        },
      },
    };
  }, [groupName, namespace, dataSourceUid]);

  if (isLoading) {
    return (
      <PluginPage pageNav={pageNav}>
        <LoadingPlaceholder text={t('alerting.group-edit.loading', 'Loading group...')} />
      </PluginPage>
    );
  }

  // Check if ruler API is not supported
  if (dsFeatures && !dsFeatures.rulerApiEnabled) {
    return (
      <PluginPage pageNav={pageNav}>
        <Alert severity="warning" title={t('alerting.group-edit.not-editable', 'This group cannot be edited')}>
          <Trans i18nKey="alerting.group-edit.not-editable-description">
            This data source does not support editing rule groups.
          </Trans>
        </Alert>
      </PluginPage>
    );
  }

  const hasError = dsFeaturesError || rulerError;
  if (hasError) {
    return (
      <PluginPage pageNav={pageNav}>
        <Alert severity="error" title={t('alerting.group-edit.error', 'Error loading group')}>
          {extractErrorMessage(dsFeaturesError || rulerError)}
        </Alert>
      </PluginPage>
    );
  }

  if (!rulerGroup) {
    return (
      <PluginPage pageNav={pageNav}>
        <Alert severity="warning" title={t('alerting.group-edit.not-found', 'Group not found')}>
          {t(
            'alerting.group-edit.not-found-message',
            'The group "{{groupName}}" in namespace "{{namespace}}" could not be found.',
            { groupName, namespace }
          )}
        </Alert>
      </PluginPage>
    );
  }

  return (
    <PluginPage pageNav={pageNav}>
      <GroupEditForm
        dataSourceUid={dataSourceUid}
        originalNamespace={namespace}
        originalGroupName={groupName}
        rulerGroup={rulerGroup}
      />
    </PluginPage>
  );
}

interface GroupEditFormProps {
  dataSourceUid: string;
  originalNamespace: string;
  originalGroupName: string;
  rulerGroup: RulerRuleGroupDTO;
}

function GroupEditForm({ dataSourceUid, originalNamespace, originalGroupName, rulerGroup }: GroupEditFormProps) {
  const styles = useStyles2(getStyles);
  const { returnTo } = useReturnTo(groups.detailsPageLink(dataSourceUid, originalNamespace, originalGroupName));

  const [upsertRuleGroup, { isLoading: isUpdating }] = useUpsertRuleGroupMutation();
  const [deleteRuleGroup, { isLoading: isDeleting }] = useDeleteRuleGroupMutation();
  const { waitForGroupConsistency } = useWaitForGroupConsistency();

  const [swapOperations, setSwapOperations] = useState<SwapOperation[]>([]);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isWaitingForConsistency, setIsWaitingForConsistency] = useState(false);

  const defaultInterval = rulerGroup.interval ?? '1m';

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<GroupEditFormData>({
    mode: 'onBlur',
    defaultValues: {
      namespace: originalNamespace,
      name: rulerGroup.name,
      interval: defaultInterval,
    },
  });

  const currentInterval = useWatch({ control, name: 'interval' });

  const onSwap = (operation: SwapOperation) => {
    setSwapOperations((prev) => [...prev, operation]);
  };

  const onSubmit: SubmitHandler<GroupEditFormData> = async (data) => {
    setSubmitError(null);

    try {
      const isNamespaceChanged = dirtyFields.namespace && data.namespace !== originalNamespace;
      const isGroupRenamed = dirtyFields.name && data.name !== originalGroupName;
      const hasSwaps = swapOperations.length > 0;

      // Apply rule reordering
      const reorderedRules = hasSwaps ? applySwaps(rulerGroup.rules, swapOperations) : rulerGroup.rules;

      // Create the new rule group payload
      const newGroupPayload = {
        name: data.name,
        interval: data.interval,
        rules: reorderedRules,
      };

      // Determine target namespace
      const targetNamespace = isNamespaceChanged ? data.namespace : originalNamespace;

      // Upsert the new/updated group
      await upsertRuleGroup({
        dataSourceUid,
        namespace: targetNamespace,
        payload: newGroupPayload,
      }).unwrap();

      // Show success toast notification
      const appEvents = getAppEvents();
      appEvents.publish({
        type: AppEvents.alertSuccess.name,
        payload: [t('alerting.group-edit.success', 'Successfully updated the rule group')],
      });

      // If namespace or name changed, navigate first then delete in background
      // We MUST navigate BEFORE triggering the delete to avoid cache invalidation showing errors
      if (isNamespaceChanged || isGroupRenamed) {
        // Navigate to the new group's edit page immediately
        locationService.replace(groups.editPageLink(dataSourceUid, targetNamespace, data.name));

        // Fire-and-forget the delete - don't await, let it complete in background
        // This avoids RTK Query cache invalidation causing a 404 error display
        deleteRuleGroup({
          dataSourceUid,
          namespace: originalNamespace,
          groupName: originalGroupName,
        });
      }
    } catch (error) {
      setIsWaitingForConsistency(false);
      setSubmitError(extractErrorMessage(error));
    }
  };

  const onDelete = async () => {
    try {
      await deleteRuleGroup({
        dataSourceUid,
        namespace: originalNamespace,
        groupName: originalGroupName,
      }).unwrap();

      // Wait for Prometheus to reflect the deletion
      setIsWaitingForConsistency(true);
      await waitForGroupConsistency({
        dataSourceUid,
        namespace: originalNamespace,
        groupName: originalGroupName,
      });
      setIsWaitingForConsistency(false);

      // Navigate back to rules list
      locationService.push(`${PLUGIN_BASE_URL}/${ROUTES.Rules}`);
    } catch (error) {
      setIsWaitingForConsistency(false);
      setSubmitError(error instanceof Error ? error.message : String(error));
    }
  };

  const isProcessing = isSubmitting || isUpdating || isDeleting || isWaitingForConsistency;

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        {submitError && (
          <Alert severity="error" title={t('alerting.group-edit.submit-error', 'Failed to save changes')}>
            {submitError}
          </Alert>
        )}

        <Field
          label={t('alerting.group-edit.namespace-label', 'Namespace')}
          description={t('alerting.group-edit.namespace-description', 'The namespace containing this rule group')}
          required
          invalid={!!errors.namespace}
          error={errors.namespace?.message}
          className={styles.field}
        >
          <Input
            id="namespace"
            {...register('namespace', {
              required: t('alerting.group-edit.namespace-required', 'Namespace is required'),
            })}
          />
        </Field>

        <Field
          label={t('alerting.group-edit.name-label', 'Evaluation group name')}
          required
          invalid={!!errors.name}
          error={errors.name?.message}
          className={styles.field}
        >
          <Input
            id="group-name"
            {...register('name', {
              required: t('alerting.group-edit.name-required', 'Group name is required'),
            })}
          />
        </Field>

        <Field
          label={t('alerting.group-edit.interval-label', 'Evaluation interval')}
          description={t('alerting.group-edit.interval-description', 'How often the rules in this group are evaluated')}
          invalid={!!errors.interval}
          error={errors.interval?.message}
          className={styles.field}
          htmlFor="interval"
        >
          <EvaluationIntervalInput
            value={currentInterval}
            onChange={(value) => setValue('interval', value, { shouldValidate: true, shouldDirty: true })}
          />
        </Field>

        <Field
          label={t('alerting.group-edit.rules-label', 'Alerting and recording rules')}
          description={t('alerting.group-edit.rules-description', 'Drag rules to reorder their evaluation order')}
        >
          <DraggableRulesTable rules={rulerGroup.rules} groupInterval={currentInterval} onSwap={onSwap} />
        </Field>

        <Stack gap={2}>
          <Button type="submit" disabled={isProcessing} icon={isProcessing ? 'spinner' : undefined}>
            <Trans i18nKey="alerting.group-edit.save">Save</Trans>
          </Button>
          <LinkButton variant="secondary" disabled={isProcessing} href={returnTo}>
            <Trans i18nKey="alerting.common.cancel">Cancel</Trans>
          </LinkButton>
        </Stack>
      </form>

      <div className={styles.deleteSection}>
        <Button type="button" variant="destructive" onClick={() => setConfirmDeleteOpen(true)} disabled={isProcessing}>
          <Trans i18nKey="alerting.group-edit.delete">Delete group</Trans>
        </Button>
      </div>

      <ConfirmModal
        isOpen={confirmDeleteOpen}
        title={t('alerting.group-edit.delete-title', 'Delete rule group')}
        body={t(
          'alerting.group-edit.delete-body',
          'Are you sure you want to delete this rule group? All rules in this group will be permanently deleted.'
        )}
        confirmText={t('alerting.group-edit.delete-confirm', 'Delete')}
        onConfirm={onDelete}
        onDismiss={() => setConfirmDeleteOpen(false)}
      />
    </>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  field: css({
    maxWidth: '600px',
  }),
  deleteSection: css({
    marginTop: theme.spacing(4),
    paddingTop: theme.spacing(4),
    borderTop: `1px solid ${theme.colors.border.weak}`,
    display: 'flex',
    justifyContent: 'flex-end',
  }),
});

export default GroupEditPage;
