/**
 * install-markup.test.ts
 *
 * Tests for the install markup model validation boundary.
 *
 * Coverage:
 *   1.  Valid InstallObjectModelV1 accepted
 *   2.  Invalid install object rejected (missing / wrong fields)
 *   3.  Non-object input rejected for install object
 *   4.  Valid InstallRouteModelV1 accepted
 *   5.  Invalid install route rejected (bad kind, missing path, bad confidence)
 *   6.  Non-object input rejected for install route
 *   7.  InstallPathPoint with optional elevationOffsetM accepted
 *   8.  InstallPathPoint with non-numeric elevationOffsetM rejected
 *   9.  Valid InstallLayerModelV1 accepted (with existing + proposed + notes)
 *  10.  Empty InstallLayerModelV1 accepted (all arrays empty)
 *  11.  Invalid install layer rejected (non-array fields)
 *  12.  Invalid route inside install layer rejected
 *  13.  Invalid annotation inside install layer rejected
 *  14.  InstallAnnotation with optional position accepted
 *  15.  TypeScript type narrowing — validated types resolve correctly
 */

import { describe, it, expect } from 'vitest';
import {
  validateInstallObject,
  validateInstallRoute,
  validateInstallLayer,
} from '../../src/scan/validation';
import type {
  InstallObjectModelV1,
  InstallRouteModelV1,
  InstallLayerModelV1,
} from '../../src/scan/types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function validObject(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'obj-001',
    type: 'boiler',
    position: { x: 1.0, y: 2.0, z: 0.0 },
    dimensions: { widthM: 0.5, depthM: 0.4, heightM: 0.7 },
    orientation: { yawDeg: 90 },
    source: 'scan',
    ...overrides,
  };
}

function validRoute(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'route-001',
    kind: 'flow',
    diameterMm: 22,
    path: [
      { x: 0.0, y: 0.0, z: 0.0 },
      { x: 1.0, y: 0.0, z: 0.0 },
    ],
    mounting: 'surface',
    confidence: 'measured',
    ...overrides,
  };
}

function validLayer(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    existing: [validRoute({ id: 'route-existing-001' })],
    proposed: [validRoute({ id: 'route-proposed-001', confidence: 'drawn' })],
    notes: [{ id: 'note-001', text: 'Low ceiling clearance' }],
    ...overrides,
  };
}

// ─── 1. Valid install object ──────────────────────────────────────────────────

describe('validateInstallObject — valid object', () => {
  it('returns ok: true', () => {
    expect(validateInstallObject(validObject()).ok).toBe(true);
  });

  it('returns the typed object', () => {
    const result = validateInstallObject(validObject());
    if (!result.ok) throw new Error('Expected ok: true');
    const obj: InstallObjectModelV1 = result.object;
    expect(obj.id).toBe('obj-001');
    expect(obj.type).toBe('boiler');
    expect(obj.source).toBe('scan');
  });

  it('accepts all valid types', () => {
    const types = ['boiler', 'cylinder', 'radiator', 'thermostat', 'flue', 'pump', 'valve', 'consumer_unit', 'other'];
    for (const type of types) {
      expect(validateInstallObject(validObject({ type })).ok).toBe(true);
    }
  });

  it('accepts all valid sources', () => {
    for (const source of ['scan', 'manual', 'inferred']) {
      expect(validateInstallObject(validObject({ source })).ok).toBe(true);
    }
  });
});

// ─── 2. Invalid install object ────────────────────────────────────────────────

describe('validateInstallObject — invalid object', () => {
  it('rejects missing id', () => {
    const result = validateInstallObject(validObject({ id: undefined }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some(e => e.includes('id'))).toBe(true);
  });

  it('rejects unknown type', () => {
    const result = validateInstallObject(validObject({ type: 'heat_pump' }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some(e => e.includes('type'))).toBe(true);
  });

  it('rejects non-numeric position', () => {
    const result = validateInstallObject(validObject({ position: { x: 'a', y: 0, z: 0 } }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some(e => e.includes('position.x'))).toBe(true);
  });

  it('rejects missing dimensions', () => {
    const result = validateInstallObject(validObject({ dimensions: null }));
    expect(result.ok).toBe(false);
  });

  it('rejects invalid source', () => {
    const result = validateInstallObject(validObject({ source: 'guessed' }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some(e => e.includes('source'))).toBe(true);
  });
});

// ─── 3. Non-object input rejected for install object ─────────────────────────

describe('validateInstallObject — non-object input', () => {
  it('rejects null', () => {
    expect(validateInstallObject(null).ok).toBe(false);
  });

  it('rejects array', () => {
    expect(validateInstallObject([]).ok).toBe(false);
  });

  it('rejects string', () => {
    expect(validateInstallObject('boiler').ok).toBe(false);
  });
});

// ─── 4. Valid install route ───────────────────────────────────────────────────

describe('validateInstallRoute — valid route', () => {
  it('returns ok: true', () => {
    expect(validateInstallRoute(validRoute()).ok).toBe(true);
  });

  it('returns the typed route', () => {
    const result = validateInstallRoute(validRoute());
    if (!result.ok) throw new Error('Expected ok: true');
    const route: InstallRouteModelV1 = result.route;
    expect(route.id).toBe('route-001');
    expect(route.kind).toBe('flow');
    expect(route.diameterMm).toBe(22);
    expect(route.path).toHaveLength(2);
  });

  it('accepts all valid kinds', () => {
    for (const kind of ['flow', 'return', 'gas', 'cold', 'hot', 'flue', 'other']) {
      expect(validateInstallRoute(validRoute({ kind })).ok).toBe(true);
    }
  });

  it('accepts all valid mountings', () => {
    for (const mounting of ['surface', 'boxed', 'buried', 'other']) {
      expect(validateInstallRoute(validRoute({ mounting })).ok).toBe(true);
    }
  });

  it('accepts all valid confidences', () => {
    for (const confidence of ['measured', 'drawn', 'estimated']) {
      expect(validateInstallRoute(validRoute({ confidence })).ok).toBe(true);
    }
  });
});

// ─── 5. Invalid install route ─────────────────────────────────────────────────

describe('validateInstallRoute — invalid route', () => {
  it('rejects unknown kind', () => {
    const result = validateInstallRoute(validRoute({ kind: 'electric' }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some(e => e.includes('kind'))).toBe(true);
  });

  it('rejects non-numeric diameterMm', () => {
    const result = validateInstallRoute(validRoute({ diameterMm: 'large' }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some(e => e.includes('diameterMm'))).toBe(true);
  });

  it('rejects non-array path', () => {
    const result = validateInstallRoute(validRoute({ path: null }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some(e => e.includes('path'))).toBe(true);
  });

  it('rejects bad confidence', () => {
    const result = validateInstallRoute(validRoute({ confidence: 'certain' }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some(e => e.includes('confidence'))).toBe(true);
  });

  it('rejects invalid mounting', () => {
    const result = validateInstallRoute(validRoute({ mounting: 'underground' }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some(e => e.includes('mounting'))).toBe(true);
  });
});

// ─── 6. Non-object input rejected for install route ──────────────────────────

describe('validateInstallRoute — non-object input', () => {
  it('rejects null', () => {
    expect(validateInstallRoute(null).ok).toBe(false);
  });

  it('rejects number', () => {
    expect(validateInstallRoute(42).ok).toBe(false);
  });
});

// ─── 7. InstallPathPoint with optional elevationOffsetM ──────────────────────

describe('validateInstallRoute — path points with elevationOffsetM', () => {
  it('accepts path point with valid elevationOffsetM', () => {
    const route = validRoute({
      path: [{ x: 0, y: 0, z: 0, elevationOffsetM: 2.4 }],
    });
    expect(validateInstallRoute(route).ok).toBe(true);
  });

  it('accepts path point without elevationOffsetM', () => {
    const route = validRoute({
      path: [{ x: 0, y: 0, z: 0 }],
    });
    expect(validateInstallRoute(route).ok).toBe(true);
  });
});

// ─── 8. InstallPathPoint with non-numeric elevationOffsetM rejected ───────────

describe('validateInstallRoute — invalid elevationOffsetM', () => {
  it('rejects path point with non-numeric elevationOffsetM', () => {
    const route = validRoute({
      path: [{ x: 0, y: 0, z: 0, elevationOffsetM: 'high' }],
    });
    const result = validateInstallRoute(route);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some(e => e.includes('elevationOffsetM'))).toBe(true);
  });
});

// ─── 9. Valid install layer ───────────────────────────────────────────────────

describe('validateInstallLayer — valid layer', () => {
  it('returns ok: true', () => {
    expect(validateInstallLayer(validLayer()).ok).toBe(true);
  });

  it('returns the typed layer', () => {
    const result = validateInstallLayer(validLayer());
    if (!result.ok) throw new Error('Expected ok: true');
    const layer: InstallLayerModelV1 = result.layer;
    expect(layer.existing).toHaveLength(1);
    expect(layer.proposed).toHaveLength(1);
    expect(layer.notes).toHaveLength(1);
  });
});

// ─── 10. Empty install layer accepted ────────────────────────────────────────

describe('validateInstallLayer — empty layer', () => {
  it('accepts a layer with all empty arrays', () => {
    const result = validateInstallLayer({ existing: [], proposed: [], notes: [] });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.layer.existing).toHaveLength(0);
    expect(result.layer.proposed).toHaveLength(0);
    expect(result.layer.notes).toHaveLength(0);
  });
});

// ─── 11. Invalid install layer rejected ──────────────────────────────────────

describe('validateInstallLayer — invalid layer', () => {
  it('rejects null input', () => {
    expect(validateInstallLayer(null).ok).toBe(false);
  });

  it('rejects non-array existing', () => {
    const result = validateInstallLayer(validLayer({ existing: 'none' }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some(e => e.includes('existing'))).toBe(true);
  });

  it('rejects non-array proposed', () => {
    const result = validateInstallLayer(validLayer({ proposed: null }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some(e => e.includes('proposed'))).toBe(true);
  });

  it('rejects non-array notes', () => {
    const result = validateInstallLayer(validLayer({ notes: 'none' }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some(e => e.includes('notes'))).toBe(true);
  });
});

// ─── 12. Invalid route inside install layer ───────────────────────────────────

describe('validateInstallLayer — invalid route inside layer', () => {
  it('rejects layer with invalid existing route', () => {
    const result = validateInstallLayer(
      validLayer({ existing: [validRoute({ kind: 'invalid' })] })
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some(e => e.includes('existing[0]'))).toBe(true);
  });

  it('rejects layer with invalid proposed route', () => {
    const result = validateInstallLayer(
      validLayer({ proposed: [validRoute({ confidence: 'unknown' })] })
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some(e => e.includes('proposed[0]'))).toBe(true);
  });
});

// ─── 13. Invalid annotation inside install layer ──────────────────────────────

describe('validateInstallLayer — invalid annotation', () => {
  it('rejects annotation with missing id', () => {
    const result = validateInstallLayer(
      validLayer({ notes: [{ text: 'Low clearance' }] })
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some(e => e.includes('notes[0].id'))).toBe(true);
  });

  it('rejects annotation with missing text', () => {
    const result = validateInstallLayer(
      validLayer({ notes: [{ id: 'n-1' }] })
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some(e => e.includes('notes[0].text'))).toBe(true);
  });

  it('rejects annotation with invalid position', () => {
    const result = validateInstallLayer(
      validLayer({ notes: [{ id: 'n-1', text: 'Note', position: { x: 'bad', y: 0, z: 0 } }] })
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some(e => e.includes('position'))).toBe(true);
  });
});

// ─── 14. InstallAnnotation with optional position accepted ────────────────────

describe('validateInstallLayer — annotation with position', () => {
  it('accepts annotation with valid 3D position', () => {
    const result = validateInstallLayer(
      validLayer({
        notes: [{ id: 'n-1', text: 'Constraint note', position: { x: 1.5, y: 2.0, z: 0.0 } }],
      })
    );
    expect(result.ok).toBe(true);
  });

  it('accepts annotation without position', () => {
    const result = validateInstallLayer(
      validLayer({ notes: [{ id: 'n-1', text: 'Note without position' }] })
    );
    expect(result.ok).toBe(true);
  });
});

// ─── 15. TypeScript narrowing ─────────────────────────────────────────────────

describe('type narrowing', () => {
  it('object result narrows to InstallObjectModelV1', () => {
    const result = validateInstallObject(validObject());
    if (!result.ok) throw new Error('Expected ok: true');
    // TypeScript ensures result.object is typed as InstallObjectModelV1
    const _typed: InstallObjectModelV1 = result.object;
    expect(_typed.type).toBe('boiler');
  });

  it('route result narrows to InstallRouteModelV1', () => {
    const result = validateInstallRoute(validRoute());
    if (!result.ok) throw new Error('Expected ok: true');
    const _typed: InstallRouteModelV1 = result.route;
    expect(_typed.kind).toBe('flow');
  });

  it('layer result narrows to InstallLayerModelV1', () => {
    const result = validateInstallLayer(validLayer());
    if (!result.ok) throw new Error('Expected ok: true');
    const _typed: InstallLayerModelV1 = result.layer;
    expect(Array.isArray(_typed.existing)).toBe(true);
  });
});
