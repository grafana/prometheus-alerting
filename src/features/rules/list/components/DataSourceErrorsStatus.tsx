import React, { useState } from 'react';

import { t, Trans } from '@grafana/i18n';
import { Button, Card, Drawer, Icon, LinkButton, Stack, Text } from '@grafana/ui';

import { DataSourceRulesError, useDataSourceErrors } from '../hooks/useDataSourceErrors';

/**
 * Summarises the data sources that failed to serve their rules – those are hidden from the rule
 * list itself, this is where the user can find out which ones failed and why.
 */
export function DataSourceErrorsStatus() {
  const { errors } = useDataSourceErrors();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  if (errors.length === 0) {
    return null;
  }

  return (
    <>
      <Stack direction="row" gap={1} alignItems="baseline">
        <Text color="warning">
          <Icon name="exclamation-triangle" color="warning" />
        </Text>
        <Text color="secondary">
          {t('alerting.rule-list.datasource-errors.summary', '{{count}} data sources reported errors', {
            count: errors.length,
          })}
        </Text>
        <Button size="sm" fill="text" variant="secondary" onClick={() => setIsDrawerOpen(true)}>
          <Trans i18nKey="alerting.rule-list.datasource-errors.view-details">View details</Trans>
        </Button>
      </Stack>
      {isDrawerOpen && (
        <Drawer
          title={t('alerting.rule-list.datasource-errors.drawer-title', 'Data source errors')}
          subtitle={t(
            'alerting.rule-list.datasource-errors.drawer-subtitle',
            'These data sources are hidden from the rule list because their rules could not be loaded.'
          )}
          onClose={() => setIsDrawerOpen(false)}
        >
          <Stack direction="column" gap={2}>
            {errors.map((error) => (
              <DataSourceErrorItem key={error.uid} {...error} />
            ))}
          </Stack>
        </Drawer>
      )}
    </>
  );
}

/**
 * Standalone footer for lists that have no status card of their own, such as the grouped view.
 * Renders nothing when all data sources are healthy.
 */
export function DataSourceErrorsFooter() {
  const { errors } = useDataSourceErrors();

  if (errors.length === 0) {
    return null;
  }

  return (
    <Card>
      <Card.Heading>
        <DataSourceErrorsStatus />
      </Card.Heading>
    </Card>
  );
}

function DataSourceErrorItem({ uid, name, description, details }: DataSourceRulesError) {
  return (
    <Stack direction="column" gap={0.5}>
      <Stack direction="row" gap={1} alignItems="center" justifyContent="space-between">
        <Text variant="h6" element="h3">
          {name}
        </Text>
        <LinkButton variant="secondary" size="sm" href={`/connections/datasources/edit/${uid}`}>
          <Trans i18nKey="alerting.rule-list.datasource-errors.configure">Configure</Trans>
        </LinkButton>
      </Stack>
      {/* The status line in the details repeats the message of a bodyless failure verbatim */}
      {!details?.includes(description) && <Text color="error">{description}</Text>}
      {details && <code>{details}</code>}
    </Stack>
  );
}
