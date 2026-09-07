import { test, expect } from '../fixtures/alertmanager';

const WECHAT_BEFORE_CONFIG = `template_files: {}
alertmanager_config: |
  route:
    receiver: wechat-update
  receivers:
    - name: wechat-update
      wechat_configs:
        - api_url: 'https://qyapi.weixin.qq.com/cgi-bin/'
          api_secret: 'before-secret'
          corp_id: 'before-corp'
          agent_id: '1000001'
          to_user: 'before-user'
          to_party: 'before-party'
          to_tag: 'before-tag'
          message: 'Before message'
          message_type: 'markdown'
`;

test.describe('WeChat receiver', () => {
  test.beforeEach(async ({ receiversPage, mimirAlertmanager }) => {
    await receiversPage.gotoWithAlertmanager(mimirAlertmanager.uid);
  });

  test('creates a WeChat receiver with its default and supported fields', async ({ receiversPage }) => {
    await receiversPage.openCreateDrawer();
    await receiversPage.fillName('wechat-create');
    const wechat = await receiversPage.selectWeChatIntegration(0);
    await expect(wechat.messageTypeCombobox).toHaveValue('Text');
    await wechat.fill({
      apiUrl: 'https://qyapi.weixin.qq.com/cgi-bin/',
      apiSecret: 'create-secret',
      corpId: 'create-corp',
      agentId: '1000001',
      toUser: 'created-user',
      toParty: 'created-party',
      toTag: 'created-tag',
      message: 'Created message',
    });
    await expect(wechat.apiSecretInput).toHaveAttribute('type', 'password');
    await receiversPage.submitCreate();

    await expect(receiversPage.getRow('wechat-create')).toBeVisible();
    await receiversPage.openReceiverByName('wechat-create');
    await expect(receiversPage.getViewFieldValue('api_secret')).toHaveText(/^\*+$/);
    await expect(receiversPage.getViewFieldValue('corp_id')).toHaveText('create-corp');
    await expect(receiversPage.getViewFieldValue('to_party')).toHaveText('created-party');
    await expect(receiversPage.getViewFieldValue('to_tag')).toHaveText('created-tag');
    await expect(receiversPage.getViewFieldValue('message_type')).toHaveText('text');
  });

  test('updates WeChat without wiping credentials', async ({ receiversPage, mimirAlertmanager }) => {
    await mimirAlertmanager.seedConfig(WECHAT_BEFORE_CONFIG);
    await receiversPage.gotoWithAlertmanager(mimirAlertmanager.uid);
    await receiversPage.openReceiverByName('wechat-update');
    await receiversPage.startEdit();
    const wechat = await receiversPage.selectWeChatIntegration(0);
    await wechat.fill({
      toUser: 'after-user',
      toParty: 'after-party',
      toTag: 'after-tag',
      message: 'After message',
      messageType: 'Text',
    });
    await receiversPage.submitUpdate();

    await receiversPage.openReceiverByName('wechat-update');
    await expect(receiversPage.getViewFieldValue('api_secret')).toHaveText(/^\*+$/);
    await expect(receiversPage.getViewFieldValue('corp_id')).toHaveText('before-corp');
    await expect(receiversPage.getViewFieldValue('to_user')).toHaveText('after-user');
    await expect(receiversPage.getViewFieldValue('to_party')).toHaveText('after-party');
    await expect(receiversPage.getViewFieldValue('to_tag')).toHaveText('after-tag');
    await expect(receiversPage.getViewFieldValue('message_type')).toHaveText('text');
  });

  test('shows shared HTTP authentication conflicts', async ({ receiversPage }) => {
    await receiversPage.openCreateDrawer();
    await receiversPage.fillName('wechat-conflict');
    await receiversPage.selectWeChatIntegration(0);
    await receiversPage.drawer.getByLabel('Authorization credentials', { exact: true }).fill('authorization-token');
    await receiversPage.drawer.getByLabel('Basic authentication username', { exact: true }).fill('basic-user');
    await receiversPage.submitCreate();

    await expect(
      receiversPage.drawer.getByText('Authorization and basic authentication cannot be used together', {
        exact: true,
      })
    ).toBeVisible();
    await expect(receiversPage.getRow('wechat-conflict')).toBeHidden();
  });
});
