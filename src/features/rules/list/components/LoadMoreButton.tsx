import React from 'react';

import { t } from '@grafana/i18n';
import { Button } from '@grafana/ui';

interface LoadMoreButtonProps {
  onClick: () => void;
  loading?: boolean;
}

export function LoadMoreButton({ onClick, loading = false }: LoadMoreButtonProps) {
  return (
    <Button
      data-testid="load-more-rule-groups"
      aria-label={t('rules.load-more.aria-label', 'Show more…')}
      fill="text"
      size="sm"
      variant="secondary"
      onClick={onClick}
      disabled={loading}
    >
      {loading ? t('rules.load-more.loading', 'Loading more groups…') : t('rules.load-more.show-more', 'Show more…')}
    </Button>
  );
}
