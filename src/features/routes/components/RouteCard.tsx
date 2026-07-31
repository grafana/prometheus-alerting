import { css } from '@emotion/css';
import { isArray, uniqueId } from 'lodash';
import * as React from 'react';
import { FC, Fragment, ReactNode, useState } from 'react';
import { useToggle } from '@react-hookz/web';
import Skeleton from 'react-loading-skeleton';

import { GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import {
  Button,
  Dropdown,
  Icon,
  IconButton,
  Menu,
  Stack,
  Text,
  Tooltip,
  getTagColorsFromName,
  useStyles2,
} from '@grafana/ui';
import { attachSkeleton } from '@grafana/ui/unstable';

import { normalizeMatchers, ObjectMatcher, stringifyObjectMatcher } from '@grafana/external-alertmanager/vanilla';
import { RouteWithID } from '@grafana/external-alertmanager/mimir';
import { MetaText } from 'features/rules/list/components/MetaText';
import MoreButton from 'features/rules/list/components/MoreButton';
import { AlertLabel } from '@grafana/alerting';
import { RouteMatchingCounts, getRouteMatchCount } from '../hooks/useRouteMatching';
import { InsertPosition } from '../types';

const ROUTES_PER_PAGE = 20;

export interface RouteCardActions {
  onAddRoute?: (referenceRoute: RouteWithID, position: InsertPosition) => void;
  onEditRoute?: (route: RouteWithID) => void;
  onDeleteRoute?: (route: RouteWithID) => void;
}

type Props = RouteCardActions & {
  numberOfMatchingInstances?: number;
  currentRoute: RouteWithID;
  isDefault?: boolean;
  onRouteClick?: (route: RouteWithID) => void;
  focussedRouteID?: string;
  matchingCounts?: RouteMatchingCounts;
};

const RouteCard = (props: Props) => {
  const {
    numberOfMatchingInstances: mumberOfMatchingInstances,
    currentRoute,
    isDefault = false,
    onRouteClick,
    focussedRouteID,
    matchingCounts,
    onAddRoute,
    onEditRoute,
    onDeleteRoute,
  } = props;

  const routeActions: RouteCardActions = {
    onAddRoute,
    onEditRoute,
    onDeleteRoute,
  };

  const styles = useStyles2(getStyles);

  const receiver = currentRoute.receiver;
  const continueMatching = currentRoute.continue ?? false;

  const matchers = normalizeMatchers(currentRoute);
  const hasMatchers = Boolean(matchers && matchers.length);

  // if the route has no matchers, is not the default route (that one has none) and it does not continue
  // then we should warn the user that it's a suspicious setup
  const showMatchesAllLabelsWarning = !hasMatchers && !isDefault && !continueMatching;

  const childRoutes = currentRoute.routes ?? [];
  const hasChildRoutes = childRoutes.length > 0;

  // we collapse the auto-generated routes by default
  const [showRouteChildren, toggleRouteChildren] = useToggle(true);

  const groupBy = currentRoute.group_by;
  const muteTimings = currentRoute.mute_time_intervals ?? [];
  const activeTimings = currentRoute.active_time_intervals ?? [];

  const [visibleChildRoutes, setVisibleChildRoutes] = useState(ROUTES_PER_PAGE);

  // child routes to render are the ones that belong to the path that matches the filters
  const childRoutesToRender = childRoutes;
  const pageOfChildren = childRoutesToRender.slice(0, visibleChildRoutes);

  const moreCount = childRoutesToRender.length - pageOfChildren.length;
  const showMore = moreCount > 0;

  const hasFocus = Boolean(focussedRouteID) && String(currentRoute.id) === String(focussedRouteID);

  const showAddAction = Boolean(onAddRoute);
  const showMoreAction = Boolean(onRouteClick || onEditRoute || (!isDefault && onDeleteRoute));

  return (
    <Stack direction="column" gap={1.5}>
      <div
        className={styles.routeWrapper(hasFocus)}
        data-testid={isDefault ? 'am-root-route-container' : 'am-route-container'}
        onClick={() => onRouteClick?.(currentRoute)}
      >
        {/* continueMatching and showMatchesAllLabelsWarning are mutually exclusive so the icons can't overlap */}
        {continueMatching && <ContinueMatchingIndicator />}
        {showMatchesAllLabelsWarning && <AllMatchesIndicator />}

        <div className={styles.routeItemWrapper}>
          <Stack direction="column" gap={1}>
            {/* Matchers and actions */}
            <div>
              <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                <Stack direction="row" alignItems="center" gap={1}>
                  {hasChildRoutes ? (
                    <IconButton
                      name={showRouteChildren ? 'angle-down' : 'angle-right'}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRouteChildren();
                      }}
                      aria-label={
                        showRouteChildren
                          ? t('alerting.routes.aria-label-collapse', 'Collapse')
                          : t('alerting.routes.aria-label-expand', 'Expand')
                      }
                    />
                  ) : null}
                  {isDefault && <DefaultRouteIndicator />}
                  {!isDefault && (
                    <>
                      {hasMatchers ? (
                        <>
                          {/* @TODO we should use the "key" as the "colorBy" here but we can't because we stringify the entire matcher :( */}
                          {matchers.map((matcher, index) => (
                            <AlertLabel key={index} value={stringifyObjectMatcher(matcher)} colorBy="value" size="sm" />
                          ))}
                        </>
                      ) : (
                        <span className={styles.metadata}>
                          <Trans i18nKey="alerting.routes.no-matchers">No matchers</Trans>
                        </span>
                      )}
                    </>
                  )}
                </Stack>

                {/* Add / More route actions */}
                <Stack direction="row" alignItems="center" gap={1}>
                  {showAddAction && onAddRoute && (
                    <div onClick={(e) => e.stopPropagation()}>
                      {isDefault ? (
                        <Button
                          size="sm"
                          icon="plus"
                          variant="secondary"
                          onClick={() => onAddRoute(currentRoute, 'child')}
                        >
                          <Trans i18nKey="alerting.routes.new-child">New child route</Trans>
                        </Button>
                      ) : (
                        <Dropdown
                          overlay={
                            <Menu>
                              <Menu.Item
                                label={t('alerting.route.label-new-sibling-above', 'New sibling above')}
                                icon="arrow-up"
                                onClick={() => onAddRoute(currentRoute, 'above')}
                              />
                              <Menu.Item
                                label={t('alerting.route.label-new-sibling-below', 'New sibling below')}
                                icon="arrow-down"
                                onClick={() => onAddRoute(currentRoute, 'below')}
                              />
                              <Menu.Divider />
                              <Menu.Item
                                label={t('alerting.route.label-new-child-route', 'New child route')}
                                icon="plus"
                                onClick={() => onAddRoute(currentRoute, 'child')}
                              />
                            </Menu>
                          }
                        >
                          <Button size="sm" icon="plus" variant="secondary">
                            <Trans i18nKey="alerting.routes.add-route">Add</Trans>
                          </Button>
                        </Dropdown>
                      )}
                    </div>
                  )}

                  {showMoreAction && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <Dropdown
                        overlay={
                          <Menu>
                            {onRouteClick && (
                              <Menu.Item
                                label={t('alerting.route.label-details', 'Details')}
                                icon="eye"
                                onClick={() => onRouteClick(currentRoute)}
                              />
                            )}
                            {onEditRoute && (
                              <Menu.Item
                                label={t('alerting.route.label-edit-route', 'Edit')}
                                icon="pen"
                                onClick={() => onEditRoute(currentRoute)}
                              />
                            )}
                            {onDeleteRoute && !isDefault && (
                              <>
                                <Menu.Divider />
                                <Menu.Item
                                  label={t('alerting.route.label-delete-route', 'Delete route')}
                                  icon="trash-alt"
                                  destructive
                                  onClick={() => onDeleteRoute(currentRoute)}
                                />
                              </>
                            )}
                          </Menu>
                        }
                      >
                        <MoreButton size="sm" />
                      </Dropdown>
                    </div>
                  )}
                </Stack>
              </Stack>
            </div>

            {/* Metadata row */}
            <MetadataRow
              numberOfAlertInstances={mumberOfMatchingInstances}
              receiver={receiver ?? undefined}
              groupBy={groupBy}
              muteTimings={muteTimings}
              activeTimings={activeTimings}
              groupWait={currentRoute.group_wait}
              groupInterval={currentRoute.group_interval}
              repeatInterval={currentRoute.repeat_interval}
              matchers={matchers}
              isDefault={isDefault}
            />
          </Stack>
        </div>
      </div>
      <div className={styles.childRoutes}>
        {showRouteChildren && (
          <>
            {pageOfChildren.map((child: RouteWithID) => (
              <RouteCard
                key={child.id}
                currentRoute={child}
                numberOfMatchingInstances={matchingCounts ? getRouteMatchCount(matchingCounts, child.id) : undefined}
                matchingCounts={matchingCounts}
                onRouteClick={onRouteClick}
                focussedRouteID={focussedRouteID}
                {...routeActions}
              />
            ))}
            {showMore && (
              <Button
                size="sm"
                icon="angle-down"
                variant="secondary"
                className={styles.moreButtons}
                onClick={() => setVisibleChildRoutes(visibleChildRoutes + ROUTES_PER_PAGE)}
              >
                <Trans i18nKey="alerting.routes.n-more-routes" count={moreCount}>
                  {{ count: moreCount }} additional routes
                </Trans>
              </Button>
            )}
          </>
        )}
      </div>
    </Stack>
  );
};

interface MetadataRowProps {
  numberOfAlertInstances?: number;
  receiver?: string;
  groupBy?: string[];
  muteTimings?: string[];
  activeTimings?: string[];
  groupWait?: string;
  groupInterval?: string;
  repeatInterval?: string;
  matchers?: ObjectMatcher[];
  isDefault: boolean;
}

function MetadataRow({
  numberOfAlertInstances,
  isDefault,
  groupWait,
  groupInterval,
  repeatInterval,
  groupBy,
  muteTimings = [],
  activeTimings = [],
  receiver,
}: MetadataRowProps) {
  const noGrouping = isArray(groupBy) && groupBy[0] === '...';
  const customGrouping = !noGrouping && isArray(groupBy) && groupBy.length > 0;
  const singleGroup = isDefault && isArray(groupBy) && groupBy.length === 0;

  const hasMuteTimings = Boolean(muteTimings.length);
  const hasActiveTimings = Boolean(activeTimings.length);

  return (
    <Stack direction="row" alignItems="center" gap={1}>
      <MetaText icon="layers-alt" data-testid="matching-instances">
        <Text color="primary">{numberOfAlertInstances ?? '-'}</Text>
        <span>
          <Trans i18nKey="alerting.routes.metadata.n-instances" count={numberOfAlertInstances ?? 0}>
            instance
          </Trans>
        </span>
      </MetaText>
      {receiver && (
        <MetaText icon="at" data-testid="receiver">
          <span>
            <Trans i18nKey="alerting.routes.metadata.delivered-to">Delivered to</Trans>{' '}
          </span>
          <Text color="primary">{receiver}</Text>
        </MetaText>
      )}
      {customGrouping && (
        <MetaText icon="layer-group" data-testid="grouping">
          <span>
            <Trans i18nKey="alerting.routes.metadata.grouped-by">Grouped by</Trans>{' '}
          </span>
          <Text color="primary">{groupBy.join(', ')}</Text>
        </MetaText>
      )}
      {singleGroup && (
        <MetaText icon="layer-group">
          <span>
            <Trans i18nKey="alerting.routes.metadata.grouping.single-group">Single group</Trans>
          </span>
        </MetaText>
      )}
      {noGrouping && (
        <MetaText icon="layer-group">
          <span>
            <Trans i18nKey="alerting.routes.metadata.grouping.none">Not grouping</Trans>
          </span>
        </MetaText>
      )}
      {hasMuteTimings && (
        <MetaText icon="calendar-slash" data-testid="mute-timings">
          <span>
            <Trans i18nKey="alerting.routes.metadata.mute-time">Muted when</Trans>{' '}
          </span>
          <TimeIntervals timings={muteTimings} />
        </MetaText>
      )}
      {hasActiveTimings && (
        <MetaText icon="calendar-alt" data-testid="active-timings">
          <span>
            <Trans i18nKey="alerting.routes.metadata.active-time">Active when</Trans>{' '}
          </span>
          <TimeIntervals timings={activeTimings} />
        </MetaText>
      )}
      <TimingOptionsMeta groupWait={groupWait} groupInterval={groupInterval} repeatInterval={repeatInterval} />
    </Stack>
  );
}

const ContinueMatchingIndicator: FC = () => {
  const styles = useStyles2(getStyles);

  return (
    <Tooltip
      placement="top"
      content={t(
        'alerting.continue-matching-indicator.content-route-continue-matching-other-routes',
        'This route will continue matching other routes'
      )}
    >
      <div className={styles.gutterIcon} data-testid="continue-matching">
        <Icon name="arrow-down" />
      </div>
    </Tooltip>
  );
};

const AllMatchesIndicator: FC = () => {
  const styles = useStyles2(getStyles);

  return (
    <Tooltip
      placement="top"
      content={t(
        'alerting.all-matches-indicator.content-this-route-matches-all-labels',
        'This route matches all labels'
      )}
    >
      <div className={styles.gutterIcon} data-testid="matches-all">
        <Icon name="exclamation-triangle" />
      </div>
    </Tooltip>
  );
};

export function DefaultRouteIndicator() {
  const styles = useStyles2(getStyles);
  return (
    <>
      <Text element="h2" variant="body" weight="medium">
        <Trans i18nKey="alerting.routes.default-route.title">Default route</Trans>
      </Text>
      <span className={styles.metadata}>
        <Trans i18nKey="alerting.routes.default-route.description">
          All alert instances will be handled by the default route if no other matching routes are found.
        </Trans>
      </span>
    </>
  );
}

const TimeIntervals: FC<{ timings: string[] }> = ({ timings }) => {
  return (
    <div>
      {timings.map((timing, index) => (
        <Fragment key={timing}>
          {timing}
          {index < timings.length - 1 && ', '}
        </Fragment>
      ))}
    </div>
  );
};

interface TimingOptionsMetaProps {
  groupWait?: string;
  groupInterval?: string;
  repeatInterval?: string;
}
export const TimingOptionsMeta = ({ groupWait, groupInterval, repeatInterval }: TimingOptionsMetaProps) => {
  // we don't have any timing options to show – we're inheriting everything from the parent
  // and those show up in a separate "inherited properties" component
  if (!groupWait && !groupInterval && !repeatInterval) {
    return null;
  }

  const metaOptions: ReactNode[] = [];

  if (groupWait) {
    metaOptions.push(
      <Tooltip
        placement="top"
        content={t(
          'alerting.routes.metadata.timingOptions.groupWait.description',
          'How long to initially wait to send a notification for a group of alert instances.'
        )}
      >
        <span>
          <Trans i18nKey="alerting.routes.metadata.timingOptions.groupWait.label" values={{ groupWait }}>
            Wait <Text color="primary">{'{{ groupWait }}'}</Text> to group instances
          </Trans>
        </span>
      </Tooltip>
    );
  }

  if (groupInterval) {
    metaOptions.push(
      <Tooltip
        placement="top"
        content={t(
          'alerting.routes.metadata.timingOptions.groupInterval.description',
          'How long to wait before sending a notification about new alerts that are added to a group of alerts for which an initial notification has already been sent.'
        )}
      >
        <span>
          <Trans i18nKey="alerting.routes.metadata.timingOptions.groupInterval.label" values={{ groupWait }}>
            Wait <Text color="primary">{'{{ groupWait }}'}</Text> before sending updates
          </Trans>
        </span>
      </Tooltip>
    );
  }

  if (repeatInterval) {
    metaOptions.push(
      <Tooltip
        placement="top"
        content={t(
          'alerting.routes.metadata.timingOptions.repeatInterval.description',
          'How often notifications are sent if the group of alerts has not changed since the last notification.'
        )}
      >
        <span>
          <Trans i18nKey="alerting.routes.metadata.timingOptions.repeatInterval.label" values={{ repeatInterval }}>
            Repeated every <Text color="primary">{'{{ repeatInterval }}'}</Text>
          </Trans>
        </span>
      </Tooltip>
    );
  }

  return (
    <MetaText icon="hourglass" data-testid="timing-options">
      {metaOptions.map((meta, index) => (
        <span key={uniqueId()}>
          {meta}
          {index < metaOptions.length - 1 && ' · '}
        </span>
      ))}
    </MetaText>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  matcher: (label: string) => {
    const { color, borderColor } = getTagColorsFromName(label);

    return {
      wrapper: css({
        color: '#fff',
        background: color,
        padding: `${theme.spacing(0.33)} ${theme.spacing(0.66)}`,
        fontSize: theme.typography.bodySmall.fontSize,
        border: `solid 1px ${borderColor}`,
        borderRadius: theme.shape.radius.default,
      }),
    };
  },
  childRoutes: css({
    marginLeft: theme.spacing(4),
    position: 'relative',
    '&:before': {
      content: '""',
      position: 'absolute',
      height: 'calc(100% - 10px)',
      borderLeft: `solid 1px ${theme.colors.border.weak}`,
      marginTop: 0,
      marginLeft: '-20px',
    },
  }),
  routeItemWrapper: css({
    padding: theme.spacing(1.5),
  }),
  routeWrapper: (hasFocus = false) =>
    css({
      flex: 1,
      position: 'relative',
      background: theme.colors.background.secondary,
      borderRadius: theme.shape.radius.default,
      border: `solid 1px ${theme.colors.border.weak}`,
      cursor: 'pointer',
      ...(hasFocus && {
        borderColor: theme.colors.primary.border,
        background: theme.colors.primary.transparent,
      }),
    }),
  metadata: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.bodySmall.fontWeight,
  }),
  break: css({
    width: '100%',
    height: 0,
    marginBottom: theme.spacing(2),
  }),
  gutterIcon: css({
    position: 'absolute',
    top: 0,
    transform: 'translateY(50%)',
    left: `-${theme.spacing(4)}`,
    color: theme.colors.text.secondary,
    background: theme.colors.background.primary,
    width: '25px',
    height: '25px',
    textAlign: 'center',
    border: `solid 1px ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    padding: 0,
  }),
  moreButtons: css({
    marginTop: theme.spacing(0.5),
    marginBottom: theme.spacing(1.5),
  }),
});

// 💀 Skeleton variant of RouteCard
const RouteCardSkeleton: FC<{ count?: number }> = ({ count = 1 }) => {
  const styles = useStyles2(getStyles);

  return (
    <Stack direction="column" gap={1.5}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={styles.routeWrapper(false)}>
          <div className={styles.routeItemWrapper}>
            <Stack direction="column" gap={1}>
              <Skeleton height={24} width="10%" />
              <Skeleton height={16} width="60%" />
            </Stack>
          </div>
        </div>
      ))}
    </Stack>
  );
};

// Attach skeleton to RouteCard component
const RouteCardWithSkeleton = attachSkeleton(RouteCard, RouteCardSkeleton);

export { RouteCardWithSkeleton as RouteCard };
