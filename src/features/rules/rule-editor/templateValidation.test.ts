import { hasUnbalancedTemplateDelimiters } from './templateValidation';

describe('hasUnbalancedTemplateDelimiters', () => {
  it('accepts a value with no templates at all', () => {
    expect(hasUnbalancedTemplateDelimiters('a plain description')).toBe(false);
  });

  it('accepts a value with a balanced template', () => {
    expect(hasUnbalancedTemplateDelimiters('{{ $labels.instance }} is down')).toBe(false);
  });

  it('accepts a value with more than one balanced template', () => {
    expect(hasUnbalancedTemplateDelimiters('{{ $labels.instance }} on {{ $labels.job }}')).toBe(false);
  });

  it('flags a template that is never closed', () => {
    expect(hasUnbalancedTemplateDelimiters('{{ $labels.instance }} on {{ $labels.job')).toBe(true);
  });

  it('flags a stray closing delimiter with nothing to match it', () => {
    expect(hasUnbalancedTemplateDelimiters('$labels.instance }} is down')).toBe(true);
  });

  it('treats an empty string as balanced', () => {
    expect(hasUnbalancedTemplateDelimiters('')).toBe(false);
  });
});
