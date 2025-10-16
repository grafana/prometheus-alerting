import { AppEvents } from '@grafana/data';
import { t } from '@grafana/i18n';
import { getAppEvents } from '@grafana/runtime';

/**
 * Copy text to clipboard and show a success notification
 */
export function copyToClipboard(text: string): void {
  if (!navigator.clipboard) {
    console.warn('Clipboard API not available');
    return;
  }

  navigator.clipboard.writeText(text).then(
    () => {
      const appEvents = getAppEvents();
      appEvents.publish({
        type: AppEvents.alertSuccess.name,
        payload: [t('alerting.clipboard.success', 'URL copied to clipboard')],
      });
    },
    (error) => {
      console.error('Failed to copy to clipboard:', error);
      const appEvents = getAppEvents();
      appEvents.publish({
        type: AppEvents.alertError.name,
        payload: [t('alerting.clipboard.error', 'Failed to copy to clipboard')],
      });
    }
  );
}

