/**
 * buildInitialSpatialModelFromSessionCapture.ts
 *
 * Derives an initial AtlasSpatialModelV1 from a SessionCaptureV2 payload.
 *
 * This is the boundary crossing from raw capture (Scan) to editable semantic
 * model (Mind).  The importer:
 *   - Maps room scans → AtlasRoomV1 entities (footprint from raw area/height)
 *   - Maps placed objects → emitter / heat-source / control / asset entities
 *   - Maps photos and voice notes → AtlasEvidenceMarkerV1 entries
 *   - Creates provenance entries for the import event
 *   - Does NOT derive heat-loss values, recommendations, or engine outputs
 */

import type { SessionCaptureV2, CapturedPlacedObject } from '../atlasScan/sessionCapture.types';
import type {
  AtlasSpatialModelV1,
  AtlasSpatialEntityV1,
  AtlasRoomV1,
  AtlasHeatSourcePlacementV1,
  AtlasStorePlacementV1,
  AtlasEmitterV1,
  AtlasControlPlacementV1,
  AtlasAssetPlacementV1,
} from './atlasSpatialModel.types';
import type { AtlasEvidenceMarkerV1 } from './atlasEvidence.types';
import type { AtlasProvenanceEntryV1 } from './atlasProvenance.types';
import type { RoomFootprintWithHeight, Polygon2D } from './atlasGeometry.types';

// ─── Options ──────────────────────────────────────────────────────────────────

export interface ImportOptions {
  /** Override the model ID (UUID). If omitted, one is generated. */
  modelId?: string;
  /** ISO-8601 timestamp for the import event. Defaults to now. */
  importedAt?: string;
  /** Actor performing the import. Defaults to system/importer. */
  actor?: {
    type: 'user' | 'system';
    id?: string;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Generates a placeholder deterministic ID from a seed string.
 *
 * ⚠️  This is NOT suitable for production use: it can produce ID collisions
 * when seeds share a long common prefix or differ only after 32 characters.
 *
 * Replace with `crypto.randomUUID()` (Node ≥ 15 / modern browsers) or an
 * equivalent UUID v4 library before deploying to production.  Callers can
 * also supply their own IDs via `ImportOptions.modelId`.
 */
function syntheticId(seed: string): string {
  // Simple deterministic surrogate — not cryptographically random.
  // Consumers should pass UUIDs via options or replace this with crypto.randomUUID().
  return `atlas-${seed.replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 32)}`;
}

/**
 * Builds a minimal RoomFootprintWithHeight from raw area and height values.
 *
 * When no geometry measurements are available, returns a unit-square placeholder
 * so that the entity can be placed and refined in Mind.
 */
function roomFootprintFromRaw(rawAreaM2?: number, rawHeightM?: number): RoomFootprintWithHeight {
  const side = rawAreaM2 != null ? Math.sqrt(rawAreaM2) : 1;
  const ceilingHeightM = rawHeightM ?? 2.4;

  const polygon: Polygon2D = {
    kind: 'polygon2d',
    points: [
      { x: 0, y: 0 },
      { x: side, y: 0 },
      { x: side, y: side },
      { x: 0, y: side },
    ],
  };

  return {
    kind: 'room_footprint',
    floorPolygon: polygon,
    ceilingHeightM,
  };
}

/**
 * Maps a CapturedPlacedObject kind to a spatial entity.
 *
 * Returns the typed entity or null if the kind is not mapped to a first-class
 * entity type (in which case it becomes a generic asset).
 */
function mapPlacedObjectToEntity(
  obj: CapturedPlacedObject,
  sessionId: string,
  now: string,
): AtlasSpatialEntityV1 {
  const base = {
    id: obj.id,
    ...(obj.label !== undefined ? { label: obj.label } : {}),
    geometry: {
      kind: 'polygon2d' as const,
      points: obj.position != null
        ? [{ x: obj.position.x, y: obj.position.y }]
        : [{ x: 0, y: 0 }],
    },
    semanticRole: obj.kind,
    status: 'existing' as const,
    certainty: 'observed' as const,
    evidenceIds: [],
    sourceSessionId: sessionId,
    createdAt: obj.createdAt,
    updatedAt: now,
  };

  if (obj.kind === 'boiler') {
    const entity: AtlasHeatSourcePlacementV1 = {
      ...base,
      kind: 'heat_source',
      type: 'boiler',
      ...(obj.roomId !== undefined ? { roomId: obj.roomId } : {}),
    };
    return entity;
  }

  if (obj.kind === 'cylinder') {
    const entity: AtlasStorePlacementV1 = {
      ...base,
      kind: 'hot_water_store',
      type: 'vented_cylinder',
      ...(obj.roomId !== undefined ? { roomId: obj.roomId } : {}),
    };
    return entity;
  }

  if (obj.kind === 'radiator') {
    const entity: AtlasEmitterV1 = {
      ...base,
      kind: 'emitter',
      type: 'panel_radiator',
      roomId: obj.roomId ?? '',
    };
    return entity;
  }

  if (obj.kind === 'control') {
    const entity: AtlasControlPlacementV1 = {
      ...base,
      kind: 'control',
      type: 'other',
      ...(obj.roomId !== undefined ? { roomId: obj.roomId } : {}),
    };
    return entity;
  }

  // All other kinds become generic assets
  const asset: AtlasAssetPlacementV1 = {
    ...base,
    kind: 'asset',
    assetType: obj.kind,
    ...(obj.roomId !== undefined ? { roomId: obj.roomId } : {}),
  };
  return asset;
}

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Builds an initial AtlasSpatialModelV1 from a SessionCaptureV2.
 *
 * This is a one-way, lossy-upward conversion: all raw capture data is mapped
 * to semantic entities, but the output model has certainty 'observed' or
 * 'inferred' on every entity.  The Mind editor is expected to review and
 * upgrade certainty values as the model is refined.
 */
export function buildInitialSpatialModelFromSessionCapture(
  capture: SessionCaptureV2,
  options: ImportOptions = {},
): AtlasSpatialModelV1 {
  const now = options.importedAt ?? nowIso();
  const modelId = options.modelId ?? syntheticId(`model-${capture.sessionId}`);
  const actor = options.actor ?? { type: 'system' as const, id: 'importer' };

  const rooms: AtlasRoomV1[] = capture.captures.roomScans.map((scan) => ({
    id: scan.id,
    kind: 'room' as const,
    ...(scan.label !== undefined ? { label: scan.label } : {}),
    geometry: roomFootprintFromRaw(scan.rawAreaM2, scan.rawHeightM),
    semanticRole: 'room',
    status: 'existing' as const,
    certainty: 'observed' as const,
    evidenceIds: [],
    sourceSessionId: capture.sessionId,
    levelId: 'level-ground',
    createdAt: scan.capturedAt,
    updatedAt: now,
  }));

  // Classify placed objects into typed entity arrays
  const emitters: AtlasEmitterV1[] = [];
  const heatSources: AtlasHeatSourcePlacementV1[] = [];
  const hotWaterStores: AtlasStorePlacementV1[] = [];
  const controls: AtlasControlPlacementV1[] = [];
  const assets: AtlasAssetPlacementV1[] = [];

  for (const obj of capture.captures.placedObjects) {
    const entity = mapPlacedObjectToEntity(obj, capture.sessionId, now);
    if (entity.kind === 'emitter') emitters.push(entity as AtlasEmitterV1);
    else if (entity.kind === 'heat_source') heatSources.push(entity as AtlasHeatSourcePlacementV1);
    else if (entity.kind === 'hot_water_store') hotWaterStores.push(entity as AtlasStorePlacementV1);
    else if (entity.kind === 'control') controls.push(entity as AtlasControlPlacementV1);
    else assets.push(entity as AtlasAssetPlacementV1);
  }

  // Build evidence markers from photos
  const evidenceMarkers: AtlasEvidenceMarkerV1[] = [
    ...capture.captures.photos.map((photo) => ({
      id: syntheticId(`ev-photo-${photo.id}`),
      entityId: photo.linkedObjectId ?? photo.roomId ?? 'unlinked',
      sources: [
        {
          type: 'photo' as const,
          captureId: photo.id,
          sessionId: capture.sessionId,
        },
      ],
      ...(photo.note !== undefined ? { note: photo.note } : {}),
      createdAt: photo.capturedAt,
    })),
    ...capture.captures.voiceNotes.map((note) => ({
      id: syntheticId(`ev-voice-${note.id}`),
      entityId: note.linkedObjectId ?? note.roomId ?? 'unlinked',
      sources: [
        {
          type: 'voice_note' as const,
          captureId: note.id,
          sessionId: capture.sessionId,
        },
      ],
      note: note.transcript.slice(0, 200),
      createdAt: note.startedAt,
    })),
  ];

  const provenance: AtlasProvenanceEntryV1[] = [
    {
      id: syntheticId(`prov-import-${capture.sessionId}`),
      eventKind: 'import_from_scan',
      actor,
      occurredAt: now,
      sourceSessionId: capture.sessionId,
      description: `Initial import from SessionCaptureV2 session ${capture.sessionId}`,
    },
  ];

  return {
    schemaVersion: 'atlas.spatial.v1',
    modelId,
    propertyId: capture.propertyId ?? '',
    sourceSessionId: capture.sessionId,
    coordinateSystem: {
      kind: 'metric_m_yup',
    },
    levels: [
      {
        id: 'level-ground',
        kind: 'level',
        label: 'Ground Floor',
        index: 0,
        geometry: {
          kind: 'polygon2d',
          points: [{ x: 0, y: 0 }],
        },
        semanticRole: 'level',
        status: 'existing',
        certainty: 'assumed',
        evidenceIds: [],
        sourceSessionId: capture.sessionId,
        createdAt: now,
        updatedAt: now,
      },
    ],
    rooms,
    boundaries: [],
    openings: [],
    thermalZones: [],
    emitters,
    heatSources,
    hotWaterStores,
    pipeRuns: [],
    controls,
    assets,
    evidenceMarkers,
    provenance,
    revision: 1,
    createdAt: now,
    updatedAt: now,
  };
}
