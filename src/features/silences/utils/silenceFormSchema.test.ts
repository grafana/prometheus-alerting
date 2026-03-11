import { SilenceFormSchema } from './silenceFormSchema';

const validMatcher = { name: 'env', value: 'prod', isRegex: false };

const validRelativeBase = {
  matchers: [validMatcher],
  timeMode: 'relative' as const,
  duration: '2h',
  createdBy: 'admin',
  comment: 'planned maintenance',
};

const validAbsoluteBase = {
  matchers: [validMatcher],
  timeMode: 'absolute' as const,
  startsAt: '2026-01-01T00:00:00Z',
  endsAt: '2026-01-02T00:00:00Z',
  createdBy: 'admin',
  comment: 'planned maintenance',
};

describe('SilenceFormSchema', () => {
  describe('relative time mode', () => {
    it('accepts valid relative silence', () => {
      expect(SilenceFormSchema.safeParse(validRelativeBase).success).toBe(true);
    });

    it('rejects missing duration', () => {
      const result = SilenceFormSchema.safeParse({ ...validRelativeBase, duration: '' });
      expect(result.success).toBe(false);
      const issues = !result.success ? result.error.issues : [];
      expect(issues.some((i) => i.path.includes('duration'))).toBe(true);
    });

    it('rejects invalid duration format', () => {
      const result = SilenceFormSchema.safeParse({ ...validRelativeBase, duration: 'not-a-duration' });
      expect(result.success).toBe(false);
      const issues = !result.success ? result.error.issues : [];
      expect(issues.some((i) => i.path.includes('duration'))).toBe(true);
    });
  });

  describe('absolute time mode', () => {
    it('accepts valid absolute silence', () => {
      expect(SilenceFormSchema.safeParse(validAbsoluteBase).success).toBe(true);
    });

    it('rejects missing startsAt', () => {
      const result = SilenceFormSchema.safeParse({ ...validAbsoluteBase, startsAt: '' });
      expect(result.success).toBe(false);
      const issues = !result.success ? result.error.issues : [];
      expect(issues.some((i) => i.path.includes('startsAt'))).toBe(true);
    });

    it('rejects missing endsAt', () => {
      const result = SilenceFormSchema.safeParse({ ...validAbsoluteBase, endsAt: '' });
      expect(result.success).toBe(false);
      const issues = !result.success ? result.error.issues : [];
      expect(issues.some((i) => i.path.includes('endsAt'))).toBe(true);
    });

    it('rejects end time before start time', () => {
      const result = SilenceFormSchema.safeParse({
        ...validAbsoluteBase,
        startsAt: '2026-01-02T00:00:00Z',
        endsAt: '2026-01-01T00:00:00Z',
      });
      expect(result.success).toBe(false);
      const issues = !result.success ? result.error.issues : [];
      expect(issues.some((i) => i.message === 'End time must be after start time')).toBe(true);
    });

    it('rejects end time equal to start time', () => {
      const result = SilenceFormSchema.safeParse({
        ...validAbsoluteBase,
        startsAt: '2026-01-01T00:00:00Z',
        endsAt: '2026-01-01T00:00:00Z',
      });
      expect(result.success).toBe(false);
      const issues = !result.success ? result.error.issues : [];
      expect(issues.some((i) => i.message === 'End time must be after start time')).toBe(true);
    });
  });

  describe('common field validation', () => {
    it('rejects empty matchers array', () => {
      const result = SilenceFormSchema.safeParse({ ...validRelativeBase, matchers: [] });
      expect(result.success).toBe(false);
    });

    it('rejects matcher with empty name', () => {
      const result = SilenceFormSchema.safeParse({
        ...validRelativeBase,
        matchers: [{ name: '', value: 'val', isRegex: false }],
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty createdBy', () => {
      const result = SilenceFormSchema.safeParse({ ...validRelativeBase, createdBy: '' });
      expect(result.success).toBe(false);
    });

    it('rejects empty comment', () => {
      const result = SilenceFormSchema.safeParse({ ...validRelativeBase, comment: '' });
      expect(result.success).toBe(false);
    });
  });
});
