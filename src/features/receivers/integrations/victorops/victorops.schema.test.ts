import { describe, expect, it } from 'vitest';

import { createVictorOpsSettingsFormSchema } from './victorops.schema';

function messagesFor(customFields: Record<string, string>) {
  const result = createVictorOpsSettingsFormSchema().safeParse({
    api_key: 'key',
    routing_key: 'routing',
    custom_fields: customFields,
  });
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('createVictorOpsSettingsFormSchema, custom fields', () => {
  it('accepts a name of its own', () => {
    expect(messagesFor({ runbook: 'https://example.com' })).toEqual([]);
  });

  // VictorOps already sends these keys, so reusing one collides with what it puts in the payload.
  it.each([
    'routing_key',
    'message_type',
    'state_message',
    'entity_display_name',
    'monitoring_tool',
    'entity_id',
    'entity_state',
  ])('rejects the reserved name %s', (field) => {
    expect(messagesFor({ [field]: 'value' })).toEqual(['Custom fields cannot use a name VictorOps already sends']);
  });
});
