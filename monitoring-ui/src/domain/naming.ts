/**
 * Nagios object names cannot contain whitespace, so operator-supplied names and
 * addresses are reduced to slugs before they reach generated configuration.
 */
export function slugify(value: string, fallback = 'host'): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);

  return slug.length > 0 ? slug : fallback;
}
