/**
 * planningOverlay.test.ts
 *
 * Tests for the AtlasPlanningOverlayV1 types and derivePlanningReadiness helper.
 *
 * Coverage:
 *   1. AtlasPlanningOverlayV1 accepts empty / partial overlays
 *   2. AtlasProposedEmitterV1 accepts all AtlasEmitterType values
 *   3. AtlasRoomPlanNoteV1 accepts all category values
 *   4. AtlasRouteMarkupV1 accepts all routeType values
 *   5. AtlasAccessNoteV1 accepts all category values
 *   6. derivePlanningReadiness returns all-false for absent overlay
 *   7. derivePlanningReadiness returns all-false for empty overlay
 *   8. derivePlanningReadiness returns correct flags for populated overlay
 *   9. AtlasPropertyV1 accepts planningOverlay as optional field
 *  10. AtlasKeyObjectType includes electric_meter and gas_meter
 */

import { describe, it, expect } from 'vitest';
import type {
  AtlasEmitterType,
  AtlasProposedEmitterV1,
  AtlasRoomPlanNoteV1,
  AtlasRouteMarkupV1,
  AtlasAccessNoteV1,
  AtlasPlanningOverlayV1,
  AtlasPlanningReadiness,
  AtlasPropertyV1,
} from '../../src/atlasProperty/index';
import { derivePlanningReadiness } from '../../src/atlasProperty/index';
import type { AtlasKeyObjectType } from '../../src/atlasSpatial/atlasSpatialAlignment.types';

// ─── Minimal property helper ──────────────────────────────────────────────────

function makeMinimalProperty(): AtlasPropertyV1 {
  return {
    version: '1.0',
    propertyId: 'prop-plan-001',
    createdAt: '2025-06-01T09:00:00Z',
    updatedAt: '2025-06-01T09:00:00Z',
    status: 'survey_in_progress',
    visitStatus: 'draft',
    sourceApps: ['atlas_scan'],
    property: {},
    capture: { sessionId: 'session-plan-001' },
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
        adultCount: { value: 2, source: 'measured', confidence: 'high' },
        childCount0to4: { value: 0, source: 'measured', confidence: 'high' },
        childCount5to10: { value: 0, source: 'measured', confidence: 'high' },
        childCount11to17: { value: 0, source: 'measured', confidence: 'high' },
        youngAdultCount18to25AtHome: { value: 0, source: 'measured', confidence: 'high' },
      },
    },
    currentSystem: {
      family: { value: 'combi', source: 'measured', confidence: 'high' },
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

// ─── 1. AtlasPlanningOverlayV1 accepts empty / partial overlays ───────────────

describe('AtlasPlanningOverlayV1 — structure', () => {
  it('accepts an entirely empty overlay object', () => {
    const overlay: AtlasPlanningOverlayV1 = {};
    expect(overlay).toBeDefined();
    expect(overlay.proposedEmitters).toBeUndefined();
    expect(overlay.routeMarkups).toBeUndefined();
    expect(overlay.accessNotes).toBeUndefined();
    expect(overlay.roomPlans).toBeUndefined();
    expect(overlay.specNotes).toBeUndefined();
  });

  it('accepts a partially populated overlay', () => {
    const overlay: AtlasPlanningOverlayV1 = {
      specNotes: ['Check loft insulation depth before routing'],
    };
    expect(overlay.specNotes).toHaveLength(1);
    expect(overlay.proposedEmitters).toBeUndefined();
  });

  it('accepts fully populated overlay', () => {
    const overlay: AtlasPlanningOverlayV1 = {
      proposedEmitters: [
        { id: 'pe-01', roomId: 'room-01', type: 'radiator' },
      ],
      routeMarkups: [
        { id: 'rm-01', description: 'Flow pipe under floorboards', routeType: 'pipe_flow' },
      ],
      accessNotes: [
        { id: 'an-01', note: 'Ladder required for loft access', category: 'ladder' },
      ],
      roomPlans: [
        { id: 'rp-01', roomId: 'room-01', note: 'Replace existing radiator', category: 'emitter' },
      ],
      specNotes: ['Confirm inhibitor dosing before sign-off'],
    };
    expect(overlay.proposedEmitters).toHaveLength(1);
    expect(overlay.routeMarkups).toHaveLength(1);
    expect(overlay.accessNotes).toHaveLength(1);
    expect(overlay.roomPlans).toHaveLength(1);
    expect(overlay.specNotes).toHaveLength(1);
  });
});

// ─── 2. AtlasProposedEmitterV1 — all AtlasEmitterType values ─────────────────

describe('AtlasProposedEmitterV1 — emitter types', () => {
  const emitterTypes: AtlasEmitterType[] = [
    'radiator',
    'vertical_radiator',
    'towel_rail',
    'ufh_zone',
    'other',
  ];

  for (const type of emitterTypes) {
    it(`accepts type '${type}'`, () => {
      const emitter: AtlasProposedEmitterV1 = {
        id: `pe-${type}`,
        roomId: 'room-01',
        type,
      };
      expect(emitter.type).toBe(type);
    });
  }

  it('accepts optional fields', () => {
    const emitter: AtlasProposedEmitterV1 = {
      id: 'pe-full',
      roomId: 'room-lounge',
      type: 'radiator',
      label: 'Living room main radiator',
      notes: 'Upsize to 1800mm double panel',
      replacesExisting: true,
    };
    expect(emitter.label).toBe('Living room main radiator');
    expect(emitter.replacesExisting).toBe(true);
  });

  it('accepts minimal required fields only', () => {
    const emitter: AtlasProposedEmitterV1 = { id: 'pe-min', roomId: 'room-01', type: 'towel_rail' };
    expect(emitter.label).toBeUndefined();
    expect(emitter.notes).toBeUndefined();
    expect(emitter.replacesExisting).toBeUndefined();
  });
});

// ─── 3. AtlasRoomPlanNoteV1 — all category values ────────────────────────────

describe('AtlasRoomPlanNoteV1 — categories', () => {
  const categories: NonNullable<AtlasRoomPlanNoteV1['category']>[] = [
    'emitter',
    'pipework',
    'access',
    'controls',
    'general',
  ];

  for (const category of categories) {
    it(`accepts category '${category}'`, () => {
      const note: AtlasRoomPlanNoteV1 = {
        id: `rp-${category}`,
        roomId: 'room-01',
        note: `Test note for ${category}`,
        category,
      };
      expect(note.category).toBe(category);
    });
  }

  it('accepts note without category', () => {
    const note: AtlasRoomPlanNoteV1 = { id: 'rp-no-cat', roomId: 'room-01', note: 'Uncategorised note' };
    expect(note.category).toBeUndefined();
  });
});

// ─── 4. AtlasRouteMarkupV1 — all routeType values ────────────────────────────

describe('AtlasRouteMarkupV1 — route types', () => {
  const routeTypes: NonNullable<AtlasRouteMarkupV1['routeType']>[] = [
    'pipe_flow',
    'pipe_return',
    'condensate',
    'cable',
    'flue',
    'other',
  ];

  for (const routeType of routeTypes) {
    it(`accepts routeType '${routeType}'`, () => {
      const markup: AtlasRouteMarkupV1 = {
        id: `rm-${routeType}`,
        description: `Route of type ${routeType}`,
        routeType,
      };
      expect(markup.routeType).toBe(routeType);
    });
  }

  it('accepts route with fromObjectId and toObjectId', () => {
    const markup: AtlasRouteMarkupV1 = {
      id: 'rm-linked',
      fromObjectId: 'boiler-anchor-01',
      toObjectId: 'rad-01',
      description: 'Flow pipe from boiler to kitchen radiator',
      routeType: 'pipe_flow',
    };
    expect(markup.fromObjectId).toBe('boiler-anchor-01');
    expect(markup.toObjectId).toBe('rad-01');
  });

  it('accepts route with roomId only', () => {
    const markup: AtlasRouteMarkupV1 = {
      id: 'rm-room-only',
      roomId: 'room-hall',
      description: 'Cable run through hallway',
      routeType: 'cable',
    };
    expect(markup.roomId).toBe('room-hall');
    expect(markup.fromObjectId).toBeUndefined();
  });

  it('accepts minimal required fields only (description)', () => {
    const markup: AtlasRouteMarkupV1 = { id: 'rm-min', description: 'Unnamed route' };
    expect(markup.routeType).toBeUndefined();
  });
});

// ─── 5. AtlasAccessNoteV1 — all category values ──────────────────────────────

describe('AtlasAccessNoteV1 — categories', () => {
  const categories: NonNullable<AtlasAccessNoteV1['category']>[] = [
    'ladder',
    'clearance',
    'obstruction',
    'loft_access',
    'general',
  ];

  for (const category of categories) {
    it(`accepts category '${category}'`, () => {
      const note: AtlasAccessNoteV1 = {
        id: `an-${category}`,
        note: `Access note for ${category}`,
        category,
      };
      expect(note.category).toBe(category);
    });
  }

  it('accepts note with roomId', () => {
    const note: AtlasAccessNoteV1 = {
      id: 'an-room',
      roomId: 'room-loft',
      note: 'Access hatch is behind water tank',
      category: 'loft_access',
    };
    expect(note.roomId).toBe('room-loft');
  });

  it('accepts note with relatedObjectId', () => {
    const note: AtlasAccessNoteV1 = {
      id: 'an-obj',
      relatedObjectId: 'comp-boiler',
      note: '500 mm clearance required on service side',
      category: 'clearance',
    };
    expect(note.relatedObjectId).toBe('comp-boiler');
  });
});

// ─── 6. derivePlanningReadiness — absent overlay ──────────────────────────────

describe('derivePlanningReadiness — absent overlay', () => {
  it('returns all-false when planningOverlay is absent', () => {
    const readiness: AtlasPlanningReadiness = derivePlanningReadiness(makeMinimalProperty());
    expect(readiness.hasProposedEmitters).toBe(false);
    expect(readiness.hasAnyRoutes).toBe(false);
    expect(readiness.hasAnyAccessNotes).toBe(false);
    expect(readiness.hasAnyRoomPlans).toBe(false);
    expect(readiness.hasAnySpecNotes).toBe(false);
  });
});

// ─── 7. derivePlanningReadiness — empty overlay ───────────────────────────────

describe('derivePlanningReadiness — empty overlay', () => {
  it('returns all-false when planningOverlay is an empty object', () => {
    const prop = { ...makeMinimalProperty(), planningOverlay: {} };
    const readiness = derivePlanningReadiness(prop);
    expect(readiness.hasProposedEmitters).toBe(false);
    expect(readiness.hasAnyRoutes).toBe(false);
    expect(readiness.hasAnyAccessNotes).toBe(false);
    expect(readiness.hasAnyRoomPlans).toBe(false);
    expect(readiness.hasAnySpecNotes).toBe(false);
  });

  it('returns all-false when all overlay arrays are empty', () => {
    const prop = {
      ...makeMinimalProperty(),
      planningOverlay: {
        proposedEmitters: [],
        routeMarkups: [],
        accessNotes: [],
        roomPlans: [],
        specNotes: [],
      },
    };
    const readiness = derivePlanningReadiness(prop);
    expect(readiness.hasProposedEmitters).toBe(false);
    expect(readiness.hasAnyRoutes).toBe(false);
    expect(readiness.hasAnyAccessNotes).toBe(false);
    expect(readiness.hasAnyRoomPlans).toBe(false);
    expect(readiness.hasAnySpecNotes).toBe(false);
  });
});

// ─── 8. derivePlanningReadiness — populated overlay ──────────────────────────

describe('derivePlanningReadiness — populated overlay', () => {
  it('hasProposedEmitters is true when proposedEmitters is non-empty', () => {
    const prop = {
      ...makeMinimalProperty(),
      planningOverlay: {
        proposedEmitters: [{ id: 'pe-01', roomId: 'room-01', type: 'radiator' as const }],
      },
    };
    expect(derivePlanningReadiness(prop).hasProposedEmitters).toBe(true);
    expect(derivePlanningReadiness(prop).hasAnyRoutes).toBe(false);
  });

  it('hasAnyRoutes is true when routeMarkups is non-empty', () => {
    const prop = {
      ...makeMinimalProperty(),
      planningOverlay: {
        routeMarkups: [{ id: 'rm-01', description: 'Some route' }],
      },
    };
    expect(derivePlanningReadiness(prop).hasAnyRoutes).toBe(true);
    expect(derivePlanningReadiness(prop).hasProposedEmitters).toBe(false);
  });

  it('hasAnyAccessNotes is true when accessNotes is non-empty', () => {
    const prop = {
      ...makeMinimalProperty(),
      planningOverlay: {
        accessNotes: [{ id: 'an-01', note: 'Ladder needed' }],
      },
    };
    expect(derivePlanningReadiness(prop).hasAnyAccessNotes).toBe(true);
  });

  it('hasAnyRoomPlans is true when roomPlans is non-empty', () => {
    const prop = {
      ...makeMinimalProperty(),
      planningOverlay: {
        roomPlans: [{ id: 'rp-01', roomId: 'room-01', note: 'Upsize radiator' }],
      },
    };
    expect(derivePlanningReadiness(prop).hasAnyRoomPlans).toBe(true);
  });

  it('hasAnySpecNotes is true when specNotes is non-empty', () => {
    const prop = {
      ...makeMinimalProperty(),
      planningOverlay: {
        specNotes: ['Check water pressure before proceeding'],
      },
    };
    expect(derivePlanningReadiness(prop).hasAnySpecNotes).toBe(true);
  });

  it('all flags are true for a fully populated overlay', () => {
    const prop = {
      ...makeMinimalProperty(),
      planningOverlay: {
        proposedEmitters: [{ id: 'pe-01', roomId: 'room-01', type: 'radiator' as const }],
        routeMarkups: [{ id: 'rm-01', description: 'Flow pipe run' }],
        accessNotes: [{ id: 'an-01', note: 'Ladder needed' }],
        roomPlans: [{ id: 'rp-01', roomId: 'room-01', note: 'Upsize emitter' }],
        specNotes: ['Confirm inhibitor dosing'],
      },
    };
    const readiness = derivePlanningReadiness(prop);
    expect(readiness.hasProposedEmitters).toBe(true);
    expect(readiness.hasAnyRoutes).toBe(true);
    expect(readiness.hasAnyAccessNotes).toBe(true);
    expect(readiness.hasAnyRoomPlans).toBe(true);
    expect(readiness.hasAnySpecNotes).toBe(true);
  });
});

// ─── 9. AtlasPropertyV1 accepts planningOverlay as optional ──────────────────

describe('AtlasPropertyV1 — planningOverlay is optional', () => {
  it('planningOverlay is absent on a minimal property', () => {
    expect(makeMinimalProperty().planningOverlay).toBeUndefined();
  });

  it('property with planningOverlay is valid', () => {
    const prop: AtlasPropertyV1 = {
      ...makeMinimalProperty(),
      planningOverlay: {
        proposedEmitters: [
          {
            id: 'pe-lounge',
            roomId: 'room-lounge',
            type: 'radiator',
            label: 'Lounge main radiator',
            replacesExisting: true,
          },
        ],
        specNotes: ['Hydraulic balance required after install'],
      },
    };
    expect(prop.planningOverlay?.proposedEmitters).toHaveLength(1);
    expect(prop.planningOverlay?.proposedEmitters?.[0]?.type).toBe('radiator');
    expect(prop.planningOverlay?.specNotes?.[0]).toBe('Hydraulic balance required after install');
  });
});

// ─── 10. AtlasKeyObjectType includes electric_meter and gas_meter ─────────────

describe('AtlasKeyObjectType', () => {
  const keyObjectTypes: AtlasKeyObjectType[] = [
    'boiler',
    'heat_pump',
    'cylinder',
    'consumer_unit',
    'electric_meter',
    'gas_meter',
    'manifold',
    'pump_station',
    'other',
  ];

  it('all expected key object types are assignable', () => {
    expect(keyObjectTypes).toContain('electric_meter');
    expect(keyObjectTypes).toContain('gas_meter');
    expect(keyObjectTypes).toHaveLength(9);
  });

  it('electric_meter is a valid AtlasKeyObjectType', () => {
    const t: AtlasKeyObjectType = 'electric_meter';
    expect(t).toBe('electric_meter');
  });

  it('gas_meter is a valid AtlasKeyObjectType', () => {
    const t: AtlasKeyObjectType = 'gas_meter';
    expect(t).toBe('gas_meter');
  });
});
