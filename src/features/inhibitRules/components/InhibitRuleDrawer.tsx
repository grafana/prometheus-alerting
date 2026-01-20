import React from 'react';
import { t } from '@grafana/i18n';
import { Alert, Stack, Text, Button } from '@grafana/ui';
import { type NormalizedInhibitRule, stringifyObjectMatcher } from '@grafana/external-alertmanager/vanilla';
import { DrawerWithFooter } from '../../../components/DrawerWithFooter';
import { Section } from '../../../components/KeyValueList/Section';
import { KeyValuePair } from '../../../components/KeyValueList/KeyValueList';
import { useProduceNewAlertmanagerConfiguration } from '../../../hooks/useProduceNewAlertmanagerConfiguration';
import { deleteInhibitRuleAction } from '../../../reducers/alertmanager/inhibitRules';
import { useHasConfigurationAPI } from '../../../hooks/useHasConfigurationAPI';
import { AlertLabel } from '@grafana/alerting';

interface InhibitRuleDetailsProps {
  inhibitRule: NormalizedInhibitRule;
}

function InhibitRuleDetails({ inhibitRule }: InhibitRuleDetailsProps) {
  const hasSourceMatchers = inhibitRule.source_matchers && inhibitRule.source_matchers.length > 0;
  const hasTargetMatchers = inhibitRule.target_matchers && inhibitRule.target_matchers.length > 0;
  const hasEqualLabels = inhibitRule.equal && inhibitRule.equal.length > 0;

  return (
    <Section title={t('inhibit-rules.drawer.details', 'Inhibit Rule Details')}>
      <Stack direction="column" gap={2}>
        {/* Source matchers */}
        <KeyValuePair
          label={t('inhibit-rules.drawer.source-matchers', 'Source Matchers')}
          value={
            hasSourceMatchers ? (
              <Stack direction="row" gap={0.5} wrap="wrap">
                {inhibitRule.source_matchers!.map((matcher, idx) => (
                  <AlertLabel key={`source-${idx}`} value={stringifyObjectMatcher(matcher)} colorBy="value" />
                ))}
              </Stack>
            ) : (
              <Text color="secondary">{t('inhibit-rules.drawer.none', 'None')}</Text>
            )
          }
        />

        {/* Target matchers */}
        <KeyValuePair
          label={t('inhibit-rules.drawer.target-matchers', 'Target Matchers')}
          value={
            hasTargetMatchers ? (
              <Stack direction="row" gap={0.5} wrap="wrap">
                {inhibitRule.target_matchers!.map((matcher, idx) => (
                  <AlertLabel key={`target-${idx}`} value={stringifyObjectMatcher(matcher)} colorBy="value" />
                ))}
              </Stack>
            ) : (
              <Text color="secondary">{t('inhibit-rules.drawer.none', 'None')}</Text>
            )
          }
        />

        {/* Equal labels */}
        {hasEqualLabels && (
          <KeyValuePair
            label={t('inhibit-rules.drawer.equal', 'Equal Labels')}
            value={
              <Stack direction="row" gap={0.5} wrap="wrap">
                {inhibitRule.equal!.map((label, idx) => (
                  <AlertLabel key={`equal-${idx}`} value={label} colorBy="value" />
                ))}
              </Stack>
            }
          />
        )}

        {/* Show info if completely empty */}
        {!hasSourceMatchers && !hasTargetMatchers && !hasEqualLabels && (
          <Alert title={t('inhibit-rules.drawer.no-config', 'No configuration')} severity="info">
            {t('inhibit-rules.drawer.no-config-desc', 'This inhibit rule has no visible configuration.')}
          </Alert>
        )}
      </Stack>
    </Section>
  );
}

interface InhibitRuleDrawerProps {
  inhibitRule: NormalizedInhibitRule | null;
  inhibitRuleIndex: number | null;
  onClose: () => void;
}

export function InhibitRuleDrawer({ inhibitRule, inhibitRuleIndex, onClose }: InhibitRuleDrawerProps) {
  const [produceNewConfig, { error: deleteError, isLoading: isDeleting }] = useProduceNewAlertmanagerConfiguration();
  const hasConfigurationAPI = useHasConfigurationAPI();

  if (!inhibitRule || inhibitRuleIndex === null) {
    return null;
  }

  const handleEdit = () => {
    // TODO: Implement edit functionality
    console.log('Edit inhibit rule:', inhibitRuleIndex);
  };

  const handleRemove = async () => {
    await produceNewConfig(deleteInhibitRuleAction(inhibitRuleIndex));
    onClose();
  };

  // Create a title based on the rule's matchers
  const getTitle = () => {
    if (inhibitRule.source_matchers && inhibitRule.source_matchers.length > 0) {
      return stringifyObjectMatcher(inhibitRule.source_matchers[0]);
    }
    return t('inhibit-rules.drawer.default-title', 'Inhibit Rule');
  };

  const hasActions = hasConfigurationAPI;

  return (
    <DrawerWithFooter
      title={
        <Stack direction="column" gap={0}>
          <Text variant="bodySmall" color="secondary">
            {t('inhibit-rules.drawer.title', 'Inhibit Rule')}
          </Text>
          <Text variant="h2">{getTitle()}</Text>
        </Stack>
      }
      onClose={onClose}
      size="sm"
      footer={
        hasActions ? (
          <Stack gap={2} justifyContent="flex-end">
            <Button variant="secondary" onClick={handleEdit}>
              {t('inhibit-rules.drawer.edit', 'Edit')}
            </Button>
            <Button variant="destructive" onClick={handleRemove} disabled={isDeleting}>
              {t('inhibit-rules.drawer.remove', 'Remove')}
            </Button>
          </Stack>
        ) : undefined
      }
    >
      <Stack direction="column" gap={2}>
        {Boolean(deleteError) && (
          <Alert title={t('inhibit-rules.error-deleting-title', 'Error deleting inhibit rule')} severity="error">
            {String(
              deleteError instanceof Error
                ? deleteError.message
                : t('inhibit-rules.error-deleting-message', 'Failed to delete inhibit rule')
            )}
          </Alert>
        )}
        <InhibitRuleDetails inhibitRule={inhibitRule} />
      </Stack>
    </DrawerWithFooter>
  );
}
