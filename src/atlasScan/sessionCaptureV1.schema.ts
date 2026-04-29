/**
 * sessionCaptureV1.schema.ts
 *
 * Runtime validation for SessionCaptureV1 payloads.
 *
 * The validator performs:
 *   1. Structural checks on all required and optional fields.
 *   2. Cross-reference (orphan) checks:
 *        - photo.roomId must reference a declared room
 *        - photo.objectMarkerId must reference a declared object marker
 *        - objectMarker.roomId must reference a declared room
 *        - objectMarker.linkedPhotoIds must reference declared photos
 *        - objectMarker.linkedNoteIds must reference declared notes
 *        - note.roomId must reference a declared room
 *        - note.objectMarkerId must reference a declared object marker
 *
 * Unknown extra fields are tolerated so that older consumers can handle newer
 * payloads gracefully.
 */

import type {
  SessionCaptureV1,
  UnknownSessionCaptureV1,
} from './sessionCaptureV1.types';

// ─── Result types ─────────────────────────────────────────────────────────────

export interface SessionCaptureV1ValidationSuccess {
  ok: true;
  session: SessionCaptureV1;
}

export interface SessionCaptureV1ValidationFailure {
  ok: false;
  error: string;
}

export type SessionCaptureV1ValidationResult =
  | SessionCaptureV1ValidationSuccess
  | SessionCaptureV1ValidationFailure;

// ─── Internal helpers ─────────────────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isIsoLike(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

// ─── Enum sets ────────────────────────────────────────────────────────────────

const SESSION_STATUSES = new Set([
  'active',
  'review',
  'ready',
  'synced',
  'exported',
]);

const ROOM_STATUSES = new Set(['active', 'complete']);

const SPATIAL_CONFIDENCES = new Set([
  'scanned',
  'manually_placed',
  'photo_linked',
  'inferred',
  'needs_review',
]);

const EVIDENCE_SOURCES = new Set(['capture', 'manual', 'inferred', 'import']);

const OBJECT_MARKER_KINDS = new Set([
  'boiler',
  'cylinder',
  'radiator',
  'flue',
  'gas_meter',
  'airing_cupboard',
  'control',
  'pump',
  'valve',
  'evidence_point',
  'generic_note',
  'pipe',
  'consumer_unit',
]);

const TRANSCRIPT_STATUSES = new Set([
  'pending',
  'processing',
  'complete',
  'failed',
]);

const NOTE_CATEGORIES = new Set([
  'constraint',
  'observation',
  'preference',
  'risk',
  'follow_up',
]);

const TIMELINE_EVENT_TYPES = new Set([
  'session_started',
  'room_started',
  'room_completed',
  'object_placed',
  'photo_taken',
  'note_added',
  'session_completed',
  'session_exported',
]);

const ASSET_KINDS = new Set(['photo', 'spatial_model', 'floor_plan', 'audio']);

const REVIEW_STATUSES = new Set([
  'pending',
  'in_review',
  'approved',
  'rejected',
]);

// ─── Sub-validators ───────────────────────────────────────────────────────────

function validateEvidenceProvenance(
  value: unknown,
  path: string,
): string | null {
  if (!isRecord(value)) return `${path} must be an object`;
  if (!EVIDENCE_SOURCES.has(value['source'] as string))
    return `${path}.source must be one of: ${[...EVIDENCE_SOURCES].join(', ')}`;
  if (!isIsoLike(value['capturedAt']))
    return `${path}.capturedAt must be an ISO-8601 timestamp`;
  if (!SPATIAL_CONFIDENCES.has(value['confidence'] as string))
    return `${path}.confidence must be one of: ${[...SPATIAL_CONFIDENCES].join(', ')}`;
  return null;
}

function validateRooms(value: unknown): string | null {
  if (!Array.isArray(value)) return 'rooms must be an array';
  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    if (!isRecord(item)) return `rooms[${i}] must be an object`;
    if (!isNonEmptyString(item['roomId']))
      return `rooms[${i}].roomId must be a non-empty string`;
    if (!isNonEmptyString(item['label']))
      return `rooms[${i}].label must be a non-empty string`;
    if (!ROOM_STATUSES.has(item['status'] as string))
      return `rooms[${i}].status must be 'active' or 'complete'`;
    if (item['provenance'] !== undefined) {
      const err = validateEvidenceProvenance(item['provenance'], `rooms[${i}].provenance`);
      if (err) return err;
    }
  }
  return null;
}

function validateSpatialModel(value: unknown): string | null {
  if (!isRecord(value)) return 'spatialModel must be an object';
  if (value['coordinateConvention'] !== 'metric_m')
    return "spatialModel.coordinateConvention must be 'metric_m'";
  if (!isIsoLike(value['capturedAt']))
    return 'spatialModel.capturedAt must be an ISO-8601 timestamp';
  if (!SPATIAL_CONFIDENCES.has(value['confidence'] as string))
    return `spatialModel.confidence must be one of: ${[...SPATIAL_CONFIDENCES].join(', ')}`;
  if (!Array.isArray(value['rooms']))
    return 'spatialModel.rooms must be an array';
  for (let i = 0; i < value['rooms'].length; i++) {
    const room = value['rooms'][i];
    if (!isRecord(room))
      return `spatialModel.rooms[${i}] must be an object`;
    if (!isNonEmptyString(room['roomId']))
      return `spatialModel.rooms[${i}].roomId must be a non-empty string`;
    if (!SPATIAL_CONFIDENCES.has(room['confidence'] as string))
      return `spatialModel.rooms[${i}].confidence must be one of: ${[...SPATIAL_CONFIDENCES].join(', ')}`;
  }
  return null;
}

function validateObjectMarkers(value: unknown): string | null {
  if (!Array.isArray(value)) return 'objectMarkers must be an array';
  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    if (!isRecord(item)) return `objectMarkers[${i}] must be an object`;
    if (!isNonEmptyString(item['markerId']))
      return `objectMarkers[${i}].markerId must be a non-empty string`;
    if (!OBJECT_MARKER_KINDS.has(item['kind'] as string))
      return `objectMarkers[${i}].kind must be a valid ObjectMarkerKind`;
    if (!Array.isArray(item['linkedPhotoIds']) || !isStringArray(item['linkedPhotoIds']))
      return `objectMarkers[${i}].linkedPhotoIds must be a string array`;
    if (!Array.isArray(item['linkedNoteIds']) || !isStringArray(item['linkedNoteIds']))
      return `objectMarkers[${i}].linkedNoteIds must be a string array`;
    if (!isIsoLike(item['createdAt']))
      return `objectMarkers[${i}].createdAt must be an ISO-8601 timestamp`;
    const err = validateEvidenceProvenance(item['provenance'], `objectMarkers[${i}].provenance`);
    if (err) return err;
  }
  return null;
}

function validatePhotos(value: unknown): string | null {
  if (!Array.isArray(value)) return 'photos must be an array';
  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    if (!isRecord(item)) return `photos[${i}] must be an object`;
    if (!isNonEmptyString(item['photoId']))
      return `photos[${i}].photoId must be a non-empty string`;
    if (!isNonEmptyString(item['uri']))
      return `photos[${i}].uri must be a non-empty string`;
    if (!isIsoLike(item['capturedAt']))
      return `photos[${i}].capturedAt must be an ISO-8601 timestamp`;
    const err = validateEvidenceProvenance(item['provenance'], `photos[${i}].provenance`);
    if (err) return err;
  }
  return null;
}

function validateTranscript(value: unknown): string | null {
  if (!isRecord(value)) return 'transcript must be an object';
  if (!TRANSCRIPT_STATUSES.has(value['status'] as string))
    return `transcript.status must be one of: ${[...TRANSCRIPT_STATUSES].join(', ')}`;
  if (value['segments'] !== undefined) {
    if (!Array.isArray(value['segments']))
      return 'transcript.segments must be an array';
    for (let i = 0; i < value['segments'].length; i++) {
      const seg = value['segments'][i];
      if (!isRecord(seg)) return `transcript.segments[${i}] must be an object`;
      if (!isNonEmptyString(seg['segmentId']))
        return `transcript.segments[${i}].segmentId must be a non-empty string`;
      if (typeof seg['text'] !== 'string')
        return `transcript.segments[${i}].text must be a string`;
      if (!isIsoLike(seg['startedAt']))
        return `transcript.segments[${i}].startedAt must be an ISO-8601 timestamp`;
    }
  }
  return null;
}

function validateNotes(value: unknown): string | null {
  if (!Array.isArray(value)) return 'notes must be an array';
  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    if (!isRecord(item)) return `notes[${i}] must be an object`;
    if (!isNonEmptyString(item['noteId']))
      return `notes[${i}].noteId must be a non-empty string`;
    if (typeof item['text'] !== 'string')
      return `notes[${i}].text must be a string`;
    if (!isIsoLike(item['createdAt']))
      return `notes[${i}].createdAt must be an ISO-8601 timestamp`;
    if (
      item['category'] !== undefined &&
      !NOTE_CATEGORIES.has(item['category'] as string)
    )
      return `notes[${i}].category must be one of: ${[...NOTE_CATEGORIES].join(', ')}`;
  }
  return null;
}

function validateTimelineEvents(value: unknown): string | null {
  if (!Array.isArray(value)) return 'timelineEvents must be an array';
  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    if (!isRecord(item)) return `timelineEvents[${i}] must be an object`;
    if (!isNonEmptyString(item['eventId']))
      return `timelineEvents[${i}].eventId must be a non-empty string`;
    if (!TIMELINE_EVENT_TYPES.has(item['type'] as string))
      return `timelineEvents[${i}].type must be a valid TimelineEventType`;
    if (!isIsoLike(item['timestamp']))
      return `timelineEvents[${i}].timestamp must be an ISO-8601 timestamp`;
  }
  return null;
}

function validateAssetManifest(value: unknown): string | null {
  if (!Array.isArray(value)) return 'assetManifest must be an array';
  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    if (!isRecord(item)) return `assetManifest[${i}] must be an object`;
    if (!isNonEmptyString(item['assetId']))
      return `assetManifest[${i}].assetId must be a non-empty string`;
    if (!ASSET_KINDS.has(item['kind'] as string))
      return `assetManifest[${i}].kind must be a valid AssetKindV1`;
    if (!isNonEmptyString(item['uri']))
      return `assetManifest[${i}].uri must be a non-empty string`;
    if (!isIsoLike(item['capturedAt']))
      return `assetManifest[${i}].capturedAt must be an ISO-8601 timestamp`;
  }
  return null;
}

function validateReviewState(value: unknown): string | null {
  if (!isRecord(value)) return 'review must be an object';
  if (!REVIEW_STATUSES.has(value['status'] as string))
    return `review.status must be one of: ${[...REVIEW_STATUSES].join(', ')}`;
  return null;
}

// ─── Orphan reference checks ──────────────────────────────────────────────────

function checkOrphanReferences(input: Record<string, unknown>): string | null {
  const rooms = (input['rooms'] as Record<string, unknown>[]) ?? [];
  const markers = (input['objectMarkers'] as Record<string, unknown>[]) ?? [];
  const photos = (input['photos'] as Record<string, unknown>[]) ?? [];
  const notes = (input['notes'] as Record<string, unknown>[]) ?? [];

  const roomIds = new Set(rooms.map((r) => r['roomId'] as string));
  const markerIds = new Set(markers.map((m) => m['markerId'] as string));
  const photoIds = new Set(photos.map((p) => p['photoId'] as string));
  const noteIds = new Set(notes.map((n) => n['noteId'] as string));

  // photos → rooms
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i];
    if (
      p !== undefined &&
      isNonEmptyString(p['roomId']) &&
      !roomIds.has(p['roomId'])
    )
      return `photos[${i}].roomId '${p['roomId']}' does not reference a declared room`;
  }

  // photos → objectMarkers
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i];
    if (
      p !== undefined &&
      isNonEmptyString(p['objectMarkerId']) &&
      !markerIds.has(p['objectMarkerId'])
    )
      return `photos[${i}].objectMarkerId '${p['objectMarkerId']}' does not reference a declared objectMarker`;
  }

  // objectMarkers → rooms
  for (let i = 0; i < markers.length; i++) {
    const m = markers[i];
    if (
      m !== undefined &&
      isNonEmptyString(m['roomId']) &&
      !roomIds.has(m['roomId'])
    )
      return `objectMarkers[${i}].roomId '${m['roomId']}' does not reference a declared room`;
  }

  // objectMarkers → photos (linkedPhotoIds)
  for (let i = 0; i < markers.length; i++) {
    const m = markers[i];
    if (!m) continue;
    const linkedPhotoIds = (m['linkedPhotoIds'] as string[]) ?? [];
    for (let j = 0; j < linkedPhotoIds.length; j++) {
      const pid = linkedPhotoIds[j];
      if (pid !== undefined && !photoIds.has(pid))
        return `objectMarkers[${i}].linkedPhotoIds[${j}] '${pid}' does not reference a declared photo`;
    }
  }

  // objectMarkers → notes (linkedNoteIds)
  for (let i = 0; i < markers.length; i++) {
    const m = markers[i];
    if (!m) continue;
    const linkedNoteIds = (m['linkedNoteIds'] as string[]) ?? [];
    for (let j = 0; j < linkedNoteIds.length; j++) {
      const nid = linkedNoteIds[j];
      if (nid !== undefined && !noteIds.has(nid))
        return `objectMarkers[${i}].linkedNoteIds[${j}] '${nid}' does not reference a declared note`;
    }
  }

  // notes → rooms
  for (let i = 0; i < notes.length; i++) {
    const n = notes[i];
    if (
      n !== undefined &&
      isNonEmptyString(n['roomId']) &&
      !roomIds.has(n['roomId'])
    )
      return `notes[${i}].roomId '${n['roomId']}' does not reference a declared room`;
  }

  // notes → objectMarkers
  for (let i = 0; i < notes.length; i++) {
    const n = notes[i];
    if (
      n !== undefined &&
      isNonEmptyString(n['objectMarkerId']) &&
      !markerIds.has(n['objectMarkerId'])
    )
      return `notes[${i}].objectMarkerId '${n['objectMarkerId']}' does not reference a declared objectMarker`;
  }

  return null;
}

// ─── Main validator ───────────────────────────────────────────────────────────

/**
 * Validates a raw unknown payload as a SessionCaptureV1.
 *
 * Returns `{ ok: true, session }` on success or `{ ok: false, error }` on
 * the first structural or reference failure found.
 *
 * Orphan reference checks run after all structural checks pass.
 */
export function validateSessionCaptureV1(
  input: UnknownSessionCaptureV1 | unknown,
): SessionCaptureV1ValidationResult {
  if (!isRecord(input)) {
    return { ok: false, error: 'Input must be a non-null object' };
  }

  if (input['schemaVersion'] !== 'atlas.scan.session.v1') {
    return {
      ok: false,
      error: `schemaVersion must be 'atlas.scan.session.v1', got: ${String(input['schemaVersion'])}`,
    };
  }

  if (!isNonEmptyString(input['visitId'])) {
    return { ok: false, error: 'visitId must be a non-empty string' };
  }

  if (!isNonEmptyString(input['sessionId'])) {
    return { ok: false, error: 'sessionId must be a non-empty string' };
  }

  if (!SESSION_STATUSES.has(input['status'] as string)) {
    return {
      ok: false,
      error: `status must be one of: ${[...SESSION_STATUSES].join(', ')}`,
    };
  }

  if (!isIsoLike(input['captureStartedAt'])) {
    return {
      ok: false,
      error: 'captureStartedAt must be an ISO-8601 timestamp',
    };
  }

  if (
    input['captureCompletedAt'] !== undefined &&
    !isIsoLike(input['captureCompletedAt'])
  ) {
    return {
      ok: false,
      error: 'captureCompletedAt must be an ISO-8601 timestamp when present',
    };
  }

  const roomsError = validateRooms(input['rooms']);
  if (roomsError) return { ok: false, error: roomsError };

  if (input['spatialModel'] !== undefined) {
    const spatialError = validateSpatialModel(input['spatialModel']);
    if (spatialError) return { ok: false, error: spatialError };
  }

  const markersError = validateObjectMarkers(input['objectMarkers']);
  if (markersError) return { ok: false, error: markersError };

  const photosError = validatePhotos(input['photos']);
  if (photosError) return { ok: false, error: photosError };

  if (input['transcript'] !== undefined) {
    const transcriptError = validateTranscript(input['transcript']);
    if (transcriptError) return { ok: false, error: transcriptError };
  }

  const notesError = validateNotes(input['notes']);
  if (notesError) return { ok: false, error: notesError };

  const eventsError = validateTimelineEvents(input['timelineEvents']);
  if (eventsError) return { ok: false, error: eventsError };

  const manifestError = validateAssetManifest(input['assetManifest']);
  if (manifestError) return { ok: false, error: manifestError };

  if (input['review'] !== undefined) {
    const reviewError = validateReviewState(input['review']);
    if (reviewError) return { ok: false, error: reviewError };
  }

  const orphanError = checkOrphanReferences(input);
  if (orphanError) return { ok: false, error: orphanError };

  return { ok: true, session: input as unknown as SessionCaptureV1 };
}
