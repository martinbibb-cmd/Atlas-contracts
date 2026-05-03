/**
 * hazardObservations.ts
 *
 * Shared contracts for site hazard observations captured by Atlas Scan and
 * surfaced in Atlas Mind engineer handoff.
 *
 * Design principles:
 *   - This is evidence capture only — not a formal risk assessment.
 *   - Hazards are captured observations for engineer handoff.
 *   - Suspected asbestos must be 'asbestos_suspected', never confirmed unless
 *     specialist evidence exists.
 *   - Customer-facing outputs must not include hazard detail by default.
 *   - Engineer handoff may show all confirmed/pending hazards.
 *   - Blocking severity can prevent handoff completion later, but that logic
 *     is not implemented here.
 */

import type { ReviewStatusV1, CaptureProvenanceV1 } from './sessionCaptureV2';

export type { ReviewStatusV1, CaptureProvenanceV1 };

// ─── HazardObservationCategoryV1 ─────────────────────────────────────────────

/**
 * Category of a hazard observation.
 *
 * - `access`                — access or egress difficulty
 * - `asbestos_suspected`    — suspected asbestos-containing material;
 *                             never confirmed here without specialist evidence
 * - `electrical`            — electrical hazard
 * - `gas`                   — gas leak, odour, or supply concern
 * - `water`                 — water leak, flooding, or moisture
 * - `working_at_height`     — risk from working at height
 * - `confined_space`        — confined-space entry risk
 * - `manual_handling`       — manual-handling hazard (heavy or awkward loads)
 * - `combustion_air`        — inadequate combustion air supply
 * - `flue`                  — flue integrity or termination concern
 * - `structural`            — structural integrity concern
 * - `trip_slip`             — trip or slip hazard
 * - `customer_vulnerability`— indication of customer vulnerability; no
 *                             sensitive detail required
 * - `pets_or_children`      — pets or children on site
 * - `other`                 — any other site hazard
 */
export type HazardObservationCategoryV1 =
  | 'access'
  | 'asbestos_suspected'
  | 'electrical'
  | 'gas'
  | 'water'
  | 'working_at_height'
  | 'confined_space'
  | 'manual_handling'
  | 'combustion_air'
  | 'flue'
  | 'structural'
  | 'trip_slip'
  | 'customer_vulnerability'
  | 'pets_or_children'
  | 'other';

// ─── HazardObservationSeverityV1 ─────────────────────────────────────────────

/**
 * Severity of a hazard observation.
 *
 * - `info`     — informational note; no immediate action required
 * - `low`      — low risk; monitor or note for handoff
 * - `medium`   — moderate risk; action recommended before or during work
 * - `high`     — high risk; action required before work proceeds
 * - `blocking` — prevents work completion or handoff until resolved
 */
export type HazardObservationSeverityV1 =
  | 'info'
  | 'low'
  | 'medium'
  | 'high'
  | 'blocking';

// ─── HazardObservationV1 ──────────────────────────────────────────────────────

/**
 * A single hazard observation captured during a site visit.
 *
 * This represents captured evidence only.  It is not a formal risk assessment
 * and carries no scoring, recommendation logic, or customer-output rendering.
 *
 * id             — unique identifier (UUID string)
 * visitId        — cross-system visit identifier
 * roomId         — optional room in which the hazard was observed
 * category       — type of hazard
 * severity       — severity level of the hazard
 * title          — short human-readable description
 * description    — optional extended free-text description
 * photoIds       — optional IDs of CapturePhotoV1 records documenting this hazard
 * objectPinIds   — optional IDs of CaptureObjectPinV1 records associated with
 *                  this hazard
 * actionRequired — optional free-text action required before/during work
 * reviewStatus   — QA review status of this observation
 * provenance     — how this observation was captured
 * observedAt     — ISO-8601 timestamp of when the hazard was observed
 * notes          — optional free-text notes
 */
export interface HazardObservationV1 {
  id: string;
  visitId: string;
  roomId?: string;
  category: HazardObservationCategoryV1;
  severity: HazardObservationSeverityV1;
  title: string;
  description?: string;
  photoIds?: string[];
  objectPinIds?: string[];
  actionRequired?: string;
  reviewStatus: ReviewStatusV1;
  provenance: CaptureProvenanceV1;
  observedAt: string;
  notes?: string;
}

// ─── HazardObservationCaptureV1 ───────────────────────────────────────────────

/**
 * The full set of hazard observations captured for a single visit.
 *
 * version      — contract discriminant; always '1.0'
 * visitId      — cross-system visit identifier
 * observations — ordered list of hazard observations (empty ⟹ no hazards)
 * createdAt    — ISO-8601 timestamp of when this capture was first created
 * updatedAt    — ISO-8601 timestamp of the last update to this capture
 */
export interface HazardObservationCaptureV1 {
  version: '1.0';
  visitId: string;
  observations: HazardObservationV1[];
  createdAt: string;
  updatedAt: string;
}
