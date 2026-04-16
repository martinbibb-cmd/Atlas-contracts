/**
 * discriminatedUnions.ts
 *
 * Utility types for discriminated unions used across Atlas contracts.
 */

/**
 * Extracts the member of a discriminated union T whose `type` field equals K.
 *
 * Example:
 *   type Op = { type: 'add'; x: number } | { type: 'remove'; id: string };
 *   type AddOp = ExtractByType<Op, 'add'>; // { type: 'add'; x: number }
 */
export type ExtractByType<T extends { type: string }, K extends T['type']> =
  T extends { type: K } ? T : never;

/**
 * Extracts the member of a discriminated union T whose `kind` field equals K.
 */
export type ExtractByKind<T extends { kind: string }, K extends T['kind']> =
  T extends { kind: K } ? T : never;
