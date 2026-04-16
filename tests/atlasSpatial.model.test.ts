/**
 * atlasSpatial.model.test.ts
 *
 * Tests for AtlasSpatialModelV1 validation.
 *
 * Coverage:
 *   1. Valid minimal model accepted
 *   2. Wrong schemaVersion rejected
 *   3. Missing modelId rejected
 *   4. Missing propertyId rejected
 *   5. Missing coordinateSystem rejected
 *   6. Non-positive revision rejected
 *   7. Missing timestamps rejected
 *   8. Non-array entity fields rejected
 *   9. Invalid entity item (missing id) rejected
 *  10. TypeScript narrowing after ok: true
 */

import { describe, it, expect } from 'vitest';
import { validateAtlasSpatialModel } from '../src/atlasSpatial/atlasSpatialModel.schema';
import type { AtlasSpatialModelV1 } from '../src/atlasSpatial/atlasSpatialModel.types';

// ─── Fixture builder ──────────────────────────────────────────────────────────

function buildMinimalModel(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
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

// ─── 1. Valid minimal model ───────────────────────────────────────────────────

describe('validateAtlasSpatialModel — valid minimal model', () => {
  it('returns ok: true', () => {
    const result = validateAtlasSpatialModel(buildMinimalModel());
    expect(result.ok).toBe(true);
  });

  it('returns the correct modelId', () => {
    const result = validateAtlasSpatialModel(buildMinimalModel());
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.model.modelId).toBe('model-001');
  });

  it('returns revision 1', () => {
    const result = validateAtlasSpatialModel(buildMinimalModel());
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.model.revision).toBe(1);
  });
});

// ─── 2. Wrong schemaVersion ───────────────────────────────────────────────────

describe('validateAtlasSpatialModel — wrong schemaVersion', () => {
  it('returns ok: false', () => {
    const result = validateAtlasSpatialModel(buildMinimalModel({ schemaVersion: 'atlas.spatial.v2' }));
    expect(result.ok).toBe(false);
  });

  it('error mentions schemaVersion', () => {
    const result = validateAtlasSpatialModel(buildMinimalModel({ schemaVersion: 'wrong' }));
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/schemaVersion/);
  });
});

// ─── 3. Missing modelId ───────────────────────────────────────────────────────

describe('validateAtlasSpatialModel — missing modelId', () => {
  it('returns ok: false with modelId error', () => {
    const { modelId: _, ...rest } = buildMinimalModel();
    const result = validateAtlasSpatialModel(rest);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/modelId/);
  });
});

// ─── 4. Missing propertyId ────────────────────────────────────────────────────

describe('validateAtlasSpatialModel — missing propertyId', () => {
  it('returns ok: false', () => {
    const { propertyId: _, ...rest } = buildMinimalModel();
    const result = validateAtlasSpatialModel(rest);
    expect(result.ok).toBe(false);
  });
});

// ─── 5. Missing coordinateSystem ─────────────────────────────────────────────

describe('validateAtlasSpatialModel — missing coordinateSystem', () => {
  it('returns ok: false', () => {
    const result = validateAtlasSpatialModel(buildMinimalModel({ coordinateSystem: null }));
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/coordinateSystem/);
  });
});

// ─── 6. Non-positive revision ─────────────────────────────────────────────────

describe('validateAtlasSpatialModel — non-positive revision', () => {
  it('rejects revision 0', () => {
    const result = validateAtlasSpatialModel(buildMinimalModel({ revision: 0 }));
    expect(result.ok).toBe(false);
  });

  it('rejects negative revision', () => {
    const result = validateAtlasSpatialModel(buildMinimalModel({ revision: -1 }));
    expect(result.ok).toBe(false);
  });

  it('rejects non-integer revision', () => {
    const result = validateAtlasSpatialModel(buildMinimalModel({ revision: 1.5 }));
    expect(result.ok).toBe(false);
  });
});

// ─── 7. Missing timestamps ────────────────────────────────────────────────────

describe('validateAtlasSpatialModel — missing timestamps', () => {
  it('rejects missing createdAt', () => {
    const { createdAt: _, ...rest } = buildMinimalModel();
    const result = validateAtlasSpatialModel(rest);
    expect(result.ok).toBe(false);
  });

  it('rejects missing updatedAt', () => {
    const { updatedAt: _, ...rest } = buildMinimalModel();
    const result = validateAtlasSpatialModel(rest);
    expect(result.ok).toBe(false);
  });
});

// ─── 8. Non-array entity fields ───────────────────────────────────────────────

describe('validateAtlasSpatialModel — non-array entity fields', () => {
  it('rejects non-array rooms', () => {
    const result = validateAtlasSpatialModel(buildMinimalModel({ rooms: 'not-an-array' }));
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/rooms/);
  });

  it('rejects non-array emitters', () => {
    const result = validateAtlasSpatialModel(buildMinimalModel({ emitters: {} }));
    expect(result.ok).toBe(false);
  });
});

// ─── 9. Invalid entity item ───────────────────────────────────────────────────

describe('validateAtlasSpatialModel — invalid entity items', () => {
  it('rejects room entity without id', () => {
    const result = validateAtlasSpatialModel(
      buildMinimalModel({ rooms: [{ kind: 'room', label: 'Kitchen' }] }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/rooms\[0\]\.id/);
  });

  it('rejects emitter entity without kind', () => {
    const result = validateAtlasSpatialModel(
      buildMinimalModel({ emitters: [{ id: 'em-001' }] }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/emitters\[0\]\.kind/);
  });
});

// ─── 10. TypeScript narrowing ─────────────────────────────────────────────────

describe('validateAtlasSpatialModel — TypeScript narrowing', () => {
  it('narrows to AtlasSpatialModelV1 after ok: true', () => {
    const result = validateAtlasSpatialModel(buildMinimalModel());
    if (!result.ok) throw new Error('Expected ok: true');
    const model: AtlasSpatialModelV1 = result.model;
    expect(model.schemaVersion).toBe('atlas.spatial.v1');
  });
});
