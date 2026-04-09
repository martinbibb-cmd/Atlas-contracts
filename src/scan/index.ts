/**
 * index.ts
 *
 * Public surface of the @atlas/contracts scan module.
 *
 * Re-exports everything callers need:
 *   - all scan entity types
 *   - version constants and helpers
 *   - validation functions and result types
 */

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
  RoomV1,
  ObjectV1,
  PhotoV1,
  AudioSegmentV1,
  AudioV1,
  NoteMarkerV1,
  SessionEventV1,
  SessionCaptureV1,
  UnknownSessionCapture,
} from './types';

export { SUPPORTED_SCAN_BUNDLE_VERSIONS, isSupportedVersion, isUnsupportedVersion } from './versions';
export type { ScanBundleVersion } from './versions';

export { validateScanBundle, validateSessionCapture } from './validation';
export type {
  ScanValidationResult,
  ScanValidationSuccess,
  ScanValidationFailure,
  SessionCaptureValidationResult,
  SessionCaptureValidationSuccess,
  SessionCaptureValidationFailure,
} from './validation';
