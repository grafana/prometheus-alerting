import { z } from 'zod';

import { createIntegrationFormSchema } from '../shared/integration.schema';
import { createHttpConfigFormSchema } from '../shared/httpConfig.schema';

export function createWeChatSettingsFormSchema() {
  return z.looseObject({
    api_url: z.string().optional(),
    corp_id: z.string().optional(),
    agent_id: z.string().optional(),
    api_secret: z.string().optional(),
    to_user: z.string().optional(),
    to_party: z.string().optional(),
    to_tag: z.string().optional(),
    message: z.string().optional(),
    message_type: z.string().optional(),
    http_config: createHttpConfigFormSchema().optional(),
  });
}
export function createWeChatIntegrationFormSchema() {
  return createIntegrationFormSchema('wechat', createWeChatSettingsFormSchema());
}
export type WeChatSettingsFormValues = z.infer<ReturnType<typeof createWeChatSettingsFormSchema>>;
