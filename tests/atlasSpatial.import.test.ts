/**
 * atlasSpatial.import.test.ts
 *
 * Tests for buildInitialSpatialModelFromSessionCapture.
 *
 * Coverage:
 *   1. Minimal capture produces a valid model
 *   2. Room scans map to AtlasRoomV1 entities
 *   3. Room footprint is derived from rawAreaM2 / rawHeightM
 *   4. Placed boiler maps to AtlasHeatSourcePlacementV1
 *   5. Placed cylinder maps to AtlasStorePlacementV1
 *   6. Placed radiator maps to AtlasEmitterV1
 *   7. Placed control maps to AtlasControlPlacementV1
 *   8. Placed flue maps to AtlasAssetPlacementV1 (generic)
 *   9. Photos produce evidence markers
 *  10. Voice notes produce evidence markers
 *  11. ModelId and propertyId are set from options / capture
 *  12. Revision starts at 1
 *  13. Provenance records import_from_scan event
 *  14. Model passes validateAtlasSpatialModel after import
 */

import { describe, it, expect } from 'vitest';
import { buildInitialSpatialModelFromSessionCapture } from '../src/atlasSpatial/buildInitialSpatialModelFromSessionCapture';
import { validateAtlasSpatialModel } from '../src/atlasSpatial/atlasSpatialModel.schema';
import {
  buildSessionCaptureV2,
  buildMinimalSessionCaptureV2,
  buildCapturedRoomScan,
  buildCapturedPlacedObject,
  buildCapturedPhoto,
  buildCapturedVoiceNote,
} from '../src/atlasScan/sessionCapture.fixtures';
import type { SessionCaptureV2 } from '../src/atlasScan/sessionCapture.types';

const NOW = '2025-06-01T10:00:00Z';

// ─── 1. Minimal capture produces a valid model ────────────────────────────────

describe('buildInitialSpatialModelFromSessionCapture — minimal capture', () => {
  it('produces a model with schemaVersion atlas.spatial.v1', () => {
    const model = buildInitialSpatialModelFromSessionCapture(
      buildMinimalSessionCaptureV2(),
      { importedAt: NOW },
    );
    expect(model.schemaVersion).toBe('atlas.spatial.v1');
  });

  it('starts at revision 1', () => {
    const model = buildInitialSpatialModelFromSessionCapture(
      buildMinimalSessionCaptureV2(),
      { importedAt: NOW },
    );
    expect(model.revision).toBe(1);
  });

  it('has empty rooms when no room scans', () => {
    const model = buildInitialSpatialModelFromSessionCapture(
      buildMinimalSessionCaptureV2(),
      { importedAt: NOW },
    );
    expect(model.rooms).toHaveLength(0);
  });
});

// ─── 2. Room scans map to AtlasRoomV1 ────────────────────────────────────────

describe('buildInitialSpatialModelFromSessionCapture — room scans', () => {
  it('maps one room scan to one AtlasRoomV1', () => {
    const capture = buildMinimalSessionCaptureV2({
      captures: {
        roomScans: [buildCapturedRoomScan({ id: 'scan-r1', label: 'Lounge' })],
        photos: [],
        voiceNotes: [],
        placedObjects: [],
        floorPlanSnapshots: [],
      },
    });
    const model = buildInitialSpatialModelFromSessionCapture(capture, { importedAt: NOW });
    expect(model.rooms).toHaveLength(1);
    expect(model.rooms[0]?.id).toBe('scan-r1');
    expect(model.rooms[0]?.label).toBe('Lounge');
  });

  it('sets certainty to observed on imported rooms', () => {
    const capture = buildMinimalSessionCaptureV2({
      captures: {
        roomScans: [buildCapturedRoomScan()],
        photos: [],
        voiceNotes: [],
        placedObjects: [],
        floorPlanSnapshots: [],
      },
    });
    const model = buildInitialSpatialModelFromSessionCapture(capture, { importedAt: NOW });
    expect(model.rooms[0]?.certainty).toBe('observed');
  });
});

// ─── 3. Footprint from rawAreaM2 / rawHeightM ─────────────────────────────────

describe('buildInitialSpatialModelFromSessionCapture — room footprint', () => {
  it('creates a room_footprint geometry with the provided height', () => {
    const capture = buildMinimalSessionCaptureV2({
      captures: {
        roomScans: [buildCapturedRoomScan({ rawAreaM2: 16, rawHeightM: 2.7 })],
        photos: [],
        voiceNotes: [],
        placedObjects: [],
        floorPlanSnapshots: [],
      },
    });
    const model = buildInitialSpatialModelFromSessionCapture(capture, { importedAt: NOW });
    const geom = model.rooms[0]?.geometry;
    expect(geom?.kind).toBe('room_footprint');
    if (geom?.kind !== 'room_footprint') throw new Error('Expected room_footprint');
    expect(geom.ceilingHeightM).toBe(2.7);
  });
});

// ─── 4–8. Placed object kind mapping ─────────────────────────────────────────

describe('buildInitialSpatialModelFromSessionCapture — placed objects', () => {
  function makeCapture(kind: string): SessionCaptureV2 {
    return buildMinimalSessionCaptureV2({
      captures: {
        roomScans: [],
        photos: [],
        voiceNotes: [],
        placedObjects: [buildCapturedPlacedObject({ kind: kind as 'boiler' })],
        floorPlanSnapshots: [],
      },
    });
  }

  it('maps boiler → heatSources with type boiler', () => {
    const model = buildInitialSpatialModelFromSessionCapture(makeCapture('boiler'), { importedAt: NOW });
    expect(model.heatSources).toHaveLength(1);
    expect(model.heatSources[0]?.type).toBe('boiler');
    expect(model.emitters).toHaveLength(0);
  });

  it('maps cylinder → hotWaterStores', () => {
    const model = buildInitialSpatialModelFromSessionCapture(makeCapture('cylinder'), { importedAt: NOW });
    expect(model.hotWaterStores).toHaveLength(1);
    expect(model.heatSources).toHaveLength(0);
  });

  it('maps radiator → emitters with type panel_radiator', () => {
    const model = buildInitialSpatialModelFromSessionCapture(makeCapture('radiator'), { importedAt: NOW });
    expect(model.emitters).toHaveLength(1);
    expect(model.emitters[0]?.type).toBe('panel_radiator');
  });

  it('maps control → controls', () => {
    const model = buildInitialSpatialModelFromSessionCapture(makeCapture('control'), { importedAt: NOW });
    expect(model.controls).toHaveLength(1);
  });

  it('maps flue → assets (generic)', () => {
    const model = buildInitialSpatialModelFromSessionCapture(makeCapture('flue'), { importedAt: NOW });
    expect(model.assets).toHaveLength(1);
    expect(model.assets[0]?.assetType).toBe('flue');
  });

  it('maps gas_meter → assets (generic)', () => {
    const model = buildInitialSpatialModelFromSessionCapture(makeCapture('gas_meter'), { importedAt: NOW });
    expect(model.assets).toHaveLength(1);
    expect(model.assets[0]?.assetType).toBe('gas_meter');
  });
});

// ─── 9. Photos → evidence markers ────────────────────────────────────────────

describe('buildInitialSpatialModelFromSessionCapture — photos', () => {
  it('creates one evidence marker per photo', () => {
    const capture = buildMinimalSessionCaptureV2({
      captures: {
        roomScans: [],
        photos: [
          buildCapturedPhoto({ id: 'p1' }),
          buildCapturedPhoto({ id: 'p2' }),
        ],
        voiceNotes: [],
        placedObjects: [],
        floorPlanSnapshots: [],
      },
    });
    const model = buildInitialSpatialModelFromSessionCapture(capture, { importedAt: NOW });
    const photoMarkers = model.evidenceMarkers.filter(
      (m) => m.sources[0]?.type === 'photo',
    );
    expect(photoMarkers).toHaveLength(2);
  });

  it('evidence marker source has the correct captureId', () => {
    const capture = buildMinimalSessionCaptureV2({
      captures: {
        roomScans: [],
        photos: [buildCapturedPhoto({ id: 'photo-xyz' })],
        voiceNotes: [],
        placedObjects: [],
        floorPlanSnapshots: [],
      },
    });
    const model = buildInitialSpatialModelFromSessionCapture(capture, { importedAt: NOW });
    const marker = model.evidenceMarkers[0];
    expect(marker?.sources[0]?.type).toBe('photo');
    if (marker?.sources[0]?.type !== 'photo') throw new Error('Expected photo');
    expect(marker.sources[0].captureId).toBe('photo-xyz');
  });
});

// ─── 10. Voice notes → evidence markers ──────────────────────────────────────

describe('buildInitialSpatialModelFromSessionCapture — voice notes', () => {
  it('creates one evidence marker per voice note', () => {
    const capture = buildMinimalSessionCaptureV2({
      captures: {
        roomScans: [],
        photos: [],
        voiceNotes: [
          buildCapturedVoiceNote({ id: 'v1' }),
          buildCapturedVoiceNote({ id: 'v2' }),
        ],
        placedObjects: [],
        floorPlanSnapshots: [],
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
      buildMinimalSessionCaptureV2({ propertyId: 'prop-abc' }),
      { importedAt: NOW, modelId: 'custom-model-id' },
    );
    expect(model.modelId).toBe('custom-model-id');
  });

  it('sets propertyId from capture.propertyId', () => {
    const model = buildInitialSpatialModelFromSessionCapture(
      buildMinimalSessionCaptureV2({ propertyId: 'prop-abc' }),
      { importedAt: NOW },
    );
    expect(model.propertyId).toBe('prop-abc');
  });

  it('sets sourceSessionId from capture.sessionId', () => {
    const model = buildInitialSpatialModelFromSessionCapture(
      buildMinimalSessionCaptureV2({ sessionId: 'sess-xyz' }),
      { importedAt: NOW },
    );
    expect(model.sourceSessionId).toBe('sess-xyz');
  });
});

// ─── 12. Revision starts at 1 ────────────────────────────────────────────────

describe('buildInitialSpatialModelFromSessionCapture — revision', () => {
  it('revision is 1', () => {
    const model = buildInitialSpatialModelFromSessionCapture(
      buildMinimalSessionCaptureV2(),
      { importedAt: NOW },
    );
    expect(model.revision).toBe(1);
  });
});

// ─── 13. Provenance records import_from_scan ──────────────────────────────────

describe('buildInitialSpatialModelFromSessionCapture — provenance', () => {
  it('adds one provenance entry', () => {
    const model = buildInitialSpatialModelFromSessionCapture(
      buildMinimalSessionCaptureV2(),
      { importedAt: NOW },
    );
    expect(model.provenance).toHaveLength(1);
  });

  it('provenance event kind is import_from_scan', () => {
    const model = buildInitialSpatialModelFromSessionCapture(
      buildMinimalSessionCaptureV2(),
      { importedAt: NOW },
    );
    expect(model.provenance[0]?.eventKind).toBe('import_from_scan');
  });

  it('provenance actor defaults to system/importer', () => {
    const model = buildInitialSpatialModelFromSessionCapture(
      buildMinimalSessionCaptureV2(),
      { importedAt: NOW },
    );
    expect(model.provenance[0]?.actor.type).toBe('system');
    expect(model.provenance[0]?.actor.id).toBe('importer');
  });
});

// ─── 14. Full model passes validateAtlasSpatialModel ─────────────────────────

describe('buildInitialSpatialModelFromSessionCapture — round-trip validation', () => {
  it('model built from full fixture passes schema validation', () => {
    const model = buildInitialSpatialModelFromSessionCapture(
      buildSessionCaptureV2(),
      { importedAt: NOW },
    );
    const result = validateAtlasSpatialModel(model);
    expect(result.ok).toBe(true);
  });
});
