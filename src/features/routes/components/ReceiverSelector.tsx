import React, { useEffect, useMemo } from 'react';

import { t } from '@grafana/i18n';
import { Combobox, ComboboxOption } from '@grafana/ui';
import type { Receiver } from '@grafana/external-alertmanager/vanilla';

import { useReceivers } from '../../receivers/hooks/useReceivers';

interface ReceiverSelectorProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
}

/**
 * A dropdown selector for Alertmanager receivers.
 * Fetches available receivers and displays them in a combobox.
 */
export function ReceiverSelector({ value, onChange, disabled }: ReceiverSelectorProps) {
  const [triggerFetchReceivers, { receivers = [], isLoading }] = useReceivers();

  // Fetch receivers on mount
  useEffect(() => {
    triggerFetchReceivers();
  }, [triggerFetchReceivers]);

  const options: Array<ComboboxOption<string>> = useMemo(
    () =>
      receivers.map((receiver: Receiver) => ({
        label: receiver.name,
        value: receiver.name,
      })),
    [receivers]
  );

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <Combobox
      value={selectedOption?.value ? selectedOption : value ? { label: value, value } : undefined}
      options={options}
      onChange={(option) => onChange(option?.value as string | undefined)}
      loading={isLoading}
      disabled={disabled}
      placeholder={t('routes.edit.receiver-placeholder', 'Select a receiver')}
      isClearable
      width={42}
    />
  );
}
