/**
 * timestamps.ts
 *
 * Shared timestamp type utilities for Atlas contracts.
 *
 * Timestamps are ISO-8601 strings (e.g. "2025-06-01T09:00:00Z").
 */

/** An ISO-8601 timestamp string. */
export type IsoTimestamp = string;

/**
 * Returns true when the given string looks like a valid ISO-8601 timestamp.
 * This is a lenient structural check, not a full date-validity check.
 */
export function isIsoTimestamp(value: unknown): value is IsoTimestamp {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
}
