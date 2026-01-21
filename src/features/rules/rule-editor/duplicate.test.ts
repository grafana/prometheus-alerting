import { generateCopiedName } from './duplicate';

describe('generateCopiedName', () => {
  it('should append (copy) to a simple name', () => {
    const result = generateCopiedName('My Alert', []);
    expect(result).toBe('My Alert (copy)');
  });

  it('should append (copy 2) if (copy) exists', () => {
    const result = generateCopiedName('My Alert', ['My Alert', 'My Alert (copy)']);
    expect(result).toBe('My Alert (copy 2)');
  });

  it('should find the next available index', () => {
    const existing = ['My Alert', 'My Alert (copy)', 'My Alert (copy 2)', 'My Alert (copy 3)'];
    const result = generateCopiedName('My Alert', existing);
    expect(result).toBe('My Alert (copy 4)');
  });

  it('should handle cloning a name that is already a copy', () => {
    // Cloning "My Alert (copy)" when it exists in the list
    const existing = ['My Alert', 'My Alert (copy)'];
    const result = generateCopiedName('My Alert (copy)', existing);
    expect(result).toBe('My Alert (copy 2)');
  });

  it('should handle cloning a name with index that is already a copy', () => {
    // Cloning "My Alert (copy 2)" when it exists in the list
    const existing = ['My Alert', 'My Alert (copy)', 'My Alert (copy 2)'];
    const result = generateCopiedName('My Alert (copy 2)', existing);
    expect(result).toBe('My Alert (copy 3)');
  });

  it('should fill in a gap if one exists', () => {
    const existing = ['My Alert (copy)', 'My Alert (copy 3)'];
    const result = generateCopiedName('My Alert', existing);
    expect(result).toBe('My Alert (copy 2)');
  });

  it('should handle names with parentheses that are not copy suffixes', () => {
    const result = generateCopiedName('func()', []);
    expect(result).toBe('func() (copy)');
  });

  it('should handle names ending in "copy" without parens', () => {
    const result = generateCopiedName('Do copy', []);
    expect(result).toBe('Do copy (copy)');
  });

  it('should handle names with multiple (copy) strings correctly', () => {
    // Should only remove the last one if it matches exactly
    const result = generateCopiedName('Test (copy) (copy)', ['Test (copy)']);
    // Removes last (copy) -> "Test (copy)"
    // Tries "Test (copy) (copy)" -> checks existing
    expect(result).toBe('Test (copy) (copy)');
  });
});
