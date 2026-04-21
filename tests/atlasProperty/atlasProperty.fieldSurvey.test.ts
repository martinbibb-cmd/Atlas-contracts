/**
 * atlasProperty.fieldSurvey.test.ts
 *
 * Tests for the minimal field survey payload types and the
 * deriveVisitReadinessFromFieldSurvey helper.
 *
 * Coverage:
 *   1.  AtlasRoomLiteV1 — minimal (id + label only)
 *   2.  AtlasRoomLiteV1 — full (all optional fields)
 *   3.  AtlasRoomLiteV1 — all roomType literals are accepted
 *   4.  AtlasPhotoEvidenceV1 — minimal (id + uri only)
 *   5.  AtlasPhotoEvidenceV1 — full (all optional fields)
 *   6.  AtlasKeyObjectV1 — minimal (id + type only)
 *   7.  AtlasKeyObjectV1 — all AtlasKeyObjectType literals are accepted
 *   8.  AtlasVisitNotesV1 — all fields optional; empty object is valid
 *   9.  AtlasSystemPresenceV1 — all fields optional; empty object is valid
 *  10.  AtlasSystemPresenceV1 — all heatingSystemType literals are accepted
 *  11.  AtlasSystemPresenceV1 — all hotWaterSystemType literals are accepted
 *  12.  AtlasFieldSurveyV1 — empty container is valid
 *  13.  AtlasFieldSurveyV1 — full container survives JSON round-trip
 *  14.  AtlasPropertyV1 — fieldSurvey is absent on minimal fixture
 *  15.  AtlasPropertyV1 — accepts fieldSurvey when provided
 *  16.  deriveVisitReadinessFromFieldSurvey — all-false when fieldSurvey absent
 *  17.  deriveVisitReadinessFromFieldSurvey — hasRooms true when rooms present
 *  18.  deriveVisitReadinessFromFieldSurvey — hasPhotos true when photos present
 *  19.  deriveVisitReadinessFromFieldSurvey — hasKeyObjectBoiler from keyObjects
 *  20.  deriveVisitReadinessFromFieldSurvey — hasKeyObjectFlue from keyObjects
 *  21.  deriveVisitReadinessFromFieldSurvey — hasHeatingSystem from systemPresence
 *  22.  deriveVisitReadinessFromFieldSurvey — hasHeatingSystem from boiler key object
 *  23.  deriveVisitReadinessFromFieldSurvey — hasHotWaterSystem from systemPresence
 *  24.  deriveVisitReadinessFromFieldSurvey — hasHotWaterSystem from cylinder/tank key object
 *  25.  deriveVisitReadinessFromFieldSurvey — hasAnyNotes from rawTranscript
 *  26.  deriveVisitReadinessFromFieldSurvey — hasAnyNotes from summary
 *  27.  deriveVisitReadinessFromFieldSurvey — hasAnyNotes from textNotes array
 *  28.  deriveVisitReadinessFromFieldSurvey — fully populated survey returns all-true
 *  29.  deriveVisitReadinessFromFieldSurvey — result survives JSON round-trip
 */

import { describe, it, expect } from 'vitest';
import type {
  AtlasRoomLiteV1,
  AtlasPhotoEvidenceV1,
  AtlasKeyObjectType,
  AtlasKeyObjectV1,
  AtlasVisitNotesV1,
  AtlasSystemPresenceV1,
  AtlasFieldSurveyV1,
  AtlasPropertyV1,
} from '../../src/atlasProperty/index';
import { deriveVisitReadinessFromFieldSurvey } from '../../src/atlasProperty/index';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roundTrip<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function minimalProperty(): AtlasPropertyV1 {
  return {
    version: '1.0',
    propertyId: 'fs-prop-001',
    createdAt: '2025-06-01T08:00:00Z',
    updatedAt: '2025-06-01T08:00:00Z',
    status: 'draft',
    visitStatus: 'draft',
    sourceApps: ['atlas_scan'],
    property: {},
    capture: { sessionId: 'fs-session-001' },
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

// ─── 1. AtlasRoomLiteV1 — minimal ────────────────────────────────────────────

describe('AtlasRoomLiteV1 — minimal', () => {
  it('accepts id and label only', () => {
    const room: AtlasRoomLiteV1 = { id: 'room-1', label: 'Kitchen' };
    expect(room.id).toBe('room-1');
    expect(room.label).toBe('Kitchen');
    expect(room.roomType).toBeUndefined();
    expect(room.floorLabel).toBeUndefined();
  });
});

// ─── 2. AtlasRoomLiteV1 — full ───────────────────────────────────────────────

describe('AtlasRoomLiteV1 — full', () => {
  it('accepts all optional fields', () => {
    const room: AtlasRoomLiteV1 = {
      id: 'room-2',
      label: 'Bedroom 1',
      roomType: 'bedroom',
      floorLabel: 'First Floor',
    };
    expect(room.roomType).toBe('bedroom');
    expect(room.floorLabel).toBe('First Floor');
  });
});

// ─── 3. AtlasRoomLiteV1 — roomType literals ───────────────────────────────────

describe('AtlasRoomLiteV1 — roomType literals', () => {
  const roomTypes: NonNullable<AtlasRoomLiteV1['roomType']>[] = [
    'living_room',
    'kitchen',
    'bedroom',
    'bathroom',
    'hallway',
    'landing',
    'utility',
    'loft',
    'garage',
    'other',
  ];

  for (const roomType of roomTypes) {
    it(`accepts roomType '${roomType}'`, () => {
      const room: AtlasRoomLiteV1 = { id: 'r', label: 'r', roomType };
      expect(room.roomType).toBe(roomType);
    });
  }
});

// ─── 4. AtlasPhotoEvidenceV1 — minimal ───────────────────────────────────────

describe('AtlasPhotoEvidenceV1 — minimal', () => {
  it('accepts id and uri only', () => {
    const photo: AtlasPhotoEvidenceV1 = { id: 'photo-1', uri: 'file:///local/photo.jpg' };
    expect(photo.id).toBe('photo-1');
    expect(photo.uri).toBe('file:///local/photo.jpg');
    expect(photo.capturedAt).toBeUndefined();
    expect(photo.roomId).toBeUndefined();
    expect(photo.caption).toBeUndefined();
    expect(photo.tags).toBeUndefined();
  });
});

// ─── 5. AtlasPhotoEvidenceV1 — full ──────────────────────────────────────────

describe('AtlasPhotoEvidenceV1 — full', () => {
  it('accepts all optional fields', () => {
    const photo: AtlasPhotoEvidenceV1 = {
      id: 'photo-2',
      uri: 'https://storage.example.com/photo.jpg',
      capturedAt: '2025-06-01T09:15:00Z',
      roomId: 'room-1',
      caption: 'Front of boiler',
      tags: ['boiler', 'heating'],
    };
    expect(photo.capturedAt).toBe('2025-06-01T09:15:00Z');
    expect(photo.roomId).toBe('room-1');
    expect(photo.tags).toEqual(['boiler', 'heating']);
  });
});

// ─── 6. AtlasKeyObjectV1 — minimal ───────────────────────────────────────────

describe('AtlasKeyObjectV1 — minimal', () => {
  it('accepts id and type only', () => {
    const obj: AtlasKeyObjectV1 = { id: 'obj-1', type: 'boiler' };
    expect(obj.id).toBe('obj-1');
    expect(obj.type).toBe('boiler');
    expect(obj.label).toBeUndefined();
    expect(obj.roomId).toBeUndefined();
    expect(obj.notes).toBeUndefined();
  });
});

// ─── 7. AtlasKeyObjectV1 — all type literals ──────────────────────────────────

describe('AtlasKeyObjectV1 — AtlasKeyObjectType literals', () => {
  const types: AtlasKeyObjectType[] = [
    'boiler',
    'flue',
    'cylinder',
    'radiator',
    'hot_water_tank',
    'consumer_unit',
    'meter',
    'other',
  ];

  for (const type of types) {
    it(`accepts type '${type}'`, () => {
      const obj: AtlasKeyObjectV1 = { id: 'o', type };
      expect(obj.type).toBe(type);
    });
  }
});

// ─── 8. AtlasVisitNotesV1 — optional fields ───────────────────────────────────

describe('AtlasVisitNotesV1', () => {
  it('accepts an empty object', () => {
    const notes: AtlasVisitNotesV1 = {};
    expect(notes.rawTranscript).toBeUndefined();
    expect(notes.summary).toBeUndefined();
    expect(notes.textNotes).toBeUndefined();
  });

  it('accepts all fields', () => {
    const notes: AtlasVisitNotesV1 = {
      rawTranscript: 'Customer said the boiler is seven years old.',
      summary: 'Boiler age: 7 years.',
      textNotes: ['Check flue clearance', 'Inhibitor not confirmed'],
    };
    expect(notes.rawTranscript).toBeDefined();
    expect(notes.textNotes).toHaveLength(2);
  });
});

// ─── 9. AtlasSystemPresenceV1 — empty object ─────────────────────────────────

describe('AtlasSystemPresenceV1 — empty object', () => {
  it('accepts empty object (all fields optional)', () => {
    const presence: AtlasSystemPresenceV1 = {};
    expect(presence.heatingSystemPresent).toBeUndefined();
    expect(presence.hotWaterSystemPresent).toBeUndefined();
    expect(presence.heatingSystemType).toBeUndefined();
    expect(presence.hotWaterSystemType).toBeUndefined();
  });
});

// ─── 10. AtlasSystemPresenceV1 — heatingSystemType literals ──────────────────

describe('AtlasSystemPresenceV1 — heatingSystemType literals', () => {
  const types: NonNullable<AtlasSystemPresenceV1['heatingSystemType']>[] = [
    'combi',
    'system_boiler',
    'regular_boiler',
    'heat_pump',
    'direct_electric',
    'unknown',
    'other',
  ];

  for (const heatingSystemType of types) {
    it(`accepts heatingSystemType '${heatingSystemType}'`, () => {
      const presence: AtlasSystemPresenceV1 = { heatingSystemType };
      expect(presence.heatingSystemType).toBe(heatingSystemType);
    });
  }
});

// ─── 11. AtlasSystemPresenceV1 — hotWaterSystemType literals ─────────────────

describe('AtlasSystemPresenceV1 — hotWaterSystemType literals', () => {
  const types: NonNullable<AtlasSystemPresenceV1['hotWaterSystemType']>[] = [
    'combi',
    'cylinder',
    'direct_electric',
    'heat_pump',
    'unknown',
    'other',
  ];

  for (const hotWaterSystemType of types) {
    it(`accepts hotWaterSystemType '${hotWaterSystemType}'`, () => {
      const presence: AtlasSystemPresenceV1 = { hotWaterSystemType };
      expect(presence.hotWaterSystemType).toBe(hotWaterSystemType);
    });
  }
});

// ─── 12. AtlasFieldSurveyV1 — empty container ────────────────────────────────

describe('AtlasFieldSurveyV1 — empty container', () => {
  it('accepts an empty object (all fields optional)', () => {
    const survey: AtlasFieldSurveyV1 = {};
    expect(survey.rooms).toBeUndefined();
    expect(survey.photos).toBeUndefined();
    expect(survey.keyObjects).toBeUndefined();
    expect(survey.notes).toBeUndefined();
    expect(survey.systemPresence).toBeUndefined();
  });
});

// ─── 13. AtlasFieldSurveyV1 — round-trip ──────────────────────────────────────

describe('AtlasFieldSurveyV1 — JSON round-trip', () => {
  it('fully populated survey survives round-trip', () => {
    const survey: AtlasFieldSurveyV1 = {
      rooms: [
        { id: 'room-1', label: 'Kitchen', roomType: 'kitchen', floorLabel: 'Ground Floor' },
      ],
      photos: [
        { id: 'photo-1', uri: 'file:///photo.jpg', capturedAt: '2025-06-01T09:00:00Z', roomId: 'room-1', tags: ['boiler'] },
      ],
      keyObjects: [
        { id: 'obj-1', type: 'boiler', label: 'Main boiler', roomId: 'room-1', notes: 'Worcester 30i' },
        { id: 'obj-2', type: 'flue' },
      ],
      notes: {
        rawTranscript: 'Boiler is in the kitchen.',
        summary: 'Boiler location confirmed.',
        textNotes: ['Check inhibitor'],
      },
      systemPresence: {
        heatingSystemPresent: true,
        hotWaterSystemPresent: true,
        heatingSystemType: 'combi',
        hotWaterSystemType: 'combi',
      },
    };

    const rt = roundTrip(survey);
    expect(rt.rooms?.[0]?.label).toBe('Kitchen');
    expect(rt.photos?.[0]?.uri).toBe('file:///photo.jpg');
    expect(rt.keyObjects?.[0]?.type).toBe('boiler');
    expect(rt.keyObjects?.[1]?.type).toBe('flue');
    expect(rt.notes?.rawTranscript).toBe('Boiler is in the kitchen.');
    expect(rt.notes?.textNotes?.[0]).toBe('Check inhibitor');
    expect(rt.systemPresence?.heatingSystemType).toBe('combi');
  });
});

// ─── 14. AtlasPropertyV1 — fieldSurvey absent by default ─────────────────────

describe('AtlasPropertyV1 — fieldSurvey is optional', () => {
  it('fieldSurvey is absent on minimal fixture', () => {
    expect(minimalProperty().fieldSurvey).toBeUndefined();
  });
});

// ─── 15. AtlasPropertyV1 — accepts fieldSurvey ───────────────────────────────

describe('AtlasPropertyV1 — accepts fieldSurvey', () => {
  it('accepts a fully populated fieldSurvey', () => {
    const prop: AtlasPropertyV1 = {
      ...minimalProperty(),
      fieldSurvey: {
        rooms: [{ id: 'r1', label: 'Hallway', roomType: 'hallway' }],
        photos: [{ id: 'p1', uri: 'file:///p1.jpg' }],
        keyObjects: [{ id: 'k1', type: 'boiler' }],
        notes: { textNotes: ['All rooms visited'] },
        systemPresence: { heatingSystemPresent: true },
      },
    };
    expect(prop.fieldSurvey?.rooms).toHaveLength(1);
    expect(prop.fieldSurvey?.systemPresence?.heatingSystemPresent).toBe(true);
  });
});

// ─── 16. deriveVisitReadinessFromFieldSurvey — all-false when absent ─────────

describe('deriveVisitReadinessFromFieldSurvey — absent fieldSurvey', () => {
  it('returns all-false when fieldSurvey is absent', () => {
    const readiness = deriveVisitReadinessFromFieldSurvey(minimalProperty());
    expect(readiness.hasRooms).toBe(false);
    expect(readiness.hasPhotos).toBe(false);
    expect(readiness.hasHeatingSystem).toBe(false);
    expect(readiness.hasHotWaterSystem).toBe(false);
    expect(readiness.hasKeyObjectBoiler).toBe(false);
    expect(readiness.hasKeyObjectFlue).toBe(false);
    expect(readiness.hasAnyNotes).toBe(false);
  });

  it('returns all-false when fieldSurvey is empty', () => {
    const readiness = deriveVisitReadinessFromFieldSurvey({ fieldSurvey: {} });
    expect(readiness.hasRooms).toBe(false);
    expect(readiness.hasAnyNotes).toBe(false);
  });
});

// ─── 17. hasRooms ─────────────────────────────────────────────────────────────

describe('deriveVisitReadinessFromFieldSurvey — hasRooms', () => {
  it('is true when rooms array has at least one entry', () => {
    const r = deriveVisitReadinessFromFieldSurvey({
      fieldSurvey: { rooms: [{ id: 'r1', label: 'Kitchen' }] },
    });
    expect(r.hasRooms).toBe(true);
  });

  it('is false when rooms array is empty', () => {
    const r = deriveVisitReadinessFromFieldSurvey({ fieldSurvey: { rooms: [] } });
    expect(r.hasRooms).toBe(false);
  });
});

// ─── 18. hasPhotos ────────────────────────────────────────────────────────────

describe('deriveVisitReadinessFromFieldSurvey — hasPhotos', () => {
  it('is true when photos array has at least one entry', () => {
    const r = deriveVisitReadinessFromFieldSurvey({
      fieldSurvey: { photos: [{ id: 'p1', uri: 'file:///p1.jpg' }] },
    });
    expect(r.hasPhotos).toBe(true);
  });

  it('is false when photos array is empty', () => {
    const r = deriveVisitReadinessFromFieldSurvey({ fieldSurvey: { photos: [] } });
    expect(r.hasPhotos).toBe(false);
  });
});

// ─── 19. hasKeyObjectBoiler ───────────────────────────────────────────────────

describe('deriveVisitReadinessFromFieldSurvey — hasKeyObjectBoiler', () => {
  it('is true when a boiler key object is present', () => {
    const r = deriveVisitReadinessFromFieldSurvey({
      fieldSurvey: { keyObjects: [{ id: 'k1', type: 'boiler' }] },
    });
    expect(r.hasKeyObjectBoiler).toBe(true);
  });

  it('is false when no boiler key object is present', () => {
    const r = deriveVisitReadinessFromFieldSurvey({
      fieldSurvey: { keyObjects: [{ id: 'k1', type: 'meter' }] },
    });
    expect(r.hasKeyObjectBoiler).toBe(false);
  });
});

// ─── 20. hasKeyObjectFlue ─────────────────────────────────────────────────────

describe('deriveVisitReadinessFromFieldSurvey — hasKeyObjectFlue', () => {
  it('is true when a flue key object is present', () => {
    const r = deriveVisitReadinessFromFieldSurvey({
      fieldSurvey: { keyObjects: [{ id: 'k1', type: 'flue' }] },
    });
    expect(r.hasKeyObjectFlue).toBe(true);
  });

  it('is false when no flue key object is present', () => {
    const r = deriveVisitReadinessFromFieldSurvey({
      fieldSurvey: { keyObjects: [{ id: 'k1', type: 'boiler' }] },
    });
    expect(r.hasKeyObjectFlue).toBe(false);
  });
});

// ─── 21. hasHeatingSystem — from systemPresence ───────────────────────────────

describe('deriveVisitReadinessFromFieldSurvey — hasHeatingSystem (systemPresence)', () => {
  it('is true when heatingSystemPresent is true', () => {
    const r = deriveVisitReadinessFromFieldSurvey({
      fieldSurvey: { systemPresence: { heatingSystemPresent: true } },
    });
    expect(r.hasHeatingSystem).toBe(true);
  });

  it('is false when heatingSystemPresent is false', () => {
    const r = deriveVisitReadinessFromFieldSurvey({
      fieldSurvey: { systemPresence: { heatingSystemPresent: false } },
    });
    expect(r.hasHeatingSystem).toBe(false);
  });
});

// ─── 22. hasHeatingSystem — inferred from boiler key object ───────────────────

describe('deriveVisitReadinessFromFieldSurvey — hasHeatingSystem (from boiler)', () => {
  it('is true when a boiler key object is present even without systemPresence', () => {
    const r = deriveVisitReadinessFromFieldSurvey({
      fieldSurvey: { keyObjects: [{ id: 'k1', type: 'boiler' }] },
    });
    expect(r.hasHeatingSystem).toBe(true);
  });
});

// ─── 23. hasHotWaterSystem — from systemPresence ──────────────────────────────

describe('deriveVisitReadinessFromFieldSurvey — hasHotWaterSystem (systemPresence)', () => {
  it('is true when hotWaterSystemPresent is true', () => {
    const r = deriveVisitReadinessFromFieldSurvey({
      fieldSurvey: { systemPresence: { hotWaterSystemPresent: true } },
    });
    expect(r.hasHotWaterSystem).toBe(true);
  });

  it('is false when hotWaterSystemPresent is false', () => {
    const r = deriveVisitReadinessFromFieldSurvey({
      fieldSurvey: { systemPresence: { hotWaterSystemPresent: false } },
    });
    expect(r.hasHotWaterSystem).toBe(false);
  });
});

// ─── 24. hasHotWaterSystem — inferred from cylinder / tank ────────────────────

describe('deriveVisitReadinessFromFieldSurvey — hasHotWaterSystem (from cylinder/tank)', () => {
  it('is true when a cylinder key object is present', () => {
    const r = deriveVisitReadinessFromFieldSurvey({
      fieldSurvey: { keyObjects: [{ id: 'k1', type: 'cylinder' }] },
    });
    expect(r.hasHotWaterSystem).toBe(true);
  });

  it('is true when a hot_water_tank key object is present', () => {
    const r = deriveVisitReadinessFromFieldSurvey({
      fieldSurvey: { keyObjects: [{ id: 'k1', type: 'hot_water_tank' }] },
    });
    expect(r.hasHotWaterSystem).toBe(true);
  });
});

// ─── 25. hasAnyNotes — rawTranscript ──────────────────────────────────────────

describe('deriveVisitReadinessFromFieldSurvey — hasAnyNotes (rawTranscript)', () => {
  it('is true when rawTranscript is non-empty', () => {
    const r = deriveVisitReadinessFromFieldSurvey({
      fieldSurvey: { notes: { rawTranscript: 'Some captured speech.' } },
    });
    expect(r.hasAnyNotes).toBe(true);
  });

  it('is false when rawTranscript is empty string', () => {
    const r = deriveVisitReadinessFromFieldSurvey({
      fieldSurvey: { notes: { rawTranscript: '' } },
    });
    expect(r.hasAnyNotes).toBe(false);
  });
});

// ─── 26. hasAnyNotes — summary ───────────────────────────────────────────────

describe('deriveVisitReadinessFromFieldSurvey — hasAnyNotes (summary)', () => {
  it('is true when summary is non-empty', () => {
    const r = deriveVisitReadinessFromFieldSurvey({
      fieldSurvey: { notes: { summary: 'Boiler age noted.' } },
    });
    expect(r.hasAnyNotes).toBe(true);
  });
});

// ─── 27. hasAnyNotes — textNotes ─────────────────────────────────────────────

describe('deriveVisitReadinessFromFieldSurvey — hasAnyNotes (textNotes)', () => {
  it('is true when textNotes has at least one entry', () => {
    const r = deriveVisitReadinessFromFieldSurvey({
      fieldSurvey: { notes: { textNotes: ['Check inhibitor'] } },
    });
    expect(r.hasAnyNotes).toBe(true);
  });

  it('is false when textNotes is empty', () => {
    const r = deriveVisitReadinessFromFieldSurvey({
      fieldSurvey: { notes: { textNotes: [] } },
    });
    expect(r.hasAnyNotes).toBe(false);
  });
});

// ─── 28. fully populated survey — all-true ───────────────────────────────────

describe('deriveVisitReadinessFromFieldSurvey — fully populated returns all-true', () => {
  it('all flags are true for a complete field survey', () => {
    const r = deriveVisitReadinessFromFieldSurvey({
      fieldSurvey: {
        rooms: [{ id: 'r1', label: 'Kitchen' }],
        photos: [{ id: 'p1', uri: 'file:///p1.jpg' }],
        keyObjects: [
          { id: 'k1', type: 'boiler' },
          { id: 'k2', type: 'flue' },
          { id: 'k3', type: 'cylinder' },
        ],
        notes: { rawTranscript: 'All captured.' },
        systemPresence: {
          heatingSystemPresent: true,
          hotWaterSystemPresent: true,
        },
      },
    });
    expect(r.hasRooms).toBe(true);
    expect(r.hasPhotos).toBe(true);
    expect(r.hasHeatingSystem).toBe(true);
    expect(r.hasHotWaterSystem).toBe(true);
    expect(r.hasKeyObjectBoiler).toBe(true);
    expect(r.hasKeyObjectFlue).toBe(true);
    expect(r.hasAnyNotes).toBe(true);
  });
});

// ─── 29. result survives JSON round-trip ──────────────────────────────────────

describe('deriveVisitReadinessFromFieldSurvey — round-trip', () => {
  it('readiness result survives JSON round-trip', () => {
    const r = deriveVisitReadinessFromFieldSurvey({
      fieldSurvey: {
        rooms: [{ id: 'r1', label: 'Kitchen' }],
        photos: [{ id: 'p1', uri: 'file:///p1.jpg' }],
        keyObjects: [{ id: 'k1', type: 'boiler' }, { id: 'k2', type: 'flue' }],
        notes: { summary: 'Noted.' },
        systemPresence: { hotWaterSystemPresent: true },
      },
    });
    const rt = roundTrip(r);
    expect(rt.hasRooms).toBe(true);
    expect(rt.hasPhotos).toBe(true);
    expect(rt.hasKeyObjectBoiler).toBe(true);
    expect(rt.hasKeyObjectFlue).toBe(true);
    expect(rt.hasAnyNotes).toBe(true);
    expect(rt.hasHotWaterSystem).toBe(true);
  });
});
