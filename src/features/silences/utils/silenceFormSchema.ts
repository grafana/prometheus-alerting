
import { z } from 'zod';
import { isValidPrometheusDuration } from '../../../utils/time.utils';

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
    timeMode: z.enum(['relative', 'absolute']),
    // For relative mode
    duration: z.string().optional(),
    // For absolute mode
    startsAt: z.string().optional(),
    endsAt: z.string().optional(),
    createdBy: z.string().min(1, 'Created by is required'),
    comment: z.string().min(1, 'Comment is required'),
  })
  .superRefine((data, ctx) => {
    if (data.timeMode === 'relative') {
      if (!data.duration || data.duration.trim() === '') {
        ctx.addIssue({
          code: 'custom',
          message: 'Duration is required',
          path: ['duration'],
        });
      } else if (!isValidPrometheusDuration(data.duration)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Invalid duration format. Use combinations like 1h, 30m, 2h30m, 1d, 1w',
          path: ['duration'],
        });
      }
    } else {
      // Absolute mode
      if (!data.startsAt || data.startsAt.trim() === '') {
        ctx.addIssue({
          code: 'custom',
          message: 'Start time is required',
          path: ['startsAt'],
        });
      }
      if (!data.endsAt || data.endsAt.trim() === '') {
        ctx.addIssue({
          code: 'custom',
          message: 'End time is required',
          path: ['endsAt'],
        });
      }
      if (data.startsAt && data.endsAt) {
        const start = new Date(data.startsAt);
        const end = new Date(data.endsAt);
        if (end <= start) {
          ctx.addIssue({
            code: 'custom',
            message: 'End time must be after start time',
            path: ['endsAt'],
          });
        }
      }
    }
  });

export type SilenceFormData = z.infer<typeof SilenceFormSchema>;
