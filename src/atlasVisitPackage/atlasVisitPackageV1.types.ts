/**
 * atlasVisitPackageV1.types.ts
 *
 * Contract types for AtlasVisitPackageV1 — the portable handoff format for a
 * completed Atlas property visit.
 *
 * An AtlasVisitPackageV1 is a folder (or archive) with the `.atlasvisit`
 * extension that contains all artefacts produced during a single visit:
 *
 *   Required contents:
 *     workspace.json            — VisitWorkspaceV1 descriptor
 *     session_capture_v2.json   — SessionCaptureV2 scan payload
 *     review_decisions.json     — ReviewDecisionsV1 review outcomes
 *     /photos/                  — directory of captured photo files
 *     /floorplans/              — directory of floor-plan image files
 *
 * The manifest file (typically `manifest.json` at the package root) acts as
 * the entry point and declares the format, schema version, and canonical
 * paths to all required contents.
 *
 * Design principles:
 *   - All file paths are relative to the package root.
 *   - The manifest carries only structural metadata, not domain data.
 *   - No storage-provider logic, DB IDs, or engine outputs belong here.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Package format identifier for AtlasVisitPackageV1. */
export const ATLAS_VISIT_PACKAGE_V1_FORMAT = 'AtlasVisitPackageV1' as const;
export type AtlasVisitPackageV1Format = typeof ATLAS_VISIT_PACKAGE_V1_FORMAT;

/** File extension for an Atlas visit package. */
export const ATLAS_VISIT_PACKAGE_V1_EXTENSION = '.atlasvisit' as const;

/** Schema version for the AtlasVisitPackageManifestV1 manifest file. */
export const ATLAS_VISIT_PACKAGE_MANIFEST_V1_SCHEMA_VERSION = '1.0' as const;
export type AtlasVisitPackageManifestV1SchemaVersion =
  typeof ATLAS_VISIT_PACKAGE_MANIFEST_V1_SCHEMA_VERSION;

// ─── Default required file/directory names ───────────────────────────────────

/** Default file name for the VisitWorkspaceV1 descriptor. */
export const ATLAS_VISIT_PACKAGE_V1_WORKSPACE_FILE = 'workspace.json' as const;

/** Default file name for the SessionCaptureV2 payload. */
export const ATLAS_VISIT_PACKAGE_V1_SESSION_CAPTURE_FILE =
  'session_capture_v2.json' as const;

/** Default file name for the ReviewDecisionsV1 payload. */
export const ATLAS_VISIT_PACKAGE_V1_REVIEW_DECISIONS_FILE =
  'review_decisions.json' as const;

/** Default directory name for captured photos. */
export const ATLAS_VISIT_PACKAGE_V1_PHOTOS_DIR = 'photos' as const;

/** Default directory name for floor-plan images. */
export const ATLAS_VISIT_PACKAGE_V1_FLOORPLANS_DIR = 'floorplans' as const;

// ─── AtlasVisitPackageManifestV1 ─────────────────────────────────────────────

/**
 * AtlasVisitPackageManifestV1 — entry-point manifest for a visit package.
 *
 * Stored as `manifest.json` at the root of an `.atlasvisit` package.
 * Declares the package format, schema version, and canonical relative paths
 * to all required contents so that consumers can locate resources without
 * scanning the directory tree.
 */
export interface AtlasVisitPackageManifestV1 {
  /** Package format identifier — always 'AtlasVisitPackageV1'. */
  format: AtlasVisitPackageV1Format;
  /** Manifest schema version — always '1.0'. */
  schemaVersion: AtlasVisitPackageManifestV1SchemaVersion;
  /** ISO-8601 timestamp of when the package was created. */
  createdAt: string;
  /**
   * Reference to the property visit this package belongs to.
   * Must match the visitReference in workspace.json and session_capture_v2.json.
   */
  visitReference: string;
  /** Unique identifier for the capture session (UUID string). */
  sessionId: string;
  /** Relative path to the VisitWorkspaceV1 descriptor (e.g. 'workspace.json'). */
  workspaceFile: string;
  /** Relative path to the SessionCaptureV2 file (e.g. 'session_capture_v2.json'). */
  sessionCaptureFile: string;
  /** Relative path to the ReviewDecisionsV1 file (e.g. 'review_decisions.json'). */
  reviewDecisionsFile: string;
  /** Relative path to the photos directory (e.g. 'photos'). */
  photosDir: string;
  /** Relative path to the floor-plans directory (e.g. 'floorplans'). */
  floorplansDir: string;
}

/**
 * A raw unknown input — used at the validation boundary before the payload
 * has been confirmed to match AtlasVisitPackageManifestV1.
 */
export type UnknownAtlasVisitPackageManifestV1 = Record<string, unknown>;
