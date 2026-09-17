import { produce } from 'immer';

import { addRouteAction, deleteRouteAction, routesReducer, updateRouteAction } from './routes';
import { Route, RouteWithID } from '@grafana/external-alertmanager/vanilla';
import {
  initialAlertmanagerConfiguration,
  PostableParsedUserConfiguration,
  PostableParsedUserConfigurationSchema,
} from '@grafana/external-alertmanager/mimir';
import { attachRouteIds } from '../../features/routes/utils';

describe('routes', () => {
  const defaultRoute: Route = {
    receiver: 'ROOT',
    group_by: ['grafana_folder'],

    routes: [
      {
        receiver: 'A',

        matchers: ['team=operations'],
        routes: [
          {
            receiver: 'B1',
            matchers: ['region=europe'],
          },
          {
            receiver: 'B2',
            matchers: ['region=nasa'],
          },
        ],
      },
      {
        receiver: 'C',
        matchers: ['foo=bar'],
      },
    ],
    group_wait: '10s',
    group_interval: '1m',
  };
  const rootRouteWithIdentifiers = attachRouteIds(defaultRoute);
  const ROOT_identifier = rootRouteWithIdentifiers.id;
  const A_identifier = rootRouteWithIdentifiers.routes![0].id;

  const initialConfig: PostableParsedUserConfiguration = {
    alertmanager_config: {
      ...initialAlertmanagerConfiguration.alertmanager_config,
      time_intervals: [],
      mute_time_intervals: [],
      route: defaultRoute,
    },
    template_files: {},
  };
  it('Should add a new route with receiver E as a child of default route', () => {
    const routeWithID = attachRouteIds({
      receiver: 'E',
    });
    const newFormRoute: Partial<RouteWithID> = {
      receiver: 'E',
      id: routeWithID.id,
    };
    const action = addRouteAction({
      partialRoute: newFormRoute,
      referenceRouteIdentifier: ROOT_identifier,
      insertPosition: 'child',
    });

    const result = routesReducer(initialConfig, action);

    expect(result.alertmanager_config.route?.routes).toHaveLength(
      (initialConfig.alertmanager_config.route?.routes?.length ?? 0) + 1
    );

    // the last route if the root route should have receiver E
    expect(result.alertmanager_config.route?.routes?.at(-1)).toMatchObject({
      receiver: 'E',
    });

    // assert the rest of the configuration
    expect(PostableParsedUserConfigurationSchema.parse(result)).toEqual(result);
    expect(result).toMatchSnapshot();
  });

  it('Should not add a new route with receiver E as a child of route with receiver A, if data has been updated by another user', () => {
    const routeWithID = attachRouteIds({
      receiver: 'E',
    });
    const newFormRoute: Partial<RouteWithID> = {
      receiver: 'E',
      id: routeWithID.id,
    };
    const action = addRouteAction({
      partialRoute: newFormRoute,
      referenceRouteIdentifier: A_identifier,
      insertPosition: 'child',
    });
    const modifiedConfig = produce(initialConfig, (draft) => {
      draft.alertmanager_config.route!.routes = [];
    });
    const rootRouteWithIdentifiers = attachRouteIds(modifiedConfig.alertmanager_config.route!);
    const modifiedConfigWithIdentifiers = produce(modifiedConfig, (draft) => {
      draft.alertmanager_config.route = rootRouteWithIdentifiers;
    });
    expect(() => routesReducer(modifiedConfigWithIdentifiers, action)).toThrow();
  });

  it('Should update an existing route A with receiver B', () => {
    const newRoute: Partial<RouteWithID> = {
      receiver: 'B',
      id: A_identifier,
    };
    const action = updateRouteAction({
      update: newRoute,
    });

    const result = routesReducer(initialConfig, action);
    expect(PostableParsedUserConfigurationSchema.parse(result)).toEqual(result);
    expect(result).toMatchSnapshot();
  });

  it('Should not update route if config has been updated by another user', () => {
    const newRoute: Partial<RouteWithID> = {
      receiver: 'B',
      id: A_identifier,
    };
    const action = updateRouteAction({
      update: newRoute,
    });
    const modifiedConfig = produce(initialConfig, (draft) => {
      draft.alertmanager_config.route!.routes = [];
    });
    const rootRouteWithIdentifiers = attachRouteIds(modifiedConfig.alertmanager_config.route!);
    const modifiedConfigWithIdentifiers = produce(modifiedConfig, (draft) => {
      draft.alertmanager_config.route = rootRouteWithIdentifiers;
    });
    expect(() => routesReducer(modifiedConfigWithIdentifiers, action)).toThrow();
  });

  it('Should delete route', () => {
    const action = deleteRouteAction({
      id: A_identifier,
    });
    const result = routesReducer(initialConfig, action);
    expect(PostableParsedUserConfigurationSchema.parse(result)).toEqual(result);
    expect(result).toMatchSnapshot();
  });
});
