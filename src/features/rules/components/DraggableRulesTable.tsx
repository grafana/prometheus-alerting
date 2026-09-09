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

import { safeParsePrometheusDuration } from '../../../utils/time.utils';

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
 * Calculate the number of evaluations from a matching expression to a firing alert.
 *
 * Prometheus starts the pending period on the first matching evaluation, then promotes
 * the alert on the first later evaluation where the elapsed time is at least `for`.
 * The examples below assume the expression remains true for every evaluation.
 *
 *   for        interval    evaluation 1        evaluation 2       evaluations
 *   ---------  ----------  ------------------  -----------------  -----------
 *   omitted    1s          firing              firing             1
 *   0s         1s          firing              firing             1
 *   800ms      1s          pending (t=0)       firing (t=1s)      2
 *   1s         1s          pending (t=0)       firing (t=1s)      2
 */
function getEvaluationsToStartAlerting(pendingPeriod: string, groupInterval: string): number {
  const pendingMs = safeParsePrometheusDuration(pendingPeriod);
  const intervalMs = safeParsePrometheusDuration(groupInterval);

  if (intervalMs === 0) {
    return 0;
  }

  return Math.ceil(pendingMs / intervalMs) + 1;
}

export function DraggableRulesTable({ rules, groupInterval, onSwap }: DraggableRulesTableProps) {
  const styles = useStyles2(getStyles);
  const [rulesList, setRulesList] = useState<RulerRuleDTO[]>(rules);

  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) {
        return;
      }

      const destinationIndex = result.destination.index;
      const swapOperation: SwapOperation = [result.source.index, destinationIndex];
      onSwap(swapOperation);

      // Re-order the rules list for the UI rendering
      const newOrderedRules = produce(rulesList, (draft) => {
        const [item] = draft.splice(result.source.index, 1);
        draft.splice(destinationIndex, 0, item);
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
      pendingPeriod={pendingPeriod || t('alerting.draggable-rules-table.no-pending-period', 'None')}
      evalsToStartAlerting={
        isRecording ? (
          <Badge text={t('alerting.draggable-rules-table.recording', 'Recording')} color="purple" />
        ) : (
          numberEvaluationsToStartAlerting
        )
      }
      data-testid="reorder-alert-rule"
      className={cx(styles.listItem, { [styles.listItemClone]: isClone })}
      /* eslint-disable react-hooks/refs -- provided.innerRef/draggableProps/dragHandleProps are @hello-pangea/dnd render-prop API, not useRef values */
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      /* eslint-enable react-hooks/refs */
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
