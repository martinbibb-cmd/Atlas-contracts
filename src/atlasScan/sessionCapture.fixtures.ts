/**
 * sessionCapture.fixtures.ts
 *
 * Fixture builder helpers for SessionCaptureV2 tests.
 *
 * These are test-only helpers — not exported from the module's public index.
 */

import type {
  SessionCaptureV2,
  CapturedRoomScan,
  CapturedPhoto,
  CapturedVoiceNote,
  CapturedPlacedObject,
  CapturedFloorPlanSnapshot,
} from './sessionCapture.types';

// ─── Individual item builders ─────────────────────────────────────────────────

export function buildCapturedRoomScan(
  overrides: Partial<CapturedRoomScan> = {},
): CapturedRoomScan {
  return {
    id: 'room-scan-001',
    capturedAt: '2025-06-01T09:05:00Z',
    label: 'Living Room',
    rawAreaM2: 18.4,
    rawHeightM: 2.4,
    ...overrides,
  };
}

export function buildCapturedPhoto(
  overrides: Partial<CapturedPhoto> = {},
): CapturedPhoto {
  return {
    id: 'photo-001',
    uri: 'https://assets.example.com/photos/photo-001.jpg',
    capturedAt: '2025-06-01T09:10:00Z',
    ...overrides,
  };
}

export function buildCapturedVoiceNote(
  overrides: Partial<CapturedVoiceNote> = {},
): CapturedVoiceNote {
  return {
    id: 'voice-001',
    transcript: 'Boiler is a Worcester 30i, installed around 2018.',
    startedAt: '2025-06-01T09:15:00Z',
    endedAt: '2025-06-01T09:15:22Z',
    ...overrides,
  };
}

export function buildCapturedPlacedObject(
  overrides: Partial<CapturedPlacedObject> = {},
): CapturedPlacedObject {
  return {
    id: 'obj-001',
    kind: 'boiler',
    label: 'Worcester 30i',
    createdAt: '2025-06-01T09:20:00Z',
    linkedPhotoIds: ['photo-001'],
    ...overrides,
  };
}

export function buildCapturedFloorPlanSnapshot(
  overrides: Partial<CapturedFloorPlanSnapshot> = {},
): CapturedFloorPlanSnapshot {
  return {
    id: 'fps-001',
    uri: 'https://assets.example.com/floorplans/fps-001.png',
    capturedAt: '2025-06-01T09:25:00Z',
    label: 'Ground Floor',
    ...overrides,
  };
}

// ─── Top-level fixture builder ────────────────────────────────────────────────

/**
 * Builds a minimal valid SessionCaptureV2 fixture.
 *
 * Pass overrides to customise individual fields; deep-merge is not performed
 * on nested objects — supply a complete replacement value.
 */
export function buildSessionCaptureV2(
  overrides: Partial<SessionCaptureV2> = {},
): SessionCaptureV2 {
  return {
    schemaVersion: 'atlas.scan.session.v2',
    sessionId: 'session-v2-fixture-001',
    propertyId: 'property-001',
    visitId: 'visit-001',
    createdAt: '2025-06-01T09:00:00Z',
    updatedAt: '2025-06-01T10:00:00Z',
    job: {
      visitReference: 'JOB-2025-0601',
    },
    device: {
      platform: 'ios',
      appVersion: '3.0.0',
      lidarAvailable: true,
    },
    captures: {
      roomScans: [buildCapturedRoomScan()],
      photos: [buildCapturedPhoto()],
      voiceNotes: [buildCapturedVoiceNote()],
      placedObjects: [buildCapturedPlacedObject()],
      floorPlanSnapshots: [buildCapturedFloorPlanSnapshot()],
    },
    ...overrides,
  };
}

/**
 * Builds a minimal SessionCaptureV2 with all capture arrays empty.
 * Useful for testing required-field validation without noise.
 */
export function buildMinimalSessionCaptureV2(
  overrides: Partial<SessionCaptureV2> = {},
): SessionCaptureV2 {
  return {
    schemaVersion: 'atlas.scan.session.v2',
    sessionId: 'session-v2-minimal-001',
    createdAt: '2025-06-01T09:00:00Z',
    updatedAt: '2025-06-01T09:00:00Z',
    job: {
      visitReference: 'JOB-2025-0601',
    },
    captures: {
      roomScans: [],
      photos: [],
      voiceNotes: [],
      placedObjects: [],
      floorPlanSnapshots: [],
    },
    ...overrides,
  };
}
