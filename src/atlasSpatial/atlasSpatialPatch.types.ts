/**
 * atlasSpatialPatch.types.ts
 *
 * AtlasSpatialPatchV1 — the unit of change applied to an AtlasSpatialModelV1.
 *
 * Design principles:
 *   - All edits to a spatial model flow through patches.
 *   - Patches are the append-only record of intent from Mind.
 *   - Operations are deliberately small and orthogonal.
 *   - `baseRevision` ensures optimistic-concurrency conflict detection.
 */

import type { AtlasGeometry } from './atlasGeometry.types';
import type { AtlasSpatialEntityV1 } from './atlasSpatialModel.types';

// ─── Patch operations ─────────────────────────────────────────────────────────

/**
 * Discriminated union of all operations that can appear in a patch.
 *
 * add_entity      — insert a new entity into the model
 * update_entity   — apply partial changes to an existing entity
 * remove_entity   — mark an entity as removed (soft-delete)
 * set_geometry    — replace the geometry of an existing entity
 * set_semantics   — update the semanticRole of an existing entity
 * attach_evidence — link an evidence marker ID to an entity
 * set_status      — change the status of an existing entity
 * set_certainty   — change the certainty of an existing entity
 */
export type AtlasSpatialOperationV1 =
  | {
      type: 'add_entity';
      /** The complete new entity to add. */
      entity: AtlasSpatialEntityV1;
    }
  | {
      type: 'update_entity';
      /** ID of the entity to update. */
      entityId: string;
      /** Partial field changes to apply (shallow merge). */
      changes: Record<string, unknown>;
    }
  | {
      type: 'remove_entity';
      /** ID of the entity to remove. */
      entityId: string;
    }
  | {
      type: 'set_geometry';
      /** ID of the entity whose geometry to replace. */
      entityId: string;
      /** The replacement geometry. */
      geometry: AtlasGeometry;
    }
  | {
      type: 'set_semantics';
      /** ID of the entity whose semantic role to update. */
      entityId: string;
      /** The new semantic role string. */
      semanticRole: string;
    }
  | {
      type: 'attach_evidence';
      /** ID of the entity to attach evidence to. */
      entityId: string;
      /** ID of the AtlasEvidenceMarkerV1 to attach. */
      evidenceMarkerId: string;
    }
  | {
      type: 'set_status';
      /** ID of the entity whose status to change. */
      entityId: string;
      /** The new status. */
      status: 'existing' | 'proposed' | 'removed';
    }
  | {
      type: 'set_certainty';
      /** ID of the entity whose certainty to change. */
      entityId: string;
      /** The new certainty level. */
      certainty: 'measured' | 'observed' | 'inferred' | 'assumed';
    };

// ─── AtlasSpatialPatchV1 ─────────────────────────────────────────────────────

/**
 * AtlasSpatialPatchV1 — a set of operations to be applied to a spatial model.
 *
 * `baseRevision` is the model revision this patch was authored against.
 * The patch applicator must reject the patch if the model's current revision
 * does not match `baseRevision` (optimistic concurrency control).
 *
 * `actor` identifies who or what authored this patch.
 */
export interface AtlasSpatialPatchV1 {
  /** Unique identifier for this patch (UUID string). */
  patchId: string;
  /** ID of the model this patch targets. */
  modelId: string;
  /** The model revision this patch was authored against. */
  baseRevision: number;
  /** ISO-8601 timestamp of when this patch was created. */
  createdAt: string;
  /** Who or what authored this patch. */
  actor: {
    type: 'user' | 'system';
    id?: string;
  };
  /** Ordered list of operations to apply. Applied sequentially. */
  operations: AtlasSpatialOperationV1[];
}
