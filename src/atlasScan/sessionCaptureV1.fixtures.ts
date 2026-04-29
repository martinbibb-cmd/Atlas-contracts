/**
 * sessionCaptureV1.fixtures.ts
 *
 * Fixture builders for SessionCaptureV1 tests and development use.
 *
 * Available fixtures:
 *   buildFullSessionCaptureV1         — complete valid capture (all fields)
 *   buildPartialRoomCapture           — rooms present but no spatial model
 *   buildPhotoOnlyCapture             — no rooms; photos only
 *   buildTranscriptOnlyCapture        — no rooms or photos; transcript only
 *   buildFlueClearanceCapture         — focused flue/boiler evidence capture
 *   buildInvalidMissingVisitId        — missing visitId (invalid)
 *   buildInvalidMissingSessionId      — missing sessionId (invalid)
 *   buildInvalidOrphanPhotoRoom       — photo references non-existent room (invalid)
 *   buildInvalidOrphanMarkerPhoto     — objectMarker linkedPhotoId references
 *                                       non-existent photo (invalid)
 */

import type {
  SessionCaptureV1,
  SessionRoomV1,
  SpatialModelV1,
  ObjectMarkerV1,
  SessionPhotoV1,
  TranscriptV1,
  SessionNoteV1,
  TimelineEventV1,
  AssetManifestEntryV1,
  DeviceMetadataV1,
  EvidenceProvenanceV1,
} from './sessionCaptureV1.types';

// ─── Shared provenance builders ───────────────────────────────────────────────

function captureProvenance(
  overrides: Partial<EvidenceProvenanceV1> = {},
): EvidenceProvenanceV1 {
  return {
    source: 'capture',
    capturedAt: '2025-06-01T09:00:00Z',
    confidence: 'scanned',
    ...overrides,
  };
}

// ─── Full valid capture ───────────────────────────────────────────────────────

/**
 * A complete, fully-populated valid SessionCaptureV1.
 *
 * All evidence types are present: rooms, spatial model, object markers,
 * photos, transcript, notes, timeline events, and asset manifest.
 */
export function buildFullSessionCaptureV1(
  overrides: Partial<SessionCaptureV1> = {},
): SessionCaptureV1 {
  const rooms: SessionRoomV1[] = [
    {
      roomId: 'room-living-001',
      label: 'Living Room',
      status: 'complete',
      floorIndex: 0,
      geometry: {
        rawAreaM2: 18.4,
        rawHeightM: 2.4,
      },
      provenance: captureProvenance({ capturedAt: '2025-06-01T09:05:00Z', confidence: 'scanned' }),
    },
    {
      roomId: 'room-boiler-001',
      label: 'Boiler Room',
      status: 'complete',
      floorIndex: 0,
      geometry: {
        rawAreaM2: 3.2,
        rawHeightM: 2.1,
      },
      provenance: captureProvenance({ capturedAt: '2025-06-01T09:20:00Z', confidence: 'scanned' }),
    },
  ];

  const spatialModel: SpatialModelV1 = {
    modelRef: 'r2://scans/session-full-001/model.usdz',
    coordinateConvention: 'metric_m',
    capturedAt: '2025-06-01T09:25:00Z',
    confidence: 'scanned',
    rooms: [
      { roomId: 'room-living-001', areaM2: 18.4, heightM: 2.4, confidence: 'scanned' },
      { roomId: 'room-boiler-001', areaM2: 3.2, heightM: 2.1, confidence: 'scanned' },
    ],
  };

  const objectMarkers: ObjectMarkerV1[] = [
    {
      markerId: 'marker-boiler-001',
      kind: 'boiler',
      label: 'Worcester Bosch 30i',
      roomId: 'room-boiler-001',
      position: { x: 1.2, y: 0.5, z: 0.9 },
      linkedPhotoIds: ['photo-boiler-001', 'photo-dataplate-001'],
      linkedNoteIds: ['note-boiler-001'],
      createdAt: '2025-06-01T09:22:00Z',
      provenance: captureProvenance({
        capturedAt: '2025-06-01T09:22:00Z',
        roomId: 'room-boiler-001',
        confidence: 'manually_placed',
      }),
    },
    {
      markerId: 'marker-flue-001',
      kind: 'flue',
      label: 'Flue terminal',
      roomId: 'room-boiler-001',
      position: { x: 1.2, y: 2.4, z: 1.8 },
      linkedPhotoIds: ['photo-flue-001'],
      linkedNoteIds: [],
      createdAt: '2025-06-01T09:23:00Z',
      provenance: captureProvenance({
        capturedAt: '2025-06-01T09:23:00Z',
        roomId: 'room-boiler-001',
        confidence: 'manually_placed',
      }),
    },
  ];

  const photos: SessionPhotoV1[] = [
    {
      photoId: 'photo-boiler-001',
      assetId: 'asset-photo-boiler-001',
      uri: 'r2://photos/session-full-001/boiler-front.jpg',
      thumbnailUri: 'r2://photos/session-full-001/boiler-front-thumb.jpg',
      capturedAt: '2025-06-01T09:22:30Z',
      roomId: 'room-boiler-001',
      objectMarkerId: 'marker-boiler-001',
      tags: ['front_view', 'condition'],
      provenance: captureProvenance({
        capturedAt: '2025-06-01T09:22:30Z',
        roomId: 'room-boiler-001',
        objectId: 'marker-boiler-001',
        confidence: 'photo_linked',
      }),
    },
    {
      photoId: 'photo-dataplate-001',
      assetId: 'asset-photo-dataplate-001',
      uri: 'r2://photos/session-full-001/boiler-dataplate.jpg',
      capturedAt: '2025-06-01T09:22:50Z',
      roomId: 'room-boiler-001',
      objectMarkerId: 'marker-boiler-001',
      tags: ['data_plate'],
      provenance: captureProvenance({
        capturedAt: '2025-06-01T09:22:50Z',
        roomId: 'room-boiler-001',
        objectId: 'marker-boiler-001',
        confidence: 'photo_linked',
      }),
    },
    {
      photoId: 'photo-flue-001',
      assetId: 'asset-photo-flue-001',
      uri: 'r2://photos/session-full-001/flue-terminal.jpg',
      capturedAt: '2025-06-01T09:23:20Z',
      roomId: 'room-boiler-001',
      objectMarkerId: 'marker-flue-001',
      tags: ['flue_terminal', 'clearance'],
      provenance: captureProvenance({
        capturedAt: '2025-06-01T09:23:20Z',
        roomId: 'room-boiler-001',
        objectId: 'marker-flue-001',
        confidence: 'photo_linked',
      }),
    },
  ];

  const transcript: TranscriptV1 = {
    status: 'complete',
    text: 'Boiler is a Worcester Bosch 30i, installed around 2018. Flue exits through the rear wall — clearance looks fine. Radiators in living room are originals.',
    segments: [
      {
        segmentId: 'seg-001',
        text: 'Boiler is a Worcester Bosch 30i, installed around 2018.',
        startedAt: '2025-06-01T09:22:10Z',
        endedAt: '2025-06-01T09:22:18Z',
        roomId: 'room-boiler-001',
        objectMarkerId: 'marker-boiler-001',
      },
      {
        segmentId: 'seg-002',
        text: 'Flue exits through the rear wall — clearance looks fine.',
        startedAt: '2025-06-01T09:23:05Z',
        endedAt: '2025-06-01T09:23:14Z',
        roomId: 'room-boiler-001',
        objectMarkerId: 'marker-flue-001',
      },
    ],
  };

  const notes: SessionNoteV1[] = [
    {
      noteId: 'note-boiler-001',
      text: 'Boiler showing signs of age — recommend replacement discussion.',
      createdAt: '2025-06-01T09:24:00Z',
      roomId: 'room-boiler-001',
      objectMarkerId: 'marker-boiler-001',
      category: 'observation',
    },
  ];

  const timelineEvents: TimelineEventV1[] = [
    { eventId: 'evt-001', type: 'session_started', timestamp: '2025-06-01T09:00:00Z' },
    { eventId: 'evt-002', type: 'room_started', timestamp: '2025-06-01T09:05:00Z', roomId: 'room-living-001' },
    { eventId: 'evt-003', type: 'room_completed', timestamp: '2025-06-01T09:18:00Z', roomId: 'room-living-001' },
    { eventId: 'evt-004', type: 'room_started', timestamp: '2025-06-01T09:20:00Z', roomId: 'room-boiler-001' },
    { eventId: 'evt-005', type: 'object_placed', timestamp: '2025-06-01T09:22:00Z', roomId: 'room-boiler-001', objectId: 'marker-boiler-001' },
    { eventId: 'evt-006', type: 'photo_taken', timestamp: '2025-06-01T09:22:30Z', roomId: 'room-boiler-001' },
    { eventId: 'evt-007', type: 'room_completed', timestamp: '2025-06-01T09:25:00Z', roomId: 'room-boiler-001' },
    { eventId: 'evt-008', type: 'session_completed', timestamp: '2025-06-01T09:30:00Z' },
  ];

  const assetManifest: AssetManifestEntryV1[] = [
    {
      assetId: 'asset-spatial-model-001',
      kind: 'spatial_model',
      uri: 'r2://scans/session-full-001/model.usdz',
      mimeType: 'model/vnd.usdz+zip',
      capturedAt: '2025-06-01T09:25:00Z',
    },
    {
      assetId: 'asset-photo-boiler-001',
      kind: 'photo',
      uri: 'r2://photos/session-full-001/boiler-front.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 2345678,
      capturedAt: '2025-06-01T09:22:30Z',
    },
    {
      assetId: 'asset-photo-dataplate-001',
      kind: 'photo',
      uri: 'r2://photos/session-full-001/boiler-dataplate.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 1876543,
      capturedAt: '2025-06-01T09:22:50Z',
    },
    {
      assetId: 'asset-photo-flue-001',
      kind: 'photo',
      uri: 'r2://photos/session-full-001/flue-terminal.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 1543210,
      capturedAt: '2025-06-01T09:23:20Z',
    },
  ];

  const device: DeviceMetadataV1 = {
    platform: 'ios',
    model: 'iPhone 15 Pro',
    appVersion: '3.0.0',
    lidarAvailable: true,
  };

  return {
    schemaVersion: 'atlas.scan.session.v1',
    visitId: 'visit-fixture-full-001',
    sessionId: 'session-fixture-full-001',
    status: 'ready',
    captureStartedAt: '2025-06-01T09:00:00Z',
    captureCompletedAt: '2025-06-01T09:30:00Z',
    rooms,
    spatialModel,
    objectMarkers,
    photos,
    transcript,
    notes,
    timelineEvents,
    assetManifest,
    device,
    review: {
      status: 'approved',
      reviewedBy: 'engineer-001',
      reviewedAt: '2025-06-01T10:00:00Z',
    },
    ...overrides,
  };
}

// ─── Partial room capture ─────────────────────────────────────────────────────

/**
 * A valid capture with rooms present but no LiDAR spatial model.
 *
 * Represents a capture on a device without LiDAR, or where the room scan
 * was not completed.  Object markers are still placed manually.
 */
export function buildPartialRoomCapture(
  overrides: Partial<SessionCaptureV1> = {},
): SessionCaptureV1 {
  const rooms: SessionRoomV1[] = [
    {
      roomId: 'room-kitchen-001',
      label: 'Kitchen',
      status: 'complete',
      floorIndex: 0,
      provenance: captureProvenance({ confidence: 'manually_placed', capturedAt: '2025-06-02T10:05:00Z' }),
    },
  ];

  const objectMarkers: ObjectMarkerV1[] = [
    {
      markerId: 'marker-boiler-partial-001',
      kind: 'boiler',
      label: 'Ideal Logic 30',
      roomId: 'room-kitchen-001',
      linkedPhotoIds: ['photo-partial-boiler-001'],
      linkedNoteIds: [],
      createdAt: '2025-06-02T10:08:00Z',
      provenance: captureProvenance({
        capturedAt: '2025-06-02T10:08:00Z',
        roomId: 'room-kitchen-001',
        confidence: 'manually_placed',
      }),
    },
  ];

  const photos: SessionPhotoV1[] = [
    {
      photoId: 'photo-partial-boiler-001',
      uri: 'r2://photos/session-partial-001/boiler.jpg',
      capturedAt: '2025-06-02T10:08:30Z',
      roomId: 'room-kitchen-001',
      objectMarkerId: 'marker-boiler-partial-001',
      provenance: captureProvenance({
        capturedAt: '2025-06-02T10:08:30Z',
        roomId: 'room-kitchen-001',
        objectId: 'marker-boiler-partial-001',
        confidence: 'photo_linked',
      }),
    },
  ];

  return {
    schemaVersion: 'atlas.scan.session.v1',
    visitId: 'visit-fixture-partial-001',
    sessionId: 'session-fixture-partial-001',
    status: 'review',
    captureStartedAt: '2025-06-02T10:00:00Z',
    captureCompletedAt: '2025-06-02T10:30:00Z',
    rooms,
    objectMarkers,
    photos,
    notes: [],
    timelineEvents: [
      { eventId: 'pevt-001', type: 'session_started', timestamp: '2025-06-02T10:00:00Z' },
      { eventId: 'pevt-002', type: 'session_completed', timestamp: '2025-06-02T10:30:00Z' },
    ],
    assetManifest: [
      {
        assetId: 'asset-partial-photo-001',
        kind: 'photo',
        uri: 'r2://photos/session-partial-001/boiler.jpg',
        mimeType: 'image/jpeg',
        capturedAt: '2025-06-02T10:08:30Z',
      },
    ],
    device: { platform: 'ios', lidarAvailable: false, appVersion: '3.0.0' },
    ...overrides,
  };
}

// ─── Photo-only capture ───────────────────────────────────────────────────────

/**
 * A valid minimal capture with photos only — no rooms, no spatial model.
 *
 * Represents a simple evidence capture (e.g. boiler photo, meter reading)
 * without room assignment or spatial capture.
 */
export function buildPhotoOnlyCapture(
  overrides: Partial<SessionCaptureV1> = {},
): SessionCaptureV1 {
  const photos: SessionPhotoV1[] = [
    {
      photoId: 'photo-only-001',
      uri: 'r2://photos/session-photo-only-001/cylinder.jpg',
      capturedAt: '2025-06-03T11:00:00Z',
      tags: ['cylinder', 'condition'],
      provenance: captureProvenance({ capturedAt: '2025-06-03T11:00:00Z', confidence: 'photo_linked' }),
    },
    {
      photoId: 'photo-only-002',
      uri: 'r2://photos/session-photo-only-001/cylinder-label.jpg',
      capturedAt: '2025-06-03T11:01:00Z',
      tags: ['data_plate'],
      provenance: captureProvenance({ capturedAt: '2025-06-03T11:01:00Z', confidence: 'photo_linked' }),
    },
  ];

  return {
    schemaVersion: 'atlas.scan.session.v1',
    visitId: 'visit-fixture-photo-only-001',
    sessionId: 'session-fixture-photo-only-001',
    status: 'ready',
    captureStartedAt: '2025-06-03T11:00:00Z',
    captureCompletedAt: '2025-06-03T11:05:00Z',
    rooms: [],
    objectMarkers: [],
    photos,
    notes: [],
    timelineEvents: [
      { eventId: 'poevt-001', type: 'session_started', timestamp: '2025-06-03T11:00:00Z' },
      { eventId: 'poevt-002', type: 'photo_taken', timestamp: '2025-06-03T11:00:00Z' },
      { eventId: 'poevt-003', type: 'photo_taken', timestamp: '2025-06-03T11:01:00Z' },
      { eventId: 'poevt-004', type: 'session_completed', timestamp: '2025-06-03T11:05:00Z' },
    ],
    assetManifest: [
      {
        assetId: 'asset-photo-only-001',
        kind: 'photo',
        uri: 'r2://photos/session-photo-only-001/cylinder.jpg',
        mimeType: 'image/jpeg',
        capturedAt: '2025-06-03T11:00:00Z',
      },
      {
        assetId: 'asset-photo-only-002',
        kind: 'photo',
        uri: 'r2://photos/session-photo-only-001/cylinder-label.jpg',
        mimeType: 'image/jpeg',
        capturedAt: '2025-06-03T11:01:00Z',
      },
    ],
    device: { platform: 'ios', appVersion: '3.0.0' },
    ...overrides,
  };
}

// ─── Transcript-only capture ──────────────────────────────────────────────────

/**
 * A valid capture with a transcript only — no rooms, no photos.
 *
 * Represents a voice-note-only session or a capture where only transcript
 * text is present (raw audio not retained).
 */
export function buildTranscriptOnlyCapture(
  overrides: Partial<SessionCaptureV1> = {},
): SessionCaptureV1 {
  const transcript: TranscriptV1 = {
    status: 'complete',
    text: 'Customer mentioned three kids, all under 10. Hot water demand is high. They have a combi at the moment but want a system boiler for better pressure. Budget around £4,000 including installation.',
    segments: [
      {
        segmentId: 'tseg-001',
        text: 'Customer mentioned three kids, all under 10. Hot water demand is high.',
        startedAt: '2025-06-04T14:00:00Z',
        endedAt: '2025-06-04T14:00:12Z',
      },
      {
        segmentId: 'tseg-002',
        text: 'They have a combi at the moment but want a system boiler for better pressure.',
        startedAt: '2025-06-04T14:00:14Z',
        endedAt: '2025-06-04T14:00:24Z',
      },
    ],
  };

  return {
    schemaVersion: 'atlas.scan.session.v1',
    visitId: 'visit-fixture-transcript-001',
    sessionId: 'session-fixture-transcript-001',
    status: 'ready',
    captureStartedAt: '2025-06-04T14:00:00Z',
    captureCompletedAt: '2025-06-04T14:05:00Z',
    rooms: [],
    objectMarkers: [],
    photos: [],
    transcript,
    notes: [],
    timelineEvents: [
      { eventId: 'tevt-001', type: 'session_started', timestamp: '2025-06-04T14:00:00Z' },
      { eventId: 'tevt-002', type: 'session_completed', timestamp: '2025-06-04T14:05:00Z' },
    ],
    assetManifest: [],
    device: { platform: 'ios', appVersion: '3.0.0' },
    ...overrides,
  };
}

// ─── Flue clearance capture ───────────────────────────────────────────────────

/**
 * A focused flue clearance evidence capture.
 *
 * Represents a visit whose primary purpose is documenting flue terminal
 * clearance distances.  Includes a flue marker with linked photos and notes.
 */
export function buildFlueClearanceCapture(
  overrides: Partial<SessionCaptureV1> = {},
): SessionCaptureV1 {
  const rooms: SessionRoomV1[] = [
    {
      roomId: 'room-utility-001',
      label: 'Utility Room',
      status: 'complete',
      floorIndex: 0,
      provenance: captureProvenance({ capturedAt: '2025-06-05T09:10:00Z', confidence: 'manually_placed' }),
    },
  ];

  const objectMarkers: ObjectMarkerV1[] = [
    {
      markerId: 'marker-flue-clearance-001',
      kind: 'flue',
      label: 'Flue terminal — rear elevation',
      roomId: 'room-utility-001',
      linkedPhotoIds: ['photo-flue-clearance-001', 'photo-flue-clearance-002'],
      linkedNoteIds: ['note-flue-clearance-001'],
      createdAt: '2025-06-05T09:12:00Z',
      provenance: captureProvenance({
        capturedAt: '2025-06-05T09:12:00Z',
        roomId: 'room-utility-001',
        confidence: 'photo_linked',
      }),
    },
  ];

  const photos: SessionPhotoV1[] = [
    {
      photoId: 'photo-flue-clearance-001',
      uri: 'r2://photos/session-flue-001/flue-terminal-wide.jpg',
      capturedAt: '2025-06-05T09:12:30Z',
      roomId: 'room-utility-001',
      objectMarkerId: 'marker-flue-clearance-001',
      tags: ['flue_terminal', 'clearance', 'wide_shot'],
      provenance: captureProvenance({
        capturedAt: '2025-06-05T09:12:30Z',
        roomId: 'room-utility-001',
        objectId: 'marker-flue-clearance-001',
        confidence: 'photo_linked',
      }),
    },
    {
      photoId: 'photo-flue-clearance-002',
      uri: 'r2://photos/session-flue-001/flue-terminal-close.jpg',
      capturedAt: '2025-06-05T09:13:00Z',
      roomId: 'room-utility-001',
      objectMarkerId: 'marker-flue-clearance-001',
      tags: ['flue_terminal', 'clearance', 'close_up'],
      provenance: captureProvenance({
        capturedAt: '2025-06-05T09:13:00Z',
        roomId: 'room-utility-001',
        objectId: 'marker-flue-clearance-001',
        confidence: 'photo_linked',
      }),
    },
  ];

  const notes: SessionNoteV1[] = [
    {
      noteId: 'note-flue-clearance-001',
      text: 'Flue terminal clearance to window opening approx 350 mm — borderline. Needs measurement check before sign-off.',
      createdAt: '2025-06-05T09:14:00Z',
      roomId: 'room-utility-001',
      objectMarkerId: 'marker-flue-clearance-001',
      category: 'risk',
    },
  ];

  return {
    schemaVersion: 'atlas.scan.session.v1',
    visitId: 'visit-fixture-flue-001',
    sessionId: 'session-fixture-flue-001',
    status: 'review',
    captureStartedAt: '2025-06-05T09:10:00Z',
    captureCompletedAt: '2025-06-05T09:20:00Z',
    rooms,
    objectMarkers,
    photos,
    notes,
    timelineEvents: [
      { eventId: 'fevt-001', type: 'session_started', timestamp: '2025-06-05T09:10:00Z' },
      { eventId: 'fevt-002', type: 'room_started', timestamp: '2025-06-05T09:10:00Z', roomId: 'room-utility-001' },
      { eventId: 'fevt-003', type: 'object_placed', timestamp: '2025-06-05T09:12:00Z', roomId: 'room-utility-001', objectId: 'marker-flue-clearance-001' },
      { eventId: 'fevt-004', type: 'photo_taken', timestamp: '2025-06-05T09:12:30Z', roomId: 'room-utility-001' },
      { eventId: 'fevt-005', type: 'note_added', timestamp: '2025-06-05T09:14:00Z', roomId: 'room-utility-001' },
      { eventId: 'fevt-006', type: 'session_completed', timestamp: '2025-06-05T09:20:00Z' },
    ],
    assetManifest: [
      {
        assetId: 'asset-flue-photo-001',
        kind: 'photo',
        uri: 'r2://photos/session-flue-001/flue-terminal-wide.jpg',
        mimeType: 'image/jpeg',
        capturedAt: '2025-06-05T09:12:30Z',
      },
      {
        assetId: 'asset-flue-photo-002',
        kind: 'photo',
        uri: 'r2://photos/session-flue-001/flue-terminal-close.jpg',
        mimeType: 'image/jpeg',
        capturedAt: '2025-06-05T09:13:00Z',
      },
    ],
    device: { platform: 'ios', model: 'iPhone 14', appVersion: '3.0.0', lidarAvailable: false },
    ...overrides,
  };
}

// ─── Invalid fixtures ─────────────────────────────────────────────────────────

/**
 * Invalid: missing visitId.
 *
 * visitId is always required.  Omitting it must cause validation failure.
 */
export function buildInvalidMissingVisitId(): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { visitId: _v, ...rest } = buildFullSessionCaptureV1();
  return rest as Record<string, unknown>;
}

/**
 * Invalid: missing sessionId.
 *
 * sessionId is always required.  Omitting it must cause validation failure.
 */
export function buildInvalidMissingSessionId(): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { sessionId: _s, ...rest } = buildFullSessionCaptureV1();
  return rest as Record<string, unknown>;
}

/**
 * Invalid: photo references a roomId that does not exist in rooms[].
 *
 * Orphan room reference must be caught by the orphan-check phase.
 */
export function buildInvalidOrphanPhotoRoom(): Record<string, unknown> {
  const session = buildPhotoOnlyCapture();
  return {
    ...session,
    photos: [
      {
        ...session.photos[0],
        photoId: 'orphan-photo-001',
        roomId: 'room-that-does-not-exist',
      },
    ],
  } as Record<string, unknown>;
}

/**
 * Invalid: objectMarker.linkedPhotoIds contains a photoId that does not exist
 * in photos[].
 *
 * Orphan photo reference must be caught by the orphan-check phase.
 */
export function buildInvalidOrphanMarkerPhoto(): Record<string, unknown> {
  const session = buildPartialRoomCapture();
  return {
    ...session,
    objectMarkers: [
      {
        ...session.objectMarkers[0],
        linkedPhotoIds: ['photo-that-does-not-exist'],
      },
    ],
  } as Record<string, unknown>;
}
