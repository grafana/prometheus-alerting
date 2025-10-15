import { z } from 'zod';

// Form schema for creating a new silence
export const SilenceFormSchema = z
  .object({
    matchers: z
      .array(
        z.object({
          name: z.string().min(1, 'Label name is required'),
          value: z.string().min(1, 'Label value is required'),
          isRegex: z.boolean(),
          isEqual: z.boolean().optional(),
        })
      )
      .min(1, 'At least one matcher is required'),
    startsAt: z.string().min(1, 'Start time is required'),
    endsAt: z.string().min(1, 'End time is required'),
    createdBy: z.string().min(1, 'Created by is required'),
    comment: z.string().min(1, 'Comment is required'),
  })
  .refine(
    (data) => {
      const start = new Date(data.startsAt);
      const end = new Date(data.endsAt);
      return end > start;
    },
    {
      message: 'End time must be after start time',
      path: ['endsAt'],
    }
  );

export type SilenceFormData = z.infer<typeof SilenceFormSchema>;
