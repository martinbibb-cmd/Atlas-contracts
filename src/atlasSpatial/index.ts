/**
 * index.ts
 *
 * Public surface of the @atlas/contracts atlasSpatial module.
 */

// ─── Geometry ─────────────────────────────────────────────────────────────────

export type {
  CoordinateSystemKind,
  LocalCoordinateSystem,
  Point2D,
  Point3D,
  Polyline2D,
  Polyline3D,
  Polygon2D,
  Box3D,
  OrientedBox3D,
  RoomFootprintWithHeight,
  AtlasGeometry,
} from './atlasGeometry.types';

// ─── Evidence markers ─────────────────────────────────────────────────────────

export type {
  AtlasEvidenceSourceRef,
  AtlasEvidenceMarkerV1,
} from './atlasEvidence.types';

// ─── Provenance ───────────────────────────────────────────────────────────────

export type {
  AtlasProvenanceActor,
  AtlasProvenanceEventKind,
  AtlasProvenanceEntryV1,
} from './atlasProvenance.types';

// ─── Spatial model ────────────────────────────────────────────────────────────

export type {
  AtlasEntityBaseV1,
  AtlasLevelV1,
  AtlasRoomV1,
  AtlasBoundaryV1,
  AtlasOpeningV1,
  AtlasThermalZoneV1,
  AtlasEmitterV1,
  AtlasHeatSourcePlacementV1,
  AtlasStorePlacementV1,
  AtlasPipeRunV1,
  AtlasControlPlacementV1,
  AtlasAssetPlacementV1,
  AtlasSpatialEntityV1,
  AtlasSpatialModelV1,
} from './atlasSpatialModel.types';

export type {
  AtlasSpatialModelValidationSuccess,
  AtlasSpatialModelValidationFailure,
  AtlasSpatialModelValidationResult,
} from './atlasSpatialModel.schema';
export { validateAtlasSpatialModel } from './atlasSpatialModel.schema';

// ─── Spatial patch ────────────────────────────────────────────────────────────

export type {
  AtlasSpatialOperationV1,
  AtlasSpatialPatchV1,
} from './atlasSpatialPatch.types';

export type {
  AtlasSpatialPatchValidationSuccess,
  AtlasSpatialPatchValidationFailure,
  AtlasSpatialPatchValidationResult,
} from './atlasSpatialPatch.schema';
export { validateAtlasSpatialPatch } from './atlasSpatialPatch.schema';

// ─── Import / apply ───────────────────────────────────────────────────────────

export type { ImportOptions } from './buildInitialSpatialModelFromSessionCapture';
export { buildInitialSpatialModelFromSessionCapture } from './buildInitialSpatialModelFromSessionCapture';

export type {
  PatchApplicationSuccess,
  PatchApplicationFailure,
  PatchApplicationResult,
} from './applyAtlasSpatialPatch';
export { applyAtlasSpatialPatch } from './applyAtlasSpatialPatch';
