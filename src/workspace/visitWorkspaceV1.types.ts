/**
 * visitWorkspaceV1.types.ts
 *
 * Portable, file-based workspace contracts for Atlas Mind.
 *
 * A VisitWorkspaceV1 describes the layout of a single visit's folder on
 * user-owned storage (local files, cloud drives, etc.).  It carries only
 * file-path references — no storage-provider logic or database assumptions.
 *
 * Design principles:
 *   - All file references are relative paths within the workspace folder.
 *   - SessionCaptureV2 and ReviewDecisionsV1 can coexist in the same folder.
 *   - No engine outputs, DB IDs, or provider-specific URLs belong here.
 *   - WorkspaceManifest is an optional helper for multi-session / multi-visit
 *     scenarios and future extension.
 */

// ─── VisitWorkspaceV1 ─────────────────────────────────────────────────────────

/** The only supported version string for VisitWorkspaceV1 payloads. */
export const VISIT_WORKSPACE_V1_VERSION = '1.0' as const;
export type VisitWorkspaceV1Version = typeof VISIT_WORKSPACE_V1_VERSION;

/**
 * Named file paths within the workspace folder.
 *
 * All paths are relative to the workspace root directory.
 * Required files must be present; optional files may be absent.
 */
export interface VisitWorkspaceFilesV1 {
  /** Relative path to the SessionCaptureV2 JSON file (required). */
  sessionCapture: string;
  /** Relative path to the ReviewDecisionsV1 JSON file (required). */
  reviewDecisions: string;
  /** Relative path to the AtlasPropertyV1 JSON file, if present. */
  atlasProperty?: string;
  /** Relative path to the engineer-handoff JSON or PDF, if present. */
  engineerHandoff?: string;
  /** Relative path to the customer-proof document, if present. */
  customerProof?: string;
  /** Relative path to the generated report PDF, if present. */
  reportPdf?: string;
}

/**
 * Asset directory paths within the workspace folder.
 *
 * All paths are relative to the workspace root directory.
 */
export interface VisitWorkspaceAssetsV1 {
  /** Relative path to the directory containing captured photos. */
  photosDir: string;
  /** Relative path to the directory containing floor-plan images. */
  floorPlansDir: string;
}

/**
 * VisitWorkspaceV1 — portable workspace descriptor for a single visit.
 *
 * This file (typically saved as `workspace.json` at the workspace root)
 * acts as the manifest for a visit folder on user-owned storage.  It
 * declares the relative paths to all known files and asset directories,
 * allowing Atlas Mind to locate resources without any storage-provider
 * knowledge.
 */
export interface VisitWorkspaceV1 {
  /** Contract version — always '1.0'. */
  version: VisitWorkspaceV1Version;
  /**
   * Reference to the property visit this workspace belongs to.
   *
   * Must match the visitReference in the corresponding SessionCaptureV2.
   */
  visitReference: string;
  /** Unique identifier for the capture session (UUID string). */
  sessionId: string;
  /** ISO-8601 timestamp of when this workspace was first created. */
  createdAt: string;
  /** ISO-8601 timestamp of the last modification to this workspace. */
  updatedAt: string;
  /** Named file paths within the workspace folder. */
  files: VisitWorkspaceFilesV1;
  /** Asset directory paths within the workspace folder. */
  assets: VisitWorkspaceAssetsV1;
}

/**
 * A raw unknown input — used at the validation boundary before the payload
 * has been confirmed to match VisitWorkspaceV1.
 */
export type UnknownVisitWorkspaceV1 = Record<string, unknown>;

// ─── ReviewDecisionsV1 ────────────────────────────────────────────────────────

/**
 * The kind of evidence item being reviewed.
 */
export type ReviewItemKindV1 = 'photo' | 'object_pin' | 'floor_plan';

/**
 * The review outcome for an evidence item.
 */
export type ReviewStatusV1 = 'pending' | 'confirmed' | 'rejected';

/**
 * A single review decision for one evidence item.
 */
export interface ReviewDecisionItemV1 {
  /**
   * Reference to the evidence item being reviewed.
   *
   * For photos: the photoId from SessionCaptureV2.
   * For object pins: the pinId from SessionCaptureV2.
   * For floor plans: the snapshotId from SessionCaptureV2.
   */
  ref: string;
  /** The kind of evidence item this decision applies to. */
  kind: ReviewItemKindV1;
  /** The outcome of the review for this item. */
  reviewStatus: ReviewStatusV1;
  /** Whether this item should appear in the customer-facing report. */
  includeInCustomerReport?: boolean;
  /** ISO-8601 timestamp of when the review decision was recorded. */
  reviewedAt?: string;
}

/**
 * ReviewDecisionsV1 — the review decisions file for a single session.
 *
 * Saved as a peer to the SessionCaptureV2 file in the workspace folder
 * (typically as `review-decisions.json`).  Records the reviewer's
 * accept/reject decisions for each evidence item in the session.
 */
export interface ReviewDecisionsV1 {
  /** Unique identifier for the capture session (UUID string). */
  sessionId: string;
  /** Review decisions for individual evidence items. */
  decisions: ReviewDecisionItemV1[];
}

/**
 * A raw unknown input — used at the validation boundary before the payload
 * has been confirmed to match ReviewDecisionsV1.
 */
export type UnknownReviewDecisionsV1 = Record<string, unknown>;

// ─── WorkspaceManifest ────────────────────────────────────────────────────────

/** The only supported version string for WorkspaceManifest payloads. */
export const WORKSPACE_MANIFEST_VERSION = '1.0' as const;
export type WorkspaceManifestVersion = typeof WORKSPACE_MANIFEST_VERSION;

/**
 * A single entry in a WorkspaceManifest, pointing to one visit's workspace.
 */
export interface WorkspaceManifestEntryV1 {
  /** The visitReference that identifies this workspace. */
  visitReference: string;
  /** Relative path to the workspace.json file for this visit. */
  workspaceFile: string;
}

/**
 * WorkspaceManifest — optional helper for multi-visit or multi-session
 * storage roots.
 *
 * Saved at the root of a storage location that contains multiple visit
 * workspaces (e.g. `manifest.json` in a shared cloud-drive folder).
 * Allows Atlas Mind to enumerate known workspaces without scanning the
 * directory tree.
 *
 * This type is intentionally minimal to allow future extension (e.g.
 * revisions, multi-session visits).
 */
export interface WorkspaceManifest {
  /** Manifest version — always '1.0'. */
  version: WorkspaceManifestVersion;
  /** Entries for each visit workspace tracked by this manifest. */
  workspaces: WorkspaceManifestEntryV1[];
}
