/**
 * atlasProperty.visitLifecycle.test.ts
 *
 * Tests for the canonical visit lifecycle types and transition map.
 *
 * Coverage:
 *   1.  AtlasVisitStatus union covers all expected literals
 *   2.  AtlasVisitCompletion minimal (completedAt only)
 *   3.  AtlasVisitCompletion full (all optional fields present)
 *   4.  AtlasVisitReadiness all-false is valid
 *   5.  AtlasVisitReadiness all-true is valid
 *   6.  ATLAS_VISIT_STATUS_TRANSITIONS covers every status key
 *   7.  Allowed transitions are non-empty for non-terminal statuses
 *   8.  complete has no allowed transitions (terminal state)
 *   9.  AtlasPropertyV1 accepts visitStatus
 *  10.  AtlasPropertyV1 accepts readiness and completion optional fields
 *  11.  visitStatus and completion survive JSON round-trip
 *  12.  Transition values only contain valid AtlasVisitStatus literals
 */

import { describe, it, expect } from 'vitest';
import type {
  AtlasVisitStatus,
  AtlasVisitCompletion,
  AtlasVisitReadiness,
  AtlasPropertyV1,
} from '../../src/atlasProperty/index';
import { ATLAS_VISIT_STATUS_TRANSITIONS } from '../../src/atlasProperty/index';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function minimalProperty(): AtlasPropertyV1 {
  return {
    version: '1.0',
    propertyId: 'lc-prop-001',
    createdAt: '2025-06-01T08:00:00Z',
    updatedAt: '2025-06-01T08:00:00Z',
    status: 'draft',
    visitStatus: 'draft',
    sourceApps: ['atlas_scan'],
    property: {},
    capture: { sessionId: 'lc-session-001' },
    building: {
      floors: [],
      rooms: [],
      zones: [],
      boundaries: [],
      openings: [],
      emitters: [],
      systemComponents: [],
    },
    household: {
      composition: {
        adultCount: { value: 2, source: 'engineer_entered', confidence: 'medium' },
        childCount0to4: { value: 0, source: 'engineer_entered', confidence: 'medium' },
        childCount5to10: { value: 0, source: 'engineer_entered', confidence: 'medium' },
        childCount11to17: { value: 0, source: 'engineer_entered', confidence: 'medium' },
        youngAdultCount18to25AtHome: { value: 0, source: 'engineer_entered', confidence: 'medium' },
      },
    },
    currentSystem: {
      family: { value: 'combi', source: 'engineer_entered', confidence: 'medium' },
    },
    evidence: {
      photos: [],
      voiceNotes: [],
      textNotes: [],
      qaFlags: [],
      events: [],
    },
  };
}

function roundTrip<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ─── 1. AtlasVisitStatus literals ────────────────────────────────────────────

describe('AtlasVisitStatus', () => {
  const allStatuses: AtlasVisitStatus[] = [
    'draft',
    'capturing',
    'planning',
    'ready_to_complete',
    'complete',
  ];

  for (const status of allStatuses) {
    it(`status '${status}' is accepted on AtlasPropertyV1`, () => {
      const prop: AtlasPropertyV1 = { ...minimalProperty(), visitStatus: status };
      expect(prop.visitStatus).toBe(status);
    });
  }
});

// ─── 2. AtlasVisitCompletion — minimal ───────────────────────────────────────

describe('AtlasVisitCompletion — minimal', () => {
  it('accepts completedAt only', () => {
    const completion: AtlasVisitCompletion = {
      completedAt: '2025-06-01T11:30:00Z',
    };
    expect(completion.completedAt).toBe('2025-06-01T11:30:00Z');
    expect(completion.completedByUserId).toBeUndefined();
    expect(completion.completionMethod).toBeUndefined();
  });
});

// ─── 3. AtlasVisitCompletion — full ──────────────────────────────────────────

describe('AtlasVisitCompletion — full', () => {
  const completionMethods: Array<AtlasVisitCompletion['completionMethod']> = [
    'manual',
    'imported',
    'system',
  ];

  for (const method of completionMethods) {
    it(`accepts completionMethod '${method}'`, () => {
      const completion: AtlasVisitCompletion = {
        completedAt: '2025-06-01T11:30:00Z',
        completedByUserId: 'user-007',
        completionMethod: method,
      };
      expect(completion.completionMethod).toBe(method);
      expect(completion.completedByUserId).toBe('user-007');
    });
  }
});

// ─── 4. AtlasVisitReadiness — all-false ──────────────────────────────────────

describe('AtlasVisitReadiness — all-false', () => {
  it('accepts a readiness object with all flags false', () => {
    const readiness: AtlasVisitReadiness = {
      hasRooms: false,
      hasPhotos: false,
      hasHeatingSystem: false,
      hasHotWaterSystem: false,
      hasKeyObjectBoiler: false,
      hasKeyObjectFlue: false,
      hasAnyNotes: false,
    };
    expect(readiness.hasRooms).toBe(false);
    expect(readiness.hasKeyObjectBoiler).toBe(false);
  });
});

// ─── 5. AtlasVisitReadiness — all-true ───────────────────────────────────────

describe('AtlasVisitReadiness — all-true', () => {
  it('accepts a readiness object with all flags true', () => {
    const readiness: AtlasVisitReadiness = {
      hasRooms: true,
      hasPhotos: true,
      hasHeatingSystem: true,
      hasHotWaterSystem: true,
      hasKeyObjectBoiler: true,
      hasKeyObjectFlue: true,
      hasAnyNotes: true,
    };
    expect(readiness.hasRooms).toBe(true);
    expect(readiness.hasAnyNotes).toBe(true);
  });
});

// ─── 6. ATLAS_VISIT_STATUS_TRANSITIONS covers every status ───────────────────

describe('ATLAS_VISIT_STATUS_TRANSITIONS — completeness', () => {
  const allStatuses: AtlasVisitStatus[] = [
    'draft',
    'capturing',
    'planning',
    'ready_to_complete',
    'complete',
  ];

  it('has an entry for every AtlasVisitStatus', () => {
    for (const status of allStatuses) {
      expect(ATLAS_VISIT_STATUS_TRANSITIONS).toHaveProperty(status);
    }
  });

  it('has no extra keys beyond the known statuses', () => {
    const keys = Object.keys(ATLAS_VISIT_STATUS_TRANSITIONS);
    expect(keys.sort()).toEqual([...allStatuses].sort());
  });
});

// ─── 7. Non-terminal statuses have allowed transitions ───────────────────────

describe('ATLAS_VISIT_STATUS_TRANSITIONS — non-terminal statuses', () => {
  const nonTerminal: AtlasVisitStatus[] = [
    'draft',
    'capturing',
    'planning',
    'ready_to_complete',
  ];

  for (const status of nonTerminal) {
    it(`'${status}' has at least one allowed transition`, () => {
      expect(ATLAS_VISIT_STATUS_TRANSITIONS[status].length).toBeGreaterThan(0);
    });
  }
});

// ─── 8. complete is terminal ──────────────────────────────────────────────────

describe('ATLAS_VISIT_STATUS_TRANSITIONS — terminal state', () => {
  it("'complete' has no allowed transitions", () => {
    expect(ATLAS_VISIT_STATUS_TRANSITIONS['complete']).toHaveLength(0);
  });
});

// ─── 9. AtlasPropertyV1 — visitStatus field ──────────────────────────────────

describe('AtlasPropertyV1 — visitStatus field', () => {
  it('visitStatus is present on the minimal fixture', () => {
    expect(minimalProperty().visitStatus).toBe('draft');
  });

  it('visitStatus can be updated to capturing', () => {
    const prop: AtlasPropertyV1 = { ...minimalProperty(), visitStatus: 'capturing' };
    expect(prop.visitStatus).toBe('capturing');
  });
});

// ─── 10. AtlasPropertyV1 — optional readiness and completion ─────────────────

describe('AtlasPropertyV1 — readiness and completion optional fields', () => {
  it('readiness is absent on minimal fixture', () => {
    expect(minimalProperty().readiness).toBeUndefined();
  });

  it('completion is absent on minimal fixture', () => {
    expect(minimalProperty().completion).toBeUndefined();
  });

  it('accepts readiness when provided', () => {
    const prop: AtlasPropertyV1 = {
      ...minimalProperty(),
      visitStatus: 'ready_to_complete',
      readiness: {
        hasRooms: true,
        hasPhotos: true,
        hasHeatingSystem: true,
        hasHotWaterSystem: false,
        hasKeyObjectBoiler: true,
        hasKeyObjectFlue: true,
        hasAnyNotes: true,
      },
    };
    expect(prop.readiness?.hasRooms).toBe(true);
    expect(prop.readiness?.hasHotWaterSystem).toBe(false);
  });

  it('accepts completion when provided', () => {
    const prop: AtlasPropertyV1 = {
      ...minimalProperty(),
      visitStatus: 'complete',
      completion: {
        completedAt: '2025-06-01T11:30:00Z',
        completedByUserId: 'user-007',
        completionMethod: 'manual',
      },
    };
    expect(prop.completion?.completedAt).toBe('2025-06-01T11:30:00Z');
    expect(prop.completion?.completionMethod).toBe('manual');
  });
});

// ─── 11. JSON round-trip ──────────────────────────────────────────────────────

describe('AtlasPropertyV1 — visitStatus / completion round-trip', () => {
  it('visitStatus survives JSON round-trip', () => {
    const prop: AtlasPropertyV1 = { ...minimalProperty(), visitStatus: 'complete' };
    expect(roundTrip(prop).visitStatus).toBe('complete');
  });

  it('completion survives JSON round-trip', () => {
    const prop: AtlasPropertyV1 = {
      ...minimalProperty(),
      visitStatus: 'complete',
      completion: {
        completedAt: '2025-06-01T11:30:00Z',
        completedByUserId: 'user-007',
        completionMethod: 'manual',
      },
    };
    const rt = roundTrip(prop);
    expect(rt.completion?.completedAt).toBe('2025-06-01T11:30:00Z');
    expect(rt.completion?.completedByUserId).toBe('user-007');
    expect(rt.completion?.completionMethod).toBe('manual');
  });

  it('readiness survives JSON round-trip', () => {
    const prop: AtlasPropertyV1 = {
      ...minimalProperty(),
      visitStatus: 'ready_to_complete',
      readiness: {
        hasRooms: true,
        hasPhotos: true,
        hasHeatingSystem: true,
        hasHotWaterSystem: false,
        hasKeyObjectBoiler: true,
        hasKeyObjectFlue: false,
        hasAnyNotes: true,
      },
    };
    const rt = roundTrip(prop);
    expect(rt.readiness?.hasRooms).toBe(true);
    expect(rt.readiness?.hasKeyObjectFlue).toBe(false);
  });
});

// ─── 12. Transition target validity ──────────────────────────────────────────

describe('ATLAS_VISIT_STATUS_TRANSITIONS — target validity', () => {
  const allStatuses = new Set<string>([
    'draft',
    'capturing',
    'planning',
    'ready_to_complete',
    'complete',
  ]);

  it('every transition target is a valid AtlasVisitStatus', () => {
    for (const [, targets] of Object.entries(ATLAS_VISIT_STATUS_TRANSITIONS)) {
      for (const target of targets) {
        expect(allStatuses.has(target)).toBe(true);
      }
    }
  });
});
