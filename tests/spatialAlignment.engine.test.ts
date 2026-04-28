/**
 * spatialAlignment.engine.test.ts
 *
 * Tests for the SpatialAlignmentEngine functions.
 *
 * Coverage:
 *   getRelativePosition
 *     1. Zero distance when user and target coincide
 *     2. Correct horizontal distance
 *     3. Correct bearing (north, east, south-west)
 *     4. Positive vertical offset when target is above
 *     5. Negative vertical offset when target is below
 *
 *   projectToViewPlane
 *     6. Point directly ahead maps to screen centre
 *     7. Point behind camera returns visible: false
 *     8. Depth equals distance along forward axis
 *
 *   buildAlignmentInsights
 *     9. Returns empty array when model has no anchors
 *    10. Returns empty array when model has no vertical relations
 *    11. Returns one insight per valid vertical relation
 *    12. Skips relations with missing anchor IDs (no ghost data)
 *    13. Confidence propagates to 'inferred' when any anchor is inferred
 *    14. HorizontalOffsetM computed correctly
 *
 *   computeInferredRouteLength
 *    15. Returns 0 for empty path
 *    16. Returns 0 for single-point path
 *    17. Returns correct length for a two-point path
 *    18. Returns correct length for a multi-segment 3-D path
 */

import { describe, it, expect } from 'vitest';
import {
  getRelativePosition,
  projectToViewPlane,
  buildAlignmentInsights,
  computeInferredRouteLength,
} from '../src/features/spatialAlignment/spatialAlignment.engine';
import type { AtlasWorldPosition, AtlasAnchor, AtlasInferredRoute } from '../src/atlasSpatial/atlasSpatialAlignment.types';
import type { AtlasSpatialModelV1 } from '../src/atlasSpatial/atlasSpatialModel.types';
import type { CameraPose } from '../src/features/spatialAlignment/spatialAlignment.engine';

// ─── Fixture helpers ──────────────────────────────────────────────────────────

function makePos(
  x: number,
  y: number,
  z: number,
  confidence: 'confirmed' | 'inferred' = 'confirmed',
): AtlasWorldPosition {
  return { x, y, z, confidence, source: 'manual' };
}

function makeAnchor(
  id: string,
  label: string,
  pos: AtlasWorldPosition,
  roomId?: string,
): AtlasAnchor {
  return { id, label, worldPosition: pos, roomId };
}

function makeMinimalModel(
  overrides: Partial<AtlasSpatialModelV1> = {},
): AtlasSpatialModelV1 {
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

function makeCamera(overrides: Partial<CameraPose> = {}): CameraPose {
  return {
    position: makePos(0, 0, 0),
    forwardVector: { x: 0, y: 1, z: 0 }, // looking along +Y
    upVector: { x: 0, y: 0, z: 1 },      // up = +Z
    fovDeg: 90,
    viewportWidth: 1920,
    viewportHeight: 1080,
    ...overrides,
  };
}

// ─── 1–5: getRelativePosition ─────────────────────────────────────────────────

describe('getRelativePosition — coincident positions', () => {
  it('returns distanceM = 0', () => {
    const pos = makePos(1, 2, 3);
    const anchor = makeAnchor('a1', 'Boiler', pos);
    const result = getRelativePosition(pos, anchor);
    expect(result.distanceM).toBeCloseTo(0);
  });

  it('returns verticalOffsetM = 0', () => {
    const pos = makePos(1, 2, 3);
    const anchor = makeAnchor('a1', 'Boiler', pos);
    const result = getRelativePosition(pos, anchor);
    expect(result.verticalOffsetM).toBeCloseTo(0);
  });
});

describe('getRelativePosition — horizontal distance', () => {
  it('returns correct distance for a 3-4-5 triangle', () => {
    const user = makePos(0, 0, 0);
    const anchor = makeAnchor('a2', 'Boiler', makePos(3, 4, 0));
    const result = getRelativePosition(user, anchor);
    expect(result.distanceM).toBeCloseTo(5);
  });

  it('ignores z-difference in distanceM', () => {
    const user = makePos(0, 0, 0);
    const anchor = makeAnchor('a3', 'Cylinder', makePos(0, 4, 100));
    const result = getRelativePosition(user, anchor);
    expect(result.distanceM).toBeCloseTo(4);
  });
});

describe('getRelativePosition — bearing', () => {
  it('returns 0° when target is directly north (+Y)', () => {
    const user = makePos(0, 0, 0);
    const anchor = makeAnchor('a4', 'Boiler', makePos(0, 5, 0));
    const result = getRelativePosition(user, anchor);
    expect(result.bearingDeg).toBeCloseTo(0);
  });

  it('returns 90° when target is directly east (+X)', () => {
    const user = makePos(0, 0, 0);
    const anchor = makeAnchor('a5', 'Boiler', makePos(5, 0, 0));
    const result = getRelativePosition(user, anchor);
    expect(result.bearingDeg).toBeCloseTo(90);
  });

  it('returns 180° when target is directly south (-Y)', () => {
    const user = makePos(0, 0, 0);
    const anchor = makeAnchor('a6', 'Boiler', makePos(0, -5, 0));
    const result = getRelativePosition(user, anchor);
    expect(result.bearingDeg).toBeCloseTo(180);
  });

  it('returns a value in [0, 360) for south-west target', () => {
    const user = makePos(0, 0, 0);
    const anchor = makeAnchor('a7', 'Boiler', makePos(-3, -3, 0));
    const result = getRelativePosition(user, anchor);
    expect(result.bearingDeg).toBeGreaterThanOrEqual(0);
    expect(result.bearingDeg).toBeLessThan(360);
    expect(result.bearingDeg).toBeCloseTo(225);
  });
});

describe('getRelativePosition — vertical offset', () => {
  it('returns positive verticalOffsetM when target is above', () => {
    const user = makePos(0, 0, 0);
    const anchor = makeAnchor('a8', 'Cylinder', makePos(0, 0, 2.3));
    const result = getRelativePosition(user, anchor);
    expect(result.verticalOffsetM).toBeCloseTo(2.3);
  });

  it('returns negative verticalOffsetM when target is below', () => {
    const user = makePos(0, 0, 3);
    const anchor = makeAnchor('a9', 'Boiler', makePos(0, 0, 0));
    const result = getRelativePosition(user, anchor);
    expect(result.verticalOffsetM).toBeCloseTo(-3);
  });
});

// ─── 6–8: projectToViewPlane ──────────────────────────────────────────────────

describe('projectToViewPlane — point ahead', () => {
  it('maps a point directly on the forward axis to screen centre', () => {
    const camera = makeCamera();
    const worldPos = makePos(0, 10, 0); // 10 m along +Y (forward)
    const result = projectToViewPlane(camera, worldPos);
    expect(result.visible).toBe(true);
    expect(result.x).toBeCloseTo(0.5);
    expect(result.y).toBeCloseTo(0.5);
  });

  it('depth equals the distance along the forward axis', () => {
    const camera = makeCamera();
    const worldPos = makePos(0, 7, 0);
    const result = projectToViewPlane(camera, worldPos);
    expect(result.depth).toBeCloseTo(7);
  });
});

describe('projectToViewPlane — point behind camera', () => {
  it('returns visible: false', () => {
    const camera = makeCamera();
    const worldPos = makePos(0, -5, 0); // behind the camera
    const result = projectToViewPlane(camera, worldPos);
    expect(result.visible).toBe(false);
  });
});

// ─── 9–14: buildAlignmentInsights ────────────────────────────────────────────

describe('buildAlignmentInsights — empty model', () => {
  it('returns empty array when no anchors', () => {
    const model = makeMinimalModel();
    expect(buildAlignmentInsights(model)).toHaveLength(0);
  });

  it('returns empty array when anchors present but no vertical relations', () => {
    const model = makeMinimalModel({
      anchors: [makeAnchor('a1', 'Boiler', makePos(0, 0, 0))],
    });
    expect(buildAlignmentInsights(model)).toHaveLength(0);
  });
});

describe('buildAlignmentInsights — valid relations', () => {
  const boiler = makeAnchor('a-boiler', 'Boiler', makePos(0, 0, 0));
  const cylinder = makeAnchor('a-cylinder', 'Cylinder', makePos(1, 0, 2.3));

  const model = makeMinimalModel({
    anchors: [boiler, cylinder],
    verticalRelations: [
      {
        fromAnchorId: 'a-cylinder',
        toAnchorId: 'a-boiler',
        verticalDistanceM: 2.3,
        relation: 'above',
      },
    ],
  });

  it('returns one insight for one relation', () => {
    expect(buildAlignmentInsights(model)).toHaveLength(1);
  });

  it('insight has correct label and referenceAnchorLabel', () => {
    const insights = buildAlignmentInsights(model);
    expect(insights[0].label).toBe('Cylinder');
    expect(insights[0].referenceAnchorLabel).toBe('Boiler');
  });

  it('insight has correct verticalDistanceM', () => {
    const insights = buildAlignmentInsights(model);
    expect(insights[0].verticalDistanceM).toBeCloseTo(2.3);
  });

  it('insight has correct horizontalOffsetM', () => {
    const insights = buildAlignmentInsights(model);
    expect(insights[0].horizontalOffsetM).toBeCloseTo(1);
  });

  it('insight has relation "above"', () => {
    const insights = buildAlignmentInsights(model);
    expect(insights[0].relation).toBe('above');
  });

  it('insight confidence is "confirmed" when both anchors are confirmed', () => {
    const insights = buildAlignmentInsights(model);
    expect(insights[0].confidence).toBe('confirmed');
  });
});

describe('buildAlignmentInsights — ghost data safety', () => {
  it('skips a relation when fromAnchorId does not exist', () => {
    const boiler = makeAnchor('a-boiler', 'Boiler', makePos(0, 0, 0));
    const model = makeMinimalModel({
      anchors: [boiler],
      verticalRelations: [
        {
          fromAnchorId: 'missing-anchor',
          toAnchorId: 'a-boiler',
          verticalDistanceM: 1,
          relation: 'above',
        },
      ],
    });
    expect(buildAlignmentInsights(model)).toHaveLength(0);
  });

  it('downgrades confidence to "inferred" when any anchor position is inferred', () => {
    const boiler = makeAnchor('a-boiler', 'Boiler', makePos(0, 0, 0, 'confirmed'));
    const cylinder = makeAnchor('a-cylinder', 'Cylinder', makePos(0, 0, 2, 'inferred'));
    const model = makeMinimalModel({
      anchors: [boiler, cylinder],
      verticalRelations: [
        {
          fromAnchorId: 'a-cylinder',
          toAnchorId: 'a-boiler',
          verticalDistanceM: 2,
          relation: 'above',
        },
      ],
    });
    const insights = buildAlignmentInsights(model);
    expect(insights[0].confidence).toBe('inferred');
  });
});

// ─── 15–18: computeInferredRouteLength ───────────────────────────────────────

function makeRoute(path: AtlasWorldPosition[]): AtlasInferredRoute {
  return {
    id: 'route-001',
    type: 'pipe',
    path,
    confidence: 'inferred',
    reason: 'test route',
  };
}

describe('computeInferredRouteLength — edge cases', () => {
  it('returns 0 for an empty path', () => {
    expect(computeInferredRouteLength(makeRoute([]))).toBe(0);
  });

  it('returns 0 for a single-point path', () => {
    expect(computeInferredRouteLength(makeRoute([makePos(0, 0, 0)]))).toBe(0);
  });
});

describe('computeInferredRouteLength — length calculations', () => {
  it('returns correct length for a horizontal two-point path', () => {
    const path = [makePos(0, 0, 0), makePos(3, 4, 0)];
    expect(computeInferredRouteLength(makeRoute(path))).toBeCloseTo(5);
  });

  it('returns correct length for a vertical two-point path', () => {
    const path = [makePos(0, 0, 0), makePos(0, 0, 2.3)];
    expect(computeInferredRouteLength(makeRoute(path))).toBeCloseTo(2.3);
  });

  it('returns summed length for a multi-segment 3-D path', () => {
    // Segment 1: (0,0,0) → (3,4,0) = 5 m
    // Segment 2: (3,4,0) → (3,4,2) = 2 m
    // Total: 7 m
    const path = [makePos(0, 0, 0), makePos(3, 4, 0), makePos(3, 4, 2)];
    expect(computeInferredRouteLength(makeRoute(path))).toBeCloseTo(7);
  });
});
