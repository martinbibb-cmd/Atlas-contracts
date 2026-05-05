/**
 * applianceDefinitionV1.schema.ts
 *
 * Runtime validation for ApplianceDefinitionV1 and MasterRegistryV1 payloads.
 *
 * validateApplianceDefinitionV1():
 *   1. Input must be a non-null object.
 *   2. schemaVersion must be '1.0'.
 *   3. modelId must be a non-empty string.
 *   4. brand must be a non-empty string.
 *   5. modelName must be a non-empty string.
 *   6. category must be one of the known ApplianceCategory values.
 *   7. dimensions must be a non-null object with positive numeric widthMm,
 *      depthMm, and heightMm.
 *   8. clearanceRules must be a non-null object with non-negative numeric
 *      frontMm, sideMm, topMm, and bottomMm.
 *   9. outputKw, if present, must be a positive number.
 *   10. notes, if present, must be a string.
 *
 * validateMasterRegistryV1():
 *   1. Input must be a non-null object.
 *   2. schemaVersion must be '1.0'.
 *   3. updatedAt must be an ISO-8601 timestamp.
 *   4. appliances must be a non-empty array.
 *   5. Every entry in appliances must pass validateApplianceDefinitionV1.
 *
 * Unknown extra fields are tolerated so that older consumers can handle
 * newer payloads gracefully.
 */

import type {
  ApplianceCategory,
  ApplianceDefinitionV1,
  MasterRegistryV1,
  UnknownMasterRegistryV1,
} from './applianceDefinitionV1.types';
import { HARDWARE_REGISTRY_V1_SCHEMA_VERSION } from './applianceDefinitionV1.types';

// ─── Result types ─────────────────────────────────────────────────────────────

export interface ApplianceDefinitionV1ValidationSuccess {
  ok: true;
  appliance: ApplianceDefinitionV1;
}

export interface ApplianceDefinitionV1ValidationFailure {
  ok: false;
  error: string;
}

export type ApplianceDefinitionV1ValidationResult =
  | ApplianceDefinitionV1ValidationSuccess
  | ApplianceDefinitionV1ValidationFailure;

export interface MasterRegistryV1ValidationSuccess {
  ok: true;
  registry: MasterRegistryV1;
}

export interface MasterRegistryV1ValidationFailure {
  ok: false;
  error: string;
}

export type MasterRegistryV1ValidationResult =
  | MasterRegistryV1ValidationSuccess
  | MasterRegistryV1ValidationFailure;

// ─── Known category values ────────────────────────────────────────────────────

const KNOWN_APPLIANCE_CATEGORIES: ReadonlySet<ApplianceCategory> = new Set([
  'boiler',
  'heat_pump',
  'cylinder',
  'other',
]);

// ─── Internal helpers ─────────────────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isIsoLike(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
  );
}

// ─── validateApplianceDefinitionV1 ───────────────────────────────────────────

/**
 * Validates a raw unknown payload as an `ApplianceDefinitionV1`.
 *
 * Returns `{ ok: true, appliance }` on success or `{ ok: false, error }` on
 * the first structural failure found.
 */
export function validateApplianceDefinitionV1(
  input: unknown,
): ApplianceDefinitionV1ValidationResult {
  if (!isRecord(input)) {
    return { ok: false, error: 'Input must be a non-null object' };
  }

  if (input['schemaVersion'] !== HARDWARE_REGISTRY_V1_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `schemaVersion must be '${HARDWARE_REGISTRY_V1_SCHEMA_VERSION}', got: ${String(input['schemaVersion'])}`,
    };
  }

  if (!isNonEmptyString(input['modelId'])) {
    return { ok: false, error: 'modelId must be a non-empty string' };
  }

  if (!isNonEmptyString(input['brand'])) {
    return { ok: false, error: 'brand must be a non-empty string' };
  }

  if (!isNonEmptyString(input['modelName'])) {
    return { ok: false, error: 'modelName must be a non-empty string' };
  }

  if (
    !isNonEmptyString(input['category']) ||
    !KNOWN_APPLIANCE_CATEGORIES.has(input['category'] as ApplianceCategory)
  ) {
    return {
      ok: false,
      error: `category must be one of: ${[...KNOWN_APPLIANCE_CATEGORIES].join(', ')}`,
    };
  }

  // ── dimensions ──
  const dims = input['dimensions'];
  if (!isRecord(dims)) {
    return { ok: false, error: 'dimensions must be a non-null object' };
  }
  if (!isPositiveNumber(dims['widthMm'])) {
    return { ok: false, error: 'dimensions.widthMm must be a positive number' };
  }
  if (!isPositiveNumber(dims['depthMm'])) {
    return { ok: false, error: 'dimensions.depthMm must be a positive number' };
  }
  if (!isPositiveNumber(dims['heightMm'])) {
    return { ok: false, error: 'dimensions.heightMm must be a positive number' };
  }

  // ── clearanceRules ──
  const cr = input['clearanceRules'];
  if (!isRecord(cr)) {
    return { ok: false, error: 'clearanceRules must be a non-null object' };
  }
  if (!isNonNegativeNumber(cr['frontMm'])) {
    return { ok: false, error: 'clearanceRules.frontMm must be a non-negative number' };
  }
  if (!isNonNegativeNumber(cr['sideMm'])) {
    return { ok: false, error: 'clearanceRules.sideMm must be a non-negative number' };
  }
  if (!isNonNegativeNumber(cr['topMm'])) {
    return { ok: false, error: 'clearanceRules.topMm must be a non-negative number' };
  }
  if (!isNonNegativeNumber(cr['bottomMm'])) {
    return { ok: false, error: 'clearanceRules.bottomMm must be a non-negative number' };
  }

  // ── optional outputKw ──
  if (input['outputKw'] !== undefined && !isPositiveNumber(input['outputKw'])) {
    return { ok: false, error: 'outputKw must be a positive number when present' };
  }

  // ── optional notes ──
  if (input['notes'] !== undefined && typeof input['notes'] !== 'string') {
    return { ok: false, error: 'notes must be a string when present' };
  }

  return { ok: true, appliance: input as unknown as ApplianceDefinitionV1 };
}

// ─── validateMasterRegistryV1 ────────────────────────────────────────────────

/**
 * Validates a raw unknown payload as a `MasterRegistryV1`.
 *
 * Returns `{ ok: true, registry }` on success or `{ ok: false, error }` on
 * the first structural failure found.
 *
 * Every entry in `appliances` is validated against
 * `validateApplianceDefinitionV1`.
 */
export function validateMasterRegistryV1(
  input: UnknownMasterRegistryV1 | unknown,
): MasterRegistryV1ValidationResult {
  if (!isRecord(input)) {
    return { ok: false, error: 'Input must be a non-null object' };
  }

  if (input['schemaVersion'] !== HARDWARE_REGISTRY_V1_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `schemaVersion must be '${HARDWARE_REGISTRY_V1_SCHEMA_VERSION}', got: ${String(input['schemaVersion'])}`,
    };
  }

  if (!isIsoLike(input['updatedAt'])) {
    return { ok: false, error: 'updatedAt must be an ISO-8601 timestamp' };
  }

  if (!Array.isArray(input['appliances']) || input['appliances'].length === 0) {
    return { ok: false, error: 'appliances must be a non-empty array' };
  }

  for (let i = 0; i < input['appliances'].length; i++) {
    const result = validateApplianceDefinitionV1(input['appliances'][i]);
    if (!result.ok) {
      return { ok: false, error: `appliances[${i}]: ${result.error}` };
    }
  }

  return { ok: true, registry: input as unknown as MasterRegistryV1 };
}
