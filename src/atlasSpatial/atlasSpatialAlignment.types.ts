/**
 * atlasSpatialAlignment.types.ts
 *
 * Data types for the Spatial Alignment feature.
 *
 * These types extend AtlasSpatialModelV1 to support absolute world positioning,
 * named anchor objects, vertical relationships between anchors, and inferred
 * routing paths.  Together they power the Spatial Alignment View ("Structure
 * View" / "Alignment View"), allowing engineers to understand vertical and
 * horizontal alignment across the building.
 *
 * Design principles:
 *   - No ghost data: every inferred entry must carry a `reason` string.
 *   - Confidence is always explicit; inferred items are never promoted to
 *     confirmed without human review.
 *   - All coordinates are in local metric metres, consistent with the parent
 *     model's `coordinateSystem`.
 */

import type { Point3D } from './atlasGeometry.types';

// ─── World position ───────────────────────────────────────────────────────────

/**
 * An absolute position in the local site coordinate grid.
 *
 * `x`, `y`   — horizontal plane in metres from the model origin.
 * `z`        — height in metres above the model origin floor plane.
 * `confidence` — whether this position was directly measured or derived.
 * `source`   — the capture method that produced this position.
 */
export interface AtlasWorldPosition extends Point3D {
  /** How confident we are in this position. */
  confidence: 'confirmed' | 'inferred';
  /** How this position was obtained. */
  source: 'lidar' | 'manual' | 'derived';
}

// ─── Anchor ───────────────────────────────────────────────────────────────────

/**
 * A named, positioned object in the building — the fundamental unit of the
 * Spatial Alignment feature.
 *
 * Anchors reference entities that already exist in the spatial model (boiler,
 * cylinder, consumer unit, etc.) and attach an absolute world position to them
 * so that alignment calculations can be performed.
 *
 * `label` is a human-readable name shown in the UI (e.g. "Boiler",
 * "Cylinder", "Consumer Unit").
 *
 * `entityId` optionally links this anchor to an existing `AtlasSpatialEntityV1`
 * in the model (e.g. a `heat_source` or `hot_water_store` entity).
 *
 * `roomId` optionally links the anchor to the room it sits in.
 */
export interface AtlasAnchor {
  /** Unique identifier (UUID string). */
  id: string;
  /** Human-readable display name. */
  label: string;
  /** Absolute world position of this anchor. */
  worldPosition: AtlasWorldPosition;
  /** ID of the `AtlasSpatialEntityV1` this anchor represents, if any. */
  entityId?: string;
  /** ID of the room this anchor is in, if known. */
  roomId?: string;
}

// ─── Vertical relation ────────────────────────────────────────────────────────

/**
 * A calculated or inferred vertical relationship between two anchors.
 *
 * Used to express facts such as "the cylinder is 2.3 m above the boiler".
 * Vertical relations are derived by the Spatial Alignment Engine and stored
 * here for fast UI lookup without re-computation.
 *
 * `relation` is always expressed from `fromAnchorId` to `toAnchorId`:
 *   'above' — fromAnchor is above toAnchor
 *   'below' — fromAnchor is below toAnchor
 *   'same_level' — both anchors share approximately the same height
 */
export interface AtlasVerticalRelation {
  /** ID of the anchor that is the subject of the relation. */
  fromAnchorId: string;
  /** ID of the anchor that is the object of the relation. */
  toAnchorId: string;
  /** Signed vertical distance in metres (positive = fromAnchor is higher). */
  verticalDistanceM: number;
  /** Qualitative vertical relationship. */
  relation: 'above' | 'below' | 'same_level';
}

// ─── Inferred route ───────────────────────────────────────────────────────────

/**
 * An inferred routing path between anchors (pipe, cable, or flue).
 *
 * Inferred routes are always presented as estimates — they must never be
 * rendered as confirmed facts in the UI.  Every route must carry a `reason`
 * string explaining the inference.
 *
 * Route paths are expressed as ordered sequences of `AtlasWorldPosition`
 * points.  The sum of distances between consecutive path points gives the
 * estimated route length, which feeds directly into pipe-length calculations
 * in the hydraulic engine.
 */
export interface AtlasInferredRoute {
  /** Unique identifier (UUID string). */
  id: string;
  /** The type of service being routed. */
  type: 'pipe' | 'cable' | 'flue';
  /**
   * Ordered waypoints describing the route path.
   *
   * All positions must have `confidence: 'inferred'` — this type is
   * inherently an estimate.
   */
  path: AtlasWorldPosition[];
  /**
   * Always 'inferred' — this discriminant signals to all consumers that the
   * route has not been directly observed.
   */
  confidence: 'inferred';
  /**
   * Human-readable explanation of how this route was inferred.
   *
   * Example: "Aligned kitchen tap + boiler position + standard routing"
   *
   * Required — no ghost data without reasoning.
   */
  reason: string;
}
