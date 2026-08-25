/**
 * Notifier type definitions for Mimir/Prometheus Alertmanager receivers.
 * Ported and adapted from Grafana core's cloud-alertmanager-notifier-types.ts
 */

export interface NotificationChannelOption {
  propertyName: string;
  label: string;
  description: string;
  element?:
    | 'input'
    | 'textarea'
    | 'checkbox'
    | 'select'
    | 'subform'
    | 'subform_array'
    | 'string_array'
    | 'key_value_map';
  inputType?: string;
  placeholder?: string;
  required?: boolean;
  /** Field path whose non-empty value makes this field optional. */
  requiredUnless?: { fieldPath: string };
  mutuallyExclusiveWith?: Array<{ fieldPath: string; label: string }>;
  validationRule?: string;
  defaultValue?: unknown;
  selectOptions?: Array<{ label: string; value: string }>;
  subformOptions?: NotificationChannelOption[];
  setValueAs?: (value: unknown) => unknown;
}

export interface NotifierDTO {
  name: string;
  description: string;
  type: string;
  info: string;
  heading: string;
  options: NotificationChannelOption[];
}

function option(
  propertyName: string,
  label: string,
  description: string,
  extra: Partial<NotificationChannelOption> = {}
): NotificationChannelOption {
  return {
    propertyName,
    label,
    description,
    ...extra,
  };
}

const authorizationTypePlaceholder = 'Bearer';
const credentialsLabel = 'Credentials';
const credentialsFileLabel = 'Credentials file';
const usernameLabel = 'Username';
const passwordLabel = 'Password';

// Alertmanager makes HTTP authorization and basic auth mutually exclusive for every integration.
const authorizationFields = [
  { fieldPath: 'http_config.authorization.credentials', label: credentialsLabel },
  { fieldPath: 'http_config.authorization.credentials_file', label: credentialsFileLabel },
];

const basicAuthFields = [
  { fieldPath: 'http_config.basic_auth.username', label: usernameLabel },
  { fieldPath: 'http_config.basic_auth.password', label: passwordLabel },
];

const basicAuthOption: NotificationChannelOption = option(
  'basic_auth',
  'Basic auth',
  'Sets the Authorization header with the configured username and password.',
  {
    element: 'subform',
    subformOptions: [
      option('username', 'Username', '', { mutuallyExclusiveWith: authorizationFields }),
      option('password', 'Password', '', { mutuallyExclusiveWith: authorizationFields }),
    ],
  }
);

const tlsConfigOption: NotificationChannelOption = option('tls_config', 'TLS config', 'Configures the TLS settings.', {
  element: 'subform',
  subformOptions: [
    option('ca_file', 'CA file', 'CA certificate to validate the server certificate with.'),
    option('cert_file', 'Cert file', 'Certificate for client cert authentication to the server.'),
    option('key_file', 'Key file', 'Key file for client cert authentication to the server.'),
    option('server_name', 'Server name', 'ServerName extension to indicate the name of the server.'),
    option('insecure_skip_verify', 'Skip verify', 'Disable validation of the server certificate.', {
      element: 'checkbox',
    }),
  ],
});

function createAuthorizationOption(credentialsRequired = false): NotificationChannelOption {
  return option('authorization', 'Authorization', 'Configures HTTP authorization credentials.', {
    element: 'subform',
    subformOptions: [
      option('type', 'Authorization type', 'HTTP authorization scheme.', { placeholder: authorizationTypePlaceholder }),
      option('credentials', 'Credentials', 'Authorization credentials.', {
        required: credentialsRequired,
        requiredUnless: credentialsRequired ? { fieldPath: 'http_config.authorization.credentials_file' } : undefined,
        mutuallyExclusiveWith: [
          { fieldPath: 'http_config.authorization.credentials_file', label: credentialsFileLabel },
          ...basicAuthFields,
        ],
      }),
      option('credentials_file', 'Credentials file', 'Path to a file containing authorization credentials.', {
        mutuallyExclusiveWith: [
          { fieldPath: 'http_config.authorization.credentials', label: credentialsLabel },
          ...basicAuthFields,
        ],
      }),
    ],
  });
}

interface HttpConfigOptionOptions {
  authorizationCredentialsRequired?: boolean;
}

function createHttpConfigOption({ authorizationCredentialsRequired = false }: HttpConfigOptionOptions = {}) {
  return option(
    'http_config',
    'HTTP Config',
    'Note that authorization, basic_auth, and oauth2 options are mutually exclusive.',
    {
      element: 'subform',
      subformOptions: [
        createAuthorizationOption(authorizationCredentialsRequired),
        option('proxy_url', 'Proxy URL', 'Optional proxy URL.'),
        basicAuthOption,
        tlsConfigOption,
      ],
    }
  );
}

const httpConfigOption = createHttpConfigOption();

/**
 * All available notifier types for cloud/mimir alertmanager.
 */
export const cloudNotifierTypes: NotifierDTO[] = [
  {
    name: 'Email',
    description: 'Send notification over SMTP',
    type: 'email',
    info: '',
    heading: 'Email settings',
    options: [
      option(
        'to',
        'To',
        'The email address to send notifications to. You can enter multiple addresses using a "," separator',
        { required: true }
      ),
      option('from', 'From', 'The sender address.'),
      option('smarthost', 'SMTP host', 'The SMTP host through which emails are sent.'),
      option('hello', 'Hello', 'The hostname to identify to the SMTP server.'),
      option('auth_username', 'Username', 'SMTP authentication information'),
      option('auth_password', 'Password', 'SMTP authentication information'),
      option('require_tls', 'Require TLS', 'The SMTP TLS requirement', { element: 'checkbox' }),
      option('html', 'Email HTML body', 'The HTML body of the email notification.', {
        placeholder: '{{ template "email.default.html" . }}',
        element: 'textarea',
      }),
      option('text', 'Email text body', 'The text body of the email notification.', { element: 'textarea' }),
      tlsConfigOption,
    ],
  },
  {
    name: 'Webhook',
    description: 'Send notifications to a webhook',
    type: 'webhook',
    info: '',
    heading: 'Webhook settings',
    options: [
      option('url', 'URL', 'The endpoint to send HTTP POST requests to.', { required: true }),
      option(
        'max_alerts',
        'Max alerts',
        'The maximum number of alerts to include in a single webhook message. Alerts above this threshold are truncated. When leaving this at its default value of 0, all alerts are included.',
        {
          placeholder: '0',
          inputType: 'number',
          setValueAs: (value) => {
            const integer = Number(value);
            return Number.isFinite(integer) ? integer : 0;
          },
        }
      ),
      httpConfigOption,
    ],
  },
  {
    name: 'Slack',
    description: 'Send notifications to Slack',
    type: 'slack',
    info: '',
    heading: 'Slack settings',
    options: [
      option('api_url', 'Webhook URL', 'The Slack webhook URL.'),
      option('channel', 'Channel', 'The #channel or @user to send notifications to.', { required: true }),
      option('icon_emoji', 'Emoji icon', ''),
      option('icon_url', 'Icon URL', ''),
      option('username', 'Username', '', { placeholder: '{{ template "slack.default.username" . }}' }),
      option('title', 'Title', '', { placeholder: '{{ template "slack.default.title" . }}' }),
      option('text', 'Message body', '', { element: 'textarea', placeholder: '{{ template "slack.default.text" . }}' }),
      httpConfigOption,
    ],
  },
  {
    name: 'PagerDuty',
    description: 'Send notifications to PagerDuty',
    type: 'pagerduty',
    info: '',
    heading: 'PagerDuty settings',
    options: [
      option('routing_key', 'Routing key', 'The PagerDuty integration key (when using Events API v2)'),
      option('service_key', 'Service key', 'The PagerDuty integration key (when using Prometheus integration type).'),
      option('url', 'URL', 'The URL to send API requests to'),
      option('client', 'Client', 'The client identification of the Alertmanager.', {
        placeholder: '{{ template "pagerduty.default.client" . }}',
      }),
      option('description', 'Description', 'A description of the incident.', {
        placeholder: '{{ template "pagerduty.default.description" .}}',
      }),
      option('severity', 'Severity', 'Severity of the incident.', { placeholder: 'error' }),
      option('details', 'Details', 'A set of arbitrary key/value pairs that provide further detail.', {
        element: 'key_value_map',
      }),
      httpConfigOption,
    ],
  },
  {
    name: 'OpsGenie',
    description: 'Send notifications to OpsGenie',
    type: 'opsgenie',
    info: '',
    heading: 'OpsGenie settings',
    options: [
      option('api_key', 'API key', 'The API key to use when talking to the OpsGenie API.'),
      option('api_url', 'API URL', 'The host to send OpsGenie API requests to.'),
      option('message', 'Message', 'Alert text limited to 130 characters.'),
      option('description', 'Description', 'A description of the incident.', {
        placeholder: '{{ template "opsgenie.default.description" . }}',
      }),
      option('priority', 'Priority', 'Priority level of alert. Possible values are P1, P2, P3, P4, and P5.'),
      option('tags', 'Tags', 'Comma separated list of tags attached to the notifications.'),
      httpConfigOption,
    ],
  },
  {
    name: 'Discord',
    description: 'Sends notifications to Discord',
    type: 'discord',
    info: '',
    heading: 'Discord settings',
    options: [
      option('title', 'Title', 'Templated title of the message', {
        placeholder: '{{ template "discord.default.title" . }}',
      }),
      option(
        'message',
        'Message Content',
        'Mention a group using @ or a user using <@ID> when notifying in a channel',
        {
          placeholder: '{{ template "discord.default.message" . }}',
        }
      ),
      option('webhook_url', 'Webhook URL', '', { placeholder: 'Discord webhook URL', required: true }),
      httpConfigOption,
    ],
  },
  {
    name: 'Microsoft Teams',
    description: 'Sends notifications to Microsoft Teams',
    type: 'msteams',
    info: '',
    heading: 'Microsoft Teams settings',
    options: [
      option('webhook_url', 'Webhook URL', 'The incoming webhook URL.', { required: true }),
      option('title', 'Title', 'Message title template.', {
        placeholder: '{{ template "teams.default.title" . }}',
      }),
      option('text', 'Text', 'Message body template.', {
        placeholder: '{{ template "teams.default.text" . }}',
      }),
    ],
  },
  {
    name: 'Telegram',
    description: 'Sends notifications to Telegram',
    type: 'telegram',
    info: '',
    heading: 'Telegram settings',
    options: [
      option('bot_token', 'Bot token', 'Telegram bot token', { required: true }),
      option('chat_id', 'Chat ID', 'ID of the chat where to send the messages', {
        required: true,
        setValueAs: (value) => (typeof value === 'string' ? parseInt(value, 10) : value),
      }),
      option('api_url', 'API URL', 'The Telegram API URL', { placeholder: 'https://api.telegram.org' }),
      option('message', 'Message', 'Message template', {
        placeholder: '{{ template "telegram.default.message" .}}',
      }),
      option('parse_mode', 'Parse mode', 'Parse mode for telegram message', {
        element: 'select',
        defaultValue: { label: 'None', value: '' },
        selectOptions: [
          { label: 'None', value: '' },
          { label: 'MarkdownV2', value: 'MarkdownV2' },
          { label: 'Markdown', value: 'Markdown' },
          { label: 'HTML', value: 'HTML' },
        ],
      }),
      httpConfigOption,
    ],
  },
  {
    name: 'Pushover',
    description: 'Send notifications to Pushover',
    type: 'pushover',
    info: '',
    heading: 'Pushover settings',
    options: [
      option('user_key', 'User key', 'The recipient user key.', { required: true }),
      option('token', 'Token', 'Your registered application API token', { required: true }),
      option('title', 'Title', 'Notification title.', { placeholder: '{{ template "pushover.default.title" . }}' }),
      option('message', 'Message', 'Notification message.', {
        placeholder: '{{ template "pushover.default.message" . }}',
      }),
      option('priority', 'Priority', 'Priority, see https://pushover.net/api#priority', {
        placeholder: '{{ if eq .Status "firing" }}2{{ else }}0{{ end }}',
      }),
      httpConfigOption,
    ],
  },
  {
    name: 'VictorOps',
    description: 'Send notifications to VictorOps',
    type: 'victorops',
    info: '',
    heading: 'VictorOps settings',
    options: [
      option('api_key', 'API key', 'The API key to use when talking to the VictorOps API.'),
      option('api_url', 'API URL', 'The VictorOps API URL.'),
      option('routing_key', 'Routing key', 'A key used to map the alert to a team.', { required: true }),
      option('message_type', 'Message type', 'Describes the behavior of the alert (CRITICAL, WARNING, INFO).'),
      option('entity_display_name', 'Entity display name', 'Contains summary of the alerted problem.', {
        placeholder: '{{ template "victorops.default.entity_display_name" . }}',
      }),
      httpConfigOption,
    ],
  },
  {
    name: 'Amazon SNS',
    description: 'Sends notifications to Amazon SNS',
    type: 'sns',
    info: '',
    heading: 'Amazon SNS settings',
    options: [
      option('api_url', 'API URL', 'The Amazon SNS API URL'),
      option(
        'topic_arn',
        'SNS topic ARN',
        "If you don't specify this value, you must specify phone_number or target_arn"
      ),
      option('phone_number', 'Phone number', 'Phone number for SMS delivery in E.164 format'),
      option('target_arn', 'Target ARN', 'The mobile platform endpoint ARN for mobile notifications'),
      option('subject', 'Subject', 'Subject line when the message is delivered', {
        placeholder: '{{ template "sns.default.subject" .}}',
      }),
      option('message', 'Message', 'The message content of the SNS notification', {
        placeholder: '{{ template "sns.default.message" .}}',
      }),
      httpConfigOption,
    ],
  },
  {
    name: 'Cisco Webex Teams',
    description: 'Sends notifications to Cisco Webex Teams',
    type: 'webex',
    info: '',
    heading: 'Cisco Webex Teams settings',
    options: [
      option('api_url', 'API URL', 'The Webex Teams API URL', { placeholder: 'https://webexapis.com/v1/messages' }),
      option('room_id', 'Room ID', 'ID of the Webex Teams room where to send the messages', { required: true }),
      option('message', 'Message', 'Message template', { placeholder: '{{ template "webex.default.message" .}}' }),
      createHttpConfigOption({ authorizationCredentialsRequired: true }),
    ],
  },
  {
    name: 'WeChat',
    description: 'Sends notifications to WeChat',
    type: 'wechat',
    info: '',
    heading: 'WeChat settings',
    options: [
      option('api_url', 'API URL', 'The WeChat API URL'),
      option('api_secret', 'API Secret', 'The API key to use when talking to the WeChat API'),
      option('corp_id', 'Corp ID', 'The corp id for authentication'),
      option('agent_id', 'Agent ID', ''),
      option('to_user', 'To user', ''),
      option('message', 'Message', 'API request data as defined by the WeChat API', {
        placeholder: '{{ template "wechat.default.message" . }}',
      }),
      option('message_type', 'Message type', 'Type of the message type', {
        element: 'select',
        defaultValue: { label: 'Text', value: 'text' },
        selectOptions: [
          { label: 'Text', value: 'text' },
          { label: 'Markdown', value: 'markdown' },
        ],
      }),
    ],
  },
];

/**
 * Get notifier definition by type
 */
export function getNotifierByType(type: string): NotifierDTO | undefined {
  return cloudNotifierTypes.find((n) => n.type === type);
}

/**
 * Get all notifier types as options for a dropdown
 */
export function getNotifierTypeOptions(): Array<{ label: string; value: string; description: string }> {
  return cloudNotifierTypes.map((n) => ({
    label: n.name,
    value: n.type,
    description: n.description,
  }));
}
