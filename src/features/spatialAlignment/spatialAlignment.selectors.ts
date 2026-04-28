/**
 * spatialAlignment.selectors.ts
 *
 * Pure selector functions that extract Spatial Alignment data from an
 * AtlasSpatialModelV1.
 *
 * These are read-only helpers — they never mutate the model.  They are
 * designed to be composed with the engine functions in
 * spatialAlignment.engine.ts.
 */

import type { AtlasSpatialModelV1 } from '../../atlasSpatial/atlasSpatialModel.types';
import type {
  AtlasAnchor,
  AtlasVerticalRelation,
  AtlasInferredRoute,
} from '../../atlasSpatial/atlasSpatialAlignment.types';

// ─── Anchor selectors ─────────────────────────────────────────────────────────

/**
 * Returns all anchors in the model, or an empty array if none exist.
 */
export function getAnchors(model: AtlasSpatialModelV1): AtlasAnchor[] {
  return model.anchors ?? [];
}

/**
 * Looks up a single anchor by ID.  Returns `undefined` if not found.
 */
export function getAnchorById(
  model: AtlasSpatialModelV1,
  anchorId: string,
): AtlasAnchor | undefined {
  return (model.anchors ?? []).find((a) => a.id === anchorId);
}

/**
 * Returns all anchors associated with a specific room.
 */
export function getAnchorsForRoom(
  model: AtlasSpatialModelV1,
  roomId: string,
): AtlasAnchor[] {
  return (model.anchors ?? []).filter((a) => a.roomId === roomId);
}

// ─── Vertical relation selectors ──────────────────────────────────────────────

/**
 * Returns all vertical relations in the model, or an empty array if none exist.
 */
export function getVerticalRelations(
  model: AtlasSpatialModelV1,
): AtlasVerticalRelation[] {
  return model.verticalRelations ?? [];
}

/**
 * Returns all vertical relations that involve a specific anchor (as either
 * `fromAnchorId` or `toAnchorId`).
 */
export function getVerticalRelationsForAnchor(
  model: AtlasSpatialModelV1,
  anchorId: string,
): AtlasVerticalRelation[] {
  return (model.verticalRelations ?? []).filter(
    (r) => r.fromAnchorId === anchorId || r.toAnchorId === anchorId,
  );
}

// ─── Inferred route selectors ─────────────────────────────────────────────────

/**
 * Returns all inferred routes in the model, or an empty array if none exist.
 */
export function getInferredRoutes(
  model: AtlasSpatialModelV1,
): AtlasInferredRoute[] {
  return model.inferredRoutes ?? [];
}

/**
 * Looks up a single inferred route by ID.  Returns `undefined` if not found.
 */
export function getInferredRouteById(
  model: AtlasSpatialModelV1,
  routeId: string,
): AtlasInferredRoute | undefined {
  return (model.inferredRoutes ?? []).find((r) => r.id === routeId);
}

/**
 * Returns all inferred routes of a given service type.
 */
export function getInferredRoutesByType(
  model: AtlasSpatialModelV1,
  type: AtlasInferredRoute['type'],
): AtlasInferredRoute[] {
  return (model.inferredRoutes ?? []).filter((r) => r.type === type);
}
