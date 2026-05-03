/**
 * floorPlanFabric.test.ts
 *
 * Tests for the FloorPlanFabricCaptureV1 floor-plan perimeter and material
 * capture contracts.
 *
 * Coverage:
 *   1.  Room perimeter can be represented
 *   2.  External, internal, and party walls are distinct boundary kinds
 *   3.  Openings attach to boundaries via boundaryId
 *   4.  Unknown materials are valid
 *   5.  LiDAR boundary can be pending
 *   6.  Manual material can be confirmed
 *   7.  Rejected boundary remains representable
 *   8.  SessionCaptureV2 accepts floorPlanFabric
 *   9.  All FloorPlanBoundaryKindV1 values are accepted
 *   10. All FloorPlanOpeningKindV1 values are accepted
 *   11. All FabricMaterialV1 values are accepted
 *   12. FloorPlanFabricCaptureV1 version discriminant is always '1.0'
 *   13. FloorPlanPointV1 supports all coordinate spaces
 *   14. Openings do not require a boundaryId (e.g. rooflights)
 */

import { describe, it, expect } from 'vitest';
import type {
  FloorPlanBoundaryKindV1,
  FloorPlanOpeningKindV1,
  FabricMaterialV1,
  FloorPlanPointV1,
  FloorPlanBoundaryV1,
  FloorPlanOpeningV1,
  FloorPlanRoomFabricV1,
  FloorPlanFabricCaptureV1,
} from '../../src/scan/floorPlanFabric';
import type { SessionCaptureV2 } from '../../src/scan/sessionCaptureV2';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function point(x: number, y: number): FloorPlanPointV1 {
  return { x, y, coordinateSpace: 'room_plan' };
}

function minimalBoundary(
  overrides: Partial<FloorPlanBoundaryV1> = {},
): FloorPlanBoundaryV1 {
  return {
    id: 'boundary-001',
    roomId: 'room-001',
    kind: 'external_wall',
    start: point(0, 0),
    end: point(4000, 0),
    reviewStatus: 'pending',
    provenance: 'scan',
    ...overrides,
  };
}

function minimalOpening(
  overrides: Partial<FloorPlanOpeningV1> = {},
): FloorPlanOpeningV1 {
  return {
    id: 'opening-001',
    roomId: 'room-001',
    kind: 'window',
    position: point(2000, 0),
    reviewStatus: 'pending',
    provenance: 'scan',
    ...overrides,
  };
}

function minimalRoomFabric(
  overrides: Partial<FloorPlanRoomFabricV1> = {},
): FloorPlanRoomFabricV1 {
  return {
    roomId: 'room-001',
    boundaries: [],
    openings: [],
    reviewStatus: 'pending',
    provenance: 'scan',
    ...overrides,
  };
}

function minimalFabricCapture(
  overrides: Partial<FloorPlanFabricCaptureV1> = {},
): FloorPlanFabricCaptureV1 {
  return {
    version: '1.0',
    visitId: 'visit-001',
    rooms: [],
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

// ─── 1. Room perimeter can be represented ─────────────────────────────────────

describe('FloorPlanRoomFabricV1 — room perimeter', () => {
  it('1. room perimeter is representable with boundaries and aggregates', () => {
    const room = minimalRoomFabric({
      floorAreaM2: 20.5,
      ceilingHeightMm: 2400,
      perimeterMm: 18000,
      boundaries: [
        minimalBoundary({ id: 'b-north', kind: 'external_wall', lengthMm: 4000 }),
        minimalBoundary({ id: 'b-east', kind: 'external_wall', lengthMm: 5000 }),
        minimalBoundary({ id: 'b-south', kind: 'external_wall', lengthMm: 4000 }),
        minimalBoundary({ id: 'b-west', kind: 'internal_wall', lengthMm: 5000 }),
      ],
    });

    expect(room.perimeterMm).toBe(18000);
    expect(room.floorAreaM2).toBe(20.5);
    expect(room.ceilingHeightMm).toBe(2400);
    expect(room.boundaries).toHaveLength(4);
  });

  it('1b. room perimeter aggregates are optional', () => {
    const room = minimalRoomFabric();
    expect(room.perimeterMm).toBeUndefined();
    expect(room.floorAreaM2).toBeUndefined();
    expect(room.ceilingHeightMm).toBeUndefined();
  });
});

// ─── 2. External, internal, party walls are distinct ─────────────────────────

describe('FloorPlanBoundaryV1 — wall kind distinctions', () => {
  it('2. external_wall, internal_wall, and party_wall are distinct kinds', () => {
    const external = minimalBoundary({ kind: 'external_wall' });
    const internal = minimalBoundary({ id: 'b-002', kind: 'internal_wall' });
    const party = minimalBoundary({ id: 'b-003', kind: 'party_wall' });

    expect(external.kind).toBe('external_wall');
    expect(internal.kind).toBe('internal_wall');
    expect(party.kind).toBe('party_wall');

    expect(external.kind).not.toBe(internal.kind);
    expect(internal.kind).not.toBe(party.kind);
    expect(external.kind).not.toBe(party.kind);
  });
});

// ─── 3. Openings attach to boundaries ────────────────────────────────────────

describe('FloorPlanOpeningV1 — attachment to boundary', () => {
  it('3. opening can reference parent boundary via boundaryId', () => {
    const boundary = minimalBoundary({ id: 'boundary-north' });
    const opening = minimalOpening({
      id: 'window-001',
      boundaryId: 'boundary-north',
      kind: 'window',
      widthMm: 1200,
      heightMm: 1050,
    });

    expect(opening.boundaryId).toBe(boundary.id);
    expect(opening.widthMm).toBe(1200);
    expect(opening.heightMm).toBe(1050);
  });
});

// ─── 4. Unknown materials are valid ──────────────────────────────────────────

describe('FabricMaterialV1 — unknown material', () => {
  it('4. unknown material is a valid value on a boundary', () => {
    const boundary = minimalBoundary({ material: 'unknown' });
    expect(boundary.material).toBe('unknown');
  });

  it('4b. unknown material is a valid value on an opening', () => {
    const opening = minimalOpening({ material: 'unknown' });
    expect(opening.material).toBe('unknown');
  });

  it('4c. material is optional — absence is also valid', () => {
    const boundary = minimalBoundary();
    expect(boundary.material).toBeUndefined();
  });
});

// ─── 5. LiDAR boundary can be pending ────────────────────────────────────────

describe('FloorPlanBoundaryV1 — LiDAR / scan provenance', () => {
  it('5. LiDAR-derived boundary has provenance scan and reviewStatus pending', () => {
    const boundary = minimalBoundary({
      provenance: 'scan',
      reviewStatus: 'pending',
    });

    expect(boundary.provenance).toBe('scan');
    expect(boundary.reviewStatus).toBe('pending');
  });
});

// ─── 6. Manual material can be confirmed ─────────────────────────────────────

describe('FloorPlanBoundaryV1 — manual / confirmed', () => {
  it('6. manually confirmed boundary has confirmed reviewStatus', () => {
    const boundary = minimalBoundary({
      provenance: 'manual',
      reviewStatus: 'confirmed',
      material: 'cavity_wall',
    });

    expect(boundary.provenance).toBe('manual');
    expect(boundary.reviewStatus).toBe('confirmed');
    expect(boundary.material).toBe('cavity_wall');
  });
});

// ─── 7. Rejected boundary remains representable ───────────────────────────────

describe('FloorPlanBoundaryV1 — rejected boundary', () => {
  it('7. rejected boundary is representable in the capture', () => {
    const boundary = minimalBoundary({ reviewStatus: 'rejected' });
    expect(boundary.reviewStatus).toBe('rejected');

    const room = minimalRoomFabric({ boundaries: [boundary] });
    expect(room.boundaries[0].reviewStatus).toBe('rejected');
  });

  it('7b. rejected opening is representable in the capture', () => {
    const opening = minimalOpening({ reviewStatus: 'rejected' });
    expect(opening.reviewStatus).toBe('rejected');

    const room = minimalRoomFabric({ openings: [opening] });
    expect(room.openings[0].reviewStatus).toBe('rejected');
  });
});

// ─── 8. SessionCaptureV2 accepts floorPlanFabric ─────────────────────────────

describe('SessionCaptureV2 — floorPlanFabric field', () => {
  it('8. SessionCaptureV2 is valid without floorPlanFabric', () => {
    const capture = minimalSessionCapture();
    expect(capture.floorPlanFabric).toBeUndefined();
  });

  it('8b. SessionCaptureV2 accepts floorPlanFabric when provided', () => {
    const fabric = minimalFabricCapture({
      rooms: [
        minimalRoomFabric({
          boundaries: [minimalBoundary()],
          openings: [minimalOpening()],
        }),
      ],
    });

    const capture = minimalSessionCapture({ floorPlanFabric: fabric });

    expect(capture.floorPlanFabric).toBeDefined();
    expect(capture.floorPlanFabric?.version).toBe('1.0');
    expect(capture.floorPlanFabric?.visitId).toBe('visit-001');
    expect(capture.floorPlanFabric?.rooms).toHaveLength(1);
    expect(capture.floorPlanFabric?.rooms[0].boundaries).toHaveLength(1);
    expect(capture.floorPlanFabric?.rooms[0].openings).toHaveLength(1);
  });
});

// ─── 9. All FloorPlanBoundaryKindV1 values ───────────────────────────────────

describe('FloorPlanBoundaryKindV1 — all values accepted', () => {
  const kinds: FloorPlanBoundaryKindV1[] = [
    'external_wall',
    'internal_wall',
    'party_wall',
    'floor_edge',
    'ceiling_edge',
    'unknown',
  ];

  for (const kind of kinds) {
    it(`9. boundary accepts kind '${kind}'`, () => {
      const boundary = minimalBoundary({ kind });
      expect(boundary.kind).toBe(kind);
    });
  }
});

// ─── 10. All FloorPlanOpeningKindV1 values ───────────────────────────────────

describe('FloorPlanOpeningKindV1 — all values accepted', () => {
  const kinds: FloorPlanOpeningKindV1[] = [
    'door',
    'window',
    'patio_door',
    'rooflight',
    'open_arch',
    'unknown',
  ];

  for (const kind of kinds) {
    it(`10. opening accepts kind '${kind}'`, () => {
      const opening = minimalOpening({ kind });
      expect(opening.kind).toBe(kind);
    });
  }
});

// ─── 11. All FabricMaterialV1 values ─────────────────────────────────────────

describe('FabricMaterialV1 — all values accepted', () => {
  const materials: FabricMaterialV1[] = [
    'solid_brick',
    'cavity_wall',
    'insulated_cavity',
    'timber_frame',
    'stone',
    'single_glazing',
    'double_glazing',
    'triple_glazing',
    'insulated_door',
    'uninsulated_door',
    'suspended_timber_floor',
    'solid_floor',
    'insulated_floor',
    'pitched_roof',
    'flat_roof',
    'insulated_roof',
    'unknown',
  ];

  for (const material of materials) {
    it(`11. boundary accepts material '${material}'`, () => {
      const boundary = minimalBoundary({ material });
      expect(boundary.material).toBe(material);
    });
  }
});

// ─── 12. Version discriminant ─────────────────────────────────────────────────

describe('FloorPlanFabricCaptureV1 — version discriminant', () => {
  it("12. version is always '1.0'", () => {
    const capture = minimalFabricCapture();
    expect(capture.version).toBe('1.0');
  });
});

// ─── 13. FloorPlanPointV1 coordinate spaces ──────────────────────────────────

describe('FloorPlanPointV1 — coordinate spaces', () => {
  const spaces: FloorPlanPointV1['coordinateSpace'][] = [
    'room_plan',
    'floor_plan',
    'world',
  ];

  for (const coordinateSpace of spaces) {
    it(`13. point accepts coordinateSpace '${coordinateSpace}'`, () => {
      const pt: FloorPlanPointV1 = { x: 1, y: 2, coordinateSpace };
      expect(pt.coordinateSpace).toBe(coordinateSpace);
    });
  }

  it('13b. z coordinate is optional', () => {
    const pt: FloorPlanPointV1 = { x: 1, y: 2, coordinateSpace: 'world' };
    expect(pt.z).toBeUndefined();

    const ptWithZ: FloorPlanPointV1 = { x: 1, y: 2, z: 3, coordinateSpace: 'world' };
    expect(ptWithZ.z).toBe(3);
  });
});

// ─── 14. Openings do not require boundaryId ───────────────────────────────────

describe('FloorPlanOpeningV1 — boundaryId is optional', () => {
  it('14. rooflight opening does not require a boundaryId', () => {
    const opening = minimalOpening({
      kind: 'rooflight',
      boundaryId: undefined,
    });

    expect(opening.kind).toBe('rooflight');
    expect(opening.boundaryId).toBeUndefined();
  });
});
