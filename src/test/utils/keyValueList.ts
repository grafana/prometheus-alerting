import { screen, within } from '@testing-library/react';

/**
 * Reads the label/value rows of the KeyValueList under a Section title, as [label, value] pairs,
 * e.g. [['Times', '09:00–17:00'], ['Weekdays', 'Monday–Friday']].
 */
export function keyValueRowsUnder(title: string) {
  // Walk up from the title to the section: the first element around it that holds any rows
  let section = screen.getByText(title, { exact: true });
  while (within(section).queryAllByRole('term').length === 0) {
    if (!section.parentElement) {
      throw new Error(`No label/value rows found under "${title}"`);
    }
    section = section.parentElement;
  }

  return within(section)
    .getAllByRole('term')
    .map((term) => [term.textContent, within(term.parentElement ?? term).getByRole('definition').textContent]);
}
