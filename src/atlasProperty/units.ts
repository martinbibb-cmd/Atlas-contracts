/**
 * units.ts
 *
 * Typed unit wrappers for Atlas numeric quantities.
 *
 * Using branded/nominal types for physical units prevents the common bug of
 * mixing up Watts and Kilowatts (or other unit mismatches) when data crosses
 * system boundaries.  Values tagged with `Watts` or `Kilowatts` can only be
 * created through the provided factory functions, and TypeScript will reject
 * plain `number` assignments where a typed unit is expected.
 *
 * Design note:
 *   - The brand tag is a compile-time-only phantom field.  At runtime these are
 *     plain IEEE-754 doubles — no boxing overhead, full JSON-serialisable.
 *   - Use the factory functions (`toWatts`, `toKilowatts`) to create branded
 *     values; use the conversion helpers (`wattsToKilowatts`, `kilowattsToWatts`)
 *     to move between them.
 *
 * Usage:
 *   import { type Watts, type Kilowatts, toWatts, wattsToKilowatts } from './units';
 *
 *   const peakLoss: Watts = toWatts(4500);
 *   const peakLossKw: Kilowatts = wattsToKilowatts(peakLoss); // 4.5 kW
 */

// ─── Branded numeric types ────────────────────────────────────────────────────

declare const __wattsTag: unique symbol;
declare const __kilowattsTag: unique symbol;

/**
 * A number that has been explicitly tagged as Watts (W).
 *
 * Used wherever the contract stores a power value in Watts to prevent
 * accidental mixing with Kilowatts values at the type level.
 */
export type Watts = number & { readonly [__wattsTag]: true };

/**
 * A number that has been explicitly tagged as Kilowatts (kW).
 *
 * Used wherever the contract stores a power value in Kilowatts to prevent
 * accidental mixing with Watts values at the type level.
 */
export type Kilowatts = number & { readonly [__kilowattsTag]: true };

// ─── Factory functions ────────────────────────────────────────────────────────

/**
 * Wraps a raw number as a `Watts` value.
 *
 * @param value — the numeric quantity in Watts
 */
export function toWatts(value: number): Watts {
  return value as Watts;
}

/**
 * Wraps a raw number as a `Kilowatts` value.
 *
 * @param value — the numeric quantity in Kilowatts
 */
export function toKilowatts(value: number): Kilowatts {
  return value as Kilowatts;
}

// ─── Conversion helpers ───────────────────────────────────────────────────────

/**
 * Converts a `Watts` value to `Kilowatts`.
 *
 * @param w — the value in Watts
 * @returns the equivalent value in Kilowatts
 */
export function wattsToKilowatts(w: Watts): Kilowatts {
  return (w / 1000) as Kilowatts;
}

/**
 * Converts a `Kilowatts` value to `Watts`.
 *
 * @param kw — the value in Kilowatts
 * @returns the equivalent value in Watts
 */
export function kilowattsToWatts(kw: Kilowatts): Watts {
  return (kw * 1000) as Watts;
}
