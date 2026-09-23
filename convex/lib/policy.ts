export const categories = ['Developer tools', 'Web & frontend', 'AI & machine learning', 'Productivity', 'Data & analytics', 'Infrastructure', 'Design', 'Other'] as const;
export const licenses = ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', '0BSD', 'Unlicense', 'CC0-1.0'];
export function parseRepository(input: string) {
  const value = input.trim().replace(/\.git\/?$/, '').replace(/\/$/, '');
  const match = /^(?:https:\/\/github\.com\/)?([a-zA-Z0-9-]+)\/([a-zA-Z0-9_.-]+)$/.exec(value);
  if (!match || match[2] === '.' || match[2] === '..') throw new Error('Enter a public GitHub repository URL, such as https://github.com/owner/repo.');
  return `${match[1]}/${match[2]}`;
}
export function validateDetails(category: string, description: string) {
  if (!(categories as readonly string[]).includes(category)) throw new Error('Choose a valid category.');
  if (description.trim().length < 20 || description.length > 1200) throw new Error('Write a description between 20 and 1,200 characters.');
}
