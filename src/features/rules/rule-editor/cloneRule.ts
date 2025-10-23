import type { RulerRuleDTO } from '@grafana/external-rules/vanilla';

// Generate a unique name for a cloned rule
function generateCopiedName(originalName: string, existingNames: string[]): string {
  const nonDuplicateName = originalName.replace(/\(copy( [0-9]+)?\)$/, '').trim();

  let newName = `${nonDuplicateName} (copy)`;

  for (let i = 2; existingNames.includes(newName); i++) {
    newName = `${nonDuplicateName} (copy ${i})`;
  }

  return newName;
}

// Get rule name from RulerRuleDTO
function getRuleName(rule: RulerRuleDTO): string {
  if ('alert' in rule) {
    return rule.alert;
  }
  if ('record' in rule) {
    return rule.record;
  }
  return '';
}

// Change the name of a rule
function changeRuleName(rule: RulerRuleDTO, newName: string): void {
  if ('alert' in rule) {
    rule.alert = newName;
  } else if ('record' in rule) {
    rule.record = newName;
  }
}

// Clone a rule definition, generating a new name based on existing rules in the group
export function cloneRuleDefinition(rule: RulerRuleDTO, existingRulesInGroup: RulerRuleDTO[]): RulerRuleDTO {
  // Deep clone the rule
  const ruleClone = JSON.parse(JSON.stringify(rule)) as RulerRuleDTO;

  // Generate a unique name
  const existingNames = existingRulesInGroup.map(getRuleName);
  const newName = generateCopiedName(getRuleName(rule), existingNames);
  changeRuleName(ruleClone, newName);

  return ruleClone;
}
