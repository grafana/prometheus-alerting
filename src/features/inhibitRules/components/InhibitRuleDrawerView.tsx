import React, { useState } from 'react';
import { t } from '@grafana/i18n';
import { Alert, Button, ConfirmModal, Stack, Text } from '@grafana/ui';
import { type NormalizedInhibitRule, stringifyObjectMatcher } from '@grafana/external-alertmanager/vanilla';
import { AlertLabel } from '@grafana/alerting';
import { Section } from '../../../components/KeyValueList/Section';
import { KeyValuePair } from '../../../components/KeyValueList/KeyValueList';

interface InhibitRuleDetailsProps {
  inhibitRule: NormalizedInhibitRule;
}

function InhibitRuleDetails({ inhibitRule }: InhibitRuleDetailsProps) {
  const hasSourceMatchers = inhibitRule.source_matchers && inhibitRule.source_matchers.length > 0;
  const hasTargetMatchers = inhibitRule.target_matchers && inhibitRule.target_matchers.length > 0;
  const hasEqualLabels = inhibitRule.equal && inhibitRule.equal.length > 0;

  return (
    <Section title={t('inhibit-rules.drawer.details', 'Inhibit Rule Details')}>
      <Stack direction="column" gap={2}>
        <KeyValuePair
          label={t('inhibit-rules.drawer.source-matchers', 'Source Matchers')}
          value={
            hasSourceMatchers && inhibitRule.source_matchers ? (
              <Stack direction="row" gap={0.5} wrap="wrap">
                {inhibitRule.source_matchers.map((matcher, idx) => (
                  <AlertLabel key={`source-${idx}`} value={stringifyObjectMatcher(matcher)} colorBy="value" />
                ))}
              </Stack>
            ) : (
              <Text color="secondary">{t('inhibit-rules.drawer.none', 'None')}</Text>
            )
          }
        />

        <KeyValuePair
          label={t('inhibit-rules.drawer.target-matchers', 'Target Matchers')}
          value={
            hasTargetMatchers && inhibitRule.target_matchers ? (
              <Stack direction="row" gap={0.5} wrap="wrap">
                {inhibitRule.target_matchers.map((matcher, idx) => (
                  <AlertLabel key={`target-${idx}`} value={stringifyObjectMatcher(matcher)} colorBy="value" />
                ))}
              </Stack>
            ) : (
              <Text color="secondary">{t('inhibit-rules.drawer.none', 'None')}</Text>
            )
          }
        />

        {hasEqualLabels && inhibitRule.equal && (
          <KeyValuePair
            label={t('inhibit-rules.drawer.equal', 'Equal Labels')}
            value={
              <Stack direction="row" gap={0.5} wrap="wrap">
                {inhibitRule.equal.map((label, idx) => (
                  <AlertLabel key={`equal-${idx}`} value={label} colorBy="value" />
                ))}
              </Stack>
            }
          />
        )}

        {!hasSourceMatchers && !hasTargetMatchers && !hasEqualLabels && (
          <Alert title={t('inhibit-rules.drawer.no-config', 'No configuration')} severity="info">
            {t('inhibit-rules.drawer.no-config-desc', 'This inhibit rule has no visible configuration.')}
          </Alert>
        )}
      </Stack>
    </Section>
  );
}

interface InhibitRuleDrawerViewProps {
  inhibitRule: NormalizedInhibitRule;
  inhibitRuleIndex: number;
  onEdit: () => void;
  onClose: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  deleteError: unknown;
}

export function InhibitRuleDrawerView({
  inhibitRule,
  onEdit,
  onDelete,
  isDeleting,
  deleteError,
}: InhibitRuleDrawerViewProps) {
  return (
    <>
      {Boolean(deleteError) && (
        <Alert title={t('inhibit-rules.error-deleting-title', 'Error deleting inhibit rule')} severity="error">
          {String(
            deleteError instanceof Error
              ? deleteError.message
              : t('inhibit-rules.error-deleting-message', 'Failed to delete inhibit rule')
          )}
        </Alert>
      )}

      <InhibitRuleDetails inhibitRule={inhibitRule} />
    </>
  );
}

interface InhibitRuleDrawerViewFooterProps {
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

export function InhibitRuleDrawerViewFooter({ onEdit, onDelete, isDeleting }: InhibitRuleDrawerViewFooterProps) {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  return (
    <>
      <Stack gap={2} justifyContent="flex-end">
        <Button variant="secondary" onClick={onEdit}>
          {t('inhibit-rules.drawer.edit.edit-button', 'Edit')}
        </Button>
        <Button variant="destructive" onClick={() => setIsConfirmModalOpen(true)} disabled={isDeleting}>
          {t('inhibit-rules.drawer.remove', 'Remove')}
        </Button>
      </Stack>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title={t('inhibit-rules.confirm-remove.title', 'Remove Inhibit Rule')}
        body={t(
          'inhibit-rules.confirm-remove.body',
          'Are you sure you want to remove this inhibit rule? This action cannot be undone.'
        )}
        confirmText={t('inhibit-rules.confirm-remove.confirm', 'Remove')}
        dismissText={t('inhibit-rules.confirm-remove.cancel', 'Cancel')}
        onConfirm={() => {
          setIsConfirmModalOpen(false);
          onDelete();
        }}
        onDismiss={() => setIsConfirmModalOpen(false)}
        confirmButtonVariant="destructive"
      />
    </>
  );
}
