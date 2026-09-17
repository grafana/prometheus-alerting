import React from 'react';

import { render, screen } from '@testing-library/react';
import { rs } from '@rstest/core';

import { NamespaceYamlDrawer } from './NamespaceYamlDrawer';
import * as grafanaUiActual from '@grafana/ui' with { rstest: 'importActual' };

const mocks = rs.hoisted(() => ({
  useGetRuleNamespaceYamlQuery: rs.fn(),
}));

rs.mock('../../../../api/rules/ruler.endpoints', () => ({
  rulerApi: {
    useGetRuleNamespaceYamlQuery: mocks.useGetRuleNamespaceYamlQuery,
  },
}));

rs.mock('@grafana/ui', () => {
  const actual = grafanaUiActual;

  return {
    ...actual,
    ClipboardButton: ({ children, getText }: { children: React.ReactNode; getText: () => string }) => (
      <button data-copy-text={getText()}>{children}</button>
    ),
    CodeEditor: ({
      value,
      language,
      readOnly,
      height,
      containerStyles,
    }: {
      value: string;
      language: string;
      readOnly: boolean;
      height: string;
      containerStyles: string;
    }) => (
      <textarea
        aria-label="YAML editor"
        data-container-styles={containerStyles}
        data-height={height}
        data-language={language}
        readOnly={readOnly}
        value={value}
      />
    ),
    Drawer: ({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) => (
      <section aria-label={title}>
        <p>{subtitle}</p>
        {children}
      </section>
    ),
    LoadingPlaceholder: ({ text }: { text: string }) => <p>{text}</p>,
  };
});

const props = {
  dataSourceUid: 'mimir-uid',
  namespace: 'platform-alerts',
  onClose: rs.fn(),
};

describe('NamespaceYamlDrawer', () => {
  it('shows a loading state while the namespace is requested', () => {
    mocks.useGetRuleNamespaceYamlQuery.mockReturnValue({ isLoading: true });

    render(<NamespaceYamlDrawer {...props} />);

    expect(screen.getByText('Loading namespace YAML...')).toBeInTheDocument();
    expect(mocks.useGetRuleNamespaceYamlQuery).toHaveBeenCalledWith({
      dataSourceUid: 'mimir-uid',
      namespace: 'platform-alerts',
    });
  });

  it('shows and copies the exact YAML response', () => {
    const yaml = ['platform-alerts:', '  - name: group', '    custom_field: keep-me', ''].join('\n');
    mocks.useGetRuleNamespaceYamlQuery.mockReturnValue({ data: yaml, isLoading: false });

    render(<NamespaceYamlDrawer {...props} />);

    expect(screen.getByRole('textbox', { name: 'YAML editor' })).toHaveValue(yaml);
    expect(screen.getByRole('textbox', { name: 'YAML editor' })).toHaveAttribute('data-language', 'yaml');
    expect(screen.getByRole('textbox', { name: 'YAML editor' })).toHaveAttribute('data-height', '100%');
    expect(screen.getByRole('textbox', { name: 'YAML editor' })).toHaveAttribute('data-container-styles');
    expect(screen.getByRole('textbox', { name: 'YAML editor' })).toHaveAttribute('readonly');
    expect(screen.getByRole('button', { name: 'Copy to clipboard' })).toHaveAttribute('data-copy-text', yaml);
  });

  it('shows an error without stale YAML or a copy action when the request fails', () => {
    mocks.useGetRuleNamespaceYamlQuery.mockReturnValue({
      data: 'stale: yaml',
      error: { status: 500, data: { message: 'Ruler unavailable' } },
      isLoading: false,
    });

    render(<NamespaceYamlDrawer {...props} />);

    expect(screen.getByText('Failed to load YAML for namespace platform-alerts')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'YAML editor' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Copy to clipboard' })).not.toBeInTheDocument();
  });
});
