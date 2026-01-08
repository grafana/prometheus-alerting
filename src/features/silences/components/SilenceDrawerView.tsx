import { css } from '@emotion/css';
import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Alert, Stack, useStyles2, Text, Button, ConfirmModal, TabContent } from '@grafana/ui';
import { AlertLabel } from '@grafana/alerting';
import type { GettableSilence } from '@grafana/external-alertmanager/vanilla';
import { KeyValueList } from '../../../components/KeyValueList';
import { Section } from '../../../components/KeyValueList/Section';
import { useDeleteSilence } from '../hooks/useSilences';
import { formatMatchers, formatDateTime } from '../utils/silences.utils';

interface SilenceDetailsProps {
  silence: GettableSilence;
}

function SilenceDetails({ silence }: SilenceDetailsProps) {
  const styles = useStyles2(getStyles);

  const items = [
    {
      label: t('silences.drawer.starts-at', 'Starts At'),
      value: formatDateTime(silence.startsAt),
    },
    {
      label: t('silences.drawer.ends-at', 'Ends At'),
      value: formatDateTime(silence.endsAt),
    },
    {
      label: t('silences.drawer.created-by', 'Created By'),
      value: silence.createdBy,
    },
    {
      label: t('silences.drawer.updated-at', 'Updated At'),
      value: formatDateTime(silence.updatedAt),
    },
  ];

  return (
    <Stack direction="column" gap={2}>
      <Section title={t('silences.drawer.matchers-title', 'Matchers')}>
        <Stack direction="row" gap={0.5} wrap>
          {formatMatchers(silence).map((matcher, index) => (
            <AlertLabel key={index} value={matcher} colorBy="value" size="sm" />
          ))}
        </Stack>
      </Section>

      <Section title={t('silences.drawer.details-title', 'Details')}>
        <KeyValueList items={items} />
      </Section>

      {silence.comment && (
        <Section title={t('silences.drawer.comment-title', 'Comment')}>
          <Text color="secondary">
            <pre className={styles.comment}>{silence.comment}</pre>
          </Text>
        </Section>
      )}
    </Stack>
  );
}

interface SilenceDrawerViewProps {
  silence: GettableSilence;
  activeTab: 'configuration' | 'affected-alerts';
  onEdit: () => void;
  onClose: () => void;
}

export function SilenceDrawerView({ silence, activeTab, onEdit, onClose }: SilenceDrawerViewProps) {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [expireSilence, { isLoading: isExpiring, error: deleteError }] = useDeleteSilence();

  const handleExpire = () => {
    setIsConfirmModalOpen(true);
  };

  const handleConfirmExpire = async () => {
    try {
      await expireSilence(silence.id);
      setIsConfirmModalOpen(false);
      onClose();
      // The list will automatically refresh due to cache invalidation
    } catch (err) {
      console.error('Failed to expire silence:', err);
      // Keep modal open on error so user can retry
    }
  };

  const handleCancelExpire = () => {
    setIsConfirmModalOpen(false);
  };

  const isExpired = silence.status.state === 'expired';
  const hasActions = !isExpired;

  return (
    <>
      {deleteError && (
        <Alert title={t('silences.error-expiring-title', 'Error expiring silence')} severity="error">
          {deleteError instanceof Error
            ? deleteError.message
            : t('silences.error-expiring-message', 'Failed to expire silence')}
        </Alert>
      )}

      <TabContent>
        {activeTab === 'configuration' && <SilenceDetails silence={silence} />}
        {activeTab === 'affected-alerts' && (
          <Stack direction="column" gap={2}>
            {/* Placeholder for affected alerts - to be implemented */}
          </Stack>
        )}
      </TabContent>

      {hasActions && activeTab === 'configuration' && (
        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <Stack gap={2} justifyContent="space-between">
            <Button variant="secondary" onClick={onEdit}>
              {t('silences.drawer.edit', 'Edit')}
            </Button>
            <div style={{ flex: 1 }} />
            <Button variant="destructive" onClick={handleExpire} disabled={isExpiring}>
              {isExpiring ? t('silences.drawer.expiring', 'Expiring...') : t('silences.drawer.expire', 'Expire')}
            </Button>
          </Stack>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title={t('silences.confirm-expire.title', 'Expire Silence')}
        body={t(
          'silences.confirm-expire.body',
          'Are you sure you want to expire this silence? This action will immediately stop the silence from muting alerts.'
        )}
        confirmText={t('silences.confirm-expire.confirm', 'Expire')}
        dismissText={t('silences.confirm-expire.cancel', 'Cancel')}
        icon="exclamation-triangle"
        onConfirm={handleConfirmExpire}
        onDismiss={handleCancelExpire}
        confirmButtonVariant="destructive"
      />
    </>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  comment: css({
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontFamily: theme.typography.fontFamilyMonospace,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
});
