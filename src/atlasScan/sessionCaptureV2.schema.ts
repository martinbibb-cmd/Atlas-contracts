/**
 * sessionCaptureV2.schema.ts
 *
 * Runtime validation for SessionCaptureV2 payloads.
 *
 * The validator performs:
 *   1. Schema-version check — only 'atlas.scan.session.v2' is accepted.
 *   2. Structural checks on all required and optional fields.
 *   3. Empty-capture check — at least one of roomScans, photos, voiceNotes,
 *      or objectPins must be non-empty.
 *   4. Raw-audio rejection — any voiceNote carrying audioUri, audioRef, or
 *      audioData is rejected outright.
 *   5. Cross-reference (orphan) checks:
 *        - photo.roomId must reference a declared roomScan
 *        - photo.objectPinId must reference a declared objectPin
 *        - objectPin.roomId must reference a declared roomScan
 *        - objectPin.linkedPhotoIds must reference declared photos
 *        - objectPin.linkedNoteIds must reference declared voiceNotes
 *        - voiceNote.roomId must reference a declared roomScan
 *        - voiceNote.objectPinId must reference a declared objectPin
 *        - qaFlag.roomId must reference a declared roomScan
 *        - qaFlag.objectPinId must reference a declared objectPin
 *
 * Unknown extra fields are tolerated so that older consumers can handle newer
 * payloads gracefully.
 */

import type {
  SessionCaptureV2,
  UnknownSessionCaptureV2,
} from './sessionCaptureV2.types';
import { SESSION_CAPTURE_V2_SCHEMA_VERSION } from './sessionCaptureV2.types';

// ─── Result types ─────────────────────────────────────────────────────────────

export interface SessionCaptureV2ValidationSuccess {
  ok: true;
  session: SessionCaptureV2;
}

export interface SessionCaptureV2ValidationFailure {
  ok: false;
  error: string;
}

export type SessionCaptureV2ValidationResult =
  | SessionCaptureV2ValidationSuccess
  | SessionCaptureV2ValidationFailure;

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

const OBJECT_PIN_KINDS = new Set([
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

const QA_FLAG_KINDS = new Set([
  'low_confidence',
  'missing_room',
  'incomplete_scan',
  'review_required',
  'access_issue',
  'other',
]);

/**
 * Raw audio field names that are forbidden in voice note objects.
 *
 * Both `audioUri` and `audioUrl` are listed defensively to cover naming
 * variations that may appear in pre-release Atlas Scan builds.
 */
const RAW_AUDIO_FIELDS = ['audioUri', 'audioRef', 'audioData', 'audioUrl', 'audioFile'];

// ─── Sub-validators ───────────────────────────────────────────────────────────

function validateRoomScans(value: unknown): string | null {
  if (!Array.isArray(value)) return 'roomScans must be an array';
  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    if (!isRecord(item)) return `roomScans[${i}] must be an object`;
    if (!isNonEmptyString(item['roomId']))
      return `roomScans[${i}].roomId must be a non-empty string`;
    if (!isNonEmptyString(item['label']))
      return `roomScans[${i}].label must be a non-empty string`;
    if (!isIsoLike(item['capturedAt']))
      return `roomScans[${i}].capturedAt must be an ISO-8601 timestamp`;
    if (
      item['floorIndex'] !== undefined &&
      typeof item['floorIndex'] !== 'number'
    )
      return `roomScans[${i}].floorIndex must be a number when present`;
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
  }
  return null;
}

function validateVoiceNotes(value: unknown): string | null {
  if (!Array.isArray(value)) return 'voiceNotes must be an array';
  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    if (!isRecord(item)) return `voiceNotes[${i}] must be an object`;
    if (!isNonEmptyString(item['noteId']))
      return `voiceNotes[${i}].noteId must be a non-empty string`;
    if (typeof item['text'] !== 'string')
      return `voiceNotes[${i}].text must be a string`;
    if (!isIsoLike(item['capturedAt']))
      return `voiceNotes[${i}].capturedAt must be an ISO-8601 timestamp`;
    // Reject raw audio fields
    for (const audioField of RAW_AUDIO_FIELDS) {
      if (item[audioField] !== undefined)
        return `voiceNotes[${i}] must not contain raw audio field '${audioField}'; export transcript text only`;
    }
  }
  return null;
}

function validateObjectPins(value: unknown): string | null {
  if (!Array.isArray(value)) return 'objectPins must be an array';
  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    if (!isRecord(item)) return `objectPins[${i}] must be an object`;
    if (!isNonEmptyString(item['pinId']))
      return `objectPins[${i}].pinId must be a non-empty string`;
    if (!OBJECT_PIN_KINDS.has(item['kind'] as string))
      return `objectPins[${i}].kind must be a valid ObjectPinKindV2`;
    if (!Array.isArray(item['linkedPhotoIds']) || !isStringArray(item['linkedPhotoIds']))
      return `objectPins[${i}].linkedPhotoIds must be a string array`;
    if (!Array.isArray(item['linkedNoteIds']) || !isStringArray(item['linkedNoteIds']))
      return `objectPins[${i}].linkedNoteIds must be a string array`;
    if (!isIsoLike(item['createdAt']))
      return `objectPins[${i}].createdAt must be an ISO-8601 timestamp`;
  }
  return null;
}

function validateFloorPlanSnapshots(value: unknown): string | null {
  if (!Array.isArray(value)) return 'floorPlanSnapshots must be an array';
  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    if (!isRecord(item)) return `floorPlanSnapshots[${i}] must be an object`;
    if (!isNonEmptyString(item['snapshotId']))
      return `floorPlanSnapshots[${i}].snapshotId must be a non-empty string`;
    if (!isNonEmptyString(item['uri']))
      return `floorPlanSnapshots[${i}].uri must be a non-empty string`;
    if (typeof item['floorIndex'] !== 'number')
      return `floorPlanSnapshots[${i}].floorIndex must be a number`;
    if (!isIsoLike(item['capturedAt']))
      return `floorPlanSnapshots[${i}].capturedAt must be an ISO-8601 timestamp`;
  }
  return null;
}

function validateQAFlags(value: unknown): string | null {
  if (!Array.isArray(value)) return 'qaFlags must be an array';
  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    if (!isRecord(item)) return `qaFlags[${i}] must be an object`;
    if (!isNonEmptyString(item['flagId']))
      return `qaFlags[${i}].flagId must be a non-empty string`;
    if (!QA_FLAG_KINDS.has(item['kind'] as string))
      return `qaFlags[${i}].kind must be a valid QAFlagKindV2`;
    if (!isNonEmptyString(item['message']))
      return `qaFlags[${i}].message must be a non-empty string`;
    if (!isIsoLike(item['createdAt']))
      return `qaFlags[${i}].createdAt must be an ISO-8601 timestamp`;
  }
  return null;
}

// ─── Empty-capture check ──────────────────────────────────────────────────────

function checkNotEmptyCapture(input: Record<string, unknown>): string | null {
  const roomScans = input['roomScans'];
  const photos = input['photos'];
  const voiceNotes = input['voiceNotes'];
  const objectPins = input['objectPins'];

  if (
    Array.isArray(roomScans) &&
    roomScans.length === 0 &&
    Array.isArray(photos) &&
    photos.length === 0 &&
    Array.isArray(voiceNotes) &&
    voiceNotes.length === 0 &&
    Array.isArray(objectPins) &&
    objectPins.length === 0
  ) {
    return 'capture payload is empty: at least one of roomScans, photos, voiceNotes, or objectPins must be non-empty';
  }
  return null;
}

// ─── Orphan reference checks ──────────────────────────────────────────────────

function checkOrphanReferences(input: Record<string, unknown>): string | null {
  const roomScans = (input['roomScans'] as Record<string, unknown>[]) ?? [];
  const photos = (input['photos'] as Record<string, unknown>[]) ?? [];
  const voiceNotes = (input['voiceNotes'] as Record<string, unknown>[]) ?? [];
  const objectPins = (input['objectPins'] as Record<string, unknown>[]) ?? [];
  const qaFlags = (input['qaFlags'] as Record<string, unknown>[]) ?? [];

  const roomIds = new Set(roomScans.map((r) => r['roomId'] as string));
  const photoIds = new Set(photos.map((p) => p['photoId'] as string));
  const noteIds = new Set(voiceNotes.map((n) => n['noteId'] as string));
  const pinIds = new Set(objectPins.map((p) => p['pinId'] as string));

  // photos → roomScans
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i];
    if (
      p !== undefined &&
      isNonEmptyString(p['roomId']) &&
      !roomIds.has(p['roomId'])
    )
      return `photos[${i}].roomId '${p['roomId']}' does not reference a declared roomScan`;
  }

  // photos → objectPins
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i];
    if (
      p !== undefined &&
      isNonEmptyString(p['objectPinId']) &&
      !pinIds.has(p['objectPinId'])
    )
      return `photos[${i}].objectPinId '${p['objectPinId']}' does not reference a declared objectPin`;
  }

  // objectPins → roomScans
  for (let i = 0; i < objectPins.length; i++) {
    const pin = objectPins[i];
    if (
      pin !== undefined &&
      isNonEmptyString(pin['roomId']) &&
      !roomIds.has(pin['roomId'])
    )
      return `objectPins[${i}].roomId '${pin['roomId']}' does not reference a declared roomScan`;
  }

  // objectPins → photos (linkedPhotoIds)
  for (let i = 0; i < objectPins.length; i++) {
    const pin = objectPins[i];
    if (!pin) continue;
    const linkedPhotoIds = (pin['linkedPhotoIds'] as string[]) ?? [];
    for (let j = 0; j < linkedPhotoIds.length; j++) {
      const pid = linkedPhotoIds[j];
      if (pid !== undefined && !photoIds.has(pid))
        return `objectPins[${i}].linkedPhotoIds[${j}] '${pid}' does not reference a declared photo`;
    }
  }

  // objectPins → voiceNotes (linkedNoteIds)
  for (let i = 0; i < objectPins.length; i++) {
    const pin = objectPins[i];
    if (!pin) continue;
    const linkedNoteIds = (pin['linkedNoteIds'] as string[]) ?? [];
    for (let j = 0; j < linkedNoteIds.length; j++) {
      const nid = linkedNoteIds[j];
      if (nid !== undefined && !noteIds.has(nid))
        return `objectPins[${i}].linkedNoteIds[${j}] '${nid}' does not reference a declared voiceNote`;
    }
  }

  // voiceNotes → roomScans
  for (let i = 0; i < voiceNotes.length; i++) {
    const note = voiceNotes[i];
    if (
      note !== undefined &&
      isNonEmptyString(note['roomId']) &&
      !roomIds.has(note['roomId'])
    )
      return `voiceNotes[${i}].roomId '${note['roomId']}' does not reference a declared roomScan`;
  }

  // voiceNotes → objectPins
  for (let i = 0; i < voiceNotes.length; i++) {
    const note = voiceNotes[i];
    if (
      note !== undefined &&
      isNonEmptyString(note['objectPinId']) &&
      !pinIds.has(note['objectPinId'])
    )
      return `voiceNotes[${i}].objectPinId '${note['objectPinId']}' does not reference a declared objectPin`;
  }

  // qaFlags → roomScans
  for (let i = 0; i < qaFlags.length; i++) {
    const flag = qaFlags[i];
    if (
      flag !== undefined &&
      isNonEmptyString(flag['roomId']) &&
      !roomIds.has(flag['roomId'])
    )
      return `qaFlags[${i}].roomId '${flag['roomId']}' does not reference a declared roomScan`;
  }

  // qaFlags → objectPins
  for (let i = 0; i < qaFlags.length; i++) {
    const flag = qaFlags[i];
    if (
      flag !== undefined &&
      isNonEmptyString(flag['objectPinId']) &&
      !pinIds.has(flag['objectPinId'])
    )
      return `qaFlags[${i}].objectPinId '${flag['objectPinId']}' does not reference a declared objectPin`;
  }

  return null;
}

// ─── Main validator ───────────────────────────────────────────────────────────

/**
 * Validates a raw unknown payload as a SessionCaptureV2.
 *
 * Returns `{ ok: true, session }` on success or `{ ok: false, error }` on
 * the first structural or reference failure found.
 *
 * Checks performed in order:
 *   1. Input must be a non-null object (non-JSON rejected here).
 *   2. schemaVersion must be 'atlas.scan.session.v2'.
 *   3. All required top-level fields must be present and well-typed.
 *   4. Sub-arrays are validated structurally.
 *   5. Capture must not be entirely empty.
 *   6. Voice notes must not carry raw audio fields.
 *   7. Orphan reference checks run last.
 */
export function validateSessionCaptureV2(
  input: UnknownSessionCaptureV2 | unknown,
): SessionCaptureV2ValidationResult {
  if (!isRecord(input)) {
    return { ok: false, error: 'Input must be a non-null object' };
  }

  if (input['schemaVersion'] !== SESSION_CAPTURE_V2_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `schemaVersion must be '${SESSION_CAPTURE_V2_SCHEMA_VERSION}', got: ${String(input['schemaVersion'])}`,
    };
  }

  if (!isNonEmptyString(input['sessionId'])) {
    return { ok: false, error: 'sessionId must be a non-empty string' };
  }

  if (!isNonEmptyString(input['visitReference'])) {
    return { ok: false, error: 'visitReference must be a non-empty string' };
  }

  if (!isIsoLike(input['capturedAt'])) {
    return { ok: false, error: 'capturedAt must be an ISO-8601 timestamp' };
  }

  if (!isIsoLike(input['exportedAt'])) {
    return { ok: false, error: 'exportedAt must be an ISO-8601 timestamp' };
  }

  if (!isNonEmptyString(input['deviceModel'])) {
    return { ok: false, error: 'deviceModel must be a non-empty string' };
  }

  const roomScansError = validateRoomScans(input['roomScans']);
  if (roomScansError) return { ok: false, error: roomScansError };

  const photosError = validatePhotos(input['photos']);
  if (photosError) return { ok: false, error: photosError };

  const voiceNotesError = validateVoiceNotes(input['voiceNotes']);
  if (voiceNotesError) return { ok: false, error: voiceNotesError };

  const objectPinsError = validateObjectPins(input['objectPins']);
  if (objectPinsError) return { ok: false, error: objectPinsError };

  const snapshotsError = validateFloorPlanSnapshots(input['floorPlanSnapshots']);
  if (snapshotsError) return { ok: false, error: snapshotsError };

  const qaFlagsError = validateQAFlags(input['qaFlags']);
  if (qaFlagsError) return { ok: false, error: qaFlagsError };

  const emptyError = checkNotEmptyCapture(input);
  if (emptyError) return { ok: false, error: emptyError };

  const orphanError = checkOrphanReferences(input);
  if (orphanError) return { ok: false, error: orphanError };

  return { ok: true, session: input as unknown as SessionCaptureV2 };
}
