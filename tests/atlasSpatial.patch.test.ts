/**
 * atlasSpatial.patch.test.ts
 *
 * Tests for AtlasSpatialPatchV1 validation and applyAtlasSpatialPatch.
 *
 * Coverage:
 *   1. Valid patch accepted by validator
 *   2. Missing patchId rejected
 *   3. Missing modelId rejected
 *   4. Non-positive baseRevision rejected
 *   5. Invalid actor.type rejected
 *   6. Non-array operations rejected
 *   7. Operation with unknown type rejected
 *   8. add_entity operation with missing entity.id rejected
 *   9. update/remove/set operations with missing entityId rejected
 *  10. applyAtlasSpatialPatch — applies add_entity
 *  11. applyAtlasSpatialPatch — applies update_entity
 *  12. applyAtlasSpatialPatch — applies remove_entity (soft delete)
 *  13. applyAtlasSpatialPatch — applies set_geometry
 *  14. applyAtlasSpatialPatch — applies set_status
 *  15. applyAtlasSpatialPatch — applies set_certainty
 *  16. applyAtlasSpatialPatch — applies attach_evidence (idempotent)
 *  17. applyAtlasSpatialPatch — rejects mismatched modelId
 *  18. applyAtlasSpatialPatch — rejects wrong baseRevision
 *  19. applyAtlasSpatialPatch — increments revision on success
 *  20. applyAtlasSpatialPatch — appends provenance entry
 */

import { describe, it, expect } from 'vitest';
import { validateAtlasSpatialPatch } from '../src/atlasSpatial/atlasSpatialPatch.schema';
import { applyAtlasSpatialPatch } from '../src/atlasSpatial/applyAtlasSpatialPatch';
import type { AtlasSpatialPatchV1 } from '../src/atlasSpatial/atlasSpatialPatch.types';
import type { AtlasSpatialModelV1 } from '../src/atlasSpatial/atlasSpatialModel.types';

// ─── Fixture builders ─────────────────────────────────────────────────────────

function buildMinimalModel(overrides: Partial<AtlasSpatialModelV1> = {}): AtlasSpatialModelV1 {
  return {
    schemaVersion: 'atlas.spatial.v1',
    modelId: 'model-001',
    propertyId: 'property-001',
    coordinateSystem: { kind: 'metric_m_yup' },
    levels: [],
    rooms: [],
    boundaries: [],
    openings: [],
    thermalZones: [],
    emitters: [],
    heatSources: [],
    hotWaterStores: [],
    pipeRuns: [],
    controls: [],
    assets: [],
    evidenceMarkers: [],
    provenance: [],
    revision: 1,
    createdAt: '2025-06-01T09:00:00Z',
    updatedAt: '2025-06-01T09:00:00Z',
    ...overrides,
  };
}

function buildMinimalPatch(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    patchId: 'patch-001',
    modelId: 'model-001',
    baseRevision: 1,
    createdAt: '2025-06-01T10:00:00Z',
    actor: { type: 'user', id: 'user-001' },
    operations: [],
    ...overrides,
  };
}

const APPLIED_AT = '2025-06-01T10:05:00Z';

const ROOM_ENTITY = {
  id: 'room-001',
  kind: 'room' as const,
  label: 'Kitchen',
  geometry: {
    kind: 'room_footprint' as const,
    floorPolygon: {
      kind: 'polygon2d' as const,
      points: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 3 }, { x: 0, y: 3 }],
    },
    ceilingHeightM: 2.4,
  },
  semanticRole: 'kitchen',
  status: 'existing' as const,
  certainty: 'measured' as const,
  evidenceIds: [],
  levelId: 'level-ground',
  createdAt: '2025-06-01T09:00:00Z',
  updatedAt: '2025-06-01T09:00:00Z',
};

// ─── 1. Valid patch accepted ──────────────────────────────────────────────────

describe('validateAtlasSpatialPatch — valid patch', () => {
  it('returns ok: true', () => {
    const result = validateAtlasSpatialPatch(buildMinimalPatch());
    expect(result.ok).toBe(true);
  });

  it('returns the patch with correct patchId', () => {
    const result = validateAtlasSpatialPatch(buildMinimalPatch());
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.patch.patchId).toBe('patch-001');
  });
});

// ─── 2–9. Validation rejections ───────────────────────────────────────────────

describe('validateAtlasSpatialPatch — field validation', () => {
  it('rejects missing patchId', () => {
    const { patchId: _, ...rest } = buildMinimalPatch();
    const result = validateAtlasSpatialPatch(rest);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/patchId/);
  });

  it('rejects missing modelId', () => {
    const { modelId: _, ...rest } = buildMinimalPatch();
    const result = validateAtlasSpatialPatch(rest);
    expect(result.ok).toBe(false);
  });

  it('rejects baseRevision of 0', () => {
    const result = validateAtlasSpatialPatch(buildMinimalPatch({ baseRevision: 0 }));
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/baseRevision/);
  });

  it('rejects invalid actor.type', () => {
    const result = validateAtlasSpatialPatch(
      buildMinimalPatch({ actor: { type: 'robot', id: 'r1' } }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/actor\.type/);
  });

  it('rejects non-array operations', () => {
    const result = validateAtlasSpatialPatch(buildMinimalPatch({ operations: 'nope' }));
    expect(result.ok).toBe(false);
  });

  it('rejects operation with unknown type', () => {
    const result = validateAtlasSpatialPatch(
      buildMinimalPatch({ operations: [{ type: 'fly_away', entityId: 'x' }] }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/type/);
  });

  it('rejects add_entity without entity.id', () => {
    const result = validateAtlasSpatialPatch(
      buildMinimalPatch({ operations: [{ type: 'add_entity', entity: { kind: 'room' } }] }),
    );
    expect(result.ok).toBe(false);
  });

  it('rejects update_entity without entityId', () => {
    const result = validateAtlasSpatialPatch(
      buildMinimalPatch({ operations: [{ type: 'update_entity', changes: { label: 'x' } }] }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/entityId/);
  });
});

// ─── 10–20. applyAtlasSpatialPatch ───────────────────────────────────────────

describe('applyAtlasSpatialPatch', () => {
  it('adds a room entity', () => {
    const model = buildMinimalModel();
    const patch: AtlasSpatialPatchV1 = {
      patchId: 'patch-001',
      modelId: 'model-001',
      baseRevision: 1,
      createdAt: '2025-06-01T10:00:00Z',
      actor: { type: 'user', id: 'user-001' },
      operations: [{ type: 'add_entity', entity: ROOM_ENTITY }],
    };
    const result = applyAtlasSpatialPatch(model, patch, APPLIED_AT);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.model.rooms).toHaveLength(1);
    expect(result.model.rooms[0]?.id).toBe('room-001');
  });

  it('updates an existing entity label', () => {
    const model = buildMinimalModel({ rooms: [ROOM_ENTITY] });
    const patch: AtlasSpatialPatchV1 = {
      patchId: 'patch-002',
      modelId: 'model-001',
      baseRevision: 1,
      createdAt: '2025-06-01T10:00:00Z',
      actor: { type: 'user' },
      operations: [{ type: 'update_entity', entityId: 'room-001', changes: { label: 'New Kitchen' } }],
    };
    const result = applyAtlasSpatialPatch(model, patch, APPLIED_AT);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.model.rooms[0]?.label).toBe('New Kitchen');
  });

  it('soft-deletes an entity via remove_entity', () => {
    const model = buildMinimalModel({ rooms: [ROOM_ENTITY] });
    const patch: AtlasSpatialPatchV1 = {
      patchId: 'patch-003',
      modelId: 'model-001',
      baseRevision: 1,
      createdAt: '2025-06-01T10:00:00Z',
      actor: { type: 'user' },
      operations: [{ type: 'remove_entity', entityId: 'room-001' }],
    };
    const result = applyAtlasSpatialPatch(model, patch, APPLIED_AT);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected ok: true');
    // Entity still present but with status 'removed'
    expect(result.model.rooms).toHaveLength(1);
    expect(result.model.rooms[0]?.status).toBe('removed');
  });

  it('replaces geometry via set_geometry', () => {
    const model = buildMinimalModel({ rooms: [ROOM_ENTITY] });
    const newGeometry = {
      kind: 'polygon2d' as const,
      points: [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 5 }, { x: 0, y: 5 }],
    };
    const patch: AtlasSpatialPatchV1 = {
      patchId: 'patch-004',
      modelId: 'model-001',
      baseRevision: 1,
      createdAt: '2025-06-01T10:00:00Z',
      actor: { type: 'user' },
      operations: [{ type: 'set_geometry', entityId: 'room-001', geometry: newGeometry }],
    };
    const result = applyAtlasSpatialPatch(model, patch, APPLIED_AT);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.model.rooms[0]?.geometry).toEqual(newGeometry);
  });

  it('changes status via set_status', () => {
    const model = buildMinimalModel({ rooms: [ROOM_ENTITY] });
    const patch: AtlasSpatialPatchV1 = {
      patchId: 'patch-005',
      modelId: 'model-001',
      baseRevision: 1,
      createdAt: '2025-06-01T10:00:00Z',
      actor: { type: 'system', id: 'engine' },
      operations: [{ type: 'set_status', entityId: 'room-001', status: 'proposed' }],
    };
    const result = applyAtlasSpatialPatch(model, patch, APPLIED_AT);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.model.rooms[0]?.status).toBe('proposed');
  });

  it('changes certainty via set_certainty', () => {
    const model = buildMinimalModel({ rooms: [ROOM_ENTITY] });
    const patch: AtlasSpatialPatchV1 = {
      patchId: 'patch-006',
      modelId: 'model-001',
      baseRevision: 1,
      createdAt: '2025-06-01T10:00:00Z',
      actor: { type: 'user' },
      operations: [{ type: 'set_certainty', entityId: 'room-001', certainty: 'inferred' }],
    };
    const result = applyAtlasSpatialPatch(model, patch, APPLIED_AT);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.model.rooms[0]?.certainty).toBe('inferred');
  });

  it('attaches evidence (idempotent)', () => {
    const model = buildMinimalModel({ rooms: [ROOM_ENTITY] });
    const patchOnce: AtlasSpatialPatchV1 = {
      patchId: 'patch-007',
      modelId: 'model-001',
      baseRevision: 1,
      createdAt: '2025-06-01T10:00:00Z',
      actor: { type: 'user' },
      operations: [{ type: 'attach_evidence', entityId: 'room-001', evidenceMarkerId: 'ev-001' }],
    };
    const first = applyAtlasSpatialPatch(model, patchOnce, APPLIED_AT);
    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error('Expected ok: true');
    expect(first.model.rooms[0]?.evidenceIds).toEqual(['ev-001']);

    // Apply same evidence again (different patch, same marker) — should be idempotent
    const patchAgain: AtlasSpatialPatchV1 = {
      patchId: 'patch-008',
      modelId: 'model-001',
      baseRevision: 2,
      createdAt: '2025-06-01T10:01:00Z',
      actor: { type: 'user' },
      operations: [{ type: 'attach_evidence', entityId: 'room-001', evidenceMarkerId: 'ev-001' }],
    };
    const second = applyAtlasSpatialPatch(first.model, patchAgain, APPLIED_AT);
    expect(second.ok).toBe(true);
    if (!second.ok) throw new Error('Expected ok: true');
    expect(second.model.rooms[0]?.evidenceIds).toEqual(['ev-001']); // still only one
  });

  it('rejects patch with wrong modelId', () => {
    const model = buildMinimalModel();
    const patch: AtlasSpatialPatchV1 = {
      patchId: 'patch-x',
      modelId: 'wrong-model',
      baseRevision: 1,
      createdAt: '2025-06-01T10:00:00Z',
      actor: { type: 'user' },
      operations: [],
    };
    const result = applyAtlasSpatialPatch(model, patch);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/modelId/);
  });

  it('rejects patch with wrong baseRevision', () => {
    const model = buildMinimalModel({ revision: 3 });
    const patch: AtlasSpatialPatchV1 = {
      patchId: 'patch-x',
      modelId: 'model-001',
      baseRevision: 1,
      createdAt: '2025-06-01T10:00:00Z',
      actor: { type: 'user' },
      operations: [],
    };
    const result = applyAtlasSpatialPatch(model, patch);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/baseRevision/);
  });

  it('increments revision on success', () => {
    const model = buildMinimalModel({ revision: 5 });
    const patch: AtlasSpatialPatchV1 = {
      patchId: 'patch-rev',
      modelId: 'model-001',
      baseRevision: 5,
      createdAt: '2025-06-01T10:00:00Z',
      actor: { type: 'system' },
      operations: [],
    };
    const result = applyAtlasSpatialPatch(model, patch, APPLIED_AT);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.model.revision).toBe(6);
  });

  it('appends a provenance entry on success', () => {
    const model = buildMinimalModel();
    const patch: AtlasSpatialPatchV1 = {
      patchId: 'patch-prov',
      modelId: 'model-001',
      baseRevision: 1,
      createdAt: '2025-06-01T10:00:00Z',
      actor: { type: 'user', id: 'user-001' },
      operations: [],
    };
    const result = applyAtlasSpatialPatch(model, patch, APPLIED_AT);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.model.provenance).toHaveLength(1);
    expect(result.model.provenance[0]?.eventKind).toBe('patch_applied');
    expect(result.model.provenance[0]?.patchId).toBe('patch-prov');
  });
});
