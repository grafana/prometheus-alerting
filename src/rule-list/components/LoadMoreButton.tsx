import React from 'react';

import { Button } from '@grafana/ui';

interface LoadMoreButtonProps {
  onClick: () => void;
  loading?: boolean;
}

export function LoadMoreButton({ onClick, loading = false }: LoadMoreButtonProps) {
  return (
    <Button
      data-testid="load-more-rule-groups"
      aria-label="Show more…"
      fill="text"
      size="sm"
      variant="secondary"
      onClick={onClick}
      disabled={loading}
    >
      {loading ? 'Loading more groups…' : 'Show more…'}
    </Button>
  );
}
