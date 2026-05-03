/**
 * hazardObservations.test.ts
 *
 * Tests for the HazardObservation contracts.
 *
 * Coverage:
 *   1.  A hazard observation can be represented
 *   2.  asbestos_suspected category exists
 *   3.  blocking severity exists
 *   4.  Hazards can link to photos (photoIds)
 *   5.  Hazards can link to object pins (objectPinIds)
 *   6.  pending / confirmed / rejected review states are representable
 *   7.  SessionCaptureV2 accepts hazardObservations
 *   8.  customer_vulnerability exists but does not require sensitive detail
 *   9.  All HazardObservationCategoryV1 values are accepted
 *   10. All HazardObservationSeverityV1 values are accepted
 *   11. HazardObservationCaptureV1 version discriminant is '1.0'
 *   12. Optional fields (description, actionRequired, notes, roomId) are absent
 *       when not provided
 */

import { describe, it, expect } from 'vitest';
import type {
  HazardObservationCategoryV1,
  HazardObservationSeverityV1,
  HazardObservationV1,
  HazardObservationCaptureV1,
} from '../../src/scan/hazardObservations';
import type { SessionCaptureV2 } from '../../src/scan/sessionCaptureV2';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeObservation(
  overrides: Partial<HazardObservationV1> = {},
): HazardObservationV1 {
  return {
    id: 'hazard-001',
    visitId: 'visit-001',
    category: 'electrical',
    severity: 'medium',
    title: 'Exposed wiring near boiler',
    reviewStatus: 'pending',
    provenance: 'manual',
    observedAt: '2025-01-01T10:00:00Z',
    ...overrides,
  };
}

function makeCapture(
  overrides: Partial<HazardObservationCaptureV1> = {},
): HazardObservationCaptureV1 {
  return {
    version: '1.0',
    visitId: 'visit-001',
    observations: [],
    createdAt: '2025-01-01T09:00:00Z',
    updatedAt: '2025-01-01T09:00:00Z',
    ...overrides,
  };
}

function minimalSessionCapture(
  overrides: Partial<SessionCaptureV2> = {},
): SessionCaptureV2 {
  return {
    version: '2.0',
    visitId: 'visit-001',
    rooms: [],
    photos: [],
    transcripts: [],
    objectPins: [],
    pipeRoutes: [],
    pointCloudAssets: [],
    createdAt: '2025-01-01T09:00:00Z',
    updatedAt: '2025-01-01T09:00:00Z',
    ...overrides,
  };
}

// ─── 1. A hazard observation can be represented ───────────────────────────────

describe('HazardObservationV1 — basic representation', () => {
  it('1. a hazard observation can be represented with required fields', () => {
    const obs = makeObservation();

    expect(obs.id).toBe('hazard-001');
    expect(obs.visitId).toBe('visit-001');
    expect(obs.category).toBe('electrical');
    expect(obs.severity).toBe('medium');
    expect(obs.title).toBe('Exposed wiring near boiler');
    expect(obs.reviewStatus).toBe('pending');
    expect(obs.provenance).toBe('manual');
    expect(obs.observedAt).toBe('2025-01-01T10:00:00Z');
  });
});

// ─── 2. asbestos_suspected category exists ────────────────────────────────────

describe('HazardObservationCategoryV1 — asbestos_suspected', () => {
  it('2. asbestos_suspected category is representable', () => {
    const obs = makeObservation({
      category: 'asbestos_suspected',
      title: 'Suspected artex ceiling — possible ACM',
      severity: 'high',
    });

    expect(obs.category).toBe('asbestos_suspected');
  });
});

// ─── 3. blocking severity exists ─────────────────────────────────────────────

describe('HazardObservationSeverityV1 — blocking', () => {
  it('3. blocking severity is representable', () => {
    const obs = makeObservation({
      severity: 'blocking',
      title: 'No safe access to boiler',
    });

    expect(obs.severity).toBe('blocking');
  });
});

// ─── 4. Hazards can link to photos ────────────────────────────────────────────

describe('HazardObservationV1 — photoIds', () => {
  it('4. a hazard observation can link to one or more photo IDs', () => {
    const obs = makeObservation({
      photoIds: ['photo-001', 'photo-002'],
    });

    expect(obs.photoIds).toHaveLength(2);
    expect(obs.photoIds).toContain('photo-001');
    expect(obs.photoIds).toContain('photo-002');
  });

  it('4b. photoIds is absent when not provided', () => {
    const obs = makeObservation();
    expect(obs.photoIds).toBeUndefined();
  });
});

// ─── 5. Hazards can link to object pins ──────────────────────────────────────

describe('HazardObservationV1 — objectPinIds', () => {
  it('5. a hazard observation can link to one or more object pin IDs', () => {
    const obs = makeObservation({
      objectPinIds: ['pin-001'],
    });

    expect(obs.objectPinIds).toHaveLength(1);
    expect(obs.objectPinIds?.[0]).toBe('pin-001');
  });

  it('5b. objectPinIds is absent when not provided', () => {
    const obs = makeObservation();
    expect(obs.objectPinIds).toBeUndefined();
  });
});

// ─── 6. Review states are representable ──────────────────────────────────────

describe('HazardObservationV1 — reviewStatus values', () => {
  const statuses = ['pending', 'confirmed', 'rejected'] as const;

  for (const status of statuses) {
    it(`6. reviewStatus '${status}' is representable`, () => {
      const obs = makeObservation({ reviewStatus: status });
      expect(obs.reviewStatus).toBe(status);
    });
  }
});

// ─── 7. SessionCaptureV2 accepts hazardObservations ──────────────────────────

describe('SessionCaptureV2 — hazardObservations field', () => {
  it('7a. hazardObservations is absent when not provided', () => {
    const capture = minimalSessionCapture();
    expect(capture.hazardObservations).toBeUndefined();
  });

  it('7b. SessionCaptureV2 accepts a HazardObservationCaptureV1 payload', () => {
    const hazardCapture = makeCapture({
      observations: [makeObservation()],
    });

    const capture = minimalSessionCapture({ hazardObservations: hazardCapture });

    expect(capture.hazardObservations).toBeDefined();
    expect(capture.hazardObservations?.version).toBe('1.0');
    expect(capture.hazardObservations?.observations).toHaveLength(1);
  });

  it('7c. hazardObservations with no observations is valid (empty list)', () => {
    const capture = minimalSessionCapture({
      hazardObservations: makeCapture(),
    });

    expect(capture.hazardObservations?.observations).toHaveLength(0);
  });
});

// ─── 8. customer_vulnerability — no sensitive detail required ─────────────────

describe('HazardObservationCategoryV1 — customer_vulnerability', () => {
  it('8. customer_vulnerability observation requires no sensitive detail', () => {
    const obs = makeObservation({
      category: 'customer_vulnerability',
      title: 'Possible vulnerability indicator noted',
      severity: 'info',
      // No description, no actionRequired — sensitive detail is optional
    });

    expect(obs.category).toBe('customer_vulnerability');
    expect(obs.description).toBeUndefined();
    expect(obs.actionRequired).toBeUndefined();
  });
});

// ─── 9. All HazardObservationCategoryV1 values ───────────────────────────────

describe('HazardObservationCategoryV1 — all values accepted', () => {
  const categories: HazardObservationCategoryV1[] = [
    'access',
    'asbestos_suspected',
    'electrical',
    'gas',
    'water',
    'working_at_height',
    'confined_space',
    'manual_handling',
    'combustion_air',
    'flue',
    'structural',
    'trip_slip',
    'customer_vulnerability',
    'pets_or_children',
    'other',
  ];

  for (const category of categories) {
    it(`9. category '${category}' is accepted`, () => {
      const obs = makeObservation({ category });
      expect(obs.category).toBe(category);
    });
  }
});

// ─── 10. All HazardObservationSeverityV1 values ──────────────────────────────

describe('HazardObservationSeverityV1 — all values accepted', () => {
  const severities: HazardObservationSeverityV1[] = [
    'info',
    'low',
    'medium',
    'high',
    'blocking',
  ];

  for (const severity of severities) {
    it(`10. severity '${severity}' is accepted`, () => {
      const obs = makeObservation({ severity });
      expect(obs.severity).toBe(severity);
    });
  }
});

// ─── 11. HazardObservationCaptureV1 version discriminant ─────────────────────

describe('HazardObservationCaptureV1 — version discriminant', () => {
  it("11. version is always '1.0'", () => {
    const capture = makeCapture();
    expect(capture.version).toBe('1.0');
  });
});

// ─── 12. Optional fields absent when not provided ────────────────────────────

describe('HazardObservationV1 — optional fields', () => {
  it('12. roomId, description, actionRequired, notes are absent when not provided', () => {
    const obs = makeObservation();

    expect(obs.roomId).toBeUndefined();
    expect(obs.description).toBeUndefined();
    expect(obs.actionRequired).toBeUndefined();
    expect(obs.notes).toBeUndefined();
  });

  it('12b. optional fields are accepted when provided', () => {
    const obs = makeObservation({
      roomId: 'room-001',
      description: 'Wiring runs exposed along back wall',
      actionRequired: 'Contact electrician before installation',
      notes: 'Customer was not aware of this issue',
    });

    expect(obs.roomId).toBe('room-001');
    expect(obs.description).toBe('Wiring runs exposed along back wall');
    expect(obs.actionRequired).toBe('Contact electrician before installation');
    expect(obs.notes).toBe('Customer was not aware of this issue');
  });
});
