import {
  ParsedUserConfiguration,
  YamlToParsedUserConfiguration,
} from '@grafana/external-alertmanager/mimir';
import { alertmanagerApi } from './alertmanager.endpoints';
import { getDataSourceSrv } from '@grafana/runtime';
import { AlertManagerDataSourceJsonData } from 'types/datasources';
import retryUntil from 'p-retry';
import { prettifyError, z, ZodError } from 'zod';
import type {
  BaseQueryApi,
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
  QueryReturnValue,
} from '@reduxjs/toolkit/query';

const NO_USER_CONFIG_ERROR = 'alertmanager storage object not found';

export function isLazyInitializationError({ status, data }: FetchBaseQueryError) {
  const isNotFound = status === 404;
  const isUnavailableStorageObject = String(data).includes(NO_USER_CONFIG_ERROR);

  return isNotFound && isUnavailableStorageObject;
}

/**
 * Validates that the data source is configured for Mimir implementation.
 * Throws an error if the data source is not using Mimir.
 */
export function validateMimirDataSource(dataSourceUID: string): void {
  const dsSettings = getDataSourceSrv().getInstanceSettings(dataSourceUID);
  const jsonData = dsSettings?.jsonData as AlertManagerDataSourceJsonData;
  const implementation = jsonData?.implementation ?? 'prometheus';

  if (implementation !== 'mimir') {
    throw new Error(
      `Mimir API endpoints can only be used with Mimir data sources. Data source ${dataSourceUID} is configured as '${implementation}'.`
    );
  }
}

/**
 * Validates and transforms a YAML string response to ParsedUserConfiguration.
 *
 * @param rawData - The raw response data (should be a YAML string)
 * @returns Success object with parsed data or error object with details
 */
export function parseUserConfigurationResponse(
  rawData: unknown
): QueryReturnValue<ParsedUserConfiguration, FetchBaseQueryError, FetchBaseQueryMeta> {
  try {
    // First, validate that we received a string (which is YAML)
    const yamlString = z.string().parse(rawData);

    // Then decode the YAML string to ParsedUserConfiguration
    const decoded = YamlToParsedUserConfiguration.decode(yamlString);

    // Return the decoded data
    return { data: decoded };
  } catch (err: unknown) {
    // Check if this is a Zod validation error and format it nicely
    const errorMessage = err instanceof ZodError ? prettifyError(err) : String(err);

    return {
      error: {
        status: 'PARSING_ERROR',
        originalStatus: 200, // Response was successful but parsing failed
        data: String(rawData), // Include the raw response data that failed to parse
        error: errorMessage,
      },
    };
  }
}

/**
 * Fetches Mimir user configuration with lazy initialization handling.
 *
 * Mimir tenants are lazily initialized - the first request may fail with a lazy initialization error.
 * This function retries the request and "wakes up" the tenant by calling getStatus on the first failure.
 *
 * ⚠️ This procedure does _not_ support Mimir's custom "Alertmanager fallback config". This will only set the Alertmanager
 * configuration and Mimir doesn't know about it via the "/api/v1/alerts" endpoint. When we receive an empty Alertmanager configuration
 * we will return a hard-coded config to the client so the user can make changes to an empty Mimir installation.
 */
export async function fetchMimirUserConfigurationWithRetry<T extends (arg: FetchArgs) => any>(
  dataSourceUID: string,
  api: BaseQueryApi,
  baseQuery: T
): Promise<Awaited<ReturnType<T>>> {
  return retryUntil(
    async () => {
      const response = await baseQuery({
        url: `/${dataSourceUID}/api/v1/alerts`,
        responseHandler: 'text',
      });

      if (response.error && isLazyInitializationError(response.error)) {
        throw new Error('tenant configuration is uninitialized');
      }

      return response;
    },
    {
      retries: 10,
      onFailedAttempt: (context) => {
        // dispatch a request to "wake up" the tenant configuration on the first failed attempt
        // this will make requests succeed during one of the next retries.
        if (context.attemptNumber === 1) {
          api.dispatch(
            alertmanagerApi.endpoints.getStatus.initiate(
              { dataSourceUID },
              { forceRefetch: true, subscribe: false } // make sure we don't subscribe
            )
          );
        }
      },
    }
  );
}
