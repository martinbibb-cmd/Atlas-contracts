/**
 * index.ts
 *
 * Public surface of the @atlas/contracts scan module.
 *
 * Canonical scan handoff contract:
 *   SessionCaptureV1 — defined in src/atlasScan/sessionCaptureV1.types.ts
 *
 * This module exports:
 *   - Spatial primitives (ScanPoint2D, ScanPoint3D, ScanCoordinateConvention)
 *   - Scan import conflict types (ScanImportConflictSetV1, etc.)
 *   - Install markup models (InstallObjectModelV1, InstallRouteModelV1, etc.)
 *   - Install markup validators
 *   - AtlasProperty version check
 */

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
} from './types';

export { checkAtlasPropertyVersion, CURRENT_ATLAS_PROPERTY_VERSION } from './validation';
export type {
  AtlasPropertyVersionStatus,
  AtlasPropertyVersionCheckResult,
  InstallObjectValidationResult,
  InstallObjectValidationSuccess,
  InstallObjectValidationFailure,
  InstallRouteValidationResult,
  InstallRouteValidationSuccess,
  InstallRouteValidationFailure,
  InstallLayerValidationResult,
  InstallLayerValidationSuccess,
  InstallLayerValidationFailure,
} from './validation';

export { validateInstallObject, validateInstallRoute, validateInstallLayer } from './validation';

export type {
  AtlasAppSourceV1,
  AtlasVisitStatusV1,
  AtlasVisitReadinessV1,
  BrandReferenceV1,
  AtlasVisitV1,
} from './visit';

export { EMPTY_ATLAS_VISIT_READINESS_V1 } from './visit';

export type {
  ReviewStatusV1,
  CaptureProvenanceV1,
  CaptureEvidenceBaseV1,
  CapturePhotoV1,
  CaptureTranscriptV1,
  CaptureObjectPinV1,
  CapturePipeRouteV1,
  CaptureRoomV1,
  CapturePointCloudAssetV1,
  SessionCaptureV2,
} from './sessionCaptureV2';

export type {
  ScanToMindHandoffReasonV1,
  ScanToMindHandoffMetaV1,
  ScanToMindHandoffV1,
} from './scanToMindHandoff';

export { validateScanToMindHandoffV1 } from './scanToMindHandoff';
