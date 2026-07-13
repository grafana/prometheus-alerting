import { Locator } from '@playwright/test';

export interface WebhookFormParams {
  url?: string;
  maxAlerts?: string;
  proxyUrl?: string;
  basicAuthUsername?: string;
  basicAuthPassword?: string;
  tlsServerName?: string;
  tlsSkipVerify?: boolean;
}

/**
 * Sub-page-object for a webhook integration's fields within the receiver drawer's create/edit
 * form (`RouteEditForm`'s sibling, `ReceiverEditForm`). Scoped to the whole drawer, not a specific
 * integration index — safe as long as a form has at most one webhook integration. Obtained via
 * `ReceiversPage.selectWebhookIntegration`.
 */
export class WebhookIntegrationForm {
  readonly urlInput: Locator;
  readonly maxAlertsInput: Locator;
  readonly proxyUrlInput: Locator;
  readonly basicAuthUsernameInput: Locator;
  readonly basicAuthPasswordInput: Locator;
  readonly tlsServerNameInput: Locator;
  readonly tlsSkipVerifyCheckbox: Locator;

  constructor(scope: Locator) {
    this.urlInput = scope.getByLabel('URL', { exact: true });
    this.maxAlertsInput = scope.getByLabel('Max alerts', { exact: true });
    this.proxyUrlInput = scope.getByLabel('Proxy URL', { exact: true });
    this.basicAuthUsernameInput = scope.getByLabel('Username', { exact: true });
    this.basicAuthPasswordInput = scope.getByLabel('Password', { exact: true });
    this.tlsServerNameInput = scope.getByLabel('Server name', { exact: true });
    this.tlsSkipVerifyCheckbox = scope.getByLabel('Skip verify', { exact: true });
  }

  /** Fill any subset of the webhook's URL, `max_alerts`, and `http_config` fields. */
  async fill({
    url,
    maxAlerts,
    proxyUrl,
    basicAuthUsername,
    basicAuthPassword,
    tlsServerName,
    tlsSkipVerify,
  }: WebhookFormParams) {
    if (url !== undefined) {
      await this.urlInput.fill(url);
    }
    if (maxAlerts !== undefined) {
      await this.maxAlertsInput.fill(maxAlerts);
    }
    if (proxyUrl !== undefined) {
      await this.proxyUrlInput.fill(proxyUrl);
    }
    if (basicAuthUsername !== undefined) {
      await this.basicAuthUsernameInput.fill(basicAuthUsername);
    }
    if (basicAuthPassword !== undefined) {
      await this.basicAuthPasswordInput.fill(basicAuthPassword);
    }
    if (tlsServerName !== undefined) {
      await this.tlsServerNameInput.fill(tlsServerName);
    }
    if (tlsSkipVerify) {
      // Grafana's `Checkbox` renders a decorative `<span>` checkmark stacked (z-index) above the
      // visually-hidden `<input>`, both wrapped in one `<label>`. A plain click on the input is
      // never "actionable" per Playwright's overlap check (the span is always topmost), so force
      // it — the browser still forwards the click to the input via the enclosing label.
      await this.tlsSkipVerifyCheckbox.click({ force: true });
    }
  }
}
