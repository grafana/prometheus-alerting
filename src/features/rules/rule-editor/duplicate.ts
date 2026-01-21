export function generateCopiedName(originalName: string, existingNames: string[]) {
  const nonDuplicateName = originalName.replace(/\(copy( [0-9]+)?\)$/, '').trim();

  let newName = `${nonDuplicateName} (copy)`;

  for (let i = 2; existingNames.includes(newName); i++) {
    newName = `${nonDuplicateName} (copy ${i})`;
  }

  return newName;
}
