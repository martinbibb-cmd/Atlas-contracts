/**
 * install-markup.test.ts
 *
 * Type-level and structural tests for the install markup models.
 *
 * Coverage:
 *   1. InstallObjectModelV1 — required fields round-trip correctly
 *   2. InstallObjectModelV1 — optional fields accepted when present
 *   3. InstallObjectModelV1 — optional fields absent when omitted
 *   4. InstallRouteModelV1  — required fields round-trip correctly
 *   5. InstallRouteModelV1  — path waypoints preserved
 *   6. InstallLayerModelV1  — empty layer is valid
 *   7. InstallLayerModelV1  — existing / proposed / notes populated correctly
 *   8. InstallAnnotation    — position is optional
 */

import { describe, it, expect } from 'vitest';
import type {
  InstallObjectModelV1,
  InstallRouteModelV1,
  InstallLayerModelV1,
  InstallAnnotation,
} from '../../src/scan/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeObject(overrides: Partial<InstallObjectModelV1> = {}): InstallObjectModelV1 {
  return {
    id: 'obj-001',
    type: 'boiler',
    position: { x: 1.0, y: 2.0, z: 0.5 },
    source: 'manual',
    ...overrides,
  };
}

function makeRoute(overrides: Partial<InstallRouteModelV1> = {}): InstallRouteModelV1 {
  return {
    id: 'route-001',
    kind: 'flow',
    diameterMm: 22,
    path: [
      { position: { x: 0.0, y: 0.0, z: 0.0 } },
      { position: { x: 1.0, y: 0.0, z: 0.0 } },
    ],
    mounting: 'surface',
    confidence: 'drawn',
    ...overrides,
  };
}

// ─── 1. InstallObjectModelV1 — required fields ────────────────────────────────

describe('InstallObjectModelV1 — required fields', () => {
  it('preserves id', () => {
    const obj = makeObject({ id: 'test-id' });
    expect(obj.id).toBe('test-id');
  });

  it('preserves type', () => {
    const obj = makeObject({ type: 'cylinder' });
    expect(obj.type).toBe('cylinder');
  });

  it('preserves position coordinates', () => {
    const obj = makeObject({ position: { x: 3.5, y: 1.2, z: 0.8 } });
    expect(obj.position.x).toBe(3.5);
    expect(obj.position.y).toBe(1.2);
    expect(obj.position.z).toBe(0.8);
  });

  it('preserves source', () => {
    const obj = makeObject({ source: 'scan' });
    expect(obj.source).toBe('scan');
  });
});

// ─── 2. InstallObjectModelV1 — optional fields present ───────────────────────

describe('InstallObjectModelV1 — optional fields present', () => {
  it('preserves dimensions when provided', () => {
    const obj = makeObject({ dimensions: { widthM: 0.6, heightM: 0.9, depthM: 0.4 } });
    expect(obj.dimensions?.widthM).toBe(0.6);
    expect(obj.dimensions?.heightM).toBe(0.9);
    expect(obj.dimensions?.depthM).toBe(0.4);
  });

  it('preserves orientation yawDeg when provided', () => {
    const obj = makeObject({ orientation: { yawDeg: 90 } });
    expect(obj.orientation?.yawDeg).toBe(90);
  });
});

// ─── 3. InstallObjectModelV1 — optional fields absent ────────────────────────

describe('InstallObjectModelV1 — optional fields absent', () => {
  it('dimensions is undefined when not provided', () => {
    const obj = makeObject();
    expect(obj.dimensions).toBeUndefined();
  });

  it('orientation is undefined when not provided', () => {
    const obj = makeObject();
    expect(obj.orientation).toBeUndefined();
  });
});

// ─── 4. InstallRouteModelV1 — required fields ─────────────────────────────────

describe('InstallRouteModelV1 — required fields', () => {
  it('preserves id', () => {
    const route = makeRoute({ id: 'r-42' });
    expect(route.id).toBe('r-42');
  });

  it('preserves kind', () => {
    const route = makeRoute({ kind: 'gas' });
    expect(route.kind).toBe('gas');
  });

  it('preserves diameterMm', () => {
    const route = makeRoute({ diameterMm: 28 });
    expect(route.diameterMm).toBe(28);
  });

  it('preserves mounting', () => {
    const route = makeRoute({ mounting: 'boxed' });
    expect(route.mounting).toBe('boxed');
  });

  it('preserves confidence', () => {
    const route = makeRoute({ confidence: 'measured' });
    expect(route.confidence).toBe('measured');
  });
});

// ─── 5. InstallRouteModelV1 — path waypoints ──────────────────────────────────

describe('InstallRouteModelV1 — path waypoints', () => {
  it('preserves the correct number of waypoints', () => {
    const path = [
      { position: { x: 0, y: 0, z: 0 } },
      { position: { x: 1, y: 0, z: 0 } },
      { position: { x: 1, y: 2, z: 0 } },
    ];
    const route = makeRoute({ path });
    expect(route.path).toHaveLength(3);
  });

  it('preserves waypoint coordinates', () => {
    const path = [{ position: { x: 4.5, y: 2.1, z: 1.0 } }];
    const route = makeRoute({ path });
    expect(route.path[0].position.x).toBe(4.5);
    expect(route.path[0].position.y).toBe(2.1);
    expect(route.path[0].position.z).toBe(1.0);
  });

  it('accepts an empty path array', () => {
    const route = makeRoute({ path: [] });
    expect(route.path).toHaveLength(0);
  });
});

// ─── 6. InstallLayerModelV1 — empty layer ─────────────────────────────────────

describe('InstallLayerModelV1 — empty layer', () => {
  it('is structurally valid with empty arrays', () => {
    const layer: InstallLayerModelV1 = { existing: [], proposed: [], notes: [] };
    expect(layer.existing).toHaveLength(0);
    expect(layer.proposed).toHaveLength(0);
    expect(layer.notes).toHaveLength(0);
  });
});

// ─── 7. InstallLayerModelV1 — populated layer ─────────────────────────────────

describe('InstallLayerModelV1 — populated layer', () => {
  it('holds existing routes separately from proposed', () => {
    const existing = [makeRoute({ id: 'existing-1', confidence: 'measured' })];
    const proposed = [makeRoute({ id: 'proposed-1', confidence: 'drawn' })];
    const notes: InstallAnnotation[] = [{ id: 'note-1', text: 'Check clearance' }];
    const layer: InstallLayerModelV1 = { existing, proposed, notes };
    expect(layer.existing[0].id).toBe('existing-1');
    expect(layer.proposed[0].id).toBe('proposed-1');
    expect(layer.notes[0].text).toBe('Check clearance');
  });

  it('existing and proposed routes are independent arrays', () => {
    const layer: InstallLayerModelV1 = {
      existing: [makeRoute({ id: 'e-1' })],
      proposed: [makeRoute({ id: 'p-1' }), makeRoute({ id: 'p-2' })],
      notes: [],
    };
    expect(layer.existing).toHaveLength(1);
    expect(layer.proposed).toHaveLength(2);
  });
});

// ─── 8. InstallAnnotation — optional position ─────────────────────────────────

describe('InstallAnnotation — optional position', () => {
  it('position is absent when not provided', () => {
    const note: InstallAnnotation = { id: 'n-1', text: 'Low ceiling here' };
    expect(note.position).toBeUndefined();
  });

  it('position is preserved when provided', () => {
    const note: InstallAnnotation = {
      id: 'n-2',
      text: 'Tight bend',
      position: { x: 2.0, y: 3.0, z: 1.5 },
    };
    expect(note.position?.x).toBe(2.0);
    expect(note.position?.y).toBe(3.0);
    expect(note.position?.z).toBe(1.5);
  });
});
