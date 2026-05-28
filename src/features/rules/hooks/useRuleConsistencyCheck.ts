import { useCallback, useEffect, useRef, useState } from 'react';

import { DataSourceRuleIdentifier } from '@grafana/external-rules/identifiers';
import { PromRuleDTO } from '@grafana/external-rules/vanilla';

import { prometheusApi } from '../../../api/rules/prometheus.endpoints';

const { useLazyGetGroupsQuery } = prometheusApi;

/** Polling interval for consistency checks (3 seconds) */
const CONSISTENCY_CHECK_INTERVAL = 3000;
/** Maximum time to wait for consistency (90 seconds) */
const CONSISTENCY_CHECK_TIMEOUT = 90000;

/**
 * Hook to check if a specific rule exists in the Prometheus API.
 * Used for consistency checks between Prometheus (state) and Ruler (config) APIs.
 */
export function useMatchingPromRuleExists() {
  const [fetchPrometheusGroups] = useLazyGetGroupsQuery();

  const matchingPromRuleExists = useCallback(
    async (identifier: DataSourceRuleIdentifier): Promise<boolean> => {
      const { uid, namespace, groupName, ruleName } = identifier;

      try {
        const response = await fetchPrometheusGroups(
          {
            ruleSource: { uid },
            namespace,
            groupName,
            ruleName,
          },
          false // preferCacheValue = false, force fresh fetch
        ).unwrap();

        // Find matching group
        const matchingGroup = response.data.groups.find((g) => g.file === namespace && g.name === groupName);

        if (!matchingGroup) {
          return false;
        }

        // Find matching rule by name
        const hasMatchingRule = matchingGroup.rules.some((rule: PromRuleDTO) => rule.name === ruleName);

        return hasMatchingRule;
      } catch (error) {
        // If the request fails, we can't determine if the rule exists
        console.warn('Error checking if rule exists in Prometheus:', error);
        return false;
      }
    },
    [fetchPrometheusGroups]
  );

  return { matchingPromRuleExists };
}

/**
 * Hook that provides functions to wait for rule consistency between Prometheus and Ruler APIs.
 * Use this after create/delete operations to ensure the UI shows accurate data.
 */
export function useRuleConsistencyCheck() {
  const { matchingPromRuleExists } = useMatchingPromRuleExists();

  const removalIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const removalTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const creationIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const creationTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const clearRemovalInterval = () => {
    if (removalIntervalRef.current) {
      clearInterval(removalIntervalRef.current);
      removalIntervalRef.current = undefined;
    }
    if (removalTimeoutRef.current) {
      clearTimeout(removalTimeoutRef.current);
      removalTimeoutRef.current = undefined;
    }
  };

  const clearCreationInterval = () => {
    if (creationIntervalRef.current) {
      clearInterval(creationIntervalRef.current);
      creationIntervalRef.current = undefined;
    }
    if (creationTimeoutRef.current) {
      clearTimeout(creationTimeoutRef.current);
      creationTimeoutRef.current = undefined;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearRemovalInterval();
      clearCreationInterval();
    };
  }, []);

  /**
   * Wait until a rule is removed from the Prometheus API.
   * Use this after deleting a rule to ensure the list view doesn't show stale data.
   */
  const waitForRemoval = useCallback(
    async (identifier: DataSourceRuleIdentifier): Promise<void> => {
      // We can wait only for one rule at a time
      clearRemovalInterval();

      const timeoutPromise = new Promise<void>((_, reject) => {
        removalTimeoutRef.current = setTimeout(() => {
          clearRemovalInterval();
          reject(new Error('Timeout while waiting for rule removal'));
        }, CONSISTENCY_CHECK_TIMEOUT);
      });

      const waitPromise = new Promise<void>((resolve, reject) => {
        removalIntervalRef.current = setInterval(() => {
          matchingPromRuleExists(identifier)
            .then((ruleExists) => {
              if (ruleExists === false) {
                clearRemovalInterval();
                resolve();
              }
            })
            .catch((error) => {
              clearRemovalInterval();
              reject(error);
            });
        }, CONSISTENCY_CHECK_INTERVAL);
      });

      return Promise.race([timeoutPromise, waitPromise]);
    },
    [matchingPromRuleExists]
  );

  /**
   * Wait until a rule appears in the Prometheus API.
   * Use this after creating a rule to ensure the details page shows accurate data.
   * Matches Grafana core's usePrometheusConsistencyCheck pattern.
   */
  const waitForCreation = useCallback(
    async (identifier: DataSourceRuleIdentifier): Promise<void> => {
      // We can wait only for one rule at a time
      clearCreationInterval();

      const timeoutPromise = new Promise<void>((_, reject) => {
        creationTimeoutRef.current = setTimeout(() => {
          clearCreationInterval();
          reject(new Error('Timeout while waiting for rule creation'));
        }, CONSISTENCY_CHECK_TIMEOUT);
      });

      const waitPromise = new Promise<void>((resolve, reject) => {
        creationIntervalRef.current = setInterval(() => {
          matchingPromRuleExists(identifier)
            .then((ruleExists) => {
              if (ruleExists === true) {
                clearCreationInterval();
                resolve();
              }
            })
            .catch((error) => {
              clearCreationInterval();
              reject(error);
            });
        }, CONSISTENCY_CHECK_INTERVAL);
      });

      return Promise.race([timeoutPromise, waitPromise]);
    },
    [matchingPromRuleExists]
  );

  return { waitForRemoval, waitForCreation };
}

export type ConsistencyCheckStatus = 'idle' | 'checking' | 'consistent' | 'timeout' | 'error';

export interface RuleCreationConsistencyState {
  /** Whether the rule is consistent (visible in Prometheus API) */
  isConsistent: boolean;
  /** Current status of the consistency check */
  status: ConsistencyCheckStatus;
  /** Error if the check failed */
  error: Error | null;
}

/**
 * Hook to automatically check if a newly created rule is visible in the Prometheus API.
 * Shows a warning while the rule is being propagated.
 *
 * @param identifier - The rule identifier to check
 * @param skip - Whether to skip the check (e.g., for existing rules)
 */
export function useRuleCreationConsistencyCheck(
  identifier: DataSourceRuleIdentifier | null,
  skip = false
): RuleCreationConsistencyState {
  const { matchingPromRuleExists } = useMatchingPromRuleExists();
  const { waitForCreation } = useRuleConsistencyCheck();

  const [status, setStatus] = useState<ConsistencyCheckStatus>('idle');
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!identifier || skip) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus('idle');
      return;
    }

    let cancelled = false;

    const checkConsistency = async () => {
      try {
        // First, check if the rule already exists (matches Grafana core pattern)
        const exists = await matchingPromRuleExists(identifier);

        if (cancelled) {
          return;
        }

        if (exists) {
          // Rule already exists, no need to wait
          setStatus('consistent');
          return;
        }

        // Rule doesn't exist yet, start waiting
        setStatus('checking');

        await waitForCreation(identifier);

        if (cancelled) {
          return;
        }

        setStatus('consistent');
      } catch (err) {
        if (cancelled) {
          return;
        }

        // Check if it's a timeout error
        const errorMessage = err instanceof Error ? err.message : '';
        if (errorMessage.includes('Timeout')) {
          setStatus('timeout');
        } else {
          setStatus('error');
        }
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    };

    checkConsistency();

    return () => {
      cancelled = true;
    };
  }, [identifier, skip, matchingPromRuleExists, waitForCreation]);

  return {
    isConsistent: status === 'consistent' || status === 'idle',
    status,
    error,
  };
}
