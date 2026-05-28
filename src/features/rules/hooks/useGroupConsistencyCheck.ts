import { useCallback, useEffect, useMemo, useRef } from 'react';

import type { PromRuleGroupDTO, RulerRuleGroupDTO } from '@grafana/external-rules/vanilla';
import { getRuleName } from '@grafana/external-rules/utils';

import { prometheusApi } from '../../../api/rules/prometheus.endpoints';
import { rulerApi } from '../../../api/rules/mimir.endpoints';

const { useLazyGetGroupsQuery } = prometheusApi;
const { useLazyGetRuleGroupQuery } = rulerApi;

/** Polling interval for consistency checks (3 seconds) */
const CONSISTENCY_CHECK_INTERVAL = 3000;
/** Maximum time to wait for consistency (90 seconds) */
const CONSISTENCY_CHECK_TIMEOUT = 90000;

export interface GroupConsistencyResult {
  /** Whether the group data is consistent between Prometheus and Ruler APIs */
  isInSync: boolean;
  /** Description of what's out of sync (if anything) */
  syncIssue?: string;
  /** Whether we can perform a consistency check (need both data sources) */
  canCheck: boolean;
}

/**
 * Hook to check if a rule group is consistent between the Prometheus API (state)
 * and the Ruler API (configuration).
 *
 * This helps identify when recent configuration changes haven't propagated yet,
 * or when there's a mismatch between what's configured and what's running.
 */
export function useGroupConsistencyCheck(
  promGroup: PromRuleGroupDTO | undefined,
  rulerGroup: RulerRuleGroupDTO | null | undefined,
  rulerApiEnabled: boolean
): GroupConsistencyResult {
  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- intentional: O(n) rule-array comparison; React Compiler cannot statically prove object identity here
  return useMemo(() => {
    // If Ruler API is not enabled, we can't compare - assume in sync
    if (!rulerApiEnabled) {
      return { isInSync: true, canCheck: false };
    }

    // If we don't have both groups, we can't compare
    if (!promGroup || !rulerGroup) {
      // If we have ruler but not prom, the rule might be newly created
      if (rulerGroup && !promGroup) {
        return {
          isInSync: false,
          syncIssue: 'Group exists in configuration but not yet visible in Prometheus',
          canCheck: true,
        };
      }
      // If we have prom but not ruler, the rule might have been deleted
      if (promGroup && !rulerGroup) {
        return {
          isInSync: false,
          syncIssue: 'Group visible in Prometheus but not found in configuration',
          canCheck: true,
        };
      }
      return { isInSync: true, canCheck: false };
    }

    // Compare rule counts
    if (promGroup.rules.length !== rulerGroup.rules.length) {
      return {
        isInSync: false,
        syncIssue: `Rule count mismatch: ${promGroup.rules.length} in Prometheus, ${rulerGroup.rules.length} in configuration`,
        canCheck: true,
      };
    }

    // Compare rule names (in order)
    const promRuleNames = promGroup.rules.map((r) => r.name);
    const rulerRuleNames = rulerGroup.rules.map(getRuleName);

    for (let i = 0; i < promRuleNames.length; i++) {
      if (promRuleNames[i] !== rulerRuleNames[i]) {
        return {
          isInSync: false,
          syncIssue: `Rule order or names differ at position ${i + 1}`,
          canCheck: true,
        };
      }
    }

    // All checks passed
    return { isInSync: true, canCheck: true };
  }, [promGroup, rulerGroup, rulerApiEnabled]);
}

/**
 * Pure function to check if two groups are in sync.
 * Used by the polling hook.
 */
function checkGroupsInSync(
  promGroup: PromRuleGroupDTO | undefined,
  rulerGroup: RulerRuleGroupDTO | null | undefined
): boolean {
  // If both are missing, consider it in sync (group deleted)
  if (!promGroup && !rulerGroup) {
    return true;
  }

  // If one exists but not the other, not in sync
  if (!promGroup || !rulerGroup) {
    return false;
  }

  // Compare rule counts
  if (promGroup.rules.length !== rulerGroup.rules.length) {
    return false;
  }

  // Compare rule names (in order)
  const promRuleNames = promGroup.rules.map((r) => r.name);
  const rulerRuleNames = rulerGroup.rules.map(getRuleName);

  for (let i = 0; i < promRuleNames.length; i++) {
    if (promRuleNames[i] !== rulerRuleNames[i]) {
      return false;
    }
  }

  return true;
}

export interface GroupIdentifier {
  dataSourceUid: string;
  namespace: string;
  groupName: string;
}

export interface WaitForConsistencyOptions {
  /**
   * When true, requires the group to exist in the Ruler API before resolving.
   * Use this after create/rename operations to ensure the group is available.
   * Default: false (allows resolution when both APIs agree group is missing - for deletions)
   */
  requireExists?: boolean;
}

/**
 * Hook that provides a function to wait for a rule group to be consistent
 * between Prometheus and Ruler APIs.
 *
 * Use this after mutations (save/delete) to ensure the UI shows up-to-date data.
 * Polls every 3 seconds and times out after 90 seconds.
 */
export function useWaitForGroupConsistency() {
  const [fetchPromGroups] = useLazyGetGroupsQuery();
  const [fetchRulerGroup] = useLazyGetRuleGroupQuery();

  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const waitForGroupConsistency = useCallback(
    async (groupIdentifier: GroupIdentifier, options: WaitForConsistencyOptions = {}): Promise<void> => {
      const { dataSourceUid, namespace, groupName } = groupIdentifier;
      const { requireExists = false } = options;

      // Clear any existing intervals
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      return new Promise((resolve, reject) => {
        // Set up timeout
        timeoutRef.current = setTimeout(() => {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          // On timeout, resolve anyway to not block the UI forever
          // The user will see the indicator on the details page
          console.warn('Timeout waiting for group consistency');
          resolve();
        }, CONSISTENCY_CHECK_TIMEOUT);

        // Function to check consistency
        const checkConsistency = async () => {
          try {
            // Fetch from both APIs, forcing refetch to bypass cache
            // Second param `false` means preferCacheValue=false (force fresh fetch)
            const [promResult, rulerResult] = await Promise.allSettled([
              fetchPromGroups(
                {
                  ruleSource: { uid: dataSourceUid },
                  namespace,
                  groupName,
                },
                false
              ).unwrap(),
              fetchRulerGroup(
                {
                  dataSourceUid,
                  namespace,
                  groupName,
                },
                false
              ).unwrap(),
            ]);

            // Extract groups from results
            const promGroup =
              promResult.status === 'fulfilled'
                ? promResult.value?.data.groups.find(
                    (g: PromRuleGroupDTO) => g.file === namespace && g.name === groupName
                  )
                : undefined;

            const rulerGroup = rulerResult.status === 'fulfilled' ? rulerResult.value : null;

            // If requireExists is true, wait until ruler has the group
            // This prevents resolving when both APIs agree group is missing (after rename)
            if (requireExists && !rulerGroup) {
              return; // Continue polling
            }

            // Check if in sync
            if (checkGroupsInSync(promGroup, rulerGroup)) {
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
              }
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }
              resolve();
            }
          } catch (error) {
            // On error, continue polling (might be transient)
            console.warn('Error checking group consistency:', error);
          }
        };

        // Start polling
        checkConsistency(); // Check immediately
        intervalRef.current = setInterval(checkConsistency, CONSISTENCY_CHECK_INTERVAL);
      });
    },
    [fetchPromGroups, fetchRulerGroup]
  );

  return { waitForGroupConsistency };
}
