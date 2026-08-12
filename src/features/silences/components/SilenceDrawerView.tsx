import { css } from '@emotion/css';
import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { Alert, Stack, useStyles2, Text, Button, ConfirmModal, TabContent } from '@grafana/ui';
import { AlertLabel } from '@grafana/alerting';
import { locationService } from '@grafana/runtime';
import type { GettableSilence } from '@grafana/external-alertmanager/vanilla';
import { KeyValueList } from '../../../components/KeyValueList';
import { Section } from '../../../components/KeyValueList/Section';
import { isAbilityAllowed } from '../../../access-control/abilities';
import { getSilencesAbilities, SilenceAction } from '../../../access-control/abilities.silences';
import { useAppNotifications } from '../../../hooks/useAppNotifications';
import { getMutationErrorFeedback } from '../../../access-control/mutationErrorFeedback';
import { useDeleteSilence } from '../hooks/useSilences';
import { formatMatchers, formatDateTime } from '../utils/silences.utils';
import { AffectedAlertsList } from './AffectedAlertsList';
import { prefixRoute } from '../../../utils/utils.routing';
import { ROUTES } from '../../../constants';

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
  const { error: notifyError } = useAppNotifications();
  const canMutateSilences = isAbilityAllowed(getSilencesAbilities()[SilenceAction.MutateSilences]);

  const handleExpire = () => {
    setIsConfirmModalOpen(true);
  };

  const handleRecreate = () => {
    // Navigate to create silence page with pre-populated data
    const params = new URLSearchParams();
    params.set('recreateFrom', silence.id);
    locationService.push(`${prefixRoute(ROUTES.CreateSilence)}?${params.toString()}`);
    onClose();
  };

  const handleConfirmExpire = async () => {
    try {
      await expireSilence(silence.id);
      setIsConfirmModalOpen(false);
      onClose();
      // The list will automatically refresh due to cache invalidation
    } catch (err) {
      // Keep modal open on error so user can retry
      const feedback = getMutationErrorFeedback(err, {
        fallbackTitle: t('silences.error-expiring-title', 'Error expiring silence'),
        resource: t('silences.resource-label', 'silences'),
      });
      notifyError(feedback.title, feedback.description);
    }
  };

  const handleCancelExpire = () => {
    setIsConfirmModalOpen(false);
  };

  const isExpired = silence.status.state === 'expired';
  const canExpire = !isExpired;

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
        {activeTab === 'affected-alerts' && <AffectedAlertsList silence={silence} />}
      </TabContent>

      {activeTab === 'configuration' && canMutateSilences && (
        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <Stack gap={2} justifyContent="space-between">
            <Stack gap={1}>
              {canExpire && (
                <Button variant="secondary" onClick={onEdit}>
                  <Trans i18nKey="silences.drawer.edit">Edit</Trans>
                </Button>
              )}
              <Button variant="secondary" icon="copy" onClick={handleRecreate}>
                <Trans i18nKey="silences.drawer.recreate">Recreate</Trans>
              </Button>
            </Stack>
            <div style={{ flex: 1 }} />
            {canExpire && (
              <Button variant="destructive" onClick={handleExpire} disabled={isExpiring}>
                {isExpiring ? t('silences.drawer.expiring', 'Expiring...') : t('silences.drawer.expire', 'Expire')}
              </Button>
            )}
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
