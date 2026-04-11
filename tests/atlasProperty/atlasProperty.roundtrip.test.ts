/**
 * atlasProperty.roundtrip.test.ts
 *
 * JSON serialisation round-trip tests for AtlasPropertyV1.
 *
 * Verifies that AtlasPropertyV1 objects survive JSON.stringify → JSON.parse
 * with no data loss, confirming the contract is safe to serialise over the
 * wire or to disk.
 *
 * Coverage:
 *   1. Minimal property round-trips correctly
 *   2. Full property with all sub-models round-trips correctly
 *   3. FieldValue with all optional fields survives round-trip
 *   4. Evidence arrays survive round-trip
 *   5. Derived model survives round-trip
 *   6. Recommendations workspace survives round-trip
 *   7. Nested building model structures survive round-trip
 *   8. Unknown extra fields are preserved through round-trip (forward compat)
 */

import { describe, it, expect } from 'vitest';
import type {
  AtlasPropertyV1,
  FieldValue,
  EvidenceModelV1,
  BuildingModelV1,
  FloorV1,
  RoomV1,
  EmitterV1,
  PhotoEvidenceV1,
  VoiceNoteEvidenceV1,
  QAFlagV1,
  TimelineEventV1,
  DerivedModelV1,
  RecommendationWorkspaceV1,
  RecommendationItemSummaryV1,
} from '../../src/atlasProperty/index';

// ─── Helper ───────────────────────────────────────────────────────────────────

function roundTrip<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function fv<T>(value: T, source: FieldValue<T>['source'] = 'measured'): FieldValue<T> {
  return { value, source, confidence: 'high' };
}

// ─── Minimal fixture ──────────────────────────────────────────────────────────

function minimalProperty(): AtlasPropertyV1 {
  return {
    version: '1.0',
    propertyId: 'rt-prop-001',
    createdAt: '2025-03-01T08:00:00Z',
    updatedAt: '2025-03-01T08:00:00Z',
    status: 'draft',
    sourceApps: ['atlas_scan'],
    property: {},
    capture: { sessionId: 'rt-session-001' },
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
        adultCount: fv(2),
        childCount0to4: fv(0),
        childCount5to10: fv(0),
        childCount11to17: fv(0),
        youngAdultCount18to25AtHome: fv(0),
      },
    },
    currentSystem: {
      family: fv('combi' as const),
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

// ─── 1. Minimal round-trip ────────────────────────────────────────────────────

describe('AtlasPropertyV1 round-trip — minimal', () => {
  it('propertyId survives', () => {
    const rt = roundTrip(minimalProperty());
    expect(rt.propertyId).toBe('rt-prop-001');
  });

  it('version survives', () => {
    expect(roundTrip(minimalProperty()).version).toBe('1.0');
  });

  it('status survives', () => {
    expect(roundTrip(minimalProperty()).status).toBe('draft');
  });

  it('sourceApps array survives', () => {
    expect(roundTrip(minimalProperty()).sourceApps).toEqual(['atlas_scan']);
  });
});

// ─── 2. Full property round-trip ─────────────────────────────────────────────

describe('AtlasPropertyV1 round-trip — full sub-models', () => {
  const floor: FloorV1 = {
    floorId: 'floor-gnd',
    index: 0,
    label: 'Ground Floor',
    heightM: fv(2.4),
  };

  const room: RoomV1 = {
    roomId: 'room-kitchen',
    floorId: 'floor-gnd',
    label: 'Kitchen',
    areaM2: fv(18.5),
    heightM: fv(2.4),
    heated: true,
  };

  const emitter: EmitterV1 = {
    emitterId: 'emitter-rad-01',
    roomId: 'room-kitchen',
    type: 'panel_radiator',
    ratedOutputW: fv(1200),
    trvFitted: fv(true),
  };

  const building: BuildingModelV1 = {
    floors: [floor],
    rooms: [room],
    zones: [
      { zoneId: 'zone-gnd', label: 'Ground Floor Zone', roomIds: ['room-kitchen'], heated: true },
    ],
    boundaries: [],
    openings: [],
    emitters: [emitter],
    systemComponents: [
      {
        componentId: 'comp-boiler',
        category: 'boiler',
        label: 'Worcester Bosch 30i',
        roomId: 'room-kitchen',
        installYear: fv(2018),
        condition: fv('good' as const),
      },
    ],
  };

  const evidence: EvidenceModelV1 = {
    photos: [
      {
        photoId: 'photo-001',
        capturedAt: '2025-03-01T09:15:00Z',
        tag: 'boiler',
        link: { roomId: 'room-kitchen' },
        caption: 'Boiler front panel',
      } satisfies PhotoEvidenceV1,
    ],
    voiceNotes: [
      {
        voiceNoteId: 'voice-001',
        capturedAt: '2025-03-01T09:20:00Z',
        durationSeconds: 12.5,
        transcript: 'Customer confirmed boiler is 7 years old.',
        kind: 'observation',
        link: { componentId: 'comp-boiler' },
      } satisfies VoiceNoteEvidenceV1,
    ],
    textNotes: [],
    qaFlags: [
      {
        flagId: 'flag-001',
        code: 'INHIBITOR_NOT_PRESENT',
        message: 'No inhibitor detected in system water.',
        severity: 'warning',
        entityType: 'property',
      } satisfies QAFlagV1,
    ],
    events: [
      {
        eventId: 'evt-001',
        occurredAt: '2025-03-01T09:00:00Z',
        type: 'session_started',
      } satisfies TimelineEventV1,
    ],
  };

  const full: AtlasPropertyV1 = {
    ...minimalProperty(),
    status: 'survey_in_progress',
    sourceApps: ['atlas_scan', 'atlas_mind'],
    property: {
      address1: '14 Elm Road',
      town: 'Manchester',
      postcode: 'M1 1AA',
      countryCode: 'GB',
      propertyType: fv('semi_detached' as const),
      buildEra: { value: '1950_to_1966', source: 'imported', confidence: 'medium' },
    },
    capture: {
      sessionId: 'rt-session-001',
      startedAt: '2025-03-01T09:00:00Z',
      operator: { engineerId: 'eng-042', engineerName: 'Bob Jones' },
      device: { app: 'atlas_scan', appVersion: '2.0.1', deviceModel: 'iPhone 15 Pro' },
    },
    building,
    evidence,
  };

  it('floors survive round-trip', () => {
    const rt = roundTrip(full);
    expect(rt.building.floors[0]?.floorId).toBe('floor-gnd');
    expect(rt.building.floors[0]?.heightM?.value).toBe(2.4);
  });

  it('rooms survive round-trip', () => {
    const rt = roundTrip(full);
    expect(rt.building.rooms[0]?.label).toBe('Kitchen');
    expect(rt.building.rooms[0]?.areaM2?.source).toBe('measured');
  });

  it('emitters survive round-trip', () => {
    const rt = roundTrip(full);
    expect(rt.building.emitters[0]?.type).toBe('panel_radiator');
    expect(rt.building.emitters[0]?.ratedOutputW?.value).toBe(1200);
  });

  it('photos survive round-trip', () => {
    const rt = roundTrip(full);
    expect(rt.evidence.photos[0]?.tag).toBe('boiler');
    expect(rt.evidence.photos[0]?.link?.roomId).toBe('room-kitchen');
  });

  it('voice notes survive round-trip', () => {
    const rt = roundTrip(full);
    expect(rt.evidence.voiceNotes[0]?.durationSeconds).toBe(12.5);
    expect(rt.evidence.voiceNotes[0]?.kind).toBe('observation');
  });

  it('QA flags survive round-trip', () => {
    const rt = roundTrip(full);
    expect(rt.evidence.qaFlags[0]?.code).toBe('INHIBITOR_NOT_PRESENT');
    expect(rt.evidence.qaFlags[0]?.severity).toBe('warning');
  });

  it('timeline events survive round-trip', () => {
    const rt = roundTrip(full);
    expect(rt.evidence.events[0]?.type).toBe('session_started');
  });

  it('address fields survive round-trip', () => {
    const rt = roundTrip(full);
    expect(rt.property.postcode).toBe('M1 1AA');
    expect(rt.property.propertyType?.value).toBe('semi_detached');
  });

  it('operator fields survive round-trip', () => {
    const rt = roundTrip(full);
    expect(rt.capture.operator?.engineerName).toBe('Bob Jones');
  });
});

// ─── 3. FieldValue optional fields ───────────────────────────────────────────

describe('FieldValue — optional fields round-trip', () => {
  it('all optional fields survive', () => {
    const fvFull: FieldValue<number> = {
      value: 98.6,
      source: 'measured',
      confidence: 'high',
      observedAt: '2025-06-01T10:00:00Z',
      observedBy: 'sensor-01',
      notes: 'Calibrated sensor reading',
    };
    const rt = roundTrip(fvFull);
    expect(rt.observedAt).toBe('2025-06-01T10:00:00Z');
    expect(rt.observedBy).toBe('sensor-01');
    expect(rt.notes).toBe('Calibrated sensor reading');
  });

  it('null value survives', () => {
    const fvNull: FieldValue<number> = { value: null, source: 'unknown', confidence: 'unknown' };
    expect(roundTrip(fvNull).value).toBeNull();
  });
});

// ─── 4. Evidence arrays survive ───────────────────────────────────────────────

describe('EvidenceModelV1 — populated arrays round-trip', () => {
  it('multiple photos survive', () => {
    const prop: AtlasPropertyV1 = {
      ...minimalProperty(),
      evidence: {
        ...minimalProperty().evidence,
        photos: [
          { photoId: 'p1', capturedAt: '2025-01-01T00:00:00Z', tag: 'boiler' },
          { photoId: 'p2', capturedAt: '2025-01-01T00:01:00Z', tag: 'radiator' },
        ],
      },
    };
    const rt = roundTrip(prop);
    expect(rt.evidence.photos).toHaveLength(2);
    expect(rt.evidence.photos[1]?.tag).toBe('radiator');
  });
});

// ─── 5. Derived model round-trip ─────────────────────────────────────────────

describe('DerivedModelV1 round-trip', () => {
  const derived: DerivedModelV1 = {
    spatial: { totalFloorAreaM2: 135, heatedAreaM2: 110, storeyCount: 2 },
    heatLoss: {
      peakWatts: { value: 9500, source: 'derived', confidence: 'medium' },
      roomResults: [
        { roomId: 'room-kitchen', fabricLossW: 800, ventilationLossW: 200, totalLossW: 1000 },
      ],
    },
    hydraulics: {
      mainsFlowLpm: { value: 22, source: 'measured', confidence: 'high' },
    },
  };

  it('spatial fields survive', () => {
    const rt = roundTrip(derived);
    expect(rt.spatial?.heatedAreaM2).toBe(110);
  });

  it('heatLoss peak watts survive', () => {
    const rt = roundTrip(derived);
    expect(rt.heatLoss?.peakWatts?.value).toBe(9500);
  });

  it('room results survive', () => {
    const rt = roundTrip(derived);
    expect(rt.heatLoss?.roomResults?.[0]?.roomId).toBe('room-kitchen');
    expect(rt.heatLoss?.roomResults?.[0]?.totalLossW).toBe(1000);
  });

  it('hydraulics survive', () => {
    const rt = roundTrip(derived);
    expect(rt.hydraulics?.mainsFlowLpm?.value).toBe(22);
  });
});

// ─── 6. Recommendations workspace round-trip ─────────────────────────────────

describe('RecommendationWorkspaceV1 round-trip', () => {
  const item: RecommendationItemSummaryV1 = {
    itemId: 'rec-001',
    category: 'air_source_heat_pump',
    label: 'Air Source Heat Pump',
    rank: 1,
    estimatedCostGbp: 12500,
    estimatedCarbonSavingKgCo2e: 1800,
    estimatedBillSavingGbp: 650,
    status: 'draft',
  };

  const workspace: RecommendationWorkspaceV1 = {
    engineRef: 'engine-workspace-xyz',
    lastRunAt: '2025-05-01T12:00:00Z',
    status: 'draft',
    items: [item],
  };

  it('status survives', () => {
    expect(roundTrip(workspace).status).toBe('draft');
  });

  it('item fields survive', () => {
    const rt = roundTrip(workspace);
    expect(rt.items[0]?.category).toBe('air_source_heat_pump');
    expect(rt.items[0]?.estimatedCostGbp).toBe(12500);
    expect(rt.items[0]?.status).toBe('draft');
  });

  it('engineRef survives', () => {
    expect(roundTrip(workspace).engineRef).toBe('engine-workspace-xyz');
  });
});

// ─── 7. Nested building model ─────────────────────────────────────────────────

describe('BuildingModelV1 — nested structures round-trip', () => {
  it('services model survives', () => {
    const prop: AtlasPropertyV1 = {
      ...minimalProperty(),
      building: {
        ...minimalProperty().building,
        services: {
          gas: {
            present: fv(true),
            meterAccessible: fv(true),
            meterLocation: { value: 'Under stairs cupboard', source: 'observed', confidence: 'high' },
          },
          electricity: {
            phase: { value: 'single', source: 'observed', confidence: 'high' },
            mainFuseAmps: fv(100),
          },
        },
      },
    };
    const rt = roundTrip(prop);
    expect(rt.building.services?.gas?.present.value).toBe(true);
    expect(rt.building.services?.electricity?.mainFuseAmps?.value).toBe(100);
  });

  it('pipe routes survive', () => {
    const prop: AtlasPropertyV1 = {
      ...minimalProperty(),
      building: {
        ...minimalProperty().building,
        pipeRoutes: [
          {
            routeId: 'pipe-01',
            medium: 'heating_flow',
            diameterMm: fv(22),
            material: { value: 'copper', source: 'observed', confidence: 'high' },
            lengthM: fv(14.5),
            insulated: fv(false),
          },
        ],
      },
    };
    const rt = roundTrip(prop);
    expect(rt.building.pipeRoutes?.[0]?.medium).toBe('heating_flow');
    expect(rt.building.pipeRoutes?.[0]?.diameterMm?.value).toBe(22);
  });
});

// ─── 8. Forward-compat: unknown extra fields ──────────────────────────────────

describe('Forward compatibility — unknown extra fields', () => {
  it('extra top-level fields are preserved through JSON round-trip', () => {
    const extended = {
      ...minimalProperty(),
      futureField: 'future-value',
    } as unknown as AtlasPropertyV1 & { futureField: string };

    const rt = roundTrip(extended) as typeof extended;
    expect(rt.futureField).toBe('future-value');
  });
});
