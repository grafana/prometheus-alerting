import React from 'react';
import { testIds } from '../../components/testIds';
import { PluginPage } from '@grafana/runtime';
import { InteractiveTable } from '@grafana/ui';
import type { Receiver } from '@grafana/prometheus-alerting';

const mockReceivers: Receiver[] = [
  { name: 'slack-notifications' },
  { name: 'pagerduty-critical' },
  { name: 'email-team' },
  { name: 'webhook-ops' },
  { name: 'discord-alerts' },
];

function ReceiversPage() {
  const columns = [
    {
      id: 'name',
      header: 'Name',
      cell: ({ row: { original } }: { row: { original: Receiver } }) => original.name,
    },
  ];

  return (
    <PluginPage>
      <div data-testid={testIds.receivers.container}>
        <InteractiveTable columns={columns} data={mockReceivers} getRowId={(receiver) => receiver.name} />
      </div>
    </PluginPage>
  );
}

export default ReceiversPage;
