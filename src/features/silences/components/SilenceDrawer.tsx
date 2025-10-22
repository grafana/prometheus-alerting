import { css } from '@emotion/css';
import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Alert, Stack, useStyles2, Text, Button, ConfirmModal, Badge } from '@grafana/ui';
import { AlertLabel } from '@grafana/alerting';
import type { GettableSilence } from '@grafana/external-alertmanager/vanilla';
import { DrawerWithFooter } from '../../../components/DrawerWithFooter';
import { KeyValueList } from '../../../components/KeyValueList';
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
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>{t('silences.drawer.matchers-title', 'Matchers')}</h4>
        <Stack direction="row" gap={0.5} wrap>
          {formatMatchers(silence).map((matcher, index) => (
            <AlertLabel key={index} value={matcher} colorBy="value" size="sm" />
          ))}
        </Stack>
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>{t('silences.drawer.details-title', 'Details')}</h4>
        <KeyValueList items={items} />
      </div>

      {silence.comment && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>{t('silences.drawer.comment-title', 'Comment')}</h4>
          <Text color="secondary">
            <pre className={styles.comment}>{silence.comment}</pre>
          </Text>
        </div>
      )}
    </Stack>
  );
}

interface SilenceDrawerProps {
  silence: GettableSilence | null;
  onClose: () => void;
  onEdit?: (silence: GettableSilence) => void;
}

export function SilenceDrawer({ silence, onClose, onEdit }: SilenceDrawerProps) {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [expireSilence, { isLoading: isExpiring, error: deleteError }] = useDeleteSilence();

  if (!silence) {
    return null;
  }

  const handleEdit = () => {
    onEdit?.(silence);
  };

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
  const hasActions = onEdit || !isExpired;

  return (
    <>
      <DrawerWithFooter
        title={
          <Stack direction="column" gap={0}>
            <Text variant="bodySmall" color="secondary">
              {t('silences.drawer.title', 'Silence')}
            </Text>
            <Stack direction="row" gap={1} alignItems="center">
              <Text variant="h2">{silence.id}</Text>
              <Badge
                text={silence.status.state}
                color={
                  silence.status.state === 'active' ? 'green' : silence.status.state === 'pending' ? 'blue' : 'red'
                }
              />
            </Stack>
          </Stack>
        }
        onClose={onClose}
        width={500}
        footer={
          hasActions ? (
            <Stack gap={2} justifyContent="space-between">
              {onEdit && !isExpired && (
                <Button variant="secondary" onClick={handleEdit}>
                  {t('silences.drawer.edit', 'Edit')}
                </Button>
              )}
              <div style={{ flex: 1 }} />
              {!isExpired && (
                <Button variant="destructive" onClick={handleExpire} disabled={isExpiring}>
                  {isExpiring ? t('silences.drawer.expiring', 'Expiring...') : t('silences.drawer.expire', 'Expire')}
                </Button>
              )}
            </Stack>
          ) : undefined
        }
      >
        {deleteError && (
          <Alert title={t('silences.error-expiring-title', 'Error expiring silence')} severity="error">
            {deleteError instanceof Error
              ? deleteError.message
              : t('silences.error-expiring-message', 'Failed to expire silence')}
          </Alert>
        )}
        <SilenceDetails silence={silence} />
      </DrawerWithFooter>

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
  section: css({
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(2),
    backgroundColor: theme.colors.background.secondary,
  }),
  sectionTitle: css({
    margin: 0,
    marginBottom: theme.spacing(2),
    fontSize: theme.typography.h5.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    paddingBottom: theme.spacing(1),
    borderBottom: `1px solid ${theme.colors.border.weak}`,
  }),
  comment: css({
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontFamily: theme.typography.fontFamilyMonospace,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
});
