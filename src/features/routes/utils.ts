import { Route, RouteWithID } from "@grafana/alerting/unstable";
import { uniqueId } from "lodash";

// @TODO use the one from @grafana/alerting once published
export function addUniqueIdentifier(route: Route): RouteWithID {
  return {
    id: uniqueId('route-'),
    ...route,
    routes: route.routes?.map(addUniqueIdentifier) ?? [],
  };
}
