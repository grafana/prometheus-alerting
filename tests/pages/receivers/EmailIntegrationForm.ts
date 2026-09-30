import { Locator } from '@playwright/test';

export interface EmailFormParams {
  to?: string;
  from?: string;
  smarthost?: string;
  hello?: string;
  authUsername?: string;
  authPassword?: string;
  authSecret?: string;
  requireTls?: boolean;
  html?: string;
  text?: string;
  tlsServerName?: string;
  tlsSkipVerify?: boolean;
}

/**
 * Sub-page-object for an email integration's fields within the receiver drawer's create/edit
 * form. Scoped to the whole drawer, not a specific integration index — safe as long as a form has
 * at most one email integration. Obtained via `ReceiversPage.selectEmailIntegration`.
 *
 * TLS `ca_file`/`cert_file`/`key_file` are deliberately not exposed, same reason as
 * `WebhookIntegrationForm`: Mimir's Alertmanager rejects local file paths in TLS config outright.
 */
export class EmailIntegrationForm {
  readonly toInput: Locator;
  readonly fromInput: Locator;
  readonly smarthostInput: Locator;
  readonly helloInput: Locator;
  readonly authUsernameInput: Locator;
  readonly authPasswordInput: Locator;
  readonly authSecretInput: Locator;
  readonly requireTlsCheckbox: Locator;
  readonly htmlInput: Locator;
  readonly textInput: Locator;
  readonly tlsServerNameInput: Locator;
  readonly tlsSkipVerifyCheckbox: Locator;
  readonly addHeaderButton: Locator;

  constructor(scope: Locator) {
    this.toInput = scope.getByLabel('To', { exact: true });
    this.fromInput = scope.getByLabel('From', { exact: true });
    this.smarthostInput = scope.getByLabel('SMTP host', { exact: true });
    this.helloInput = scope.getByLabel('Hello', { exact: true });
    this.authUsernameInput = scope.getByLabel('Username', { exact: true });
    this.authPasswordInput = scope.getByLabel('Password', { exact: true });
    this.authSecretInput = scope.getByLabel('Secret', { exact: true });
    this.requireTlsCheckbox = scope.getByLabel('Require TLS', { exact: true });
    this.htmlInput = scope.getByLabel('Email HTML body', { exact: true });
    this.textInput = scope.getByLabel('Email text body', { exact: true });
    this.tlsServerNameInput = scope.getByLabel('TLS server name', { exact: true });
    this.tlsSkipVerifyCheckbox = scope.getByLabel('Skip TLS certificate verification', { exact: true });
    this.addHeaderButton = scope.getByRole('button', { name: 'Add header', exact: true });
  }

  async addHeader(key: string, value: string) {
    await this.addHeaderButton.click();
    await this.addHeaderButton.locator('xpath=preceding::input[@aria-label="Header key"][1]').fill(key);
    await this.addHeaderButton.locator('xpath=preceding::input[@aria-label="Header value"][1]').fill(value);
  }

  /** Fill any subset of the email's top-level and `tls_config` fields. */
  async fill({
    to,
    from,
    smarthost,
    hello,
    authUsername,
    authPassword,
    authSecret,
    requireTls,
    html,
    text,
    tlsServerName,
    tlsSkipVerify,
  }: EmailFormParams) {
    if (to !== undefined) {
      await this.toInput.fill(to);
    }
    if (from !== undefined) {
      await this.fromInput.fill(from);
    }
    if (smarthost !== undefined) {
      await this.smarthostInput.fill(smarthost);
    }
    if (hello !== undefined) {
      await this.helloInput.fill(hello);
    }
    if (authUsername !== undefined) {
      await this.authUsernameInput.fill(authUsername);
    }
    if (authPassword !== undefined) {
      await this.authPasswordInput.fill(authPassword);
    }
    if (authSecret !== undefined) {
      await this.authSecretInput.fill(authSecret);
    }
    if (requireTls) {
      // Grafana's `Checkbox` renders a decorative `<span>` checkmark stacked (z-index) above the
      // visually-hidden `<input>`, both wrapped in one `<label>`. A plain click on the input is
      // never "actionable" per Playwright's overlap check (the span is always topmost), so force
      // it — the browser still forwards the click to the input via the enclosing label.
      await this.requireTlsCheckbox.click({ force: true });
    }
    if (html !== undefined) {
      await this.htmlInput.fill(html);
    }
    if (text !== undefined) {
      await this.textInput.fill(text);
    }
    if (tlsServerName !== undefined) {
      await this.tlsServerNameInput.fill(tlsServerName);
    }
    if (tlsSkipVerify) {
      // Same Checkbox quirk as `requireTlsCheckbox` above.
      await this.tlsSkipVerifyCheckbox.click({ force: true });
    }
  }
}
