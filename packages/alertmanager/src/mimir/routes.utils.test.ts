import { describe, it, expect } from 'vitest';
import { addUniqueIdentifierToRoute, type Route, type RouteWithID } from '@grafana/external-alertmanager/vanilla';
import {
  addRouteToReferenceRoute,
  cleanRouteIDs,
  mergePartialRouteWithRouteTree,
  omitRouteFromRouteTree,
  renameReceiverInRoute,
} from './routes.utils';
import { ERROR_NEWER_CONFIGURATION } from './constants';

describe('routes.utils', () => {
  describe('addRouteToReferenceRoute', () => {
    const createTestRouteTree = (): RouteWithID => {
      return addUniqueIdentifierToRoute({
        receiver: 'default',
        routes: [
          {
            receiver: 'team-a',
            matchers: ['team=a'],
          },
          {
            receiver: 'team-b',
            matchers: ['team=b'],
          },
        ],
      });
    };

    it('should add route as child when routes array exists', () => {
      const routeTree = createTestRouteTree();
      const newRoute: Route = { receiver: 'new-receiver' };

      const result = addRouteToReferenceRoute(newRoute, routeTree, 'child', routeTree.routes![0].id);

      expect(result.routes![0].routes).toHaveLength(1);
    });

    it('should create routes array when adding child to route without routes', () => {
      const routeTree: RouteWithID = {
        id: 'root',
        receiver: 'default',
        routes: [{ id: 'team-a', receiver: 'team-a' }],
      };

      const result = addRouteToReferenceRoute({ receiver: 'new' }, routeTree, 'child', 'team-a');

      expect(result.routes![0].routes).toHaveLength(1);
    });

    it('should add route above reference', () => {
      const routeTree = createTestRouteTree();

      const result = addRouteToReferenceRoute({ receiver: 'new' }, routeTree, 'above', routeTree.routes![1].id);

      expect(result.routes).toHaveLength(3);
      expect(result.routes![1].receiver).toBe('new');
    });

    it('should add route below reference', () => {
      const routeTree = createTestRouteTree();

      const result = addRouteToReferenceRoute({ receiver: 'new' }, routeTree, 'below', routeTree.routes![0].id);

      expect(result.routes![1].receiver).toBe('new');
    });

    it('should throw with ERROR_NEWER_CONFIGURATION when reference not found', () => {
      const routeTree = createTestRouteTree();

      try {
        addRouteToReferenceRoute({ receiver: 'new' }, routeTree, 'child', 'invalid');
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).cause).toBe(ERROR_NEWER_CONFIGURATION);
      }
    });
  });

  describe('cleanRouteIDs', () => {
    it('should recursively remove id from all routes', () => {
      const route: RouteWithID = {
        id: 'root',
        receiver: 'default',
        routes: [{ id: 'child', receiver: 'child' }],
      };

      const result = cleanRouteIDs(route);

      expect(result).not.toHaveProperty('id');
      expect(result.routes![0]).not.toHaveProperty('id');
    });
  });

  describe('mergePartialRouteWithRouteTree', () => {
    it('should merge partial route data', () => {
      const routeTree: RouteWithID = addUniqueIdentifierToRoute({
        receiver: 'default',
        routes: [{ receiver: 'team-a', matchers: ['team=a'] }],
      });
      const routeId = routeTree.routes![0].id;

      const result = mergePartialRouteWithRouteTree({ id: routeId, receiver: 'updated' }, routeTree);

      expect(result.routes![0].receiver).toBe('updated');
      expect(result.routes![0].matchers).toEqual(['team=a']);
    });

    it('should throw with ERROR_NEWER_CONFIGURATION when route not found', () => {
      const routeTree: RouteWithID = addUniqueIdentifierToRoute({ receiver: 'default' });

      try {
        mergePartialRouteWithRouteTree({ id: 'invalid', receiver: 'updated' }, routeTree);
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).cause).toBe(ERROR_NEWER_CONFIGURATION);
      }
    });
  });

  describe('omitRouteFromRouteTree', () => {
    it('should remove route by id', () => {
      const routeTree: RouteWithID = addUniqueIdentifierToRoute({
        receiver: 'default',
        routes: [{ receiver: 'team-a' }, { receiver: 'team-b' }],
      });

      const result = omitRouteFromRouteTree(routeTree.routes![1].id, routeTree);

      expect(result.routes).toHaveLength(1);
    });

    it('should throw error when trying to remove root', () => {
      const routeTree: RouteWithID = addUniqueIdentifierToRoute({ receiver: 'default' });

      expect(() => omitRouteFromRouteTree(routeTree.id, routeTree)).toThrow('You cant remove the root route');
    });
  });

  describe('renameReceiverInRoute', () => {
    it('should recursively rename receiver', () => {
      const route: Route = {
        receiver: 'default',
        routes: [{ receiver: 'old' }, { receiver: 'other', routes: [{ receiver: 'old' }] }],
      };

      const result = renameReceiverInRoute(route, 'old', 'new');

      expect(result.routes![0].receiver).toBe('new');
      expect(result.routes![1].routes![0].receiver).toBe('new');
    });
  });
});
