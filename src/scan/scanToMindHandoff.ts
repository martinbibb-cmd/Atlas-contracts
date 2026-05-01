/**
 * scanToMindHandoff.ts
 *
 * ScanToMindHandoffV1 — canonical typed payload used when Atlas Scan completes
 * capture and opens Atlas Mind with the visit loaded.
 *
 * This file defines the handoff shape and a pure validation helper.
 * It does NOT define API routes, storage, simulator, recommendation, portal,
 * or PDF behaviour.
 *
 * Required types (imported from within this module):
 *   - AtlasVisitV1
 *   - AtlasVisitReadinessV1
 *   - SessionCaptureV2
 */

import type { AtlasVisitV1, AtlasVisitReadinessV1 } from './visit';
import type { SessionCaptureV2 } from './sessionCaptureV2';

// ─── Handoff reason ───────────────────────────────────────────────────────────

/**
 * Why the handoff from Scan to Mind is occurring.
 *
 * - `complete_capture`  — engineer has finished capturing and is handing off
 *                         a fully complete session
 * - `save_progress`     — engineer is saving partial progress mid-capture
 * - `review_in_mind`    — engineer wants to review the session in Mind without
 *                         completing capture
 */
export type ScanToMindHandoffReasonV1 =
  | 'complete_capture'
  | 'save_progress'
  | 'review_in_mind';

// ─── Handoff meta ─────────────────────────────────────────────────────────────

/**
 * Metadata describing the context of a scan-to-mind handoff.
 */
export interface ScanToMindHandoffMetaV1 {
  /** ISO-8601 timestamp of when the handoff payload was created. */
  createdAt: string;
  /** The app that produced this handoff — always 'scan_ios'. */
  sourceApp: 'scan_ios';
  /** The app intended to consume this handoff — always 'mind_pwa'. */
  targetApp: 'mind_pwa';
  /** Why the handoff is occurring. */
  handoffReason: ScanToMindHandoffReasonV1;
  /** Schema version of this meta block — always '1.0'. */
  schemaVersion: '1.0';
}

// ─── ScanToMindHandoffV1 ──────────────────────────────────────────────────────

/**
 * ScanToMindHandoffV1 — the canonical payload passed from Atlas Scan to Atlas
 * Mind when a visit session is handed off.
 *
 * Contains the visit identity, readiness flags, capture evidence, and optional
 * warnings produced during capture.  No engine outputs, recommendation scores,
 * proposal design state, or derived values belong here.
 */
export interface ScanToMindHandoffV1 {
  /** Contract version discriminant — always '1.0'. */
  version: '1.0';
  /** Metadata describing the handoff context. */
  meta: ScanToMindHandoffMetaV1;
  /** The visit identity record produced by Atlas Scan. */
  visit: AtlasVisitV1;
  /** Readiness flags at the time of handoff. */
  readiness: AtlasVisitReadinessV1;
  /** The full capture evidence payload. */
  capture: SessionCaptureV2;
  /**
   * Optional warnings produced during or after capture.
   *
   * - `info`     — informational only; does not block handoff
   * - `warning`  — notable issue; does not block handoff
   * - `blocking` — critical issue that must be resolved before proceeding
   */
  warnings?: Array<{
    code: string;
    message: string;
    severity: 'info' | 'warning' | 'blocking';
  }>;
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Readiness flag names that must all be `true` for a `complete_capture`
 * handoff to be considered valid.
 */
const REQUIRED_COMPLETE_CAPTURE_FLAGS: ReadonlyArray<keyof AtlasVisitReadinessV1> =
  [
    'hasRooms',
    'hasPhotos',
    'hasHeatingSystem',
    'hasHotWaterSystem',
    'hasKeyObjectBoiler',
    'hasKeyObjectFlue',
    'hasAnyNotes',
  ];

/**
 * Validate a ScanToMindHandoffV1 payload.
 *
 * Returns `{ ok, errors, warnings }` where:
 *   - `ok`       — true only when `errors` is empty
 *   - `errors`   — fatal validation failures
 *   - `warnings` — non-fatal notices (e.g. one-sided brandId)
 *
 * Validation rules:
 *   1.  handoff.version must be '1.0'
 *   2.  meta.schemaVersion must be '1.0'
 *   3.  meta.sourceApp must be 'scan_ios'
 *   4.  meta.targetApp must be 'mind_pwa'
 *   5.  visit.visitId must match capture.visitId
 *   6.  readiness must match visit.readiness by value
 *   7.  capture.version must be '2.0'
 *   8.  If handoffReason is 'complete_capture':
 *         - visit.status should be 'complete' or 'ready_to_complete'
 *         - all REQUIRED_COMPLETE_CAPTURE_FLAGS must be true (blocking errors)
 *   9.  If brandId exists on both visit and capture, they must match
 *   10. If brandId exists on only one side, produce a warning (not an error)
 */
export function validateScanToMindHandoffV1(handoff: ScanToMindHandoffV1): {
  ok: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Rule 1 — handoff version
  if (handoff.version !== '1.0') {
    errors.push(`handoff.version must be '1.0', got '${handoff.version}'`);
  }

  // Rule 2 — meta.schemaVersion
  if (handoff.meta.schemaVersion !== '1.0') {
    errors.push(
      `meta.schemaVersion must be '1.0', got '${handoff.meta.schemaVersion}'`,
    );
  }

  // Rule 3 — meta.sourceApp
  if (handoff.meta.sourceApp !== 'scan_ios') {
    errors.push(
      `meta.sourceApp must be 'scan_ios', got '${handoff.meta.sourceApp}'`,
    );
  }

  // Rule 4 — meta.targetApp
  if (handoff.meta.targetApp !== 'mind_pwa') {
    errors.push(
      `meta.targetApp must be 'mind_pwa', got '${handoff.meta.targetApp}'`,
    );
  }

  // Rule 5 — visitId consistency
  if (handoff.visit.visitId !== handoff.capture.visitId) {
    errors.push(
      `visit.visitId ('${handoff.visit.visitId}') does not match capture.visitId ('${handoff.capture.visitId}')`,
    );
  }

  // Rule 6 — readiness must match visit.readiness by value
  const r = handoff.readiness;
  const vr = handoff.visit.readiness;
  const readinessMismatch =
    r.hasRooms !== vr.hasRooms ||
    r.hasPhotos !== vr.hasPhotos ||
    r.hasHeatingSystem !== vr.hasHeatingSystem ||
    r.hasHotWaterSystem !== vr.hasHotWaterSystem ||
    r.hasKeyObjectBoiler !== vr.hasKeyObjectBoiler ||
    r.hasKeyObjectFlue !== vr.hasKeyObjectFlue ||
    r.hasAnyNotes !== vr.hasAnyNotes;

  if (readinessMismatch) {
    errors.push('readiness does not match visit.readiness');
  }

  // Rule 7 — capture version
  if (handoff.capture.version !== '2.0') {
    errors.push(
      `capture.version must be '2.0', got '${handoff.capture.version}'`,
    );
  }

  // Rule 8 — complete_capture constraints
  if (handoff.meta.handoffReason === 'complete_capture') {
    const { status } = handoff.visit;
    if (status !== 'complete' && status !== 'ready_to_complete') {
      errors.push(
        `complete_capture requires visit.status 'complete' or 'ready_to_complete', got '${status}'`,
      );
    }

    for (const flag of REQUIRED_COMPLETE_CAPTURE_FLAGS) {
      if (!handoff.readiness[flag]) {
        errors.push(
          `complete_capture requires readiness.${flag} to be true (blocking)`,
        );
      }
    }
  }

  // Rules 9 & 10 — brandId consistency
  const visitBrandId = handoff.visit.brandId;
  const captureBrandId = handoff.capture.brandId;

  if (visitBrandId !== undefined && captureBrandId !== undefined) {
    // Rule 9 — both present, must match
    if (visitBrandId !== captureBrandId) {
      errors.push(
        `visit.brandId ('${visitBrandId}') does not match capture.brandId ('${captureBrandId}')`,
      );
    }
  } else if (visitBrandId !== undefined || captureBrandId !== undefined) {
    // Rule 10 — only one side has brandId
    const side = visitBrandId !== undefined ? 'visit' : 'capture';
    warnings.push(
      `brandId is present on ${side} but absent on the other side`,
    );
  }

  return { ok: errors.length === 0, errors, warnings };
}
