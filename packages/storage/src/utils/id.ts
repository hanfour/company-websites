/**
 * ID Generation
 *
 * Simple, collision-resistant IDs.
 * Format: timestamp + random = sortable and unique
 */

export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
}

/**
 * Parse timestamp from ID (for sorting)
 */
export function getTimestampFromId(id: string): number {
  const timestamp = id.split('-')[0];
  return parseInt(timestamp, 36);
}
