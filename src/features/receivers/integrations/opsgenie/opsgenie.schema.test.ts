import { describe, expect, it } from '@rstest/core';
import { z } from 'zod';

import { createOpsgenieSettingsFormSchema, createOpsgenieSettingsSchema } from './opsgenie.schema';

function messagesFor(responders: unknown, schema: z.ZodType = createOpsgenieSettingsFormSchema()) {
  const result = schema.safeParse({ api_key: 'key', responders });
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('createOpsgenieSettingsFormSchema, responders', () => {
  it('accepts a responder that says who it is', () => {
    expect(messagesFor([{ id: '1', type: 'team' }])).toEqual([]);
    expect(messagesFor([{ username: 'someone', type: 'user' }])).toEqual([]);
  });

  it('asks who the responder is when nothing identifies them', () => {
    expect(messagesFor([{ type: 'team' }])).toEqual(['Every responder needs an ID, username, or name']);
  });

  it('rejects a kind of responder Opsgenie does not have', () => {
    expect(messagesFor([{ id: '1', type: 'robot' }])).toEqual([
      'Responder type must be team, teams, user, escalation, or schedule',
    ]);
  });

  // Alertmanager lowercases the type before it checks, so we should not be fussier than that.
  it('does not mind how the type is capitalised', () => {
    expect(messagesFor([{ id: '1', type: 'TEAM' }])).toEqual([]);
  });

  // A templated type is only known once an alert renders it, so it goes through untouched.
  it('leaves a templated type alone', () => {
    expect(messagesFor([{ id: '1', type: '{{ .CommonLabels.team }}' }])).toEqual([]);
  });

  it('leaves a loaded config alone', () => {
    expect(messagesFor([{ type: 'team' }], createOpsgenieSettingsSchema())).toEqual([]);
  });
});
