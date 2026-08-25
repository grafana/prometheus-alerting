import type { FetchArgs, FetchBaseQueryError, FetchBaseQueryMeta, QueryReturnValue } from '@reduxjs/toolkit/query';

export type MimirConfigurationBaseQuery = (
  arg: FetchArgs
) =>
  | QueryReturnValue<unknown, FetchBaseQueryError, FetchBaseQueryMeta>
  | PromiseLike<QueryReturnValue<unknown, FetchBaseQueryError, FetchBaseQueryMeta>>;
