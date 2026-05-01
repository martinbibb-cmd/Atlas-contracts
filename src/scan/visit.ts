/**
 * visit.ts
 *
 * Shared visit identity layer used by Atlas Scan and Atlas Mind.
 *
 * Defines the canonical types for:
 *   - AtlasAppSourceV1   — which app originated the visit
 *   - AtlasVisitStatusV1 — visit lifecycle status
 *   - AtlasVisitReadinessV1 — readiness flags for a visit
 *   - BrandReferenceV1   — lightweight brand reference
 *   - AtlasVisitV1       — top-level visit identity contract
 */

// MARK: - Source app

/** The app that originated the visit. */
export type AtlasAppSourceV1 = 'scan_ios' | 'mind_pwa' | 'import';

// MARK: - Visit status

/** Lifecycle status of a visit. */
export type AtlasVisitStatusV1 =
  | 'draft'
  | 'capturing'
  | 'planning'
  | 'ready_to_complete'
  | 'complete'
  | 'synced'
  | 'archived';

// MARK: - Readiness

/** Readiness flags indicating what has been captured for a visit. */
export interface AtlasVisitReadinessV1 {
  hasRooms: boolean;
  hasPhotos: boolean;
  hasHeatingSystem: boolean;
  hasHotWaterSystem: boolean;
  hasKeyObjectBoiler: boolean;
  hasKeyObjectFlue: boolean;
  hasAnyNotes: boolean;
}

/** A readiness value with all flags set to false. */
export const EMPTY_ATLAS_VISIT_READINESS_V1: AtlasVisitReadinessV1 = {
  hasRooms: false,
  hasPhotos: false,
  hasHeatingSystem: false,
  hasHotWaterSystem: false,
  hasKeyObjectBoiler: false,
  hasKeyObjectFlue: false,
  hasAnyNotes: false,
};

// MARK: - Brand reference

/** A lightweight reference to a brand. */
export interface BrandReferenceV1 {
  brandId: string;
}

// MARK: - Visit

/** AtlasVisitV1 — the top-level visit identity contract shared across Atlas apps. */
export interface AtlasVisitV1 {
  version: '1.0';
  visitId: string;
  visitNumber?: string;
  brandId?: string;
  sourceApp: AtlasAppSourceV1;
  status: AtlasVisitStatusV1;
  readiness: AtlasVisitReadinessV1;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  externalRef?: string;
}
