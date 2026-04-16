/**
 * atlasSpatialPatch.schema.ts
 *
 * Runtime validation for AtlasSpatialPatchV1 payloads.
 */

import type { AtlasSpatialPatchV1 } from './atlasSpatialPatch.types';

// ─── Result types ─────────────────────────────────────────────────────────────

export interface AtlasSpatialPatchValidationSuccess {
  ok: true;
  patch: AtlasSpatialPatchV1;
}

export interface AtlasSpatialPatchValidationFailure {
  ok: false;
  error: string;
}

export type AtlasSpatialPatchValidationResult =
  | AtlasSpatialPatchValidationSuccess
  | AtlasSpatialPatchValidationFailure;

// ─── Internal helpers ─────────────────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isIsoLike(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
  );
}

const VALID_OPERATION_TYPES = new Set([
  'add_entity',
  'update_entity',
  'remove_entity',
  'set_geometry',
  'set_semantics',
  'attach_evidence',
  'set_status',
  'set_certainty',
]);

function validateOperations(value: unknown): string | null {
  if (!Array.isArray(value)) return 'operations must be an array';
  for (let i = 0; i < value.length; i++) {
    const op = value[i];
    if (!isRecord(op)) return `operations[${i}] must be an object`;
    if (!VALID_OPERATION_TYPES.has(op['type'] as string)) {
      return `operations[${i}].type must be a valid AtlasSpatialOperationV1 type`;
    }

    const type = op['type'] as string;

    if (type === 'add_entity') {
      if (!isRecord(op['entity'])) return `operations[${i}].entity must be an object`;
      if (!isNonEmptyString((op['entity'] as Record<string, unknown>)['id']))
        return `operations[${i}].entity.id must be a non-empty string`;
    }

    if (
      type === 'update_entity' ||
      type === 'remove_entity' ||
      type === 'set_geometry' ||
      type === 'set_semantics' ||
      type === 'attach_evidence' ||
      type === 'set_status' ||
      type === 'set_certainty'
    ) {
      if (!isNonEmptyString(op['entityId']))
        return `operations[${i}].entityId must be a non-empty string`;
    }
  }
  return null;
}

// ─── Main validator ───────────────────────────────────────────────────────────

/**
 * Validates a raw unknown payload as an AtlasSpatialPatchV1.
 */
export function validateAtlasSpatialPatch(
  input: unknown,
): AtlasSpatialPatchValidationResult {
  if (!isRecord(input)) {
    return { ok: false, error: 'Input must be a non-null object' };
  }

  if (!isNonEmptyString(input['patchId'])) {
    return { ok: false, error: 'patchId must be a non-empty string' };
  }

  if (!isNonEmptyString(input['modelId'])) {
    return { ok: false, error: 'modelId must be a non-empty string' };
  }

  if (typeof input['baseRevision'] !== 'number' || !Number.isInteger(input['baseRevision']) || (input['baseRevision'] as number) < 1) {
    return { ok: false, error: 'baseRevision must be a positive integer' };
  }

  if (!isIsoLike(input['createdAt'])) {
    return { ok: false, error: 'createdAt must be an ISO-8601 timestamp' };
  }

  if (!isRecord(input['actor'])) {
    return { ok: false, error: 'actor must be an object' };
  }

  const actor = input['actor'] as Record<string, unknown>;
  if (actor['type'] !== 'user' && actor['type'] !== 'system') {
    return { ok: false, error: "actor.type must be 'user' or 'system'" };
  }

  const opsError = validateOperations(input['operations']);
  if (opsError) return { ok: false, error: opsError };

  return { ok: true, patch: input as unknown as AtlasSpatialPatchV1 };
}
