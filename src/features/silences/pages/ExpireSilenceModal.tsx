import React, { useCallback, useMemo, useState } from 'react';
import { ConfirmModal } from '@grafana/ui';
import { t } from '@grafana/i18n';

type ExpireSilenceModalHook = [React.JSX.Element, (silenceId: string) => void, () => void, string | undefined];

export const useExpireSilenceModal = (
  onExpire: (silenceId: string) => void | Promise<void>,
): ExpireSilenceModalHook => {
  const [expiringSilenceId, setExpiringSilenceId] = useState<string | undefined>();

  const dismissModal = useCallback(() => {
    setExpiringSilenceId(undefined);
  }, []);

  const showModal = useCallback((silenceId: string) => {
    setExpiringSilenceId(silenceId);
  }, []);

  const expireSilence = useCallback(async () => {
    if (!expiringSilenceId) {
      return;
    }

    try {
      await onExpire(expiringSilenceId);
      dismissModal();
    } catch (err) {
      // Keep the modal open on error so user can retry
      throw err;
    }
  }, [onExpire, expiringSilenceId, dismissModal]);

  const modal = useMemo(
    () => (
      <ConfirmModal
        isOpen={Boolean(expiringSilenceId)}
        title={t('silences.expire-modal.title', 'Expire Silence')}
        body={
          expiringSilenceId ? (
            <p>{t('silences.expire-modal.body', 'Are you sure you want to expire this silence?')}</p>
          ) : null
        }
        confirmText={t('silences.expire-modal.confirm', 'Expire')}
        dismissText={t('silences.expire-modal.cancel', 'Cancel')}
        icon="exclamation-triangle"
        onConfirm={expireSilence}
        onDismiss={dismissModal}
        confirmButtonVariant="destructive"
      />
    ),
    [expiringSilenceId, expireSilence, dismissModal]
  );

  return [modal, showModal, dismissModal, expiringSilenceId];
};
