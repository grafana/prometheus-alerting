/**
 * MSW handlers for datasource-related endpoints.
 */

import { http, HttpResponse } from 'msw';

/**
 * GET /api/datasources/uid/:uid/resources/api/v1/labels
 * Returns available label names for a datasource
 */
const getLabelsHandler = () =>
  http.get('/api/datasources/uid/:uid/resources/api/v1/labels', () => {
    return HttpResponse.json({
      status: 'success',
      data: ['__name__', 'instance', 'job'],
    });
  });

/**
 * GET /api/datasources/uid/:uid/resources/api/v1/label/:name/values
 * Returns values for a specific label
 */
const getLabelValuesHandler = () =>
  http.get('/api/datasources/uid/:uid/resources/api/v1/label/:name/values', () => {
    return HttpResponse.json({
      status: 'success',
      data: [],
    });
  });

/**
 * GET /api/datasources/uid/:uid/resources/api/v1/metadata
 * Returns metric metadata
 */
const getMetadataHandler = () =>
  http.get('/api/datasources/uid/:uid/resources/api/v1/metadata', () => {
    return HttpResponse.json({
      status: 'success',
      data: {},
    });
  });

export const datasourcesHandlers = [getLabelsHandler(), getLabelValuesHandler(), getMetadataHandler()];
