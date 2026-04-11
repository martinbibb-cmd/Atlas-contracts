/**
 * atlasProperty.types.ts
 *
 * AtlasPropertyV1 — the canonical cross-app property root contract.
 *
 * This is the shared top-level model that Atlas Scan (capture output),
 * Atlas Mind (input and persistence), customer portal (state), and the
 * engineer pre-install view all target.
 *
 * What this contract is:
 *   - The single versioned root for cross-app property truth
 *   - A composition of focused sub-models (identity, capture, building,
 *     household, current system, evidence, derived, recommendations)
 *   - Provenance-aware for all fields whose origin matters
 *
 * What this contract is NOT:
 *   - A replacement for ScanBundleV1 (raw scan geometry stays there)
 *   - A replacement for VisitCapture (portable visit artefact stays there)
 *   - A replacement for SessionCaptureV1 (UI-agnostic session capture stays there)
 *   - A recommendation-engine contract (engine details stay in Atlas Recommendation)
 *
 * Version history:
 *   1.0 — initial introduction
 */

import type { PropertyIdentityV1 } from './propertyIdentity.types';
import type { CaptureContextV1 } from './captureContext.types';
import type { BuildingModelV1 } from './building.types';
import type { HouseholdModelV1 } from './household.types';
import type { CurrentSystemModelV1 } from './currentSystem.types';
import type { EvidenceModelV1 } from './evidence.types';
import type { DerivedModelV1 } from './derived.types';
import type { RecommendationWorkspaceV1 } from './recommendations.types';

// ─── Source app tag ───────────────────────────────────────────────────────────

/**
 * Identifier for an Atlas application that contributed to this property record.
 */
export type AtlasSourceApp =
  | 'atlas_scan'
  | 'atlas_mind'
  | 'atlas_portal'
  | 'atlas_backend';

// ─── Property status ─────────────────────────────────────────────────────────

/**
 * Lifecycle status of the AtlasPropertyV1 record.
 *
 * draft                — initial creation; data capture may be incomplete
 * survey_in_progress   — a capture session is currently active
 * ready_for_simulation — capture complete; ready for the recommendation engine
 * simulation_ready     — engine run queued or in progress
 * report_ready         — recommendation outputs are ready to present
 * archived             — superseded or closed; retained for audit
 */
export type AtlasPropertyStatus =
  | 'draft'
  | 'survey_in_progress'
  | 'ready_for_simulation'
  | 'simulation_ready'
  | 'report_ready'
  | 'archived';

// ─── AtlasPropertyV1 ─────────────────────────────────────────────────────────

/**
 * The canonical cross-app property root contract.
 *
 * All cross-app consumers — Atlas Scan, Atlas Mind, customer portal,
 * pre-install view — should target this type as their shared truth.
 *
 * Sub-models are deliberately separated so that individual apps can read
 * or update only the sections they own without coupling to the full model.
 */
export interface AtlasPropertyV1 {
  /**
   * Contract version.
   * Must be '1.0' for this version of the type.
   */
  version: '1.0';

  /** Unique identifier for this property record (UUID string). */
  propertyId: string;

  /** Identifier of the visit session that last wrote to this record. */
  visitId?: string;

  /** ISO-8601 timestamp of when this record was first created. */
  createdAt: string;

  /** ISO-8601 timestamp of the last write to any section of this record. */
  updatedAt: string;

  /** Lifecycle status of this property record. */
  status: AtlasPropertyStatus;

  /**
   * Monotonically increasing schema revision counter.
   * Incremented by any app each time it writes a structural change to the record.
   * Can be used for optimistic-concurrency conflict detection.
   */
  schemaRevision?: number;

  /**
   * Which Atlas applications have contributed data to this record.
   * Populated by each app when it writes; enables provenance tracing at the
   * property root level.
   */
  sourceApps: AtlasSourceApp[];

  // ── Sub-models ──────────────────────────────────────────────────────────────

  /** Address and classification metadata for the physical property. */
  property: PropertyIdentityV1;

  /** Session-level metadata for the capture visit. */
  capture: CaptureContextV1;

  /** Physical building model (spatial, thermal, plant). */
  building: BuildingModelV1;

  /** Household occupant composition, behaviour, and preferences. */
  household: HouseholdModelV1;

  /** Existing heating and hot-water system as surveyed. */
  currentSystem: CurrentSystemModelV1;

  /** First-class evidence layer (photos, voice notes, QA flags, timeline). */
  evidence: EvidenceModelV1;

  /**
   * Calculated outputs derived from the captured data.
   * Absent until at least one calculation has been run.
   */
  derived?: DerivedModelV1;

  /**
   * Lightweight recommendation workspace.
   * Absent until the recommendation engine has run.
   */
  recommendations?: RecommendationWorkspaceV1;
}

/**
 * An unknown input at the parse/validation boundary before the object has
 * been confirmed to match AtlasPropertyV1.
 */
export type UnknownAtlasProperty = Record<string, unknown>;
