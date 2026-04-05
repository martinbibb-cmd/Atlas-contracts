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
} from './types';

export { SUPPORTED_SCAN_BUNDLE_VERSIONS, isSupportedVersion, isUnsupportedVersion } from './versions';
export type { ScanBundleVersion } from './versions';

export { validateScanBundle } from './validation';
export type { ScanValidationResult, ScanValidationSuccess, ScanValidationFailure } from './validation';
