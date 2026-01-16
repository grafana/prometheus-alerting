import { css, cx } from '@emotion/css';
import {
  DragDropContext,
  Draggable,
  DraggableProvided,
  DropResult,
  Droppable,
  DroppableProvided,
} from '@hello-pangea/dnd';
import { produce } from 'immer';
import React, { forwardRef, useCallback, useMemo, useState } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { RulerRuleDTO } from '@grafana/external-rules/vanilla';
import { t } from '@grafana/i18n';
import { Badge, Icon, Stack, useStyles2 } from '@grafana/ui';

export type SwapOperation = [number, number];

interface DraggableRulesTableProps {
  rules: RulerRuleDTO[];
  groupInterval: string;
  onSwap: (swapOperation: SwapOperation) => void;
}

/**
 * Apply swap operations to a list of rules
 */
export function applySwaps<T>(items: T[], swaps: SwapOperation[]): T[] {
  return produce(items, (draft) => {
    for (const [fromIndex, toIndex] of swaps) {
      if (fromIndex >= 0 && fromIndex < draft.length && toIndex >= 0 && toIndex < draft.length) {
        const [item] = draft.splice(fromIndex, 1);
        draft.splice(toIndex, 0, item);
      }
    }
  });
}

/**
 * Generate a unique ID for a ruler rule
 */
function hashRule(rule: RulerRuleDTO): string {
  const name = 'alert' in rule ? rule.alert : 'record' in rule ? rule.record : 'unknown';
  const expr = rule.expr ?? '';
  return `${name}-${expr.slice(0, 50)}`;
}

/**
 * Get the name of a ruler rule
 */
function getRuleName(rule: RulerRuleDTO): string {
  if ('alert' in rule) {
    return rule.alert;
  }
  if ('record' in rule) {
    return rule.record;
  }
  return 'Unknown rule';
}

/**
 * Check if a rule is a recording rule
 */
function isRecordingRule(rule: RulerRuleDTO): boolean {
  return 'record' in rule;
}

/**
 * Get the pending period (for) of an alerting rule
 */
function getPendingPeriod(rule: RulerRuleDTO): string | null {
  if ('alert' in rule) {
    return rule.for ?? null;
  }
  return null;
}

/**
 * Calculate the number of evaluations before an alert starts firing
 */
function getEvaluationsToStartAlerting(pendingPeriod: string, groupInterval: string): number {
  const pendingSeconds = parseDurationToSeconds(pendingPeriod);
  const intervalSeconds = parseDurationToSeconds(groupInterval);

  if (intervalSeconds === 0) {
    return 0;
  }

  return Math.ceil(pendingSeconds / intervalSeconds) + 1;
}

/**
 * Parse a duration string (e.g., "5m", "1h30m", "30s") to seconds
 */
function parseDurationToSeconds(duration: string): number {
  if (!duration) {
    return 0;
  }

  let totalSeconds = 0;
  const regex = /(\d+)(h|m|s)/g;
  let match;

  while ((match = regex.exec(duration)) !== null) {
    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'h':
        totalSeconds += value * 3600;
        break;
      case 'm':
        totalSeconds += value * 60;
        break;
      case 's':
        totalSeconds += value;
        break;
    }
  }

  return totalSeconds;
}

export function DraggableRulesTable({ rules, groupInterval, onSwap }: DraggableRulesTableProps) {
  const styles = useStyles2(getStyles);
  const [rulesList, setRulesList] = useState<RulerRuleDTO[]>(rules);

  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) {
        return;
      }

      const swapOperation: SwapOperation = [result.source.index, result.destination.index];
      onSwap(swapOperation);

      // Re-order the rules list for the UI rendering
      const newOrderedRules = produce(rulesList, (draft) => {
        const [item] = draft.splice(result.source.index, 1);
        draft.splice(result.destination!.index, 0, item);
      });
      setRulesList(newOrderedRules);
    },
    [rulesList, onSwap]
  );

  const rulesWithUID = useMemo(() => {
    return rulesList.map((rule, index) => ({ ...rule, uid: `${hashRule(rule)}-${index}` }));
  }, [rulesList]);

  return (
    <div>
      <ListItem
        ruleName={t('alerting.draggable-rules-table.rule-name', 'Rule name')}
        pendingPeriod={t('alerting.draggable-rules-table.pending-period', 'Pending period')}
        evalsToStartAlerting={t(
          'alerting.draggable-rules-table.evals-to-start-alerting',
          'Evaluations to start alerting'
        )}
        className={styles.listHeader}
      />
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable
          droppableId="alert-list"
          mode="standard"
          renderClone={(provided, _snapshot, rubric) => (
            <DraggableListItem
              provided={provided}
              rule={rulesWithUID[rubric.source.index]}
              isClone
              groupInterval={groupInterval}
            />
          )}
        >
          {(droppableProvided: DroppableProvided) => (
            <Stack direction="column" gap={0} ref={droppableProvided.innerRef} {...droppableProvided.droppableProps}>
              {rulesWithUID.map((rule, index) => (
                <Draggable key={rule.uid} draggableId={rule.uid} index={index} isDragDisabled={false}>
                  {(provided: DraggableProvided) => (
                    <DraggableListItem key={rule.uid} provided={provided} rule={rule} groupInterval={groupInterval} />
                  )}
                </Draggable>
              ))}
              {droppableProvided.placeholder}
            </Stack>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

interface DraggableListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  provided: DraggableProvided;
  rule: RulerRuleDTO & { uid: string };
  groupInterval: string;
  isClone?: boolean;
}

const DraggableListItem = ({ provided, rule, groupInterval, isClone = false }: DraggableListItemProps) => {
  const styles = useStyles2(getStyles);

  const ruleName = getRuleName(rule);
  const pendingPeriod = getPendingPeriod(rule);
  const isRecording = isRecordingRule(rule);
  const numberEvaluationsToStartAlerting = pendingPeriod
    ? getEvaluationsToStartAlerting(pendingPeriod, groupInterval)
    : 1;

  return (
    <ListItem
      dragHandle={<Icon name="draggabledots" />}
      ruleName={ruleName}
      pendingPeriod={pendingPeriod}
      evalsToStartAlerting={
        isRecording ? (
          <Badge text={t('alerting.draggable-rules-table.recording', 'Recording')} color="purple" />
        ) : (
          numberEvaluationsToStartAlerting
        )
      }
      data-testid="reorder-alert-rule"
      className={cx(styles.listItem, { [styles.listItemClone]: isClone })}
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
    />
  );
};

interface ListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  dragHandle?: React.ReactNode;
  ruleName: React.ReactNode;
  pendingPeriod: React.ReactNode;
  evalsToStartAlerting: React.ReactNode;
}

const ListItem = forwardRef<HTMLDivElement, ListItemProps>(
  ({ dragHandle, ruleName, pendingPeriod, evalsToStartAlerting, className, ...props }, ref) => {
    const styles = useStyles2(getStyles);

    return (
      <div className={cx(styles.listItem, className)} ref={ref} {...props}>
        <Stack flex="0 0 24px">{dragHandle}</Stack>
        <Stack flex={1}>{ruleName}</Stack>
        <Stack basis="30%">{pendingPeriod}</Stack>
        <Stack basis="30%">{evalsToStartAlerting}</Stack>
      </div>
    );
  }
);
ListItem.displayName = 'ListItem';

const getStyles = (theme: GrafanaTheme2) => ({
  listItem: css({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: `${theme.spacing(1)} ${theme.spacing(2)}`,

    '&:nth-child(even)': {
      background: theme.colors.background.secondary,
    },
  }),
  listItemClone: css({
    border: `solid 1px ${theme.colors.primary.shade}`,
  }),
  listHeader: css({
    fontWeight: theme.typography.fontWeightBold,
    borderBottom: `1px solid ${theme.colors.border.weak}`,
  }),
});
