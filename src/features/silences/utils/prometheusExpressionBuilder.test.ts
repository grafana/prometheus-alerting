import { prometheusExpressionBuilder, type SilenceFilter } from './prometheusExpressionBuilder';

describe('prometheusExpressionBuilder', () => {
  describe('basic operators', () => {
    it('builds an exact match expression', () => {
      const filters: SilenceFilter[] = [{ key: 'severity', operator: '=', value: 'critical' }];
      expect(prometheusExpressionBuilder(filters)).toBe('severity="critical"');
    });

    it('builds a not-equal expression', () => {
      const filters: SilenceFilter[] = [{ key: 'env', operator: '!=', value: 'production' }];
      expect(prometheusExpressionBuilder(filters)).toBe('env!="production"');
    });

    it('builds a regex match expression', () => {
      const filters: SilenceFilter[] = [{ key: 'env', operator: '=~', value: 'prod.*' }];
      expect(prometheusExpressionBuilder(filters)).toBe('env=~"prod.*"');
    });

    it('builds a negative regex expression', () => {
      const filters: SilenceFilter[] = [{ key: 'env', operator: '!~', value: 'prod.*' }];
      expect(prometheusExpressionBuilder(filters)).toBe('env!~"prod.*"');
    });
  });

  describe('multiple filters', () => {
    it('joins multiple filters with commas', () => {
      const filters: SilenceFilter[] = [
        { key: 'severity', operator: '=', value: 'critical' },
        { key: 'env', operator: '=~', value: 'prod.*' },
      ];
      expect(prometheusExpressionBuilder(filters)).toBe('severity="critical",env=~"prod.*"');
    });

    it('returns empty string for empty filters array', () => {
      expect(prometheusExpressionBuilder([])).toBe('');
    });
  });

  describe('filter exclusions', () => {
    it('excludes nonApplicable filters', () => {
      const filters: SilenceFilter[] = [
        { key: 'severity', operator: '=', value: 'critical', nonApplicable: true },
        { key: 'env', operator: '=', value: 'production' },
      ];
      expect(prometheusExpressionBuilder(filters)).toBe('env="production"');
    });

    it('excludes hidden filters', () => {
      const filters: SilenceFilter[] = [
        { key: 'severity', operator: '=', value: 'critical', hidden: true },
        { key: 'env', operator: '=', value: 'production' },
      ];
      expect(prometheusExpressionBuilder(filters)).toBe('env="production"');
    });

    it('returns empty string when all filters are excluded', () => {
      const filters: SilenceFilter[] = [
        { key: 'severity', operator: '=', value: 'critical', nonApplicable: true },
        { key: 'env', operator: '=', value: 'production', hidden: true },
      ];
      expect(prometheusExpressionBuilder(filters)).toBe('');
    });
  });

  describe('multi-value operators', () => {
    it('converts =| to =~ and joins values as escaped literals', () => {
      const filters: SilenceFilter[] = [{ key: 'env', operator: '=|', value: '', values: ['prod', 'staging'] }];
      expect(prometheusExpressionBuilder(filters)).toBe('env=~"prod|staging"');
    });

    it('converts !=| to !~ and joins values as escaped literals', () => {
      const filters: SilenceFilter[] = [{ key: 'env', operator: '!=|', value: '', values: ['prod', 'staging'] }];
      expect(prometheusExpressionBuilder(filters)).toBe('env!~"prod|staging"');
    });

    it('escapes regex metacharacters in multi-value literals', () => {
      const filters: SilenceFilter[] = [{ key: 'env', operator: '=|', value: '', values: ['prod.us', 'staging+eu'] }];
      expect(prometheusExpressionBuilder(filters)).toBe('env=~"prod\\.us|staging\\+eu"');
    });

    it('returns empty string when values array is empty', () => {
      const filters: SilenceFilter[] = [{ key: 'env', operator: '=|', value: '', values: [] }];
      expect(prometheusExpressionBuilder(filters)).toBe('env=~""');
    });
  });

  describe('value escaping', () => {
    it('escapes double quotes in values', () => {
      const filters: SilenceFilter[] = [{ key: 'msg', operator: '=', value: 'say "hello"' }];
      expect(prometheusExpressionBuilder(filters)).toBe('msg="say \\"hello\\""');
    });

    it('escapes backslashes in values', () => {
      const filters: SilenceFilter[] = [{ key: 'path', operator: '=', value: 'C:\\Users' }];
      expect(prometheusExpressionBuilder(filters)).toBe('path="C:\\\\Users"');
    });

    it('escapes newlines in values', () => {
      const filters: SilenceFilter[] = [{ key: 'msg', operator: '=', value: 'line1\nline2' }];
      expect(prometheusExpressionBuilder(filters)).toBe('msg="line1\\nline2"');
    });

    it('does not escape regex metacharacters for =~ operator', () => {
      const filters: SilenceFilter[] = [{ key: 'env', operator: '=~', value: 'prod.*|staging.+' }];
      expect(prometheusExpressionBuilder(filters)).toBe('env=~"prod.*|staging.+"');
    });

    it('returns empty string value for undefined/empty value', () => {
      const filters: SilenceFilter[] = [{ key: 'env', operator: '=', value: '' }];
      expect(prometheusExpressionBuilder(filters)).toBe('env=""');
    });
  });
});
