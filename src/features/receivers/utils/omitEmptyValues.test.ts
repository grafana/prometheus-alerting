import { omitEmptyValues } from './omitEmptyValues';

describe('omitEmptyValues', () => {
  it('removes empty array entries while preserving false, zero, and the empty array itself', () => {
    expect(
      omitEmptyValues({
        rows: [
          { key: '', value: '' },
          { key: 'environment', value: 'prod' },
        ],
        strings: ['', 'alert'],
        removedRows: [{}],
        enabled: false,
        count: 0,
      })
    ).toEqual({
      rows: [{ key: 'environment', value: 'prod' }],
      strings: ['alert'],
      removedRows: [],
      enabled: false,
      count: 0,
    });
  });
});
