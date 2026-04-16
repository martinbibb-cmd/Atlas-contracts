/**
 * applyAtlasSpatialPatch.ts
 *
 * Applies an AtlasSpatialPatchV1 to an AtlasSpatialModelV1.
 *
 * Design principles:
 *   - Immutable: returns a new model; does not mutate the input.
 *   - Optimistic concurrency: rejects patches whose `baseRevision` does not
 *     match the model's current `revision`.
 *   - Appends a provenance entry for the patch.
 *   - Operations are applied sequentially in the order they appear.
 *   - `remove_entity` performs a soft-delete by setting `status: 'removed'`
 *     rather than physically deleting the entity.
 */

import type { AtlasSpatialModelV1, AtlasSpatialEntityV1 } from './atlasSpatialModel.types';
import type { AtlasSpatialPatchV1, AtlasSpatialOperationV1 } from './atlasSpatialPatch.types';
import type { AtlasProvenanceEntryV1 } from './atlasProvenance.types';
import type { AtlasGeometry } from './atlasGeometry.types';

// ─── Result types ─────────────────────────────────────────────────────────────

export interface PatchApplicationSuccess {
  ok: true;
  model: AtlasSpatialModelV1;
}

export interface PatchApplicationFailure {
  ok: false;
  error: string;
}

export type PatchApplicationResult = PatchApplicationSuccess | PatchApplicationFailure;

// ─── Entity registry helpers ──────────────────────────────────────────────────

type EntityArrayKey = keyof Pick<
  AtlasSpatialModelV1,
  | 'levels'
  | 'rooms'
  | 'boundaries'
  | 'openings'
  | 'thermalZones'
  | 'emitters'
  | 'heatSources'
  | 'hotWaterStores'
  | 'pipeRuns'
  | 'controls'
  | 'assets'
>;

const ENTITY_ARRAY_KEYS: EntityArrayKey[] = [
  'levels',
  'rooms',
  'boundaries',
  'openings',
  'thermalZones',
  'emitters',
  'heatSources',
  'hotWaterStores',
  'pipeRuns',
  'controls',
  'assets',
];

/**
 * Finds an entity by ID across all entity arrays in the model.
 * Returns `{ key, index }` or null if not found.
 */
function findEntity(
  model: AtlasSpatialModelV1,
  entityId: string,
): { key: EntityArrayKey; index: number } | null {
  for (const key of ENTITY_ARRAY_KEYS) {
    const arr = model[key] as AtlasSpatialEntityV1[];
    const index = arr.findIndex((e) => e.id === entityId);
    if (index !== -1) return { key, index };
  }
  return null;
}

/**
 * Returns the entity array key for a given entity kind.
 * Used when adding new entities.
 */
function arrayKeyForKind(kind: string): EntityArrayKey | null {
  switch (kind) {
    case 'level': return 'levels';
    case 'room': return 'rooms';
    case 'boundary': return 'boundaries';
    case 'opening': return 'openings';
    case 'thermal_zone': return 'thermalZones';
    case 'emitter': return 'emitters';
    case 'heat_source': return 'heatSources';
    case 'hot_water_store': return 'hotWaterStores';
    case 'pipe_run': return 'pipeRuns';
    case 'control': return 'controls';
    case 'asset': return 'assets';
    default: return null;
  }
}

// ─── Operation application ────────────────────────────────────────────────────

/**
 * Applies a single operation to a mutable working copy of the model.
 * Returns an error string on failure, or null on success.
 */
function applyOperation(
  model: AtlasSpatialModelV1,
  op: AtlasSpatialOperationV1,
  now: string,
): string | null {
  switch (op.type) {
    case 'add_entity': {
      const key = arrayKeyForKind(op.entity.kind);
      if (key === null) return `Unknown entity kind: ${op.entity.kind}`;
      const arr = model[key] as AtlasSpatialEntityV1[];
      if (arr.some((e) => e.id === op.entity.id)) {
        return `Entity ${op.entity.id} already exists`;
      }
      (model[key] as AtlasSpatialEntityV1[]) = [...arr, { ...op.entity, updatedAt: now }];
      return null;
    }

    case 'update_entity': {
      const loc = findEntity(model, op.entityId);
      if (!loc) return `Entity ${op.entityId} not found`;
      const arr = model[loc.key] as AtlasSpatialEntityV1[];
      const updated = { ...arr[loc.index], ...op.changes, updatedAt: now } as AtlasSpatialEntityV1;
      const newArr = [...arr];
      newArr[loc.index] = updated;
      (model[loc.key] as AtlasSpatialEntityV1[]) = newArr;
      return null;
    }

    case 'remove_entity': {
      const loc = findEntity(model, op.entityId);
      if (!loc) return `Entity ${op.entityId} not found`;
      const arr = model[loc.key] as AtlasSpatialEntityV1[];
      const updated = { ...arr[loc.index], status: 'removed' as const, updatedAt: now } as AtlasSpatialEntityV1;
      const newArr = [...arr];
      newArr[loc.index] = updated;
      (model[loc.key] as AtlasSpatialEntityV1[]) = newArr;
      return null;
    }

    case 'set_geometry': {
      const loc = findEntity(model, op.entityId);
      if (!loc) return `Entity ${op.entityId} not found`;
      const arr = model[loc.key] as AtlasSpatialEntityV1[];
      const updated = {
        ...arr[loc.index],
        geometry: op.geometry as AtlasGeometry,
        updatedAt: now,
      } as AtlasSpatialEntityV1;
      const newArr = [...arr];
      newArr[loc.index] = updated;
      (model[loc.key] as AtlasSpatialEntityV1[]) = newArr;
      return null;
    }

    case 'set_semantics': {
      const loc = findEntity(model, op.entityId);
      if (!loc) return `Entity ${op.entityId} not found`;
      const arr = model[loc.key] as AtlasSpatialEntityV1[];
      const updated = { ...arr[loc.index], semanticRole: op.semanticRole, updatedAt: now } as AtlasSpatialEntityV1;
      const newArr = [...arr];
      newArr[loc.index] = updated;
      (model[loc.key] as AtlasSpatialEntityV1[]) = newArr;
      return null;
    }

    case 'attach_evidence': {
      const loc = findEntity(model, op.entityId);
      if (!loc) return `Entity ${op.entityId} not found`;
      const arr = model[loc.key] as AtlasSpatialEntityV1[];
      const existing = arr[loc.index] as AtlasSpatialEntityV1;
      if (existing.evidenceIds.includes(op.evidenceMarkerId)) return null; // idempotent
      const updated = {
        ...existing,
        evidenceIds: [...existing.evidenceIds, op.evidenceMarkerId],
        updatedAt: now,
      } as AtlasSpatialEntityV1;
      const newArr = [...arr];
      newArr[loc.index] = updated;
      (model[loc.key] as AtlasSpatialEntityV1[]) = newArr;
      return null;
    }

    case 'set_status': {
      const loc = findEntity(model, op.entityId);
      if (!loc) return `Entity ${op.entityId} not found`;
      const arr = model[loc.key] as AtlasSpatialEntityV1[];
      const updated = { ...arr[loc.index], status: op.status, updatedAt: now } as AtlasSpatialEntityV1;
      const newArr = [...arr];
      newArr[loc.index] = updated;
      (model[loc.key] as AtlasSpatialEntityV1[]) = newArr;
      return null;
    }

    case 'set_certainty': {
      const loc = findEntity(model, op.entityId);
      if (!loc) return `Entity ${op.entityId} not found`;
      const arr = model[loc.key] as AtlasSpatialEntityV1[];
      const updated = { ...arr[loc.index], certainty: op.certainty, updatedAt: now } as AtlasSpatialEntityV1;
      const newArr = [...arr];
      newArr[loc.index] = updated;
      (model[loc.key] as AtlasSpatialEntityV1[]) = newArr;
      return null;
    }
  }
}

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Applies an AtlasSpatialPatchV1 to an AtlasSpatialModelV1.
 *
 * Returns a new model with the patch applied and revision incremented, or a
 * failure result if the patch cannot be applied.
 *
 * @param model  The current model (not mutated).
 * @param patch  The patch to apply.
 * @param now    Optional ISO-8601 timestamp for `updatedAt`; defaults to the
 *               current time.
 */
export function applyAtlasSpatialPatch(
  model: AtlasSpatialModelV1,
  patch: AtlasSpatialPatchV1,
  now?: string,
): PatchApplicationResult {
  if (patch.modelId !== model.modelId) {
    return {
      ok: false,
      error: `Patch modelId ${patch.modelId} does not match model modelId ${model.modelId}`,
    };
  }

  if (patch.baseRevision !== model.revision) {
    return {
      ok: false,
      error: `Patch baseRevision ${patch.baseRevision} does not match model revision ${model.revision}`,
    };
  }

  const appliedAt = now ?? new Date().toISOString();

  // Work on a shallow copy to preserve immutability at the top level
  let working: AtlasSpatialModelV1 = { ...model };

  for (const op of patch.operations) {
    const error = applyOperation(working, op, appliedAt);
    if (error) return { ok: false, error };
  }

  const provenanceEntry: AtlasProvenanceEntryV1 = {
    id: `prov-patch-${patch.patchId}`,
    eventKind: 'patch_applied',
    actor: patch.actor,
    occurredAt: appliedAt,
    patchId: patch.patchId,
    description: `Applied patch ${patch.patchId} with ${patch.operations.length} operation(s)`,
  };

  working = {
    ...working,
    revision: model.revision + 1,
    updatedAt: appliedAt,
    provenance: [...working.provenance, provenanceEntry],
  };

  return { ok: true, model: working };
}
