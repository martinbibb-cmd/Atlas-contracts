/**
 * spatialAlignment.engine.ts
 *
 * SpatialAlignmentEngine — core computation module for the Spatial Alignment
 * feature.
 *
 * Responsibility:
 *   Convert an AtlasSpatialModelV1 (with anchors and vertical relations) into
 *   relative positioning data, screen projections, and human-readable alignment
 *   insights.
 *
 * Design rules:
 *   - All outputs from inferred data are labelled as inferred.
 *   - No ghost data: every inferred result traces back to explicit model state.
 *   - Pure functions only — no side effects, no I/O.
 */

import type { AtlasWorldPosition, AtlasAnchor, AtlasInferredRoute } from '../../atlasSpatial/atlasSpatialAlignment.types';
import type { AtlasSpatialModelV1 } from '../../atlasSpatial/atlasSpatialModel.types';

// ─── Result types ─────────────────────────────────────────────────────────────

/**
 * The relative position of a target anchor from the user's current position.
 *
 * `distanceM`      — horizontal Euclidean distance in metres (x/y plane).
 * `bearingDeg`     — compass-like bearing in degrees (0 = +Y axis, clockwise).
 *                    Range: [0, 360).
 * `verticalOffsetM` — signed vertical difference: target.z − user.z.
 *                    Positive means target is above the user.
 */
export interface RelativePosition {
  distanceM: number;
  bearingDeg: number;
  verticalOffsetM: number;
}

/**
 * A normalised screen position produced by `projectToViewPlane`.
 *
 * `x`, `y`  — normalised device coordinates in [0, 1].
 *             (0,0) = top-left; (1,1) = bottom-right.
 * `depth`   — distance in metres from the camera to the projected point along
 *             the forward axis.
 * `visible` — true when the point is in front of the camera's near plane.
 */
export interface ScreenPosition {
  x: number;
  y: number;
  depth: number;
  visible: boolean;
}

/**
 * The pose of the viewer's camera in world space.
 *
 * `position`      — camera origin in world coordinates.
 * `forwardVector` — unit vector pointing in the camera's view direction.
 * `upVector`      — unit vector pointing upward in camera space (Y-up).
 * `fovDeg`        — full vertical field of view in degrees.
 * `viewportWidth` — viewport width in pixels (used for aspect ratio).
 * `viewportHeight` — viewport height in pixels.
 */
export interface CameraPose {
  position: AtlasWorldPosition;
  forwardVector: { x: number; y: number; z: number };
  upVector: { x: number; y: number; z: number };
  fovDeg: number;
  viewportWidth: number;
  viewportHeight: number;
}

/**
 * A human-readable alignment insight derived from the spatial model.
 *
 * Rendered in the Alignment View / Structure View panels.
 *
 * Visual rendering rules (non-negotiable):
 *   confidence === 'confirmed'  → solid line / marker
 *   confidence === 'inferred'   → dashed line / faded marker
 */
export interface AlignmentInsight {
  /** ID of the primary anchor this insight describes. */
  anchorId: string;
  /** Display label of the primary anchor. */
  label: string;
  /** Qualitative vertical relationship to a reference anchor. */
  relation: 'above' | 'below' | 'same_level';
  /** Signed vertical distance in metres from reference anchor. */
  verticalDistanceM: number;
  /** Horizontal distance in metres from reference anchor. */
  horizontalOffsetM: number;
  /** ID of the reference anchor. */
  referenceAnchorId: string;
  /** Display label of the reference anchor. */
  referenceAnchorLabel: string;
  /**
   * Whether this insight is based on confirmed measurements or inferred data.
   *
   * MUST be propagated faithfully to the UI renderer — never promote inferred
   * to confirmed.
   */
  confidence: 'confirmed' | 'inferred';
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function vec2Length(dx: number, dy: number): number {
  return Math.sqrt(dx * dx + dy * dy);
}

function clampBearing(deg: number): number {
  const clamped = deg % 360;
  return clamped < 0 ? clamped + 360 : clamped;
}

function worstConfidence(
  a: 'confirmed' | 'inferred',
  b: 'confirmed' | 'inferred',
): 'confirmed' | 'inferred' {
  return a === 'inferred' || b === 'inferred' ? 'inferred' : 'confirmed';
}

// ─── getRelativePosition ──────────────────────────────────────────────────────

/**
 * Computes the relative position of a target anchor from the user's position.
 *
 * @param userPosition  The user's current world position.
 * @param target        The anchor whose position is being queried.
 * @returns             Horizontal distance, compass bearing, and vertical offset.
 */
export function getRelativePosition(
  userPosition: AtlasWorldPosition,
  target: AtlasAnchor,
): RelativePosition {
  const dx = target.worldPosition.x - userPosition.x;
  const dy = target.worldPosition.y - userPosition.y;
  const dz = target.worldPosition.z - userPosition.z;

  const distanceM = vec2Length(dx, dy);

  // Bearing: 0° = +Y axis, clockwise.  atan2(dx, dy) gives the angle from
  // the +Y axis measured towards +X, then we normalise to [0, 360).
  const bearingRad = Math.atan2(dx, dy);
  const bearingDeg = clampBearing((bearingRad * 180) / Math.PI);

  return {
    distanceM,
    bearingDeg,
    verticalOffsetM: dz,
  };
}

// ─── projectToViewPlane ───────────────────────────────────────────────────────

/**
 * Projects a world position onto the camera's view plane.
 *
 * Uses a perspective projection based on the camera pose.  Returns normalised
 * device coordinates suitable for overlay rendering.
 *
 * @param cameraPose     The camera's current pose in world space.
 * @param worldPosition  The 3-D world position to project.
 * @returns              Normalised screen position and depth.
 */
export function projectToViewPlane(
  cameraPose: CameraPose,
  worldPosition: AtlasWorldPosition,
): ScreenPosition {
  // Translate world point to camera-relative space
  const rx = worldPosition.x - cameraPose.position.x;
  const ry = worldPosition.y - cameraPose.position.y;
  const rz = worldPosition.z - cameraPose.position.z;

  const fw = cameraPose.forwardVector;
  const up = cameraPose.upVector;

  // Right vector = forward × up (cross product)
  const rightX = fw.y * up.z - fw.z * up.y;
  const rightY = fw.z * up.x - fw.x * up.z;
  const rightZ = fw.x * up.y - fw.y * up.x;

  // Project onto camera axes
  const depth = rx * fw.x + ry * fw.y + rz * fw.z;  // along forward
  const lateral = rx * rightX + ry * rightY + rz * rightZ; // along right
  const vertical = rx * up.x + ry * up.y + rz * up.z;    // along up

  if (depth <= 0) {
    // Behind the camera — not visible
    return { x: 0, y: 0, depth, visible: false };
  }

  const aspectRatio = cameraPose.viewportWidth / cameraPose.viewportHeight;
  const tanHalfFovV = Math.tan(((cameraPose.fovDeg / 2) * Math.PI) / 180);
  const tanHalfFovH = tanHalfFovV * aspectRatio;

  // NDC in [-1, 1], then remap to [0, 1] with (0,0) at top-left
  const ndcX = lateral / (depth * tanHalfFovH);
  const ndcY = vertical / (depth * tanHalfFovV);

  const screenX = (ndcX + 1) / 2;
  const screenY = (1 - ndcY) / 2; // flip Y so top = 0

  return {
    x: screenX,
    y: screenY,
    depth,
    visible: true,
  };
}

// ─── buildAlignmentInsights ───────────────────────────────────────────────────

/**
 * Derives human-readable alignment insights from the spatial model.
 *
 * For every vertical relation in the model, produces an `AlignmentInsight`
 * describing the relationship between the two anchors involved, including
 * their horizontal offset and the combined confidence level.
 *
 * When the model has no anchors or vertical relations, returns an empty array.
 *
 * @param model  The spatial model to analyse.
 * @returns      An array of alignment insights, one per vertical relation.
 */
export function buildAlignmentInsights(
  model: AtlasSpatialModelV1,
): AlignmentInsight[] {
  const anchors = model.anchors ?? [];
  const relations = model.verticalRelations ?? [];

  if (anchors.length === 0 || relations.length === 0) {
    return [];
  }

  const anchorMap = new Map<string, AtlasAnchor>(
    anchors.map((a) => [a.id, a]),
  );

  const insights: AlignmentInsight[] = [];

  for (const relation of relations) {
    const from = anchorMap.get(relation.fromAnchorId);
    const to = anchorMap.get(relation.toAnchorId);

    if (from == null || to == null) {
      // Guard: skip relations with missing anchors to prevent ghost data
      continue;
    }

    const dx = from.worldPosition.x - to.worldPosition.x;
    const dy = from.worldPosition.y - to.worldPosition.y;
    const horizontalOffsetM = vec2Length(dx, dy);

    const confidence = worstConfidence(
      from.worldPosition.confidence,
      to.worldPosition.confidence,
    );

    insights.push({
      anchorId: from.id,
      label: from.label,
      relation: relation.relation,
      verticalDistanceM: relation.verticalDistanceM,
      horizontalOffsetM,
      referenceAnchorId: to.id,
      referenceAnchorLabel: to.label,
      confidence,
    });
  }

  return insights;
}

// ─── computeInferredRouteLength ───────────────────────────────────────────────

/**
 * Computes the total length of an inferred route path in metres.
 *
 * Sums the Euclidean distance between each consecutive pair of waypoints in
 * three dimensions.  Returns 0 for routes with fewer than two waypoints.
 *
 * This value feeds directly into the hydraulic engine:
 *   pipeLength = computeInferredRouteLength(route)
 *
 * @param route  The inferred route to measure.
 * @returns      Total path length in metres.
 */
export function computeInferredRouteLength(route: AtlasInferredRoute): number {
  const { path } = route;
  if (path.length < 2) return 0;

  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const prev = path[i - 1];
    const curr = path[i];
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    const dz = curr.z - prev.z;
    total += Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  return total;
}
