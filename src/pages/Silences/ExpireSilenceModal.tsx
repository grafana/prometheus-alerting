import React from 'react';
import { ConfirmModal, Stack } from '@grafana/ui';
import { AlertLabel } from '@grafana/alerting';
import type { GettableSilence } from '@grafana/external-alertmanager/vanilla';
import { t } from '@grafana/i18n';
import { formatMatchers } from './silences.utils';

interface ExpireSilenceModalProps {
  silence: GettableSilence | null;
  onConfirm: () => void;
  onDismiss: () => void;
}

export function ExpireSilenceModal({ silence, onConfirm, onDismiss }: ExpireSilenceModalProps) {
  if (!silence) {
    return null;
  }

  return (
    <ConfirmModal
      isOpen={true}
      title={t('silences.expire-modal.title', 'Expire Silence')}
      body={
        <Stack direction="column" gap={1.5}>
          <p>{t('silences.expire-modal.body', 'Are you sure you want to expire this silence?')}</p>
          <div>
            <strong>{t('silences.expire-modal.comment-label', 'Comment:')}</strong> {silence.comment}
          </div>
          <Stack direction="row" gap={0.5} wrap="wrap">
            <strong>{t('silences.expire-modal.matchers-label', 'Matchers:')}</strong>
            {formatMatchers(silence).map((matcher, index) => (
              <AlertLabel key={index} value={matcher} colorBy="value" size="sm" />
            ))}
          </Stack>
        </Stack>
      }
      confirmText={t('silences.expire-modal.confirm', 'Expire')}
      dismissText={t('silences.expire-modal.cancel', 'Cancel')}
      icon="exclamation-triangle"
      onConfirm={onConfirm}
      onDismiss={onDismiss}
      confirmButtonVariant="destructive"
    />
  );
}
