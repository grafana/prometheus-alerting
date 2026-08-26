import { describe, expect, it } from 'vitest';

import { createReceiverFormSchema } from '../../utils/receiverFormSchema';

const schema = createReceiverFormSchema();

function parse(integration: unknown) {
  return schema.safeParse({ name: 'a receiver', integrations: [integration] });
}

describe('integration form schema', () => {
  it('still tells integrations apart by type', () => {
    expect(parse({ type: 'discord', sendResolved: true, settings: { webhook_url: 'http://hook' } }).success).toBe(true);
    expect(parse({ type: 'wechat', sendResolved: false, settings: {} }).success).toBe(true);
  });

  it('rejects a type the form does not know', () => {
    expect(parse({ type: 'carrier-pigeon', sendResolved: true, settings: {} }).success).toBe(false);
  });

  it('applies the settings rules belonging to the chosen type', () => {
    // Discord needs a webhook URL; the same empty settings are fine for WeChat.
    const discord = parse({ type: 'discord', sendResolved: true, settings: {} });
    expect(discord.success).toBe(false);
    expect(discord.success ? [] : discord.error.issues.map((issue) => issue.message)).toContain(
      'Webhook URL is required'
    );
    expect(parse({ type: 'wechat', sendResolved: true, settings: {} }).success).toBe(true);
  });

  it('requires sendResolved', () => {
    expect(parse({ type: 'wechat', settings: {} }).success).toBe(false);
  });

  describe('URL fields', () => {
    const withUrl = (webhook_url: string) => parse({ type: 'discord', sendResolved: true, settings: { webhook_url } });

    it('reports a value that is not a URL on the field itself', () => {
      const result = withUrl('*************');
      expect(result.success).toBe(false);
      const issues = result.success ? [] : result.error.issues;
      expect(issues.map((issue) => issue.path.join('.'))).toContain('integrations.0.settings.webhook_url');
      expect(issues.map((issue) => issue.message)).toContain('Webhook URL must start with http:// or https://');
    });

    it('accepts the hosts Alertmanager accepts', () => {
      for (const url of [
        'https://discord.example/api/webhooks/1/abc',
        'http://localhost:9093',
        'http://10.0.0.5:8080/hook',
        'http://alertmanager',
        'http://webhook.default.svc.cluster.local:8080/x',
      ]) {
        expect(withUrl(url).success, url).toBe(true);
      }
    });

    it('rejects a scheme Alertmanager cannot use', () => {
      expect(withUrl('ftp://files.example').success).toBe(false);
      expect(withUrl('discord.example/hook').success).toBe(false);
    });

    it('leaves the empty case to the settings schema', () => {
      // Empty means "required" here, not "malformed" - one message, not two.
      const issues = (() => {
        const r = withUrl('');
        return r.success ? [] : r.error.issues.map((i) => i.message);
      })();
      expect(issues).toEqual(['Webhook URL is required']);
    });
  });
});
