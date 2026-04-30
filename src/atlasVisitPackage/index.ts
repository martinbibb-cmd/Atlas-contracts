/**
 * index.ts
 *
 * Public surface of the @atlas/contracts atlasVisitPackage module.
 *
 * Exports all types, constants, and validators for AtlasVisitPackageV1 —
 * the portable handoff format for a completed Atlas property visit.
 */

// ─── Types and constants ──────────────────────────────────────────────────────

export type {
  AtlasVisitPackageV1Format,
  AtlasVisitPackageManifestV1SchemaVersion,
  AtlasVisitPackageManifestV1,
  UnknownAtlasVisitPackageManifestV1,
} from './atlasVisitPackageV1.types';

export {
  ATLAS_VISIT_PACKAGE_V1_FORMAT,
  ATLAS_VISIT_PACKAGE_V1_EXTENSION,
  ATLAS_VISIT_PACKAGE_MANIFEST_V1_SCHEMA_VERSION,
  ATLAS_VISIT_PACKAGE_V1_WORKSPACE_FILE,
  ATLAS_VISIT_PACKAGE_V1_SESSION_CAPTURE_FILE,
  ATLAS_VISIT_PACKAGE_V1_REVIEW_DECISIONS_FILE,
  ATLAS_VISIT_PACKAGE_V1_PHOTOS_DIR,
  ATLAS_VISIT_PACKAGE_V1_FLOORPLANS_DIR,
} from './atlasVisitPackageV1.types';

// ─── Validators ───────────────────────────────────────────────────────────────

export { validateAtlasVisitPackageManifestV1 } from './atlasVisitPackageV1.schema';
export type {
  AtlasVisitPackageManifestV1ValidationResult,
  AtlasVisitPackageManifestV1ValidationSuccess,
  AtlasVisitPackageManifestV1ValidationFailure,
} from './atlasVisitPackageV1.schema';
