import React from 'react';

import { AlertLabel } from '@grafana/alerting';
import { type ObjectMatcher, formatObjectMatcherForDisplay } from '@grafana/external-alertmanager/vanilla';
import { Stack } from '@grafana/ui';

interface MatcherLabelsProps {
  matchers: ObjectMatcher[];
}

export function MatcherLabels({ matchers }: MatcherLabelsProps) {
  return (
    <Stack direction="row" gap={0.5} wrap="wrap">
      {matchers.map((matcher, index) => {
        const value = formatObjectMatcherForDisplay(matcher);
        return <AlertLabel key={`${value}-${index}`} value={value} colorBy="value" />;
      })}
    </Stack>
  );
}
