import { css } from '@emotion/css';
import { isArray, uniqueId } from 'lodash';
import * as React from 'react';
import { FC, Fragment, ReactNode, useState } from 'react';
import { useToggle } from '@react-hookz/web';
import Skeleton from 'react-loading-skeleton';

import { GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { Button, Dropdown, Icon, IconButton, Menu, Stack, Text, Tooltip, getTagColorsFromName, useStyles2 } from '@grafana/ui';
import { attachSkeleton } from '@grafana/ui/unstable';

import {
  normalizeMatchers,
  ObjectMatcher,
  stringifyObjectMatcher,
} from '@grafana/external-alertmanager/vanilla';
import { RouteWithID } from '@grafana/external-alertmanager/mimir';
import { MetaText } from 'features/rules/list/components/MetaText';
import { AlertLabel } from '@grafana/alerting';
import { RouteMatchingCounts, getRouteMatchCount } from '../hooks/useRouteMatching';
import { InsertPosition } from '../types';

const ROUTES_PER_PAGE = 20;

interface Props {
  numberOfMatchingInstances?: number;
  currentRoute: RouteWithID;
  isDefaultPolicy?: boolean;
  onRouteClick?: (route: RouteWithID) => void;
  focussedRouteID?: string;
  matchingCounts?: RouteMatchingCounts;
  onAddPolicy?: (referenceRoute: RouteWithID, position: InsertPosition) => void;
  readOnly?: boolean;
}

const RouteCard = (props: Props) => {
  const {
    numberOfMatchingInstances: mumberOfMatchingInstances,
    currentRoute,
    isDefaultPolicy = false,
    onRouteClick,
    focussedRouteID,
    matchingCounts,
    onAddPolicy,
    readOnly = false,
  } = props;

  const styles = useStyles2(getStyles);

  const receiver = currentRoute.receiver;
  const continueMatching = currentRoute.continue ?? false;

  const matchers = normalizeMatchers(currentRoute);
  const hasMatchers = Boolean(matchers && matchers.length);

  // if the route has no matchers, is not the default policy (that one has none) and it does not continue
  // then we should warn the user that it's a suspicious setup
  const showMatchesAllLabelsWarning = !hasMatchers && !isDefaultPolicy && !continueMatching;

  const childPolicies = currentRoute.routes ?? [];
  const hasChildPolicies = childPolicies.length > 0;

  // we collapse the auto-generated policies by default
  const [showPolicyChildren, togglePolicyChildren] = useToggle(true);

  const groupBy = currentRoute.group_by;
  const muteTimings = currentRoute.mute_time_intervals ?? [];
  const activeTimings = currentRoute.active_time_intervals ?? [];

  const [visibleChildPolicies, setVisibleChildPolicies] = useState(ROUTES_PER_PAGE);

  // child policies to render are the ones that belong to the path that matches the filters
  const childPoliciesToRender = childPolicies;
  const pageOfChildren = childPoliciesToRender.slice(0, visibleChildPolicies);

  const moreCount = childPoliciesToRender.length - pageOfChildren.length;
  const showMore = moreCount > 0;

  const hasFocus = Boolean(focussedRouteID) && String(currentRoute.id) === String(focussedRouteID);

  return (
    <Stack direction="column" gap={1.5}>
      <div
        className={styles.policyWrapper(hasFocus)}
        data-testid={isDefaultPolicy ? 'am-root-route-container' : 'am-route-container'}
        onClick={() => onRouteClick?.(currentRoute)}
      >
        {/* continueMatching and showMatchesAllLabelsWarning are mutually exclusive so the icons can't overlap */}
        {continueMatching && <ContinueMatchingIndicator />}
        {showMatchesAllLabelsWarning && <AllMatchesIndicator />}

        <div className={styles.policyItemWrapper}>
          <Stack direction="column" gap={1}>
            {/* Matchers and actions */}
            <div>
              <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                <Stack direction="row" alignItems="center" gap={1}>
                  {hasChildPolicies ? (
                    <IconButton
                      name={showPolicyChildren ? 'angle-down' : 'angle-right'}
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePolicyChildren();
                      }}
                      aria-label={
                        showPolicyChildren
                          ? t('alerting.policies.aria-label-collapse', 'Collapse')
                          : t('alerting.policies.aria-label-expand', 'Expand')
                      }
                    />
                  ) : null}
                  {isDefaultPolicy && <DefaultPolicyIndicator />}
                  {!isDefaultPolicy && (
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
                          <Trans i18nKey="alerting.policies.no-matchers">No matchers</Trans>
                        </span>
                      )}
                    </>
                  )}
                </Stack>

                {/* Add policy actions */}
                {!readOnly && onAddPolicy && (
                  <div onClick={(e) => e.stopPropagation()}>
                    {isDefaultPolicy ? (
                      <Button
                        size="sm"
                        icon="plus"
                        variant="secondary"
                        onClick={() => onAddPolicy(currentRoute, 'child')}
                      >
                        <Trans i18nKey="alerting.policies.new-child">New child route</Trans>
                      </Button>
                    ) : (
                      <Dropdown
                        overlay={
                          <Menu>
                            <Menu.Item
                              label={t('alerting.policy.label-new-sibling-above', 'New sibling above')}
                              icon="arrow-up"
                              onClick={() => onAddPolicy(currentRoute, 'above')}
                            />
                            <Menu.Item
                              label={t('alerting.policy.label-new-sibling-below', 'New sibling below')}
                              icon="arrow-down"
                              onClick={() => onAddPolicy(currentRoute, 'below')}
                            />
                            <Menu.Divider />
                            <Menu.Item
                              label={t('alerting.policy.label-new-child-route', 'New child route')}
                              icon="plus"
                              onClick={() => onAddPolicy(currentRoute, 'child')}
                            />
                          </Menu>
                        }
                      >
                        <Button size="sm" icon="plus" variant="secondary">
                          <Trans i18nKey="alerting.policies.add-route">Add</Trans>
                        </Button>
                      </Dropdown>
                    )}
                  </div>
                )}
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
              isDefaultPolicy={isDefaultPolicy}
            />
          </Stack>
        </div>
      </div>
      <div className={styles.childPolicies}>
        {showPolicyChildren && (
          <>
            {pageOfChildren.map((child: RouteWithID) => (
              <RouteCard
                key={child.id}
                currentRoute={child}
                numberOfMatchingInstances={matchingCounts ? getRouteMatchCount(matchingCounts, child.id) : undefined}
                matchingCounts={matchingCounts}
                onRouteClick={onRouteClick}
                focussedRouteID={focussedRouteID}
                onAddPolicy={onAddPolicy}
                readOnly={readOnly}
              />
            ))}
            {showMore && (
              <Button
                size="sm"
                icon="angle-down"
                variant="secondary"
                className={styles.moreButtons}
                onClick={() => setVisibleChildPolicies(visibleChildPolicies + ROUTES_PER_PAGE)}
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
  isDefaultPolicy: boolean;
}

function MetadataRow({
  numberOfAlertInstances,
  isDefaultPolicy,
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
  const singleGroup = isDefaultPolicy && isArray(groupBy) && groupBy.length === 0;

  const hasMuteTimings = Boolean(muteTimings.length);
  const hasActiveTimings = Boolean(activeTimings.length);

  return (
    <Stack direction="row" alignItems="center" gap={1}>
      <MetaText icon="layers-alt" data-testid="matching-instances">
        <Text color="primary">{numberOfAlertInstances ?? '-'}</Text>
        <span>
          <Trans i18nKey="alerting.policies.metadata.n-instances" count={numberOfAlertInstances ?? 0}>
            instance
          </Trans>
        </span>
      </MetaText>
      {receiver && (
        <MetaText icon="at" data-testid="receiver">
          <span>
            <Trans i18nKey="alerting.policies.metadata.delivered-to">Delivered to</Trans>{' '}
          </span>
          <Text color="primary">{receiver}</Text>
        </MetaText>
      )}
      {customGrouping && (
        <MetaText icon="layer-group" data-testid="grouping">
          <span>
            <Trans i18nKey="alerting.policies.metadata.grouped-by">Grouped by</Trans>{' '}
          </span>
          <Text color="primary">{groupBy.join(', ')}</Text>
        </MetaText>
      )}
      {singleGroup && (
        <MetaText icon="layer-group">
          <span>
            <Trans i18nKey="alerting.policies.metadata.grouping.single-group">Single group</Trans>
          </span>
        </MetaText>
      )}
      {noGrouping && (
        <MetaText icon="layer-group">
          <span>
            <Trans i18nKey="alerting.policies.metadata.grouping.none">Not grouping</Trans>
          </span>
        </MetaText>
      )}
      {hasMuteTimings && (
        <MetaText icon="calendar-slash" data-testid="mute-timings">
          <span>
            <Trans i18nKey="alerting.policies.metadata.mute-time">Muted when</Trans>{' '}
          </span>
          <TimeIntervals timings={muteTimings} />
        </MetaText>
      )}
      {hasActiveTimings && (
        <MetaText icon="calendar-alt" data-testid="active-timings">
          <span>
            <Trans i18nKey="alerting.policies.metadata.active-time">Active when</Trans>{' '}
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

export function DefaultPolicyIndicator() {
  const styles = useStyles2(getStyles);
  return (
    <>
      <Text element="h2" variant="body" weight="medium">
        <Trans i18nKey="alerting.policies.default-route.title">Default route</Trans>
      </Text>
      <span className={styles.metadata}>
        <Trans i18nKey="alerting.policies.default-route.description">
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
          'alerting.policies.metadata.timingOptions.groupWait.description',
          'How long to initially wait to send a notification for a group of alert instances.'
        )}
      >
        <span>
          <Trans i18nKey="alerting.policies.metadata.timingOptions.groupWait.label" values={{ groupWait }}>
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
          'alerting.policies.metadata.timingOptions.groupInterval.description',
          'How long to wait before sending a notification about new alerts that are added to a group of alerts for which an initial notification has already been sent.'
        )}
      >
        <span>
          <Trans i18nKey="alerting.policies.metadata.timingOptions.groupInterval.label" values={{ groupWait }}>
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
          'alerting.policies.metadata.timingOptions.repeatInterval.description',
          'How often notifications are sent if the group of alerts has not changed since the last notification.'
        )}
      >
        <span>
          <Trans i18nKey="alerting.policies.metadata.timingOptions.repeatInterval.label" values={{ repeatInterval }}>
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
  childPolicies: css({
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
  policyItemWrapper: css({
    padding: theme.spacing(1.5),
  }),
  policyWrapper: (hasFocus = false) =>
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
        <div key={index} className={styles.policyWrapper(false)}>
          <div className={styles.policyItemWrapper}>
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
