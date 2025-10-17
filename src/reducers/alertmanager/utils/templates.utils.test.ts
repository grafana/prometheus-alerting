import { ensureDefine, updateDefinesWithUniqueValue } from './templates.utils';

describe('ensureDefine', () => {
  it('should wrap content without define tag', () => {
    expect(ensureDefine('myTemplate', 'Hello {{.CommonLabels.alertname}}')).toBe(
      '{{ define "myTemplate" }}\n  Hello {{.CommonLabels.alertname}}\n{{ end }}'
    );
  });

  it('should wrap and indent multi-line content', () => {
    expect(ensureDefine('myTemplate', 'Line 1\nLine 2\nLine 3')).toBe(
      '{{ define "myTemplate" }}\n  Line 1\n  Line 2\n  Line 3\n{{ end }}'
    );
  });

  it('should not wrap content that already has define tag', () => {
    const content = '{{ define "existingName" }}\nContent\n{{ end }}';
    expect(ensureDefine('myTemplate', content)).toBe(content);
  });

  it('should trim whitespace before wrapping', () => {
    expect(ensureDefine('myTemplate', '  \n  Content  \n  ')).toBe('{{ define "myTemplate" }}\n  Content\n{{ end }}');
  });
});

describe('updateDefinesWithUniqueValue method', () => {
  it('should update single define with unique timestamp', () => {
    const result = updateDefinesWithUniqueValue(`{{ define "t" }}\n{{.Alerts.Firing}}\n{{ end }}`);
    expect(result).toMatch(/\{\{ define "t_COPY_\d+" \}\}\n\{\{\.Alerts\.Firing\}\}\n\{\{ end \}\}/);
  });

  it('should update multiple defines with unique timestamp', () => {
    const result = updateDefinesWithUniqueValue(
      `{{ define "t1" }}\n{{.Alerts.Firing}}\n{{ end }}\n{{ define "t2" }}\n{{.Alerts.Firing}}\n{{ end }}\n{{ define "t3" }}\n{{.Alerts.Firing}}\n{{ end }}\n`
    );
    expect(result).toMatch(/\{\{ define "t1_COPY_\d+" \}\}/);
    expect(result).toMatch(/\{\{ define "t2_COPY_\d+" \}\}/);
    expect(result).toMatch(/\{\{ define "t3_COPY_\d+" \}\}/);
  });

  it('should update defines with special characters in name', () => {
    const result = updateDefinesWithUniqueValue(
      `{{ define "t1 /^*;$@" }}\n{{.Alerts.Firing}}\n{{ end }}\n{{ define "t2" }}\n{{.Alerts.Firing}}\n{{ end }}\n{{ define "t3" }}\n{{.Alerts.Firing}}\n{{ end }}\n`
    );
    expect(result).toMatch(/\{\{ define "t1 \/\^\*;\$@_COPY_\d+" \}\}/);
    expect(result).toMatch(/\{\{ define "t2_COPY_\d+" \}\}/);
    expect(result).toMatch(/\{\{ define "t3_COPY_\d+" \}\}/);
  });
});
