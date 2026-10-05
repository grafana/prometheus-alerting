import { describe, it, expect } from '@rstest/core';
import { addUniqueIdentifierToRoute, findExistingRoute, findRouteInTree } from './routes.utils';

describe('routes.utils', () => {
  describe('findExistingRoute', () => {
    it('returns the exact nested route', () => {
      const routeTree = addUniqueIdentifierToRoute({
        receiver: 'default',
        routes: [{ receiver: 'parent', routes: [{ receiver: 'nested' }] }],
      });
      const nestedRoute = routeTree.routes?.[0].routes?.[0];

      expect(nestedRoute).toBeDefined();
      expect(findExistingRoute(nestedRoute?.id ?? '', routeTree)).toBe(nestedRoute);
      expect(findExistingRoute('missing', routeTree)).toBeUndefined();
    });
  });

  describe('findRouteInTree', () => {
    it('returns the route, its parent and its position in the parent', () => {
      const routeTree = addUniqueIdentifierToRoute({
        receiver: 'default',
        routes: [{ receiver: 'first' }, { receiver: 'second' }],
      });
      const second = routeTree.routes![1];

      const [match, parent, position] = findRouteInTree(routeTree, second.id);

      expect(match).toBe(second);
      expect(parent).toBe(routeTree);
      expect(position).toBe(1);
    });

    it('returns nothing when the route is not in the tree', () => {
      const routeTree = addUniqueIdentifierToRoute({ receiver: 'default' });

      expect(findRouteInTree(routeTree, 'missing')).toEqual([undefined, undefined, undefined]);
    });
  });
});
