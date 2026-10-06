import React, { useState } from 'react';
import { css } from '@emotion/css';
import { useResizeObserver } from '@react-hookz/web';

import { GrafanaTheme2 } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { getDataSourceSrv } from '@grafana/runtime';
import {
  Button,
  Card,
  Counter,
  Drawer,
  Icon,
  InlineField,
  LinkButton,
  LoadingBar,
  Stack,
  Text,
  Tooltip,
  useStyles2,
} from '@grafana/ui';

import { useDelayedHide } from '../../../../hooks/useDelayedHide';
import { useDelayedShow } from '../../../../hooks/useDelayedShow';
import { DataSourceRulesError, useDataSourceErrors } from '../hooks/useDataSourceErrors';
import { useIsLoadingRules } from '../hooks/useIsLoadingRules';

/**
 * How long the loading bar stays up after the last data source finished loading. Data sources finish
 * one by one and a new one can start right after (e.g. discovery hands over to loading the groups),
 * so without this the bar would blink off and on between them.
 */
export const LOADING_BAR_HIDE_DELAY_MS = 500;

/**
 * How long loading has to take before the status field says so. Most data sources answer faster than
 * this, and flipping to "Loading" and straight back would only be noise – the same delay the
 * LoadingBar uses before it starts moving.
 */
export const LOADING_STATUS_SHOW_DELAY_MS = 300;

/**
 * The longest the hidden count waits for every data source on the first load. After that we show what we
 * know so far, so one slow data source does not hold back what the others already told us.
 */
export const HIDDEN_COUNT_MAX_WAIT_MS = 300;

/**
 * A loading bar at the top of the rule list, shown while any data source is still loading its rules.
 */
export function DataSourcesLoadingBar() {
  const showLoadingBar = useDelayedHide(useIsLoadingRules(), LOADING_BAR_HIDE_DELAY_MS);
  // The bar only uses its width to pick an animation speed that suits the length it travels
  const [barContainer, setBarContainer] = useState<HTMLDivElement | null>(null);
  const [barWidth, setBarWidth] = useState(0);
  useResizeObserver(barContainer, (entry) => setBarWidth(entry.contentRect.width));

  return (
    // Always takes up the height of the bar, so showing and hiding it does not move the list
    <div ref={setBarContainer} style={{ height: 1 }}>
      {showLoadingBar && (
        <LoadingBar width={barWidth} ariaLabel={t('alerting.rule-list.datasource-status.loading', 'Loading rules')} />
      )}
    </div>
  );
}

/**
 * Sits in the page header like the Alertmanager picker does on the Alertmanager pages. While data
 * sources are loading it says so, afterwards it says how many data sources we hide from the rule list
 * – because they failed to serve their rules or have no rules at all – and opens a drawer listing
 * which ones and why. Renders nothing once everything has loaded and no data source is hidden.
 */
export function DataSourcesStatusField() {
  const { errors } = useDataSourceErrors();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isLoadingNow = useIsLoadingRules();
  const showLoading = useDelayedHide(
    useDelayedShow(isLoadingNow, LOADING_STATUS_SHOW_DELAY_MS),
    LOADING_BAR_HIDE_DELAY_MS
  );
  const summary = useHiddenSummary();

  // The hidden count keeps climbing while data sources come in, so we only show it once they all
  // have. Until loading has taken long enough to say so, we show nothing at all.
  if (!showLoading && (isLoadingNow || errors.length === 0)) {
    return null;
  }

  return (
    <>
      <InlineField label={t('alerting.rule-list.datasource-status.label', 'Data sources')}>
        {showLoading ? (
          <Button variant="secondary" icon="spinner" disabled>
            {t('alerting.rule-list.datasource-status.loading', 'Loading rules')}
          </Button>
        ) : (
          <Button
            variant="secondary"
            icon="exclamation-triangle"
            tooltip={summary}
            onClick={() => setIsDrawerOpen(true)}
          >
            {t('alerting.rule-list.datasource-errors.button', '{{count}} hidden', { count: errors.length })}
          </Button>
        )}
      </InlineField>
      {isDrawerOpen && <HiddenDataSourcesDrawer onClose={() => setIsDrawerOpen(false)} />}
    </>
  );
}

/**
 * Yellow "N hidden" text for next to the data source filter label, that opens the drawer listing the
 * hidden data sources. Only shows once loading has settled, so the count does not climb on screen – unless
 * a data source takes longer than `HIDDEN_COUNT_MAX_WAIT_MS`, then it shows what we know so far.
 * After that it stays up while loading again (e.g. after switching views), since reported data sources
 * are kept until they load fine – it would only drop out and come back with the same count.
 */
export function HiddenDataSourcesLink() {
  const { errors } = useDataSourceErrors();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isLoading = useDelayedHide(useIsLoadingRules(), LOADING_BAR_HIDE_DELAY_MS);
  const hasSettled = useHasSettled(isLoading, HIDDEN_COUNT_MAX_WAIT_MS);
  const summary = useHiddenSummary();
  const styles = useStyles2(getStyles);

  if ((isLoading && !hasSettled) || errors.length === 0) {
    return null;
  }

  return (
    <>
      <Tooltip content={summary}>
        <button type="button" className={styles.hiddenLink} onClick={() => setIsDrawerOpen(true)}>
          <Icon name="exclamation-triangle" size="xs" />
          {t('alerting.rule-list.datasource-errors.button', '{{count}} hidden', { count: errors.length })}
        </button>
      </Tooltip>
      {isDrawerOpen && <HiddenDataSourcesDrawer onClose={() => setIsDrawerOpen(false)} />}
    </>
  );
}

/**
 * Turns true the first time loading finishes, or once it has taken longer than `maxWaitMs`, and stays
 * true after that.
 */
function useHasSettled(isLoading: boolean, maxWaitMs: number): boolean {
  const [hasStarted, setHasStarted] = useState(isLoading);
  const [hasSettled, setHasSettled] = useState(false);
  const hasWaitedLongEnough = useDelayedShow(isLoading, maxWaitMs);

  if (isLoading && !hasStarted) {
    setHasStarted(true);
  }

  if (!hasSettled && ((!isLoading && hasStarted) || hasWaitedLongEnough)) {
    setHasSettled(true);
  }

  return hasSettled;
}

/** "N data sources reported errors · N data sources have no rules", leaving out a kind with none. */
function useHiddenSummary(): string {
  const { errors } = useDataSourceErrors();
  const failed = errors.filter((error) => error.kind === 'error').length;
  const empty = errors.filter((error) => error.kind === 'empty').length;

  return [
    failed > 0 &&
      t('alerting.rule-list.datasource-errors.summary', '{{count}} data sources reported errors', { count: failed }),
    empty > 0 &&
      t('alerting.rule-list.datasource-errors.summary-empty', '{{count}} data sources have no rules', { count: empty }),
  ]
    .filter(Boolean)
    .join(' · ');
}

function HiddenDataSourcesDrawer({ onClose }: { onClose: () => void }) {
  const { errors } = useDataSourceErrors();
  // Failures first, they are the ones that need fixing
  const failed = errors.filter((error) => error.kind === 'error');
  const empty = errors.filter((error) => error.kind === 'empty');

  return (
    <Drawer
      title={t('alerting.rule-list.datasource-errors.drawer-title', 'Hidden data sources')}
      subtitle={t(
        'alerting.rule-list.datasource-errors.drawer-subtitle',
        'These data sources are hidden from the rule list because their rules could not be loaded, or because they have no rules.'
      )}
      onClose={onClose}
    >
      <Stack direction="column" gap={3}>
        <HiddenDataSourcesSection
          title={t('alerting.rule-list.datasource-errors.section-failed', 'Could not load rules')}
          errors={failed}
        />
        <HiddenDataSourcesSection
          title={t('alerting.rule-list.datasource-errors.section-empty', 'No rules')}
          errors={empty}
        />
      </Stack>
    </Drawer>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  // Plain text in the warning colour rather than a Button – none of the Button variants is yellow,
  // and a full button would outweigh the small filter label it sits next to
  hiddenLink: css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    padding: 0,
    border: 'none',
    background: 'none',
    color: theme.colors.warning.text,
    fontSize: theme.typography.bodySmall.fontSize,
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline',
    },
  }),
});

function HiddenDataSourcesSection({ title, errors }: { title: string; errors: DataSourceRulesError[] }) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <Stack direction="column" gap={1}>
      <Text variant="h5" element="h3">
        {title}
        <Counter value={errors.length} />
      </Text>
      {errors.map((error) => (
        <DataSourceErrorItem key={error.uid} {...error} />
      ))}
    </Stack>
  );
}

function DataSourceErrorItem({ uid, kind, description, status, url }: DataSourceRulesError) {
  // Reports only carry the uid, fall back to it for a data source that has since been removed
  const name = getDataSourceSrv().getInstanceSettings(uid)?.name ?? uid;
  const meta = [status, url && withoutProxyPrefix(url, uid)].filter(Boolean);

  return (
    <Card noMargin isCompact>
      {/* Card.Heading is a plain div, so put a real heading inside it for screen readers */}
      <Card.Heading>
        <Text element="h4" variant="h6">
          {name}
        </Text>
      </Card.Heading>
      {/* A failure without a body uses the status line as its description, don't show it twice */}
      {description !== status && (
        <Card.Description>
          <Text color={kind === 'error' ? 'error' : 'secondary'}>{description}</Text>
        </Card.Description>
      )}
      {meta.length > 0 && <Card.Meta>{meta}</Card.Meta>}
      {/* The right-hand column, so the button sits next to the name instead of adding a row of its own */}
      <Card.Tags>
        <LinkButton variant="secondary" size="sm" icon="cog" href={`/connections/datasources/edit/${uid}`}>
          <Trans i18nKey="alerting.rule-list.datasource-errors.configure">Configure</Trans>
        </LinkButton>
      </Card.Tags>
    </Card>
  );
}

/**
 * Every request goes through Grafana's data source proxy, so the start of the URL is the same for all of
 * them and only the part after it says which endpoint failed.
 */
export function withoutProxyPrefix(url: string, uid: string): string {
  const prefix = `api/datasources/proxy/uid/${uid}`;
  const path = url.startsWith('/') ? url.slice(1) : url;

  return path.startsWith(prefix) ? path.slice(prefix.length) || '/' : url;
}
