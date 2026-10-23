export const categories = ['Developer tools', 'Web & frontend', 'AI & machine learning', 'Productivity', 'Data & analytics', 'Infrastructure', 'Design', 'Other'] as const;
export const licenses = ['MIT', 'Unlicense', 'CC0-1.0', '0BSD', 'MIT-0', 'WTFPL', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', 'Zlib', 'BSL-1.0'] as const;
export type PermittedLicense = typeof licenses[number];
export const licensePolicyMessage = 'Nebula only accepts projects with a permitted permissive licence. We recommend the MIT licence. If you maintain this repository, add an MIT LICENSE file or another permitted licence, wait for GitHub to recognise it, and try again.';
export function isPermittedLicense(license: unknown): license is PermittedLicense {
  return licenses.some(permitted => permitted === license);
}
export function validateLicense(license: unknown) {
  if (!isPermittedLicense(license)) throw new Error(licensePolicyMessage);
}
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
