import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rs } from '@rstest/core';

import { TemplateEditForm } from './TemplateEditForm';
import * as grafanaUiActual from '@grafana/ui' with { rstest: 'importActual' };

// The real CodeEditor is Monaco, which the Grafana host supplies at runtime and
// which has no DOM to attach to here. A textarea that reports its value on blur
// is enough: the form only ever reads the content on blur or save.
rs.mock('@grafana/ui', () => {
  const actual = grafanaUiActual;
  return {
    ...actual,
    CodeEditor: ({ value, onBlur }: { value: string; onBlur: (value: string) => void }) => (
      <textarea aria-label="Editor content" defaultValue={value} onBlur={(e) => onBlur(e.currentTarget.value)} />
    ),
  };
});

function renderForm(onSave = rs.fn()) {
  render(<TemplateEditForm existingTemplateNames={[]} onSave={onSave} onCancel={rs.fn()} />);
  return { onSave };
}

async function fillIn(user: ReturnType<typeof userEvent.setup>, name: string, content: string) {
  await user.type(screen.getByRole('textbox', { name: 'Name' }), name);
  await setContent(user, content);
}

async function setContent(user: ReturnType<typeof userEvent.setup>, content: string) {
  const editor = screen.getByRole('textbox', { name: 'Editor content' });
  await user.clear(editor);
  if (content !== '') {
    // Pasted rather than typed: userEvent reads `{` as the start of a key
    // description, so typing `{{ define }}` would enter a single brace.
    await user.click(editor);
    await user.paste(content);
  }
  await user.tab();
}

describe('template content validation', () => {
  it('refuses to save a template that will not parse', async () => {
    const user = userEvent.setup();
    const { onSave } = renderForm();

    await fillIn(user, 'broken', '{{ if .Alerts }}no end here');
    await user.click(screen.getByRole('button', { name: 'Create template' }));

    expect(await screen.findByText(/Template syntax error on line/)).toBeVisible();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves a template that parses', async () => {
    const user = userEvent.setup();
    const { onSave } = renderForm();

    await fillIn(user, 'good', '{{ define "good" }}{{ .Status | toUpper }}{{ end }}');
    await user.click(screen.getByRole('button', { name: 'Create template' }));

    expect(onSave).toHaveBeenCalledWith({
      title: 'good',
      content: '{{ define "good" }}{{ .Status | toUpper }}{{ end }}',
    });
  });

  it('saves content that has no define of its own, since saving adds one', async () => {
    const user = userEvent.setup();
    const { onSave } = renderForm();

    await fillIn(user, 'bare', '{{ .Status }}');
    await user.click(screen.getByRole('button', { name: 'Create template' }));

    expect(onSave).toHaveBeenCalled();
  });

  it('still requires content', async () => {
    const user = userEvent.setup();
    const { onSave } = renderForm();

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'empty');
    // A new template starts with a {{ define }} shell already filled in, so
    // this has to be emptied deliberately.
    await setContent(user, '');
    await user.click(screen.getByRole('button', { name: 'Create template' }));

    expect(await screen.findByText('Template content is required')).toBeVisible();
    expect(onSave).not.toHaveBeenCalled();
  });
});
