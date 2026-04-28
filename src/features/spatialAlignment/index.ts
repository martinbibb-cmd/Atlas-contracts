/**
 * index.ts
 *
 * Public surface of the @atlas/contracts spatialAlignment feature module.
 *
 * Re-exports all engine types, functions, and selectors.
 */

// ─── Engine types ─────────────────────────────────────────────────────────────

export type {
  RelativePosition,
  ScreenPosition,
  CameraPose,
  AlignmentInsight,
} from './spatialAlignment.engine';

// ─── Engine functions ─────────────────────────────────────────────────────────

export {
  getRelativePosition,
  projectToViewPlane,
  buildAlignmentInsights,
  computeInferredRouteLength,
} from './spatialAlignment.engine';

// ─── Selectors ────────────────────────────────────────────────────────────────

export {
  getAnchors,
  getAnchorById,
  getAnchorsForRoom,
  getVerticalRelations,
  getVerticalRelationsForAnchor,
  getInferredRoutes,
  getInferredRouteById,
  getInferredRoutesByType,
} from './spatialAlignment.selectors';
