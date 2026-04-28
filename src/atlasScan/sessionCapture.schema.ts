/**
 * sessionCapture.schema.ts
 *
 * Runtime validation for SessionCaptureV2 payloads.
 *
 * The validator performs structural checks only — it does not re-implement
 * business rules.  Unknown extra fields are tolerated so that older consumers
 * can handle newer payloads gracefully.
 */

import type {
  SessionCaptureV2,
  UnknownSessionCaptureV2,
} from './sessionCapture.types';

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

// ─── Capture-array item validators ───────────────────────────────────────────

function validateRoomScans(value: unknown): string | null {
  if (!Array.isArray(value)) return 'captures.roomScans must be an array';
  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    if (!isRecord(item)) return `captures.roomScans[${i}] must be an object`;
    if (!isNonEmptyString(item['id'])) return `captures.roomScans[${i}].id must be a non-empty string`;
    if (!isIsoLike(item['capturedAt'])) return `captures.roomScans[${i}].capturedAt must be an ISO-8601 timestamp`;
  }
  return null;
}

function validatePhotos(value: unknown): string | null {
  if (!Array.isArray(value)) return 'captures.photos must be an array';
  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    if (!isRecord(item)) return `captures.photos[${i}] must be an object`;
    if (!isNonEmptyString(item['id'])) return `captures.photos[${i}].id must be a non-empty string`;
    if (!isNonEmptyString(item['uri'])) return `captures.photos[${i}].uri must be a non-empty string`;
    if (!isIsoLike(item['capturedAt'])) return `captures.photos[${i}].capturedAt must be an ISO-8601 timestamp`;
  }
  return null;
}

function validateVoiceNotes(value: unknown): string | null {
  if (!Array.isArray(value)) return 'captures.voiceNotes must be an array';
  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    if (!isRecord(item)) return `captures.voiceNotes[${i}] must be an object`;
    if (!isNonEmptyString(item['id'])) return `captures.voiceNotes[${i}].id must be a non-empty string`;
    if (typeof item['transcript'] !== 'string') return `captures.voiceNotes[${i}].transcript must be a string`;
    if (!isIsoLike(item['startedAt'])) return `captures.voiceNotes[${i}].startedAt must be an ISO-8601 timestamp`;
  }
  return null;
}

const PLACED_OBJECT_KINDS = new Set([
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
]);

function validatePlacedObjects(value: unknown): string | null {
  if (!Array.isArray(value)) return 'captures.placedObjects must be an array';
  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    if (!isRecord(item)) return `captures.placedObjects[${i}] must be an object`;
    if (!isNonEmptyString(item['id'])) return `captures.placedObjects[${i}].id must be a non-empty string`;
    if (!PLACED_OBJECT_KINDS.has(item['kind'] as string))
      return `captures.placedObjects[${i}].kind must be a valid PlacedObjectKind`;
    if (!isIsoLike(item['createdAt'])) return `captures.placedObjects[${i}].createdAt must be an ISO-8601 timestamp`;
    if (item['linkedPhotoIds'] !== undefined && !isStringArray(item['linkedPhotoIds']))
      return `captures.placedObjects[${i}].linkedPhotoIds must be a string array`;
  }
  return null;
}

function validateFloorPlanSnapshots(value: unknown): string | null {
  if (!Array.isArray(value)) return 'captures.floorPlanSnapshots must be an array';
  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    if (!isRecord(item)) return `captures.floorPlanSnapshots[${i}] must be an object`;
    if (!isNonEmptyString(item['id'])) return `captures.floorPlanSnapshots[${i}].id must be a non-empty string`;
    if (!isNonEmptyString(item['uri'])) return `captures.floorPlanSnapshots[${i}].uri must be a non-empty string`;
    if (!isIsoLike(item['capturedAt'])) return `captures.floorPlanSnapshots[${i}].capturedAt must be an ISO-8601 timestamp`;
  }
  return null;
}

// ─── Main validator ───────────────────────────────────────────────────────────

/**
 * Validates a raw unknown payload as a SessionCaptureV2.
 *
 * Returns a discriminated result: `{ ok: true, session }` on success or
 * `{ ok: false, error }` on failure.
 */
export function validateSessionCaptureV2(
  input: UnknownSessionCaptureV2 | unknown,
): SessionCaptureV2ValidationResult {
  if (!isRecord(input)) {
    return { ok: false, error: 'Input must be a non-null object' };
  }

  if (input['schemaVersion'] !== 'atlas.scan.session.v2') {
    return {
      ok: false,
      error: `schemaVersion must be 'atlas.scan.session.v2', got: ${String(input['schemaVersion'])}`,
    };
  }

  if (!isNonEmptyString(input['sessionId'])) {
    return { ok: false, error: 'sessionId must be a non-empty string' };
  }

  if (!isIsoLike(input['createdAt'])) {
    return { ok: false, error: 'createdAt must be an ISO-8601 timestamp' };
  }

  if (!isIsoLike(input['updatedAt'])) {
    return { ok: false, error: 'updatedAt must be an ISO-8601 timestamp' };
  }

  if (!isRecord(input['job'])) {
    return { ok: false, error: 'job must be an object' };
  }

  if (!isNonEmptyString((input['job'] as Record<string, unknown>)['visitReference'])) {
    return { ok: false, error: 'job.visitReference must be a non-empty string' };
  }

  if (!isRecord(input['captures'])) {
    return { ok: false, error: 'captures must be an object' };
  }

  const captures = input['captures'] as Record<string, unknown>;

  const roomScansError = validateRoomScans(captures['roomScans']);
  if (roomScansError) return { ok: false, error: roomScansError };

  const photosError = validatePhotos(captures['photos']);
  if (photosError) return { ok: false, error: photosError };

  const voiceNotesError = validateVoiceNotes(captures['voiceNotes']);
  if (voiceNotesError) return { ok: false, error: voiceNotesError };

  const placedObjectsError = validatePlacedObjects(captures['placedObjects']);
  if (placedObjectsError) return { ok: false, error: placedObjectsError };

  const snapshotsError = validateFloorPlanSnapshots(captures['floorPlanSnapshots']);
  if (snapshotsError) return { ok: false, error: snapshotsError };

  return { ok: true, session: input as unknown as SessionCaptureV2 };
}
