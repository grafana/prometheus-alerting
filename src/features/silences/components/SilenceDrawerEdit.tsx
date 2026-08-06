import React from 'react';
import { t } from '@grafana/i18n';
import type { GettableSilence, PostableSilence } from '@grafana/external-alertmanager/vanilla';
import { useAppNotifications } from '../../../hooks/useAppNotifications';
import { getSilenceMutationErrorFeedback } from '../utils/errorFeedback';
import { useCreateSilence } from '../hooks/useSilences';
import { SilenceFormFields } from './SilenceFormFields';
import type { SilenceFormData } from '../utils/silenceFormSchema';
import { parsePrometheusDuration } from '../../../utils/time.utils';

interface SilenceDrawerEditProps {
  silence: GettableSilence;
  onCancel: () => void;
  onSuccess: () => void;
}

export function SilenceDrawerEdit({ silence, onCancel, onSuccess }: SilenceDrawerEditProps) {
  const [updateSilence, { isLoading: isUpdating, error: updateError }] = useCreateSilence();
  const { error: notifyError } = useAppNotifications();

  const handleSave = async (data: SilenceFormData) => {
    let startsAt: string;
    let endsAt: string;

    if (data.timeMode === 'relative') {
      // Calculate absolute times from relative duration
      const startDate = new Date();
      const durationMs = data.duration ? parsePrometheusDuration(data.duration) : 0;
      const endDate = new Date(startDate.getTime() + durationMs);

      startsAt = startDate.toISOString();
      endsAt = endDate.toISOString();
    } else {
      // Use absolute times
      startsAt = data.startsAt ? new Date(data.startsAt).toISOString() : new Date().toISOString();
      endsAt = data.endsAt ? new Date(data.endsAt).toISOString() : new Date().toISOString();
    }

    const postableData: PostableSilence = {
      matchers: data.matchers,
      startsAt,
      endsAt,
      createdBy: data.createdBy,
      comment: data.comment,
      // Include ID when editing to update the existing silence
      id: silence.id,
    };

    try {
      await updateSilence(postableData);
      onSuccess();
    } catch (err) {
      const feedback = getSilenceMutationErrorFeedback(err, t('silences.edit.error-title', 'Error updating silence'));
      notifyError(feedback.title, feedback.description);
    }
  };

  return (
    <SilenceFormFields
      silence={silence}
      onSubmit={handleSave}
      onCancel={onCancel}
      isLoading={isUpdating}
      error={updateError}
      submitButtonText={
        isUpdating ? t('silences.edit.updating', 'Updating...') : t('silences.edit.submit', 'Update Silence')
      }
      cancelButtonText={t('silences.create.cancel', 'Cancel')}
    />
  );
}
