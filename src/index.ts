/**
 * index.ts
 *
 * Top-level public surface of the @atlas/contracts package.
 *
 * Canonical scan handoff contract:
 *   SessionCaptureV2 — the canonical contract between Atlas Scan and Atlas Mind.
 *   Import from '@atlas/contracts' or directly from '@atlas/contracts/scan'.
 *
 *   Raw audio must not be exported; only transcript text travels in the
 *   SessionCaptureV2 payload.  ScanBundleV1 and ScanJob are NOT production
 *   handoff contracts.
 *
 * Re-exports:
 *   - SessionCaptureV2 types and validator          (atlasScan module)
 *   - SessionCaptureV1 types and validator          (atlasScan module, legacy)
 *   - Spatial primitives and install markup types   (scan module)
 *   - AtlasPropertyV1 and all sub-models            (atlasProperty module)
 *   - AtlasSpatial alignment types and engine       (atlasSpatial module)
 */

// ─── Canonical scan handoff contract: SessionCaptureV2 ───────────────────────

export type {
  SessionCaptureV2SchemaVersion,
  ObjectPinKindV2,
  QAFlagKindV2,
  RoomScanV2,
  PhotoV2,
  VoiceNoteV2,
  ObjectPinV2,
  FloorPlanSnapshotV2,
  QAFlagV2,
  SessionCaptureV2,
  UnknownSessionCaptureV2,
} from './atlasScan/sessionCaptureV2.types';

export { SESSION_CAPTURE_V2_SCHEMA_VERSION } from './atlasScan/sessionCaptureV2.types';

export { validateSessionCaptureV2 } from './atlasScan/sessionCaptureV2.schema';
export type {
  SessionCaptureV2ValidationResult,
  SessionCaptureV2ValidationSuccess,
  SessionCaptureV2ValidationFailure,
} from './atlasScan/sessionCaptureV2.schema';

// ─── Canonical scan handoff contract: SessionCaptureV1 ───────────────────────

export type {
  SpatialConfidence,
  EvidenceProvenanceV1,
  SessionCaptureStatus,
  RoomCaptureStatus,
  SessionRoomV1,
  SpatialRoomGeometryV1,
  SpatialModelV1,
  ObjectMarkerKind,
  ObjectMarkerV1,
  SessionPhotoV1,
  TranscriptSegmentV1,
  TranscriptV1,
  NoteCategoryV1,
  SessionNoteV1,
  TimelineEventType,
  TimelineEventV1,
  AssetKindV1,
  AssetManifestEntryV1,
  DeviceMetadataV1,
  ReviewStatus,
  ReviewStateV1,
  SessionCaptureV1,
  UnknownSessionCaptureV1,
} from './atlasScan/sessionCaptureV1.types';

export { validateSessionCaptureV1 } from './atlasScan/sessionCaptureV1.schema';
export type {
  SessionCaptureV1ValidationResult,
  SessionCaptureV1ValidationSuccess,
  SessionCaptureV1ValidationFailure,
} from './atlasScan/sessionCaptureV1.schema';

// ─── Scan module (spatial primitives, install markup, property version) ───────

export type {
  ScanCoordinateConvention,
  ScanPoint2D,
  ScanPoint3D,
  ScanImportConflictKind,
  ScanImportConflictFieldV1,
  ScanImportConflictItemV1,
  ScanImportConflictSetV1,
  InstallObjectType,
  InstallObjectSource,
  InstallDimensions,
  InstallOrientation,
  InstallObjectModelV1,
  InstallRouteKind,
  InstallMounting,
  InstallRouteConfidence,
  InstallPathPoint,
  InstallRouteModelV1,
  InstallAnnotation,
  InstallLayerModelV1,
} from './scan/types';

export { checkAtlasPropertyVersion, CURRENT_ATLAS_PROPERTY_VERSION } from './scan/validation';
export type {
  AtlasPropertyVersionStatus,
  AtlasPropertyVersionCheckResult,
} from './scan/validation';

export { validateInstallObject, validateInstallRoute, validateInstallLayer } from './scan/validation';
export type {
  InstallObjectValidationResult,
  InstallObjectValidationSuccess,
  InstallObjectValidationFailure,
  InstallRouteValidationResult,
  InstallRouteValidationSuccess,
  InstallRouteValidationFailure,
  InstallLayerValidationResult,
  InstallLayerValidationSuccess,
  InstallLayerValidationFailure,
} from './scan/validation';

// ─── AtlasProperty module ─────────────────────────────────────────────────────

export * from './atlasProperty/index';

// ─── Spatial alignment module ─────────────────────────────────────────────────

export type {
  AtlasWorldPosition,
  AtlasAnchor,
  AtlasVerticalRelation,
  AtlasInferredRoute,
  AtlasAnchorObjectType,
} from './atlasSpatial/atlasSpatialAlignment.types';

export type {
  RelativePosition,
  ScreenPosition,
  CameraPose,
  AlignmentInsight,
} from './features/spatialAlignment/spatialAlignment.engine';

export {
  getRelativePosition,
  projectToViewPlane,
  buildAlignmentInsights,
  computeInferredRouteLength,
} from './features/spatialAlignment/spatialAlignment.engine';

export {
  getAnchors,
  getAnchorById,
  getAnchorsForRoom,
  getVerticalRelations,
  getVerticalRelationsForAnchor,
  getInferredRoutes,
  getInferredRouteById,
  getInferredRoutesByType,
} from './features/spatialAlignment/spatialAlignment.selectors';
