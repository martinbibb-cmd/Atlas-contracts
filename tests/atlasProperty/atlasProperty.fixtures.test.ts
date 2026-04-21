/**
 * atlasProperty.fixtures.test.ts
 *
 * Fixture-based tests for AtlasPropertyV1.
 *
 * Coverage:
 *   1. Minimal valid AtlasPropertyV1 object constructs without type errors
 *   2. FieldValue wrapper carries correct provenance and confidence
 *   3. BuildingModelV1 empty arrays are valid
 *   4. EvidenceModelV1 empty arrays are valid
 *   5. DerivedModelV1 is optional and absent is valid
 *   6. RecommendationWorkspaceV1 is optional and absent is valid
 *   7. status union covers all expected literals
 *   8. sourceApps array carries expected app identifiers
 *   9. PropertyIdentityV1 partial fields are valid
 *  10. CaptureContextV1 optional operator and device fields are valid
 *  11. Watts / Kilowatts unit wrappers convert correctly
 *  12. WhyNotReasonV1 attaches to RecommendationItemSummaryV1
 */

import { describe, it, expect } from 'vitest';
import type {
  AtlasPropertyV1,
  FieldValue,
  BuildingModelV1,
  HouseholdModelV1,
  CurrentSystemModelV1,
  EvidenceModelV1,
  PropertyIdentityV1,
  CaptureContextV1,
  AtlasPropertyStatus,
  AtlasSourceApp,
  RecommendationItemSummaryV1,
  WhyNotReasonV1,
} from '../../src/atlasProperty/index';
import {
  toWatts,
  toKilowatts,
  wattsToKilowatts,
  kilowattsToWatts,
} from '../../src/atlasProperty/units';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeFieldValue<T>(value: T): FieldValue<T> {
  return {
    value,
    source: 'engineer_entered',
    confidence: 'medium',
  };
}

function makeEmptyBuilding(): BuildingModelV1 {
  return {
    floors: [],
    rooms: [],
    zones: [],
    boundaries: [],
    openings: [],
    emitters: [],
    systemComponents: [],
  };
}

function makeEmptyHousehold(): HouseholdModelV1 {
  return {
    composition: {
      adultCount: makeFieldValue(2),
      childCount0to4: makeFieldValue(0),
      childCount5to10: makeFieldValue(0),
      childCount11to17: makeFieldValue(0),
      youngAdultCount18to25AtHome: makeFieldValue(0),
    },
  };
}

function makeMinimalCurrentSystem(): CurrentSystemModelV1 {
  return {
    family: makeFieldValue('combi' as const),
  };
}

function makeEmptyEvidence(): EvidenceModelV1 {
  return {
    photos: [],
    voiceNotes: [],
    textNotes: [],
    qaFlags: [],
    events: [],
  };
}

function makeMinimalProperty(): AtlasPropertyV1 {
  return {
    version: '1.0',
    propertyId: 'prop-001',
    createdAt: '2025-01-01T09:00:00Z',
    updatedAt: '2025-01-01T09:00:00Z',
    status: 'draft',
    visitStatus: 'draft',
    sourceApps: ['atlas_scan'],
    property: {},
    capture: { sessionId: 'session-001' },
    building: makeEmptyBuilding(),
    household: makeEmptyHousehold(),
    currentSystem: makeMinimalCurrentSystem(),
    evidence: makeEmptyEvidence(),
  };
}

// ─── 1. Minimal valid object ──────────────────────────────────────────────────

describe('AtlasPropertyV1 — minimal valid fixture', () => {
  it('constructs without throwing', () => {
    expect(() => makeMinimalProperty()).not.toThrow();
  });

  it('has the correct version', () => {
    expect(makeMinimalProperty().version).toBe('1.0');
  });

  it('propertyId is present', () => {
    expect(makeMinimalProperty().propertyId).toBe('prop-001');
  });
});

// ─── 2. FieldValue wrapper ────────────────────────────────────────────────────

describe('FieldValue wrapper', () => {
  it('carries value, source, and confidence', () => {
    const fv: FieldValue<number> = {
      value: 42,
      source: 'measured',
      confidence: 'high',
    };
    expect(fv.value).toBe(42);
    expect(fv.source).toBe('measured');
    expect(fv.confidence).toBe('high');
  });

  it('accepts null value', () => {
    const fv: FieldValue<number> = {
      value: null,
      source: 'unknown',
      confidence: 'unknown',
    };
    expect(fv.value).toBeNull();
  });

  it('accepts all optional fields', () => {
    const fv: FieldValue<string> = {
      value: 'detached',
      source: 'customer_stated',
      confidence: 'medium',
      observedAt: '2025-06-01T10:00:00Z',
      observedBy: 'engineer-007',
      notes: 'Customer confirmed at doorstep',
    };
    expect(fv.observedBy).toBe('engineer-007');
  });
});

// ─── 3. BuildingModelV1 empty arrays ─────────────────────────────────────────

describe('BuildingModelV1 — empty arrays', () => {
  it('all required array fields default to empty', () => {
    const b = makeEmptyBuilding();
    expect(b.floors).toHaveLength(0);
    expect(b.rooms).toHaveLength(0);
    expect(b.zones).toHaveLength(0);
    expect(b.boundaries).toHaveLength(0);
    expect(b.openings).toHaveLength(0);
    expect(b.emitters).toHaveLength(0);
    expect(b.systemComponents).toHaveLength(0);
  });

  it('optional arrays are absent by default', () => {
    const b = makeEmptyBuilding();
    expect(b.pipeRoutes).toBeUndefined();
    expect(b.services).toBeUndefined();
  });
});

// ─── 4. EvidenceModelV1 empty arrays ─────────────────────────────────────────

describe('EvidenceModelV1 — empty arrays', () => {
  it('all required array fields default to empty', () => {
    const e = makeEmptyEvidence();
    expect(e.photos).toHaveLength(0);
    expect(e.voiceNotes).toHaveLength(0);
    expect(e.textNotes).toHaveLength(0);
    expect(e.qaFlags).toHaveLength(0);
    expect(e.events).toHaveLength(0);
  });
});

// ─── 5. DerivedModelV1 optional ───────────────────────────────────────────────

describe('AtlasPropertyV1 — derived is optional', () => {
  it('derived is absent on minimal object', () => {
    expect(makeMinimalProperty().derived).toBeUndefined();
  });

  it('accepts derived with spatial fields', () => {
    const prop: AtlasPropertyV1 = {
      ...makeMinimalProperty(),
      derived: {
        spatial: {
          totalFloorAreaM2: 120,
          heatedAreaM2: 100,
          storeyCount: 2,
        },
      },
    };
    expect(prop.derived?.spatial?.totalFloorAreaM2).toBe(120);
  });
});

// ─── 6. RecommendationWorkspaceV1 optional ───────────────────────────────────

describe('AtlasPropertyV1 — recommendations is optional', () => {
  it('recommendations is absent on minimal object', () => {
    expect(makeMinimalProperty().recommendations).toBeUndefined();
  });

  it('accepts a workspace with pending status and empty items', () => {
    const prop: AtlasPropertyV1 = {
      ...makeMinimalProperty(),
      recommendations: {
        status: 'pending',
        items: [],
      },
    };
    expect(prop.recommendations?.status).toBe('pending');
    expect(prop.recommendations?.items).toHaveLength(0);
  });
});

// ─── 7. Status union ─────────────────────────────────────────────────────────

describe('AtlasPropertyStatus', () => {
  const validStatuses: AtlasPropertyStatus[] = [
    'draft',
    'survey_in_progress',
    'ready_for_simulation',
    'simulation_ready',
    'report_ready',
    'archived',
  ];

  for (const status of validStatuses) {
    it(`status '${status}' is accepted`, () => {
      const prop: AtlasPropertyV1 = { ...makeMinimalProperty(), status };
      expect(prop.status).toBe(status);
    });
  }
});

// ─── 8. sourceApps ───────────────────────────────────────────────────────────

describe('AtlasPropertyV1 sourceApps', () => {
  const validApps: AtlasSourceApp[] = [
    'atlas_scan',
    'atlas_mind',
    'atlas_portal',
    'atlas_backend',
  ];

  it('accepts all known app identifiers', () => {
    const prop: AtlasPropertyV1 = {
      ...makeMinimalProperty(),
      sourceApps: validApps,
    };
    expect(prop.sourceApps).toEqual(validApps);
  });

  it('accepts empty sourceApps', () => {
    const prop: AtlasPropertyV1 = { ...makeMinimalProperty(), sourceApps: [] };
    expect(prop.sourceApps).toHaveLength(0);
  });
});

// ─── 9. PropertyIdentityV1 partial fields ────────────────────────────────────

describe('PropertyIdentityV1', () => {
  it('accepts empty object (all fields optional)', () => {
    const identity: PropertyIdentityV1 = {};
    expect(identity).toBeDefined();
  });

  it('accepts full address', () => {
    const identity: PropertyIdentityV1 = {
      address1: '12 Baker Street',
      town: 'London',
      postcode: 'NW1 6XE',
      countryCode: 'GB',
      occupancyType: makeFieldValue('owner_occupied' as const),
      propertyType: makeFieldValue('detached' as const),
      buildEra: makeFieldValue('pre_1919'),
    };
    expect(identity.postcode).toBe('NW1 6XE');
    expect(identity.occupancyType?.value).toBe('owner_occupied');
  });
});

// ─── 10. CaptureContextV1 optional fields ─────────────────────────────────────

describe('CaptureContextV1', () => {
  it('accepts session ID only', () => {
    const ctx: CaptureContextV1 = { sessionId: 'sess-abc' };
    expect(ctx.sessionId).toBe('sess-abc');
    expect(ctx.operator).toBeUndefined();
    expect(ctx.device).toBeUndefined();
  });

  it('accepts full context', () => {
    const ctx: CaptureContextV1 = {
      sessionId: 'sess-abc',
      startedAt: '2025-06-01T09:00:00Z',
      completedAt: '2025-06-01T11:30:00Z',
      operator: { engineerId: 'eng-001', engineerName: 'Alice Smith' },
      device: { app: 'atlas_scan', appVersion: '2.0.0', deviceModel: 'iPhone 15 Pro' },
      walkthrough: { started: true, completed: true, notes: 'All rooms surveyed.' },
    };
    expect(ctx.operator?.engineerName).toBe('Alice Smith');
    expect(ctx.device?.app).toBe('atlas_scan');
    expect(ctx.walkthrough?.completed).toBe(true);
  });
});


// ─── 11. Watts / Kilowatts unit wrappers ─────────────────────────────────────

describe('Watts and Kilowatts unit wrappers', () => {
  it('toWatts creates a Watts-tagged value', () => {
    const w = toWatts(4500);
    expect(w).toBe(4500);
  });

  it('toKilowatts creates a Kilowatts-tagged value', () => {
    const kw = toKilowatts(4.5);
    expect(kw).toBe(4.5);
  });

  it('wattsToKilowatts divides by 1000', () => {
    const w = toWatts(4500);
    const kw = wattsToKilowatts(w);
    expect(kw).toBe(4.5);
  });

  it('kilowattsToWatts multiplies by 1000', () => {
    const kw = toKilowatts(4.5);
    const w = kilowattsToWatts(kw);
    expect(w).toBe(4500);
  });

  it('round-trips Watts → Kilowatts → Watts without loss', () => {
    const original = toWatts(12345);
    const back = kilowattsToWatts(wattsToKilowatts(original));
    expect(back).toBeCloseTo(12345, 6);
  });

  it('round-trips Kilowatts → Watts → Kilowatts without loss', () => {
    const original = toKilowatts(12.345);
    const back = wattsToKilowatts(kilowattsToWatts(original));
    expect(back).toBeCloseTo(12.345, 6);
  });
});

// ─── 12. WhyNotReasonV1 on RecommendationItemSummaryV1 ───────────────────────

describe('WhyNotReasonV1 on RecommendationItemSummaryV1', () => {
  it('accepts a rejected item with whyNotReasons', () => {
    const reason: WhyNotReasonV1 = {
      code: 'hydraulic_capacity_insufficient',
      explanation: 'The existing pipe network cannot deliver the required flow rate.',
      educationalExplainerRef: 'explainer:pipe-capacity',
    };
    const item: RecommendationItemSummaryV1 = {
      itemId: 'item-001',
      category: 'air_source_heat_pump',
      label: 'Air Source Heat Pump',
      status: 'rejected',
      whyNotReasons: [reason],
    };
    expect(item.whyNotReasons).toHaveLength(1);
    expect(item.whyNotReasons![0].code).toBe('hydraulic_capacity_insufficient');
    expect(item.whyNotReasons![0].educationalExplainerRef).toBe('explainer:pipe-capacity');
  });

  it('accepts an accepted item without whyNotReasons', () => {
    const item: RecommendationItemSummaryV1 = {
      itemId: 'item-002',
      category: 'replacement_boiler',
      label: 'Replacement Boiler',
      status: 'accepted',
    };
    expect(item.whyNotReasons).toBeUndefined();
  });

  it('accepts a WhyNotReasonV1 without educationalExplainerRef', () => {
    const reason: WhyNotReasonV1 = {
      code: 'flue_clearance_violation',
      explanation: 'The proposed flue location violates BS 6798 clearance requirements.',
    };
    expect(reason.educationalExplainerRef).toBeUndefined();
  });
});
