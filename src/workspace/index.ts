/**
 * index.ts
 *
 * Public surface of the @atlas/contracts workspace module.
 *
 * Re-exports all workspace types and validators needed by consumers.
 */

// ─── VisitWorkspaceV1 types ───────────────────────────────────────────────────

export type {
  VisitWorkspaceV1Version,
  VisitWorkspaceFilesV1,
  VisitWorkspaceAssetsV1,
  VisitWorkspaceV1,
  UnknownVisitWorkspaceV1,
} from './visitWorkspaceV1.types';

export { VISIT_WORKSPACE_V1_VERSION } from './visitWorkspaceV1.types';

// ─── ReviewDecisionsV1 types ──────────────────────────────────────────────────

export type {
  ReviewItemKindV1,
  ReviewStatusV1,
  ReviewDecisionItemV1,
  ReviewDecisionsV1,
  UnknownReviewDecisionsV1,
} from './visitWorkspaceV1.types';

// ─── WorkspaceManifest types ──────────────────────────────────────────────────

export type {
  WorkspaceManifestVersion,
  WorkspaceManifestEntryV1,
  WorkspaceManifest,
} from './visitWorkspaceV1.types';

export { WORKSPACE_MANIFEST_VERSION } from './visitWorkspaceV1.types';

// ─── Validators ───────────────────────────────────────────────────────────────

export { validateVisitWorkspaceV1 } from './visitWorkspaceV1.schema';
export type {
  VisitWorkspaceV1ValidationResult,
  VisitWorkspaceV1ValidationSuccess,
  VisitWorkspaceV1ValidationFailure,
} from './visitWorkspaceV1.schema';

export { validateReviewDecisionsV1 } from './visitWorkspaceV1.schema';
export type {
  ReviewDecisionsV1ValidationResult,
  ReviewDecisionsV1ValidationSuccess,
  ReviewDecisionsV1ValidationFailure,
} from './visitWorkspaceV1.schema';
