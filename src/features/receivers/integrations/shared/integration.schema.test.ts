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
});
