/** Normalize text for case- and whitespace-insensitive matching. */
export function normalizeMessage(value) {
  return String(value ?? '').trim().replace(/\s+/gu, ' ').toLocaleLowerCase();
}
