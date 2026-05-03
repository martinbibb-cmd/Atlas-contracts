/**
 * floorPlanFabric.ts
 *
 * Floor-plan perimeter and material capture contracts for Atlas Scan.
 *
 * These types represent measured/captured fabric data only.
 * They carry no heat-loss calculation, no U-value derivation, and no
 * recommendation logic.
 *
 * Design principles:
 *   - Every boundary and opening carries provenance and reviewStatus.
 *   - Rejected evidence remains in history but must not feed customer outputs.
 *   - LiDAR-derived boundaries default to reviewStatus: 'pending'.
 *   - Manually confirmed boundaries can be set to reviewStatus: 'confirmed'.
 *   - Unknown material is valid — engineers are not required to identify it.
 */

import type { ReviewStatusV1, CaptureProvenanceV1 } from './sessionCaptureV2';

// ─── Re-export shared types ───────────────────────────────────────────────────

export type { ReviewStatusV1, CaptureProvenanceV1 };

// ─── Boundary kind ────────────────────────────────────────────────────────────

/**
 * The structural kind of a floor-plan boundary segment.
 *
 * - `external_wall` — separates the dwelling from outside
 * - `internal_wall` — separates two rooms within the same dwelling
 * - `party_wall`    — shared with a neighbouring property
 * - `floor_edge`    — lower horizontal boundary of a room
 * - `ceiling_edge`  — upper horizontal boundary of a room
 * - `unknown`       — kind not yet identified
 */
export type FloorPlanBoundaryKindV1 =
  | 'external_wall'
  | 'internal_wall'
  | 'party_wall'
  | 'floor_edge'
  | 'ceiling_edge'
  | 'unknown';

// ─── Opening kind ─────────────────────────────────────────────────────────────

/**
 * The kind of an opening within a boundary segment.
 *
 * - `door`         — standard hinged or sliding door
 * - `window`       — fixed or openable window
 * - `patio_door`   — full-height glazed patio or French door
 * - `rooflight`    — overhead glazing in a ceiling or roof
 * - `open_arch`    — open archway with no door
 * - `unknown`      — kind not yet identified
 */
export type FloorPlanOpeningKindV1 =
  | 'door'
  | 'window'
  | 'patio_door'
  | 'rooflight'
  | 'open_arch'
  | 'unknown';

// ─── Fabric material ──────────────────────────────────────────────────────────

/**
 * The construction material recorded for a boundary or opening.
 *
 * This is captured evidence — not a derived or modelled value.
 * `unknown` is valid; engineers are not required to identify the material.
 */
export type FabricMaterialV1 =
  | 'solid_brick'
  | 'cavity_wall'
  | 'insulated_cavity'
  | 'timber_frame'
  | 'stone'
  | 'single_glazing'
  | 'double_glazing'
  | 'triple_glazing'
  | 'insulated_door'
  | 'uninsulated_door'
  | 'suspended_timber_floor'
  | 'solid_floor'
  | 'insulated_floor'
  | 'pitched_roof'
  | 'flat_roof'
  | 'insulated_roof'
  | 'unknown';

// ─── Spatial point ────────────────────────────────────────────────────────────

/**
 * A 2-D or 3-D point in a named coordinate space.
 *
 * - `room_plan`  — local to the current room's scan capture
 * - `floor_plan` — normalised to the storey floor plan
 * - `world`      — ARKit world coordinate space
 */
export interface FloorPlanPointV1 {
  x: number;
  y: number;
  z?: number;
  coordinateSpace: 'room_plan' | 'floor_plan' | 'world';
}

// ─── Boundary ─────────────────────────────────────────────────────────────────

/**
 * A single boundary segment of a room's perimeter.
 *
 * Each boundary is defined by a start/end point pair.  Optional dimensions
 * (length, height) and material may be attached.
 *
 * Default reviewStatus by provenance:
 *   - `scan` (LiDAR)  → `pending`
 *   - `manual`        → `confirmed`
 */
export interface FloorPlanBoundaryV1 {
  /** Unique identifier (UUID string). */
  id: string;
  /** ID of the room this boundary belongs to. */
  roomId: string;
  /** Structural kind of this boundary. */
  kind: FloorPlanBoundaryKindV1;
  /** Start point of the boundary segment. */
  start: FloorPlanPointV1;
  /** End point of the boundary segment. */
  end: FloorPlanPointV1;
  /** Measured or estimated length in millimetres. */
  lengthMm?: number;
  /** Measured or estimated height in millimetres. */
  heightMm?: number;
  /** Construction material, if identified. */
  material?: FabricMaterialV1;
  /** QA review status. */
  reviewStatus: ReviewStatusV1;
  /** How this boundary was produced. */
  provenance: CaptureProvenanceV1;
  /** Optional free-text engineer note. */
  notes?: string;
}

// ─── Opening ──────────────────────────────────────────────────────────────────

/**
 * A door, window, or other opening within a room boundary.
 *
 * An opening may reference a parent boundary (`boundaryId`) but is not
 * required to — e.g. a rooflight does not sit within a wall boundary.
 */
export interface FloorPlanOpeningV1 {
  /** Unique identifier (UUID string). */
  id: string;
  /** ID of the room this opening belongs to. */
  roomId: string;
  /** Optional reference to the parent boundary segment. */
  boundaryId?: string;
  /** Kind of opening. */
  kind: FloorPlanOpeningKindV1;
  /** Spatial position of the opening centre. */
  position: FloorPlanPointV1;
  /** Width in millimetres. */
  widthMm?: number;
  /** Height in millimetres. */
  heightMm?: number;
  /** Construction material, if identified. */
  material?: FabricMaterialV1;
  /** QA review status. */
  reviewStatus: ReviewStatusV1;
  /** How this opening was produced. */
  provenance: CaptureProvenanceV1;
  /** Optional free-text engineer note. */
  notes?: string;
}

// ─── Room fabric ──────────────────────────────────────────────────────────────

/**
 * Measured fabric data for a single room.
 *
 * `floorAreaM2`, `ceilingHeightMm`, and `perimeterMm` are optional aggregates
 * that may be derived from the boundary list or entered manually.
 */
export interface FloorPlanRoomFabricV1 {
  /** ID of the room (matches CaptureRoomV1.id in SessionCaptureV2). */
  roomId: string;
  /** Floor area in square metres. */
  floorAreaM2?: number;
  /** Ceiling height in millimetres. */
  ceilingHeightMm?: number;
  /** Total room perimeter in millimetres. */
  perimeterMm?: number;
  /** Boundary segments forming the room perimeter. */
  boundaries: FloorPlanBoundaryV1[];
  /** Openings (doors, windows, etc.) within the room. */
  openings: FloorPlanOpeningV1[];
  /** QA review status for this room's fabric data. */
  reviewStatus: ReviewStatusV1;
  /** How this room's fabric data was produced. */
  provenance: CaptureProvenanceV1;
}

// ─── Top-level capture ────────────────────────────────────────────────────────

/**
 * FloorPlanFabricCaptureV1 — the top-level container for floor-plan perimeter
 * and material capture data produced by Atlas Scan.
 *
 * This is measured/captured fabric data only.  It is NOT:
 *   - a heat-loss calculation
 *   - a U-value model
 *   - a recommendation or design output
 *
 * What IS included:
 *   - room perimeters (boundary segments with kind, dimensions, material)
 *   - openings (doors, windows) with dimensions and material
 *   - provenance and reviewStatus on every item
 *   - visitId for cross-system keying
 */
export interface FloorPlanFabricCaptureV1 {
  /** Contract discriminant — always '1.0'. */
  version: '1.0';
  /** Authoritative cross-system visit identifier. */
  visitId: string;
  /** Fabric data for each room captured in this visit. */
  rooms: FloorPlanRoomFabricV1[];
  /** ISO-8601 timestamp of when this payload was first created. */
  createdAt: string;
  /** ISO-8601 timestamp of the last update to this payload. */
  updatedAt: string;
}
