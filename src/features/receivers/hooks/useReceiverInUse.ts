import { useMemo } from 'react';
import type { Route } from '@grafana/external-alertmanager/vanilla';
import { useRoutes } from '../../routes/hooks/useRoutes';

/**
 * Get all routes that use a specific receiver.
 */
function getRoutesUsingReceiver(route: Route, receiverName: string, path: string[] = []): string[][] {
  const results: string[][] = [];
  const currentPath = [...path, route.receiver ?? '(no receiver)'];

  // Check if this route uses the receiver
  if (route.receiver === receiverName) {
    results.push(currentPath);
  }

  // Check child routes recursively
  if (route.routes) {
    for (let i = 0; i < route.routes.length; i++) {
      const childRoute = route.routes[i];
      const childResults = getRoutesUsingReceiver(childRoute, receiverName, currentPath);
      results.push(...childResults);
    }
  }

  return results;
}

interface UseReceiverInUseResult {
  /** Whether the receiver is in use by at least one route */
  isInUse: boolean;
  /** Whether the receiver is the default (root) receiver */
  isDefaultReceiver: boolean;
  /** Number of routes using this receiver */
  usageCount: number;
  isLoading: boolean;
}

/**
 * Hook to check if a receiver is in use by any route.
 * This is useful for showing warnings when deleting a receiver that's still referenced.
 */
export function useReceiverInUse(receiverName: string | undefined): UseReceiverInUseResult {
  const { route, isLoading } = useRoutes();

  return useMemo(() => {
    if (!receiverName || !route) {
      return {
        isInUse: false,
        isDefaultReceiver: false,
        usageCount: 0,
        isLoading,
      };
    }

    // Check if this is the default (root) receiver
    const isDefaultReceiver = route.receiver === receiverName;

    // Find all routes using this receiver
    const routesUsingReceiver = getRoutesUsingReceiver(route, receiverName);
    const usageCount = routesUsingReceiver.length;
    const isInUse = usageCount > 0;

    return {
      isInUse,
      isDefaultReceiver,
      usageCount,
      isLoading,
    };
  }, [receiverName, route, isLoading]);
}
