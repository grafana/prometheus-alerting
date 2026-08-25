import { HTTPConfigSchema, type Receiver } from '@grafana/external-alertmanager/vanilla';

import { createDefaultIntegration, formValuesToReceiver, receiverToFormValues } from './receiverFormTransform';

describe('HTTPConfigSchema', () => {
  it('preserves deprecated bearer-token fields until the receiver form normalizes them', () => {
    expect(HTTPConfigSchema.parse({ bearer_token: 'legacy-token' })).toEqual({ bearer_token: 'legacy-token' });
    expect(HTTPConfigSchema.parse({ bearer_token: '', bearer_token_file: '/var/run/secrets/token' })).toEqual({
      bearer_token: '',
      bearer_token_file: '/var/run/secrets/token',
    });
  });
});

describe('receiverToFormValues', () => {
  it('converts a legacy bearer token to Bearer authorization credentials without mutating the receiver', () => {
    const receiver = {
      name: 'webex',
      webex_configs: [
        {
          room_id: 'room-id',
          http_config: {
            bearer_token: 'legacy-token',
          },
        },
      ],
    } satisfies Receiver;

    const formValues = receiverToFormValues(receiver);

    expect(formValues.integrations[0].settings).toEqual({
      room_id: 'room-id',
      http_config: {
        authorization: {
          type: 'Bearer',
          credentials: 'legacy-token',
        },
      },
    });
    expect(receiver.webex_configs?.[0].http_config).toEqual({ bearer_token: 'legacy-token' });
  });

  it('converts a legacy bearer token file to Bearer authorization credentials-file', () => {
    const receiver = {
      name: 'webhook',
      webhook_configs: [
        {
          url: 'https://example.com/webhook',
          http_config: {
            bearer_token_file: '/var/run/secrets/token',
          },
        },
      ],
    } satisfies Receiver;

    const formValues = receiverToFormValues(receiver);

    expect(formValues.integrations[0].settings).toEqual({
      url: 'https://example.com/webhook',
      http_config: {
        authorization: {
          type: 'Bearer',
          credentials_file: '/var/run/secrets/token',
        },
      },
    });
    expect(formValuesToReceiver(formValues)).toEqual({
      name: 'webhook',
      webhook_configs: [
        {
          send_resolved: true,
          url: 'https://example.com/webhook',
          http_config: {
            authorization: {
              type: 'Bearer',
              credentials_file: '/var/run/secrets/token',
            },
          },
        },
      ],
    });
  });

  it('prefers a non-empty legacy token-file over an empty token', () => {
    const receiver = {
      name: 'webex',
      webex_configs: [
        {
          room_id: 'room-id',
          http_config: {
            bearer_token: '',
            bearer_token_file: '/var/run/secrets/token',
          },
        },
      ],
    } satisfies Receiver;

    const formValues = receiverToFormValues(receiver);

    expect(formValues.integrations[0].settings).toEqual({
      room_id: 'room-id',
      http_config: {
        authorization: {
          type: 'Bearer',
          credentials_file: '/var/run/secrets/token',
        },
      },
    });
  });

  it('preserves modern authorization when legacy and modern values coexist', () => {
    const receiver = {
      name: 'webex',
      webex_configs: [
        {
          room_id: 'room-id',
          http_config: {
            bearer_token: 'legacy-token',
            authorization: {
              type: 'Custom',
              credentials: 'modern-token',
            },
          },
        },
      ],
    } satisfies Receiver;

    const formValues = receiverToFormValues(receiver);

    expect(formValues.integrations[0].settings).toEqual({
      room_id: 'room-id',
      http_config: {
        authorization: {
          type: 'Custom',
          credentials: 'modern-token',
        },
      },
    });
  });
});

describe('createDefaultIntegration', () => {
  it('does not add an incomplete authorization block', () => {
    expect(createDefaultIntegration('webex').settings).toEqual({});
  });
});

describe('formValuesToReceiver', () => {
  it('keeps modern authorization in the receiver configuration', () => {
    const receiver = formValuesToReceiver({
      name: 'webex',
      integrations: [
        {
          __id: 'webex-1',
          type: 'webex',
          sendResolved: true,
          settings: {
            room_id: 'room-id',
            http_config: {
              authorization: {
                type: 'Bearer',
                credentials: 'modern-token',
              },
            },
          },
        },
      ],
    });

    expect(receiver).toEqual({
      name: 'webex',
      webex_configs: [
        {
          send_resolved: true,
          room_id: 'room-id',
          http_config: {
            authorization: {
              type: 'Bearer',
              credentials: 'modern-token',
            },
          },
        },
      ],
    });
  });

  it('omits an authorization block without credentials for optional integrations', () => {
    const receiver = formValuesToReceiver({
      name: 'webhook',
      integrations: [
        {
          __id: 'webhook-1',
          type: 'webhook',
          sendResolved: true,
          settings: {
            url: 'https://example.com/webhook',
            http_config: {
              authorization: {
                type: 'Bearer',
              },
            },
          },
        },
      ],
    });

    expect(receiver).toEqual({
      name: 'webhook',
      webhook_configs: [
        {
          send_resolved: true,
          url: 'https://example.com/webhook',
        },
      ],
    });
  });
});
