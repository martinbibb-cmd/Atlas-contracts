/**
 * visitLifecycle.types.ts
 *
 * Canonical visit lifecycle types for the Atlas field workflow.
 *
 * These types represent the explicit status of a visit as a domain fact,
 * independent of UI flow.  Completion is captured here so that all apps
 * (Atlas Scan, Atlas Mind, customer portal) can rely on a single
 * authoritative lifecycle rather than inferring state from navigation.
 *
 * Scope:
 *   - AtlasVisitStatus          — canonical status enum
 *   - AtlasVisitCompletion      — completion metadata
 *   - AtlasVisitReadiness       — lightweight readiness summary for UI
 *   - ATLAS_VISIT_STATUS_TRANSITIONS — allowed status transitions
 */

// ─── Status ───────────────────────────────────────────────────────────────────

/**
 * Canonical lifecycle status of a visit.
 *
 * draft              — visit created; no active capture yet
 * capturing          — engineer is actively capturing data on-site
 * planning           — capture complete; engineer is reviewing / planning
 * ready_to_complete  — all required data present; visit can be finalised
 * complete           — visit formally closed and locked
 */
export type AtlasVisitStatus =
  | 'draft'
  | 'capturing'
  | 'planning'
  | 'ready_to_complete'
  | 'complete';

// ─── Completion metadata ──────────────────────────────────────────────────────

/**
 * Metadata recorded when a visit is formally completed.
 */
export interface AtlasVisitCompletion {
  /** ISO-8601 timestamp at which the visit was completed. */
  completedAt: string;

  /** Identifier of the user who completed the visit, if known. */
  completedByUserId?: string;

  /**
   * How the completion was triggered.
   *
   * manual   — engineer explicitly marked the visit complete
   * imported — completion state was imported from an external source
   * system   — completed automatically by a backend process
   */
  completionMethod?: 'manual' | 'imported' | 'system';
}

// ─── Readiness flags ──────────────────────────────────────────────────────────

/**
 * Lightweight canonical summary of visit readiness, consumed by UI layers
 * in Atlas Scan, Atlas Mind, and the portal to show consistent readiness
 * indicators.
 *
 * These are factual boolean flags.  They describe what data is present —
 * they are not a score or a gate.
 */
export interface AtlasVisitReadiness {
  /** At least one room has been captured. */
  hasRooms: boolean;

  /** At least one photo has been captured. */
  hasPhotos: boolean;

  /** A heating system has been recorded. */
  hasHeatingSystem: boolean;

  /** A hot water system has been recorded. */
  hasHotWaterSystem: boolean;

  /** A key object of type "boiler" has been captured. */
  hasKeyObjectBoiler: boolean;

  /** A key object of type "flue" has been captured. */
  hasKeyObjectFlue: boolean;

  /** At least one note (voice or text) has been captured. */
  hasAnyNotes: boolean;
}

// ─── Transition map ───────────────────────────────────────────────────────────

/**
 * Allowed forward transitions between visit statuses.
 *
 * Each entry lists the statuses that a visit may move into from the
 * current status.  This is intentionally a pure data declaration —
 * it is not an enforcement engine.  Consumers should validate against
 * this map before mutating status.
 *
 * Transitions are strictly forward; there is no back-transition once a
 * visit is complete.
 */
export const ATLAS_VISIT_STATUS_TRANSITIONS: Record<
  AtlasVisitStatus,
  readonly AtlasVisitStatus[]
> = {
  draft: ['capturing'],
  capturing: ['planning', 'ready_to_complete'],
  planning: ['ready_to_complete', 'capturing'],
  ready_to_complete: ['complete', 'capturing', 'planning'],
  complete: [],
};
