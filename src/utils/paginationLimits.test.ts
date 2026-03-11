import { getApiGroupPageSize, FILTERED_GROUPS_API_PAGE_SIZE, DEFAULT_GROUPS_API_PAGE_SIZE } from './paginationLimits';

describe('getApiGroupPageSize', () => {
  it('returns filtered page size when filters are active', () => {
    expect(getApiGroupPageSize(true)).toBe(FILTERED_GROUPS_API_PAGE_SIZE);
  });

  it('returns default page size when no filters are active', () => {
    expect(getApiGroupPageSize(false)).toBe(DEFAULT_GROUPS_API_PAGE_SIZE);
  });
});
