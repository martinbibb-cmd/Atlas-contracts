/**
 * atlasVisitPackageV1.schema.ts
 *
 * Runtime validation for AtlasVisitPackageManifestV1 payloads.
 *
 * validateAtlasVisitPackageManifestV1():
 *   1. Input must be a non-null object.
 *   2. format must be 'AtlasVisitPackageV1'.
 *   3. schemaVersion must be '1.0'.
 *   4. visitReference and sessionId must be non-empty strings.
 *   5. createdAt must be an ISO-8601 timestamp.
 *   6. workspaceFile, sessionCaptureFile, reviewDecisionsFile must be
 *      non-empty strings.
 *   7. photosDir and floorplansDir must be non-empty strings.
 *
 * Unknown extra fields are tolerated so that older consumers can handle newer
 * payloads gracefully.
 */

import type {
  AtlasVisitPackageManifestV1,
  UnknownAtlasVisitPackageManifestV1,
} from './atlasVisitPackageV1.types';
import {
  ATLAS_VISIT_PACKAGE_V1_FORMAT,
  ATLAS_VISIT_PACKAGE_MANIFEST_V1_SCHEMA_VERSION,
} from './atlasVisitPackageV1.types';

// ─── Result types ─────────────────────────────────────────────────────────────

export interface AtlasVisitPackageManifestV1ValidationSuccess {
  ok: true;
  manifest: AtlasVisitPackageManifestV1;
}

export interface AtlasVisitPackageManifestV1ValidationFailure {
  ok: false;
  error: string;
}

export type AtlasVisitPackageManifestV1ValidationResult =
  | AtlasVisitPackageManifestV1ValidationSuccess
  | AtlasVisitPackageManifestV1ValidationFailure;

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

// ─── Main validator ───────────────────────────────────────────────────────────

/**
 * Validates a raw unknown payload as an AtlasVisitPackageManifestV1.
 *
 * Returns `{ ok: true, manifest }` on success or `{ ok: false, error }` on
 * the first structural failure found.
 *
 * Checks performed in order:
 *   1. Input must be a non-null object.
 *   2. format must be 'AtlasVisitPackageV1'.
 *   3. schemaVersion must be '1.0'.
 *   4. visitReference and sessionId must be non-empty strings.
 *   5. createdAt must be an ISO-8601 timestamp.
 *   6. workspaceFile, sessionCaptureFile, reviewDecisionsFile must be
 *      non-empty strings.
 *   7. photosDir and floorplansDir must be non-empty strings.
 */
export function validateAtlasVisitPackageManifestV1(
  input: UnknownAtlasVisitPackageManifestV1 | unknown,
): AtlasVisitPackageManifestV1ValidationResult {
  if (!isRecord(input)) {
    return { ok: false, error: 'Input must be a non-null object' };
  }

  if (input['format'] !== ATLAS_VISIT_PACKAGE_V1_FORMAT) {
    return {
      ok: false,
      error: `format must be '${ATLAS_VISIT_PACKAGE_V1_FORMAT}', got: ${String(input['format'])}`,
    };
  }

  if (input['schemaVersion'] !== ATLAS_VISIT_PACKAGE_MANIFEST_V1_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `schemaVersion must be '${ATLAS_VISIT_PACKAGE_MANIFEST_V1_SCHEMA_VERSION}', got: ${String(input['schemaVersion'])}`,
    };
  }

  if (!isNonEmptyString(input['visitReference'])) {
    return { ok: false, error: 'visitReference must be a non-empty string' };
  }

  if (!isNonEmptyString(input['sessionId'])) {
    return { ok: false, error: 'sessionId must be a non-empty string' };
  }

  if (!isIsoLike(input['createdAt'])) {
    return { ok: false, error: 'createdAt must be an ISO-8601 timestamp' };
  }

  if (!isNonEmptyString(input['workspaceFile'])) {
    return { ok: false, error: 'workspaceFile must be a non-empty string' };
  }

  if (!isNonEmptyString(input['sessionCaptureFile'])) {
    return { ok: false, error: 'sessionCaptureFile must be a non-empty string' };
  }

  if (!isNonEmptyString(input['reviewDecisionsFile'])) {
    return { ok: false, error: 'reviewDecisionsFile must be a non-empty string' };
  }

  if (!isNonEmptyString(input['photosDir'])) {
    return { ok: false, error: 'photosDir must be a non-empty string' };
  }

  if (!isNonEmptyString(input['floorplansDir'])) {
    return { ok: false, error: 'floorplansDir must be a non-empty string' };
  }

  return { ok: true, manifest: input as unknown as AtlasVisitPackageManifestV1 };
}
