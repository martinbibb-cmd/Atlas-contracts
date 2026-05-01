/**
 * sessionCaptureV2.test.ts
 *
 * Tests for the SessionCaptureV2 capture-evidence contract.
 *
 * Coverage:
 *   1.  Minimal empty SessionCaptureV2 shape (all arrays empty)
 *   2.  Confirmed manual boiler object pin
 *   3.  Pending inferred/scanned object pin
 *   4.  Rejected evidence is still representable
 *   5.  photo includeInCustomerReport flag is required (false for object-scope)
 *   6.  pointCloudAssets are represented separately from photos
 *   7.  Pipe route can be existing/proposed/assumed
 *   8.  visitNumber and brandId are optional
 *   9.  CaptureRoomV1 carries provenance and reviewStatus
 *   10. CaptureTranscriptV1 source variants are accepted
 *   11. CapturePhotoV1 cameraMode variants are accepted
 *   12. CaptureObjectPinV1 anchorConfidence variants are accepted
 *   13. All ReviewStatusV1 values are accepted
 *   14. All CaptureProvenanceV1 values are accepted
 *   15. version discriminant is always '2.0'
 */

import { describe, it, expect } from 'vitest';
import type {
  SessionCaptureV2,
  CaptureRoomV1,
  CapturePhotoV1,
  CaptureTranscriptV1,
  CaptureObjectPinV1,
  CapturePipeRouteV1,
  CapturePointCloudAssetV1,
  ReviewStatusV1,
  CaptureProvenanceV1,
} from '../../src/scan/sessionCaptureV2';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function minimalCapture(
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

// ─── 1. Minimal empty SessionCaptureV2 shape ──────────────────────────────────

describe('SessionCaptureV2 — minimal empty shape', () => {
  it('1. accepts a minimal capture with all arrays empty', () => {
    const capture = minimalCapture();
    expect(capture.version).toBe('2.0');
    expect(capture.visitId).toBe('visit-001');
    expect(capture.rooms).toHaveLength(0);
    expect(capture.photos).toHaveLength(0);
    expect(capture.transcripts).toHaveLength(0);
    expect(capture.objectPins).toHaveLength(0);
    expect(capture.pipeRoutes).toHaveLength(0);
    expect(capture.pointCloudAssets).toHaveLength(0);
  });
});

// ─── 2. Confirmed manual boiler object pin ────────────────────────────────────

describe('CaptureObjectPinV1 — manual / confirmed', () => {
  it('2. confirmed manual boiler pin has reviewStatus confirmed', () => {
    const pin: CaptureObjectPinV1 = {
      kind: 'object_pin',
      id: 'pin-001',
      provenance: 'manual',
      reviewStatus: 'confirmed',
      capturedAt: '2025-01-01T09:05:00Z',
      objectType: 'boiler',
      label: 'Worcester 30i',
      location: { x: 1.2, y: 3.4, coordinateSpace: 'room_plan' },
      anchorConfidence: 'world_locked',
    };

    expect(pin.reviewStatus).toBe('confirmed');
    expect(pin.provenance).toBe('manual');
    expect(pin.objectType).toBe('boiler');
    expect(pin.anchorConfidence).toBe('world_locked');
  });
});

// ─── 3. Pending inferred/scanned object pin ───────────────────────────────────

describe('CaptureObjectPinV1 — scan / pending', () => {
  it('3. scanned/inferred pin has reviewStatus pending', () => {
    const pin: CaptureObjectPinV1 = {
      kind: 'object_pin',
      id: 'pin-002',
      provenance: 'scan',
      reviewStatus: 'pending',
      capturedAt: '2025-01-01T09:06:00Z',
      objectType: 'radiator',
      location: { x: 2.0, y: 1.5, z: 0.8, coordinateSpace: 'world' },
      anchorConfidence: 'raycast_estimated',
    };

    expect(pin.reviewStatus).toBe('pending');
    expect(pin.provenance).toBe('scan');
    expect(pin.anchorConfidence).toBe('raycast_estimated');
  });

  it('3b. inferred pin also has reviewStatus pending', () => {
    const pin: CaptureObjectPinV1 = {
      kind: 'object_pin',
      id: 'pin-003',
      provenance: 'inferred',
      reviewStatus: 'pending',
      capturedAt: '2025-01-01T09:07:00Z',
      objectType: 'cylinder',
      location: { x: 0.5, y: 0.5, coordinateSpace: 'floor_plan' },
      anchorConfidence: 'screen_only',
    };

    expect(pin.reviewStatus).toBe('pending');
    expect(pin.provenance).toBe('inferred');
  });
});

// ─── 4. Rejected evidence is still representable ──────────────────────────────

describe('ReviewStatusV1 — rejected evidence', () => {
  it('4. rejected photo is representable in the capture', () => {
    const photo: CapturePhotoV1 = {
      kind: 'photo',
      id: 'photo-rejected-001',
      provenance: 'photo',
      reviewStatus: 'rejected',
      capturedAt: '2025-01-01T09:10:00Z',
      uri: 'file:///photos/blurry.jpg',
      includeInCustomerReport: false,
    };

    expect(photo.reviewStatus).toBe('rejected');

    const capture = minimalCapture({ photos: [photo] });
    expect(capture.photos[0].reviewStatus).toBe('rejected');
  });

  it('4b. rejected object pin is representable in the capture', () => {
    const pin: CaptureObjectPinV1 = {
      kind: 'object_pin',
      id: 'pin-rejected-001',
      provenance: 'manual',
      reviewStatus: 'rejected',
      capturedAt: '2025-01-01T09:11:00Z',
      objectType: 'other',
      location: { x: 0, y: 0, coordinateSpace: 'room_plan' },
      anchorConfidence: 'screen_only',
    };

    expect(pin.reviewStatus).toBe('rejected');

    const capture = minimalCapture({ objectPins: [pin] });
    expect(capture.objectPins[0].reviewStatus).toBe('rejected');
  });
});

// ─── 5. photo includeInCustomerReport flag ────────────────────────────────────

describe('CapturePhotoV1 — includeInCustomerReport', () => {
  it('5a. object-scope photo defaults includeInCustomerReport to false', () => {
    const photo: CapturePhotoV1 = {
      kind: 'photo',
      id: 'photo-obj-001',
      provenance: 'photo',
      reviewStatus: 'confirmed',
      capturedAt: '2025-01-01T09:15:00Z',
      uri: 'file:///photos/boiler_front.jpg',
      objectId: 'pin-001',
      includeInCustomerReport: false,
    };

    expect(photo.includeInCustomerReport).toBe(false);
  });

  it('5b. overview photo can set includeInCustomerReport to true', () => {
    const photo: CapturePhotoV1 = {
      kind: 'photo',
      id: 'photo-overview-001',
      provenance: 'photo',
      reviewStatus: 'confirmed',
      capturedAt: '2025-01-01T09:16:00Z',
      uri: 'file:///photos/living_room_overview.jpg',
      roomId: 'room-001',
      includeInCustomerReport: true,
    };

    expect(photo.includeInCustomerReport).toBe(true);
  });
});

// ─── 6. pointCloudAssets are separate from photos ─────────────────────────────

describe('CapturePointCloudAssetV1 — separate from photos', () => {
  it('6. point cloud assets sit in their own array, not in photos', () => {
    const asset: CapturePointCloudAssetV1 = {
      kind: 'point_cloud_asset',
      id: 'pca-001',
      provenance: 'scan',
      reviewStatus: 'confirmed',
      capturedAt: '2025-01-01T09:20:00Z',
      uri: 'file:///scans/kitchen.usdz',
      format: 'usdz',
      label: 'Kitchen scan',
      includeInCustomerReport: false,
    };

    const capture = minimalCapture({ pointCloudAssets: [asset] });

    expect(capture.pointCloudAssets).toHaveLength(1);
    expect(capture.pointCloudAssets[0].kind).toBe('point_cloud_asset');
    expect(capture.photos).toHaveLength(0);
    expect(capture.pointCloudAssets[0].format).toBe('usdz');
  });

  it('6b. point cloud format variants are accepted', () => {
    const formats: CapturePointCloudAssetV1['format'][] = [
      'usdz',
      'ply',
      'las',
      'e57',
      'image_depth',
      'other',
    ];

    for (const format of formats) {
      const asset: CapturePointCloudAssetV1 = {
        kind: 'point_cloud_asset',
        id: `pca-${format}`,
        provenance: 'scan',
        reviewStatus: 'pending',
        capturedAt: '2025-01-01T09:21:00Z',
        uri: `file:///scans/scan.${format}`,
        format,
        includeInCustomerReport: false,
      };
      expect(asset.format).toBe(format);
    }
  });
});

// ─── 7. Pipe route status variants ───────────────────────────────────────────

describe('CapturePipeRouteV1 — status variants', () => {
  const statuses: CapturePipeRouteV1['status'][] = [
    'existing',
    'proposed',
    'assumed',
  ];

  for (const status of statuses) {
    it(`7. pipe route accepts status '${status}'`, () => {
      const route: CapturePipeRouteV1 = {
        kind: 'pipe_route',
        id: `route-${status}`,
        provenance: 'manual',
        reviewStatus: 'confirmed',
        capturedAt: '2025-01-01T09:25:00Z',
        routeType: 'heating_flow',
        status,
        points: [
          { x: 0, y: 0, coordinateSpace: 'room_plan' },
          { x: 1, y: 0, coordinateSpace: 'room_plan' },
        ],
      };

      expect(route.status).toBe(status);
    });
  }
});

// ─── 8. visitNumber and brandId are optional ──────────────────────────────────

describe('SessionCaptureV2 — optional top-level fields', () => {
  it('8a. visitNumber is absent when not provided', () => {
    const capture = minimalCapture();
    expect(capture.visitNumber).toBeUndefined();
  });

  it('8b. brandId is absent when not provided', () => {
    const capture = minimalCapture();
    expect(capture.brandId).toBeUndefined();
  });

  it('8c. visitNumber and brandId can be provided', () => {
    const capture = minimalCapture({
      visitNumber: 'VN-0042',
      brandId: 'brand-abc',
    });
    expect(capture.visitNumber).toBe('VN-0042');
    expect(capture.brandId).toBe('brand-abc');
  });
});

// ─── 9. CaptureRoomV1 ─────────────────────────────────────────────────────────

describe('CaptureRoomV1 — provenance and reviewStatus', () => {
  it('9. room carries provenance and reviewStatus', () => {
    const room: CaptureRoomV1 = {
      id: 'room-001',
      name: 'Kitchen',
      floorIndex: 0,
      provenance: 'scan',
      reviewStatus: 'confirmed',
    };

    expect(room.provenance).toBe('scan');
    expect(room.reviewStatus).toBe('confirmed');
  });

  it('9b. linkedRoomIds is optional', () => {
    const room: CaptureRoomV1 = {
      id: 'room-002',
      provenance: 'manual',
      reviewStatus: 'pending',
    };

    expect(room.linkedRoomIds).toBeUndefined();
  });
});

// ─── 10. CaptureTranscriptV1 source variants ──────────────────────────────────

describe('CaptureTranscriptV1 — source variants', () => {
  const sources: CaptureTranscriptV1['source'][] = [
    'voice_note',
    'dictation',
    'manual_note',
  ];

  for (const source of sources) {
    it(`10. transcript accepts source '${source}'`, () => {
      const transcript: CaptureTranscriptV1 = {
        kind: 'transcript',
        id: `transcript-${source}`,
        provenance: 'transcript',
        reviewStatus: 'confirmed',
        capturedAt: '2025-01-01T09:30:00Z',
        text: 'Engineer note text.',
        source,
      };

      expect(transcript.source).toBe(source);
    });
  }
});

// ─── 11. CapturePhotoV1 cameraMode variants ───────────────────────────────────

describe('CapturePhotoV1 — cameraMode variants', () => {
  const modes: NonNullable<CapturePhotoV1['cameraMode']>[] = [
    'standard',
    'wide',
    'panorama',
  ];

  for (const mode of modes) {
    it(`11. photo accepts cameraMode '${mode}'`, () => {
      const photo: CapturePhotoV1 = {
        kind: 'photo',
        id: `photo-cam-${mode}`,
        provenance: 'photo',
        reviewStatus: 'confirmed',
        capturedAt: '2025-01-01T09:35:00Z',
        uri: `file:///photos/${mode}.jpg`,
        includeInCustomerReport: false,
        cameraMode: mode,
      };

      expect(photo.cameraMode).toBe(mode);
    });
  }
});

// ─── 12. CaptureObjectPinV1 anchorConfidence variants ─────────────────────────

describe('CaptureObjectPinV1 — anchorConfidence variants', () => {
  const confidences: CaptureObjectPinV1['anchorConfidence'][] = [
    'screen_only',
    'raycast_estimated',
    'world_locked',
  ];

  for (const confidence of confidences) {
    it(`12. object pin accepts anchorConfidence '${confidence}'`, () => {
      const pin: CaptureObjectPinV1 = {
        kind: 'object_pin',
        id: `pin-conf-${confidence}`,
        provenance: 'scan',
        reviewStatus: 'pending',
        capturedAt: '2025-01-01T09:40:00Z',
        objectType: 'flue',
        location: { x: 1, y: 1, coordinateSpace: 'room_plan' },
        anchorConfidence: confidence,
      };

      expect(pin.anchorConfidence).toBe(confidence);
    });
  }
});

// ─── 13. All ReviewStatusV1 values ───────────────────────────────────────────

describe('ReviewStatusV1 — all values accepted', () => {
  const statuses: ReviewStatusV1[] = ['pending', 'confirmed', 'rejected'];

  for (const status of statuses) {
    it(`13. ReviewStatusV1 accepts '${status}'`, () => {
      const room: CaptureRoomV1 = {
        id: 'room-rs-test',
        provenance: 'manual',
        reviewStatus: status,
      };
      expect(room.reviewStatus).toBe(status);
    });
  }
});

// ─── 14. All CaptureProvenanceV1 values ──────────────────────────────────────

describe('CaptureProvenanceV1 — all values accepted', () => {
  const provenances: CaptureProvenanceV1[] = [
    'manual',
    'scan',
    'photo',
    'transcript',
    'inferred',
    'imported',
  ];

  for (const provenance of provenances) {
    it(`14. CaptureProvenanceV1 accepts '${provenance}'`, () => {
      const room: CaptureRoomV1 = {
        id: 'room-prov-test',
        provenance,
        reviewStatus: 'pending',
      };
      expect(room.provenance).toBe(provenance);
    });
  }
});

// ─── 15. version discriminant ─────────────────────────────────────────────────

describe('SessionCaptureV2 — version discriminant', () => {
  it("15. version is always '2.0'", () => {
    const capture = minimalCapture();
    expect(capture.version).toBe('2.0');
  });
});
