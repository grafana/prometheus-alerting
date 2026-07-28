import { test, expect } from './fixtures/ruler';
import { RuleBuilder, TEST_DATASOURCE_UID, TEST_NAMESPACE } from './factories/rules';

const vanillaPrometheusCloudRule = RuleBuilder.createCloudRuleIdentifier(
  TEST_DATASOURCE_UID,
  TEST_NAMESPACE,
  'test-group',
  'HighErrorRate'
);

test.describe('Rules RBAC editor feedback', () => {
  test('an editor sees that a handcrafted edit URL targets a datasource without Ruler support', async ({
    ruleEditorPage,
  }) => {
    await ruleEditorPage.gotoEdit(vanillaPrometheusCloudRule);

    await expect(ruleEditorPage.rulerApiNotSupportedAlert).toContainText(
      'Editing rules is only available for data sources with Ruler API.'
    );
  });

  test('an editor sees that a handcrafted clone URL targets a datasource without Ruler support', async ({
    ruleEditorPage,
  }) => {
    await ruleEditorPage.gotoClone(vanillaPrometheusCloudRule);

    await expect(ruleEditorPage.rulerApiNotSupportedAlert).toContainText(
      'Cloning rules is only available for data sources with Ruler API.'
    );
  });
});

test.describe('Rules RBAC editor mutations', () => {
  test('an editor can create a rule in a Ruler-enabled data source', async ({
    page,
    ruleEditorPage,
    mimirGroup,
    mimirRuler,
  }) => {
    const groupName = mimirGroup('rbac-editor-group');

    await ruleEditorPage.gotoNew('alerting');
    await ruleEditorPage.waitForLoad('New alert rule');
    await ruleEditorPage.fillRuleName('RBACEditorCanCreate');
    await ruleEditorPage.selectDataSource(mimirRuler.name);
    await ruleEditorPage.fillExpression('up == 0');
    await ruleEditorPage.selectNamespace(mimirRuler.namespace);
    await ruleEditorPage.createGroup(groupName);

    await ruleEditorPage.clickSave();

    await expect(page).toHaveURL(/\/rules\/cri/);
  });
});
