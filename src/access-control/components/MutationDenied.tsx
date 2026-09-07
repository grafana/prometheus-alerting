import React from 'react';
import { LoadingPlaceholder } from '@grafana/ui';
import { t } from '@grafana/i18n';

import { DeniedAbility } from '../abilities';
import { MutationUnavailable } from './MutationUnavailable';
import { PermissionDenied } from './PermissionDenied';

interface MutationDeniedProps {
  ability: DeniedAbility;
  resource: string;
}

/**
 * Says why a configuration resource cannot be changed, rather than leaving the reason to guesswork.
 * Every reason an ability can be denied has its own explanation here.
 */
export function MutationDenied({ ability, resource }: MutationDeniedProps) {
  switch (ability.cause) {
    case 'LOADING':
      return <LoadingPlaceholder text={t('common.loading', 'Loading...')} />;
    case 'INSUFFICIENT_PERMISSIONS':
      return <PermissionDenied />;
    case 'NOT_SUPPORTED':
      return <MutationUnavailable resource={resource} />;
    case 'ERROR':
      return <MutationUnavailable resource={resource} error={ability.error} />;
  }
}
