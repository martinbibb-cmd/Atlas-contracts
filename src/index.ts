/**
 * index.ts
 *
 * Top-level public surface of the @atlas/contracts package.
 *
 * Re-exports all versioned contracts:
 *   - scan module        (ScanBundleV1, VisitCapture, SessionCaptureV1, …)
 *   - atlasProperty module (AtlasPropertyV1 and all sub-models)
 *
 * Note: consumers that want to import a specific module directly should use
 * the dedicated export paths:
 *   @atlas/contracts/scan
 *   @atlas/contracts/atlasProperty
 */

// ─── Scan module ──────────────────────────────────────────────────────────────
// Re-export the scan module types, renaming the SessionCaptureV1 RoomV1 to
// SessionRoomV1 at this aggregated boundary to avoid ambiguity with the
// building model's RoomV1.

export type {
  ScanCoordinateConvention,
  ScanConfidenceBand,
  ScanQAFlag,
  ScanPoint2D,
  ScanPoint3D,
  ScanOpening,
  ScanWall,
  ScanDetectedObject,
  ScanAnchor,
  ScanRoom,
  ScanMeta,
  ScanBundleV1,
  ScanBundle,
  UnknownScanBundle,
  VoiceNoteKind,
  TranscriptStatus,
  VoiceNoteSyncState,
  VoiceNote,
  VisitCapture,
  SessionStatusV1,
  RoomStatusV1,
  CapturedObjectType,
  AnchorConfidence,
  CapturedObjectStatus,
  PhotoScope,
  NoteMarkerCategory,
  SessionEventType,
  RoomV1 as SessionRoomV1,
  ObjectV1,
  PhotoV1,
  AudioSegmentV1,
  AudioV1,
  NoteMarkerV1,
  SessionEventV1,
  SessionCaptureV1,
  UnknownSessionCapture,
  ScanImportConflictKind,
  ScanImportConflictFieldV1,
  ScanImportConflictItemV1,
  ScanImportConflictSetV1,
} from './scan/types';

export {
  SUPPORTED_SCAN_BUNDLE_VERSIONS,
  isSupportedVersion,
  isUnsupportedVersion,
} from './scan/versions';
export type { ScanBundleVersion } from './scan/versions';

export { validateScanBundle, validateSessionCapture, checkAtlasPropertyVersion, CURRENT_ATLAS_PROPERTY_VERSION } from './scan/validation';
export type {
  ScanValidationResult,
  ScanValidationSuccess,
  ScanValidationFailure,
  SessionCaptureValidationResult,
  SessionCaptureValidationSuccess,
  SessionCaptureValidationFailure,
  AtlasPropertyVersionStatus,
  AtlasPropertyVersionCheckResult,
} from './scan/validation';

// ─── AtlasProperty module ─────────────────────────────────────────────────────

export * from './atlasProperty/index';

// ─── Spatial alignment module ─────────────────────────────────────────────────

export type {
  AtlasWorldPosition,
  AtlasAnchor,
  AtlasVerticalRelation,
  AtlasInferredRoute,
  AtlasKeyObjectType,
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
