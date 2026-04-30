/**
 * visitWorkspaceV1.schema.ts
 *
 * Runtime validation for VisitWorkspaceV1 and ReviewDecisionsV1 payloads.
 *
 * validateVisitWorkspaceV1():
 *   1. Input must be a non-null object.
 *   2. version must be '1.0'.
 *   3. visitReference, sessionId must be non-empty strings.
 *   4. createdAt, updatedAt must be ISO-8601 timestamps.
 *   5. files must be a valid VisitWorkspaceFilesV1 object (required file paths
 *      are non-empty strings; optional paths, when present, must also be
 *      non-empty strings).
 *   6. assets must be a valid VisitWorkspaceAssetsV1 object (both paths
 *      required and must be non-empty strings).
 *
 * validateReviewDecisionsV1():
 *   1. Input must be a non-null object.
 *   2. sessionId must be a non-empty string.
 *   3. decisions must be an array of valid ReviewDecisionItemV1 objects:
 *        - ref: non-empty string
 *        - kind: 'photo' | 'object_pin' | 'floor_plan'
 *        - reviewStatus: 'pending' | 'confirmed' | 'rejected'
 *        - includeInCustomerReport: boolean when present
 *        - reviewedAt: ISO-8601 timestamp when present
 *
 * Unknown extra fields are tolerated so that older consumers can handle newer
 * payloads gracefully.
 */

import type {
  ReviewDecisionsV1,
  UnknownReviewDecisionsV1,
  UnknownVisitWorkspaceV1,
  VisitWorkspaceV1,
} from './visitWorkspaceV1.types';
import { VISIT_WORKSPACE_V1_VERSION } from './visitWorkspaceV1.types';

// ─── Result types: VisitWorkspaceV1 ──────────────────────────────────────────

export interface VisitWorkspaceV1ValidationSuccess {
  ok: true;
  workspace: VisitWorkspaceV1;
}

export interface VisitWorkspaceV1ValidationFailure {
  ok: false;
  error: string;
}

export type VisitWorkspaceV1ValidationResult =
  | VisitWorkspaceV1ValidationSuccess
  | VisitWorkspaceV1ValidationFailure;

// ─── Result types: ReviewDecisionsV1 ─────────────────────────────────────────

export interface ReviewDecisionsV1ValidationSuccess {
  ok: true;
  reviewDecisions: ReviewDecisionsV1;
}

export interface ReviewDecisionsV1ValidationFailure {
  ok: false;
  error: string;
}

export type ReviewDecisionsV1ValidationResult =
  | ReviewDecisionsV1ValidationSuccess
  | ReviewDecisionsV1ValidationFailure;

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

// ─── Enum sets ────────────────────────────────────────────────────────────────

const REVIEW_ITEM_KINDS = new Set(['photo', 'object_pin', 'floor_plan']);
const REVIEW_STATUSES = new Set(['pending', 'confirmed', 'rejected']);

// ─── VisitWorkspaceV1 sub-validators ─────────────────────────────────────────

function validateFiles(value: unknown): string | null {
  if (!isRecord(value)) return 'files must be an object';

  if (!isNonEmptyString(value['sessionCapture']))
    return 'files.sessionCapture must be a non-empty string';

  if (!isNonEmptyString(value['reviewDecisions']))
    return 'files.reviewDecisions must be a non-empty string';

  const optionalPaths = [
    'atlasProperty',
    'engineerHandoff',
    'customerProof',
    'reportPdf',
  ] as const;

  for (const key of optionalPaths) {
    if (value[key] !== undefined && !isNonEmptyString(value[key]))
      return `files.${key} must be a non-empty string when present`;
  }

  return null;
}

function validateAssets(value: unknown): string | null {
  if (!isRecord(value)) return 'assets must be an object';

  if (!isNonEmptyString(value['photosDir']))
    return 'assets.photosDir must be a non-empty string';

  if (!isNonEmptyString(value['floorPlansDir']))
    return 'assets.floorPlansDir must be a non-empty string';

  return null;
}

// ─── ReviewDecisionsV1 sub-validators ─────────────────────────────────────────

function validateDecisions(value: unknown): string | null {
  if (!Array.isArray(value)) return 'decisions must be an array';

  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    if (!isRecord(item)) return `decisions[${i}] must be an object`;

    if (!isNonEmptyString(item['ref']))
      return `decisions[${i}].ref must be a non-empty string`;

    if (!REVIEW_ITEM_KINDS.has(item['kind'] as string))
      return `decisions[${i}].kind must be 'photo', 'object_pin', or 'floor_plan'`;

    if (!REVIEW_STATUSES.has(item['reviewStatus'] as string))
      return `decisions[${i}].reviewStatus must be 'pending', 'confirmed', or 'rejected'`;

    if (
      item['includeInCustomerReport'] !== undefined &&
      typeof item['includeInCustomerReport'] !== 'boolean'
    )
      return `decisions[${i}].includeInCustomerReport must be a boolean when present`;

    if (item['reviewedAt'] !== undefined && !isIsoLike(item['reviewedAt']))
      return `decisions[${i}].reviewedAt must be an ISO-8601 timestamp when present`;
  }

  return null;
}

// ─── Main validators ──────────────────────────────────────────────────────────

/**
 * Validates a raw unknown payload as a VisitWorkspaceV1.
 *
 * Returns `{ ok: true, workspace }` on success or `{ ok: false, error }` on
 * the first structural failure found.
 *
 * Checks performed in order:
 *   1. Input must be a non-null object.
 *   2. version must be '1.0'.
 *   3. visitReference and sessionId must be non-empty strings.
 *   4. createdAt and updatedAt must be ISO-8601 timestamps.
 *   5. files must satisfy VisitWorkspaceFilesV1 constraints.
 *   6. assets must satisfy VisitWorkspaceAssetsV1 constraints.
 */
export function validateVisitWorkspaceV1(
  input: UnknownVisitWorkspaceV1 | unknown,
): VisitWorkspaceV1ValidationResult {
  if (!isRecord(input)) {
    return { ok: false, error: 'Input must be a non-null object' };
  }

  if (input['version'] !== VISIT_WORKSPACE_V1_VERSION) {
    return {
      ok: false,
      error: `version must be '${VISIT_WORKSPACE_V1_VERSION}', got: ${String(input['version'])}`,
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

  if (!isIsoLike(input['updatedAt'])) {
    return { ok: false, error: 'updatedAt must be an ISO-8601 timestamp' };
  }

  const filesError = validateFiles(input['files']);
  if (filesError) return { ok: false, error: filesError };

  const assetsError = validateAssets(input['assets']);
  if (assetsError) return { ok: false, error: assetsError };

  return { ok: true, workspace: input as unknown as VisitWorkspaceV1 };
}

/**
 * Validates a raw unknown payload as a ReviewDecisionsV1.
 *
 * Returns `{ ok: true, reviewDecisions }` on success or
 * `{ ok: false, error }` on the first structural failure found.
 *
 * Checks performed in order:
 *   1. Input must be a non-null object.
 *   2. sessionId must be a non-empty string.
 *   3. decisions must be a valid array of ReviewDecisionItemV1 objects.
 */
export function validateReviewDecisionsV1(
  input: UnknownReviewDecisionsV1 | unknown,
): ReviewDecisionsV1ValidationResult {
  if (!isRecord(input)) {
    return { ok: false, error: 'Input must be a non-null object' };
  }

  if (!isNonEmptyString(input['sessionId'])) {
    return { ok: false, error: 'sessionId must be a non-empty string' };
  }

  const decisionsError = validateDecisions(input['decisions']);
  if (decisionsError) return { ok: false, error: decisionsError };

  return {
    ok: true,
    reviewDecisions: input as unknown as ReviewDecisionsV1,
  };
}
