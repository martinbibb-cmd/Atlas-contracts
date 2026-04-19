/**
 * atlasSpatialModel.schema.ts
 *
 * Runtime validation for AtlasSpatialModelV1 payloads.
 *
 * Performs structural checks on required fields.  Unknown extra fields are
 * tolerated for forward compatibility.
 */

import type {
  AtlasSpatialModelV1,
} from './atlasSpatialModel.types';

// ─── Result types ─────────────────────────────────────────────────────────────

export interface AtlasSpatialModelValidationSuccess {
  ok: true;
  model: AtlasSpatialModelV1;
}

export interface AtlasSpatialModelValidationFailure {
  ok: false;
  error: string;
}

export type AtlasSpatialModelValidationResult =
  | AtlasSpatialModelValidationSuccess
  | AtlasSpatialModelValidationFailure;

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

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1;
}

function isEntityArray(fieldName: string, value: unknown): string | null {
  if (!Array.isArray(value)) return `${fieldName} must be an array`;
  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    if (!isRecord(item)) return `${fieldName}[${i}] must be an object`;
    if (!isNonEmptyString(item['id'])) return `${fieldName}[${i}].id must be a non-empty string`;
    if (!isNonEmptyString(item['kind'])) return `${fieldName}[${i}].kind must be a non-empty string`;
  }
  return null;
}

function isIdArray(fieldName: string, value: unknown): string | null {
  if (!Array.isArray(value)) return `${fieldName} must be an array`;
  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    if (!isRecord(item)) return `${fieldName}[${i}] must be an object`;
    if (!isNonEmptyString(item['id'])) return `${fieldName}[${i}].id must be a non-empty string`;
  }
  return null;
}

// ─── Main validator ───────────────────────────────────────────────────────────

/**
 * Validates a raw unknown payload as an AtlasSpatialModelV1.
 */
export function validateAtlasSpatialModel(
  input: unknown,
): AtlasSpatialModelValidationResult {
  if (!isRecord(input)) {
    return { ok: false, error: 'Input must be a non-null object' };
  }

  if (input['schemaVersion'] !== 'atlas.spatial.v1') {
    return {
      ok: false,
      error: `schemaVersion must be 'atlas.spatial.v1', got: ${String(input['schemaVersion'])}`,
    };
  }

  if (!isNonEmptyString(input['modelId'])) {
    return { ok: false, error: 'modelId must be a non-empty string' };
  }

  if (!isNonEmptyString(input['propertyId'])) {
    return { ok: false, error: 'propertyId must be a non-empty string' };
  }

  if (!isRecord(input['coordinateSystem'])) {
    return { ok: false, error: 'coordinateSystem must be an object' };
  }

  if (!isPositiveInteger(input['revision'])) {
    return { ok: false, error: 'revision must be a positive integer' };
  }

  if (!isIsoLike(input['createdAt'])) {
    return { ok: false, error: 'createdAt must be an ISO-8601 timestamp' };
  }

  if (!isIsoLike(input['updatedAt'])) {
    return { ok: false, error: 'updatedAt must be an ISO-8601 timestamp' };
  }

  const entityArrayFields: Array<[string, unknown, boolean]> = [
    ['levels', input['levels'], true],
    ['rooms', input['rooms'], true],
    ['boundaries', input['boundaries'], true],
    ['openings', input['openings'], true],
    ['thermalZones', input['thermalZones'], true],
    ['emitters', input['emitters'], true],
    ['heatSources', input['heatSources'], true],
    ['hotWaterStores', input['hotWaterStores'], true],
    ['pipeRuns', input['pipeRuns'], true],
    ['controls', input['controls'], true],
    ['assets', input['assets'], true],
    // evidenceMarkers and provenance have id but not kind
    ['evidenceMarkers', input['evidenceMarkers'], false],
    ['provenance', input['provenance'], false],
  ];

  for (const [fieldName, fieldValue, requireKind] of entityArrayFields) {
    const error = requireKind
      ? isEntityArray(fieldName, fieldValue)
      : isIdArray(fieldName, fieldValue);
    if (error) return { ok: false, error };
  }

  // ─── Optional spatial-alignment arrays ──────────────────────────────────────
  // These fields were added in the Spatial Alignment feature and may be absent
  // on models created before this feature was introduced.

  if (input['anchors'] !== undefined) {
    const err = isIdArray('anchors', input['anchors']);
    if (err) return { ok: false, error: err };
  }

  if (input['verticalRelations'] !== undefined) {
    if (!Array.isArray(input['verticalRelations'])) {
      return { ok: false, error: 'verticalRelations must be an array' };
    }
    for (let i = 0; i < (input['verticalRelations'] as unknown[]).length; i++) {
      const item = (input['verticalRelations'] as unknown[])[i];
      if (!isRecord(item)) {
        return { ok: false, error: `verticalRelations[${i}] must be an object` };
      }
      if (!isNonEmptyString(item['fromAnchorId'])) {
        return { ok: false, error: `verticalRelations[${i}].fromAnchorId must be a non-empty string` };
      }
      if (!isNonEmptyString(item['toAnchorId'])) {
        return { ok: false, error: `verticalRelations[${i}].toAnchorId must be a non-empty string` };
      }
    }
  }

  if (input['inferredRoutes'] !== undefined) {
    const err = isIdArray('inferredRoutes', input['inferredRoutes']);
    if (err) return { ok: false, error: err };
  }

  return { ok: true, model: input as unknown as AtlasSpatialModelV1 };
}
