import { Locator, Page, expect } from '@playwright/test';
import { AlertmanagerPage } from './AlertmanagerPage';

const ACKNOWLEDGEMENT = 'I understand the consequences, I want to edit the configuration';

/** Just enough of Monaco's global to set an editor's contents, and read its marks, from the page. */
type MonacoGlobal = {
  editor: {
    getModels(): Array<{ setValue(value: string): void }>;
    getEditors(): Array<{ getValue(): string }>;
    getModelMarkers(filter: { owner?: string }): Array<{ message: string; startLineNumber: number }>;
  };
};

/** Matches MARKER_OWNER in StoredConfigEditor, so this only reads our own marks. */
const YAML_MARKER_OWNER = 'alertmanager-config-yaml';

/**
 * Page object for the plugin's own configuration page (`/plugins/<pluginId>`).
 *
 * The Alertmanager configuration lives here in two tabs. **Source** is the document Mimir has
 * stored and is editable; **Resolved** is what the Alertmanager reports it is running and is always
 * read-only. Vanilla `test-alertmanager` has no configuration API, so it gets an explanation on the
 * Source tab instead of an editor. See `src/features/alertmanagerConfig/`.
 */
export class AppConfigPage extends AlertmanagerPage {
  readonly container: Locator;

  readonly sourceTab: Locator;
  readonly resolvedTab: Locator;

  readonly editor: Locator;
  readonly saveButton: Locator;
  readonly discardButton: Locator;
  readonly acknowledgeCheckbox: Locator;
  readonly acknowledgeLabel: Locator;
  readonly unavailableMessage: Locator;

  readonly confirmSaveModal: Locator;
  readonly saveSuccessNotification: Locator;

  constructor(page: Page, pluginId: string) {
    super(page, pluginId);

    this.container = page.getByTestId('data-testid prom-app-config');

    this.sourceTab = page.getByRole('tab', { name: 'Source' });
    this.resolvedTab = page.getByRole('tab', { name: 'Resolved' });

    // Monaco's own textarea, located by class rather than by role: role queries against a mounted
    // Monaco editor overflow Playwright's accessible-name computation. Only one editor is mounted at
    // a time, since only one tab is active.
    this.editor = page.locator('textarea.inputarea');
    this.saveButton = page.getByRole('button', { name: 'Save configuration' });
    this.discardButton = page.getByRole('button', { name: 'Discard changes' });
    this.acknowledgeCheckbox = this.container.locator('input[type="checkbox"]');
    this.acknowledgeLabel = this.container.getByText(ACKNOWLEDGEMENT);
    this.unavailableMessage = page.getByText('Configuration changes unavailable');

    this.confirmSaveModal = page.getByRole('dialog', { name: 'Replace the Alertmanager configuration' });
    // Grafana's app notifications. Worth asserting on: this page renders outside the app's own
    // routes, so it is not obvious that publishing to appEvents from here reaches the user.
    this.saveSuccessNotification = page.getByText('Alertmanager configuration updated');
  }

  async goto() {
    await this.page.goto(`/plugins/${this.pluginId}`);
  }

  async waitForLoad() {
    await expect(this.container).toBeVisible({ timeout: 10000 });
  }

  /** Seed the given Alertmanager UID in sessionStorage, then navigate + wait. */
  async gotoWithAlertmanager(uid: string) {
    await AlertmanagerPage.seedAlertmanager(this.page, uid);
    await this.goto();
    await this.waitForLoad();
    await expect(this.sourceTab).toBeVisible();
  }

  async openResolvedTab() {
    await this.resolvedTab.click();
    await expect(this.editor).toBeVisible();
  }

  /** The document Monaco actually holds, or empty while the editor is between mounts. */
  async getConfiguration(): Promise<string> {
    await this.editor.waitFor({ state: 'attached' });

    return this.page.evaluate(() => {
      const monaco = (window as unknown as { monaco?: MonacoGlobal }).monaco;
      const editor = monaco?.editor.getEditors()[0];

      return editor ? editor.getValue() : '';
    });
  }

  /**
   * The YAML problems the editor is marking, as `<line>: <message>`.
   *
   * There is no message anywhere on the page to read: a problem is marked on the line it is on,
   * which is a Monaco decoration and only reachable through its API.
   */
  async getYamlProblems(): Promise<string[]> {
    return this.page.evaluate((owner) => {
      const monaco = (window as unknown as { monaco?: MonacoGlobal }).monaco;
      const markers = monaco?.editor.getModelMarkers({ owner }) ?? [];

      return markers.map((marker) => `${marker.startLineNumber}: ${marker.message}`);
    }, YAML_MARKER_OWNER);
  }

  /** Type at the cursor without acknowledging first, to check the editor refuses the edit. */
  async typeWithoutAcknowledging(text: string) {
    await this.editor.click();
    await this.page.keyboard.type(text);
  }

  /**
   * Replace the editor's contents by setting Monaco's model directly.
   *
   * Typing it in does not work for YAML. Monaco auto-indents text that arrives as keystrokes, so
   * every line ends up nested under the one above it and the result does not parse, and select-all
   * plus insert leaves part of the old text behind. Setting the model is the only way to get exactly
   * the intended document in.
   *
   * Setting the model fires Monaco's content-change event, which is what the editor component
   * listens to, so no blur is needed to get the text in.
   */
  async acknowledgeWarning() {
    if (await this.acknowledgeCheckbox.isChecked()) {
      return;
    }

    await this.acknowledgeCheckbox.check({ force: true });
    await expect.poll(() => this.acknowledgeCheckbox.isChecked()).toBe(true);
  }

  async fillConfiguration(configuration: string) {
    await this.acknowledgeWarning();
    await this.editor.click();

    await this.page.evaluate((value) => {
      const monaco = (window as unknown as { monaco?: MonacoGlobal }).monaco;
      const model = monaco?.editor.getModels()[0];

      if (!model) {
        throw new Error('Monaco is not loaded, cannot set the editor contents');
      }

      model.setValue(value);
    }, configuration);
  }

  /**
   * Type at the cursor, leaving focus in the editor.
   *
   * Deliberately real keystrokes and no blur: the buttons have to react to typing, and one short
   * string sidesteps the auto-indent that makes typing multi-line YAML useless.
   */
  async typeIntoConfiguration(text: string) {
    await this.acknowledgeWarning();
    await this.editor.click();
    await this.page.keyboard.type(text);
  }

  /** Save, and confirm the replacement. */
  async saveAndConfirm() {
    await this.saveButton.click();
    await expect(this.confirmSaveModal).toBeVisible();
    await this.confirmSaveModal.getByRole('button', { name: 'Replace configuration' }).click();
    await expect(this.confirmSaveModal).toBeHidden();
  }
}
