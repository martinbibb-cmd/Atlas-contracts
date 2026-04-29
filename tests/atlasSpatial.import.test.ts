/**
 * atlasSpatial.import.test.ts
 *
 * Tests for buildInitialSpatialModelFromSessionCapture.
 *
 * Coverage:
 *   1. Minimal capture produces a valid model
 *   2. Rooms map to AtlasRoomV1 entities
 *   3. Room footprint is derived from geometry.rawAreaM2 / rawHeightM
 *   4. Boiler objectMarker maps to AtlasHeatSourcePlacementV1
 *   5. Cylinder objectMarker maps to AtlasStorePlacementV1
 *   6. Radiator objectMarker maps to AtlasEmitterV1
 *   7. Control objectMarker maps to AtlasControlPlacementV1
 *   8. Flue objectMarker maps to AtlasAssetPlacementV1 (generic)
 *   9. Photos produce evidence markers
 *  10. Transcript segments produce evidence markers
 *  11. ModelId and propertyId are set from options
 *  12. Revision starts at 1
 *  13. Provenance records import_from_scan event
 *  14. Model passes validateAtlasSpatialModel after import
 */

import { describe, it, expect } from 'vitest';
import { buildInitialSpatialModelFromSessionCapture } from '../src/atlasSpatial/buildInitialSpatialModelFromSessionCapture';
import { validateAtlasSpatialModel } from '../src/atlasSpatial/atlasSpatialModel.schema';
import {
  buildPhotoOnlyCapture,
  buildFullSessionCaptureV1,
} from '../src/atlasScan/sessionCaptureV1.fixtures';
import type {
  SessionCaptureV1,
  SessionRoomV1,
  ObjectMarkerV1,
  EvidenceProvenanceV1,
} from '../src/atlasScan/sessionCaptureV1.types';

const NOW = '2025-06-01T10:00:00Z';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function baseProvenance(): EvidenceProvenanceV1 {
  return { source: 'capture', capturedAt: NOW, confidence: 'scanned' };
}

function minimalCapture(
  overrides: Partial<SessionCaptureV1> = {},
): SessionCaptureV1 {
  return {
    schemaVersion: 'atlas.scan.session.v1',
    visitId: 'visit-spatial-test-001',
    sessionId: 'session-spatial-test-001',
    status: 'ready',
    captureStartedAt: NOW,
    rooms: [],
    objectMarkers: [],
    photos: [],
    notes: [],
    timelineEvents: [],
    assetManifest: [],
    ...overrides,
  };
}

function roomCapture(
  rooms: SessionRoomV1[],
  overrides: Partial<SessionCaptureV1> = {},
): SessionCaptureV1 {
  return minimalCapture({ rooms, ...overrides });
}

function markerCapture(
  markers: ObjectMarkerV1[],
): SessionCaptureV1 {
  return minimalCapture({ objectMarkers: markers });
}

function makeMarker(kind: ObjectMarkerV1['kind']): ObjectMarkerV1 {
  return {
    markerId: `marker-${kind}-001`,
    kind,
    linkedPhotoIds: [],
    linkedNoteIds: [],
    createdAt: NOW,
    provenance: baseProvenance(),
  };
}

// ─── 1. Minimal capture produces a valid model ────────────────────────────────

describe('buildInitialSpatialModelFromSessionCapture — minimal capture', () => {
  it('produces a model with schemaVersion atlas.spatial.v1', () => {
    const model = buildInitialSpatialModelFromSessionCapture(
      minimalCapture(),
      { importedAt: NOW },
    );
    expect(model.schemaVersion).toBe('atlas.spatial.v1');
  });

  it('starts at revision 1', () => {
    const model = buildInitialSpatialModelFromSessionCapture(
      minimalCapture(),
      { importedAt: NOW },
    );
    expect(model.revision).toBe(1);
  });

  it('has empty rooms when no rooms', () => {
    const model = buildInitialSpatialModelFromSessionCapture(
      minimalCapture(),
      { importedAt: NOW },
    );
    expect(model.rooms).toHaveLength(0);
  });
});

// ─── 2. Rooms map to AtlasRoomV1 ─────────────────────────────────────────────

describe('buildInitialSpatialModelFromSessionCapture — rooms', () => {
  it('maps one room to one AtlasRoomV1', () => {
    const capture = roomCapture([
      {
        roomId: 'scan-r1',
        label: 'Lounge',
        status: 'complete',
        provenance: baseProvenance(),
      },
    ]);
    const model = buildInitialSpatialModelFromSessionCapture(capture, { importedAt: NOW });
    expect(model.rooms).toHaveLength(1);
    expect(model.rooms[0]?.id).toBe('scan-r1');
    expect(model.rooms[0]?.label).toBe('Lounge');
  });

  it('sets certainty to observed on imported rooms', () => {
    const capture = roomCapture([
      { roomId: 'r1', label: 'Kitchen', status: 'complete', provenance: baseProvenance() },
    ]);
    const model = buildInitialSpatialModelFromSessionCapture(capture, { importedAt: NOW });
    expect(model.rooms[0]?.certainty).toBe('observed');
  });
});

// ─── 3. Footprint from geometry.rawAreaM2 / rawHeightM ───────────────────────

describe('buildInitialSpatialModelFromSessionCapture — room footprint', () => {
  it('creates a room_footprint geometry with the provided height', () => {
    const capture = roomCapture([
      {
        roomId: 'r1',
        label: 'Kitchen',
        status: 'complete',
        geometry: { rawAreaM2: 16, rawHeightM: 2.7 },
        provenance: baseProvenance(),
      },
    ]);
    const model = buildInitialSpatialModelFromSessionCapture(capture, { importedAt: NOW });
    const geom = model.rooms[0]?.geometry;
    expect(geom?.kind).toBe('room_footprint');
    if (geom?.kind !== 'room_footprint') throw new Error('Expected room_footprint');
    expect(geom.ceilingHeightM).toBe(2.7);
  });
});

// ─── 4–8. Object marker kind mapping ─────────────────────────────────────────

describe('buildInitialSpatialModelFromSessionCapture — object markers', () => {
  it('maps boiler → heatSources with type boiler', () => {
    const model = buildInitialSpatialModelFromSessionCapture(
      markerCapture([makeMarker('boiler')]),
      { importedAt: NOW },
    );
    expect(model.heatSources).toHaveLength(1);
    expect(model.heatSources[0]?.type).toBe('boiler');
    expect(model.emitters).toHaveLength(0);
  });

  it('maps cylinder → hotWaterStores', () => {
    const model = buildInitialSpatialModelFromSessionCapture(
      markerCapture([makeMarker('cylinder')]),
      { importedAt: NOW },
    );
    expect(model.hotWaterStores).toHaveLength(1);
    expect(model.heatSources).toHaveLength(0);
  });

  it('maps radiator → emitters with type panel_radiator', () => {
    const model = buildInitialSpatialModelFromSessionCapture(
      markerCapture([makeMarker('radiator')]),
      { importedAt: NOW },
    );
    expect(model.emitters).toHaveLength(1);
    expect(model.emitters[0]?.type).toBe('panel_radiator');
  });

  it('maps control → controls', () => {
    const model = buildInitialSpatialModelFromSessionCapture(
      markerCapture([makeMarker('control')]),
      { importedAt: NOW },
    );
    expect(model.controls).toHaveLength(1);
  });

  it('maps flue → assets (generic)', () => {
    const model = buildInitialSpatialModelFromSessionCapture(
      markerCapture([makeMarker('flue')]),
      { importedAt: NOW },
    );
    expect(model.assets).toHaveLength(1);
    expect(model.assets[0]?.assetType).toBe('flue');
  });

  it('maps gas_meter → assets (generic)', () => {
    const model = buildInitialSpatialModelFromSessionCapture(
      markerCapture([makeMarker('gas_meter')]),
      { importedAt: NOW },
    );
    expect(model.assets).toHaveLength(1);
    expect(model.assets[0]?.assetType).toBe('gas_meter');
  });
});

// ─── 9. Photos → evidence markers ────────────────────────────────────────────

describe('buildInitialSpatialModelFromSessionCapture — photos', () => {
  it('creates one evidence marker per photo', () => {
    const capture = minimalCapture({
      photos: [
        {
          photoId: 'p1',
          uri: 'r2://photos/p1.jpg',
          capturedAt: NOW,
          provenance: baseProvenance(),
        },
        {
          photoId: 'p2',
          uri: 'r2://photos/p2.jpg',
          capturedAt: NOW,
          provenance: baseProvenance(),
        },
      ],
    });
    const model = buildInitialSpatialModelFromSessionCapture(capture, { importedAt: NOW });
    const photoMarkers = model.evidenceMarkers.filter(
      (m) => m.sources[0]?.type === 'photo',
    );
    expect(photoMarkers).toHaveLength(2);
  });

  it('evidence marker source has the correct captureId', () => {
    const capture = minimalCapture({
      photos: [
        {
          photoId: 'photo-xyz',
          uri: 'r2://photos/photo-xyz.jpg',
          capturedAt: NOW,
          provenance: baseProvenance(),
        },
      ],
    });
    const model = buildInitialSpatialModelFromSessionCapture(capture, { importedAt: NOW });
    const marker = model.evidenceMarkers[0];
    expect(marker?.sources[0]?.type).toBe('photo');
    if (marker?.sources[0]?.type !== 'photo') throw new Error('Expected photo');
    expect(marker.sources[0].captureId).toBe('photo-xyz');
  });
});

// ─── 10. Transcript segments → evidence markers ───────────────────────────────

describe('buildInitialSpatialModelFromSessionCapture — transcript segments', () => {
  it('creates one evidence marker per transcript segment', () => {
    const capture = minimalCapture({
      transcript: {
        status: 'complete',
        segments: [
          {
            segmentId: 'seg-v1',
            text: 'Boiler is Worcester 30i.',
            startedAt: NOW,
          },
          {
            segmentId: 'seg-v2',
            text: 'Flue exit at rear.',
            startedAt: NOW,
          },
        ],
      },
    });
    const model = buildInitialSpatialModelFromSessionCapture(capture, { importedAt: NOW });
    const voiceMarkers = model.evidenceMarkers.filter(
      (m) => m.sources[0]?.type === 'voice_note',
    );
    expect(voiceMarkers).toHaveLength(2);
  });
});

// ─── 11. ModelId and propertyId ───────────────────────────────────────────────

describe('buildInitialSpatialModelFromSessionCapture — ids', () => {
  it('uses provided modelId option', () => {
    const model = buildInitialSpatialModelFromSessionCapture(
      minimalCapture(),
      { importedAt: NOW, modelId: 'custom-model-id' },
    );
    expect(model.modelId).toBe('custom-model-id');
  });

  it('sets propertyId from options.propertyId', () => {
    const model = buildInitialSpatialModelFromSessionCapture(
      minimalCapture(),
      { importedAt: NOW, propertyId: 'prop-abc' },
    );
    expect(model.propertyId).toBe('prop-abc');
  });

  it('sets sourceSessionId from capture.sessionId', () => {
    const model = buildInitialSpatialModelFromSessionCapture(
      minimalCapture({ sessionId: 'sess-xyz' }),
      { importedAt: NOW },
    );
    expect(model.sourceSessionId).toBe('sess-xyz');
  });
});

// ─── 12. Revision starts at 1 ────────────────────────────────────────────────

describe('buildInitialSpatialModelFromSessionCapture — revision', () => {
  it('revision is 1', () => {
    const model = buildInitialSpatialModelFromSessionCapture(
      minimalCapture(),
      { importedAt: NOW },
    );
    expect(model.revision).toBe(1);
  });
});

// ─── 13. Provenance records import_from_scan ──────────────────────────────────

describe('buildInitialSpatialModelFromSessionCapture — provenance', () => {
  it('adds one provenance entry', () => {
    const model = buildInitialSpatialModelFromSessionCapture(
      minimalCapture(),
      { importedAt: NOW },
    );
    expect(model.provenance).toHaveLength(1);
  });

  it('provenance event kind is import_from_scan', () => {
    const model = buildInitialSpatialModelFromSessionCapture(
      minimalCapture(),
      { importedAt: NOW },
    );
    expect(model.provenance[0]?.eventKind).toBe('import_from_scan');
  });

  it('provenance actor defaults to system/importer', () => {
    const model = buildInitialSpatialModelFromSessionCapture(
      minimalCapture(),
      { importedAt: NOW },
    );
    expect(model.provenance[0]?.actor.type).toBe('system');
    expect(model.provenance[0]?.actor.id).toBe('importer');
  });
});

// ─── 14. Full model passes validateAtlasSpatialModel ─────────────────────────

describe('buildInitialSpatialModelFromSessionCapture — round-trip validation', () => {
  it('model built from photo-only fixture passes schema validation', () => {
    const model = buildInitialSpatialModelFromSessionCapture(
      buildPhotoOnlyCapture(),
      { importedAt: NOW, propertyId: 'prop-test-001' },
    );
    const result = validateAtlasSpatialModel(model);
    expect(result.ok).toBe(true);
  });

  it('model built from full fixture passes schema validation', () => {
    const model = buildInitialSpatialModelFromSessionCapture(
      buildFullSessionCaptureV1(),
      { importedAt: NOW, propertyId: 'prop-test-002' },
    );
    const result = validateAtlasSpatialModel(model);
    expect(result.ok).toBe(true);
  });
});
