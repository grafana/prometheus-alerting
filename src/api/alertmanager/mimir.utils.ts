import {
  initialAlertmanagerConfiguration,
  ParsedUserConfiguration,
  YamlToParsedUserConfiguration,
} from '@grafana/external-alertmanager/mimir';
import { config } from '@grafana/runtime';
import type { FetchBaseQueryError, FetchBaseQueryMeta, QueryReturnValue } from '@reduxjs/toolkit/query';
import { AlertManagerDataSourceJsonData } from 'types/datasources';
import { prettifyError, z, ZodError } from 'zod';

import type { MimirConfigurationBaseQuery } from './mimir.types';

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
  const dsSettings = Object.values(config.datasources).find((dataSource) => dataSource.uid === dataSourceUID);
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
 * Fetches and parses a Mimir user configuration.
 *
 * An uninitialized tenant has no stored configuration, so Mimir returns 404. Return the editable initial configuration immediately
 * instead of retrying while a separate status request initializes the tenant.
 */
export async function loadMimirUserConfiguration(
  dataSourceUID: string,
  baseQuery: MimirConfigurationBaseQuery
): Promise<QueryReturnValue<ParsedUserConfiguration, FetchBaseQueryError, FetchBaseQueryMeta>> {
  const response = await baseQuery({
    url: `/${dataSourceUID}/api/v1/alerts`,
    responseHandler: 'text',
  });

  if (response.error) {
    if (isLazyInitializationError(response.error)) {
      return { data: initialAlertmanagerConfiguration };
    }

    return { error: response.error };
  }

  return parseUserConfigurationResponse(response.data);
}
