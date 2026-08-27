import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AlertRuleListItem, RecordingRuleListItem, type RuleListItemCommonProps } from './AlertRuleListItem';

const commonProps: RuleListItemCommonProps = {
  name: 'Test rule',
  rulesSource: { uid: 'test-data-source', name: 'Test data source' },
  group: 'Test group',
  namespace: 'Test namespace',
};

describe('rule list item description', () => {
  it('renders an alert rule summary and health error on separate lines', () => {
    render(<AlertRuleListItem {...commonProps} summary="Rule summary" error="Rule evaluation failed" />);

    const summary = screen.getByText('Rule summary');
    const description = summary.parentElement;

    expect(description).toHaveStyle({ display: 'flex', flexDirection: 'column' });
    expect(description).toContainElement(screen.getByText(/Rule evaluation failed/));
  });

  it('renders a recording rule health error in the description column', () => {
    render(<RecordingRuleListItem {...commonProps} error="Rule evaluation failed" />);

    expect(screen.getByText(/Rule evaluation failed/).parentElement).toHaveStyle({
      display: 'flex',
      flexDirection: 'column',
    });
  });
});
