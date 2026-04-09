/**
 * validation.ts
 *
 * Runtime validation for incoming scan bundles.
 *
 * All incoming scan data must pass through this module before it reaches any
 * other Atlas code.  The validator:
 *   1. Confirms the input is a non-null object.
 *   2. Checks the version field is present and supported.
 *   3. Validates required structural fields for the detected version.
 *
 * The validator does NOT attempt to parse or normalise coordinates — that is
 * the importer's responsibility.
 *
 * Design note: Zod is not a dependency of this package; we use bespoke
 * structural checks that keep the dependency footprint minimal.
 */

import { SUPPORTED_SCAN_BUNDLE_VERSIONS } from './versions';
import type { ScanBundle, ScanBundleV1, UnknownScanBundle, SessionCaptureV1, UnknownSessionCapture } from './types';

// ─── Validation result types ──────────────────────────────────────────────────

export interface ScanValidationSuccess {
  ok: true;
  bundle: ScanBundle;
}

export interface ScanValidationFailure {
  ok: false;
  errors: string[];
}

export type ScanValidationResult = ScanValidationSuccess | ScanValidationFailure;

// ─── Internal helpers ─────────────────────────────────────────────────────────

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

// ─── Field-level validators ───────────────────────────────────────────────────

function validateScanPoint3D(value: unknown, path: string): string[] {
  if (!isObject(value)) return [`${path}: must be an object`];
  const errors: string[] = [];
  if (!isNumber(value['x'])) errors.push(`${path}.x: must be a finite number`);
  if (!isNumber(value['y'])) errors.push(`${path}.y: must be a finite number`);
  if (!isNumber(value['z'])) errors.push(`${path}.z: must be a finite number`);
  return errors;
}

function validateScanPoint2D(value: unknown, path: string): string[] {
  if (!isObject(value)) return [`${path}: must be an object`];
  const errors: string[] = [];
  if (!isNumber(value['x'])) errors.push(`${path}.x: must be a finite number`);
  if (!isNumber(value['y'])) errors.push(`${path}.y: must be a finite number`);
  return errors;
}

const VALID_CONFIDENCE_BANDS = ['high', 'medium', 'low'] as const;

function validateConfidence(value: unknown, path: string): string[] {
  if (!(VALID_CONFIDENCE_BANDS as readonly string[]).includes(value as string)) {
    return [`${path}: must be 'high' | 'medium' | 'low', got '${String(value)}'`];
  }
  return [];
}

function validateScanOpening(value: unknown, path: string): string[] {
  if (!isObject(value)) return [`${path}: must be an object`];
  const errors: string[] = [];
  if (!isString(value['id'])) errors.push(`${path}.id: must be a string`);
  if (!isNumber(value['widthM'])) errors.push(`${path}.widthM: must be a finite number`);
  if (!isNumber(value['heightM'])) errors.push(`${path}.heightM: must be a finite number`);
  if (!isNumber(value['offsetM'])) errors.push(`${path}.offsetM: must be a finite number`);
  const validOpeningTypes = ['door', 'window', 'unknown'];
  if (!validOpeningTypes.includes(value['type'] as string)) {
    errors.push(`${path}.type: must be 'door' | 'window' | 'unknown'`);
  }
  errors.push(...validateConfidence(value['confidence'], `${path}.confidence`));
  return errors;
}

function validateScanWall(value: unknown, path: string): string[] {
  if (!isObject(value)) return [`${path}: must be an object`];
  const errors: string[] = [];
  if (!isString(value['id'])) errors.push(`${path}.id: must be a string`);
  errors.push(...validateScanPoint3D(value['start'], `${path}.start`));
  errors.push(...validateScanPoint3D(value['end'], `${path}.end`));
  if (!isNumber(value['heightM'])) errors.push(`${path}.heightM: must be a finite number`);
  if (!isNumber(value['thicknessMm'])) errors.push(`${path}.thicknessMm: must be a finite number`);
  const validKinds = ['internal', 'external', 'unknown'];
  if (!validKinds.includes(value['kind'] as string)) {
    errors.push(`${path}.kind: must be 'internal' | 'external' | 'unknown'`);
  }
  if (!isArray(value['openings'])) {
    errors.push(`${path}.openings: must be an array`);
  } else {
    value['openings'].forEach((o, i) => {
      errors.push(...validateScanOpening(o, `${path}.openings[${i}]`));
    });
  }
  errors.push(...validateConfidence(value['confidence'], `${path}.confidence`));
  return errors;
}

function validateScanRoom(value: unknown, path: string): string[] {
  if (!isObject(value)) return [`${path}: must be an object`];
  const errors: string[] = [];
  if (!isString(value['id'])) errors.push(`${path}.id: must be a string`);
  if (!isString(value['label'])) errors.push(`${path}.label: must be a string`);
  if (!isNumber(value['floorIndex'])) errors.push(`${path}.floorIndex: must be a finite number`);
  if (!isNumber(value['areaM2'])) errors.push(`${path}.areaM2: must be a finite number`);
  if (!isNumber(value['heightM'])) errors.push(`${path}.heightM: must be a finite number`);
  if (!isArray(value['polygon'])) {
    errors.push(`${path}.polygon: must be an array`);
  } else {
    value['polygon'].forEach((p, i) => {
      errors.push(...validateScanPoint2D(p, `${path}.polygon[${i}]`));
    });
  }
  if (!isArray(value['walls'])) {
    errors.push(`${path}.walls: must be an array`);
  } else {
    value['walls'].forEach((w, i) => {
      errors.push(...validateScanWall(w, `${path}.walls[${i}]`));
    });
  }
  if (!isArray(value['detectedObjects'])) {
    errors.push(`${path}.detectedObjects: must be an array`);
  }
  errors.push(...validateConfidence(value['confidence'], `${path}.confidence`));
  return errors;
}

function validateScanMeta(value: unknown, path: string): string[] {
  if (!isObject(value)) return [`${path}: must be an object`];
  const errors: string[] = [];
  if (!isString(value['capturedAt'])) errors.push(`${path}.capturedAt: must be a string`);
  if (!isString(value['deviceModel'])) errors.push(`${path}.deviceModel: must be a string`);
  if (!isString(value['scannerApp'])) errors.push(`${path}.scannerApp: must be a string`);
  if (value['coordinateConvention'] !== 'metric_m') {
    errors.push(`${path}.coordinateConvention: must be 'metric_m'`);
  }
  return errors;
}

function validateBundleV1(raw: UnknownScanBundle): string[] {
  const errors: string[] = [];
  if (!isString(raw['bundleId'])) errors.push('bundleId: must be a string');
  if (!isArray(raw['rooms'])) {
    errors.push('rooms: must be an array');
  } else {
    raw['rooms'].forEach((r, i) => {
      errors.push(...validateScanRoom(r, `rooms[${i}]`));
    });
  }
  if (!isArray(raw['anchors'])) {
    errors.push('anchors: must be an array');
  }
  if (!isArray(raw['qaFlags'])) {
    errors.push('qaFlags: must be an array');
  }
  errors.push(...validateScanMeta(raw['meta'], 'meta'));
  return errors;
}

/**
 * assertIsScanBundleV1 — assertion function that narrows UnknownScanBundle to
 * ScanBundleV1.
 *
 * Runs the same structural checks as validateBundleV1 and throws if any fail.
 * This acts as both a runtime safety-net and an explicit proof point for the
 * TypeScript compiler so that the return type of validateScanBundle is
 * correctly narrowed to ScanBundleV1 without a sloppy cast.
 */
function assertIsScanBundleV1(value: unknown): asserts value is ScanBundleV1 {
  if (!isObject(value)) {
    throw new Error('assertIsScanBundleV1: expected a non-null object');
  }
  const errors = validateBundleV1(value);
  if (errors.length > 0) {
    throw new Error(`assertIsScanBundleV1: structural validation failed — ${errors.join('; ')}`);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * validateScanBundle — entry-point validator for an unknown incoming payload.
 *
 * Returns `{ ok: true, bundle }` when the bundle passes all structural checks,
 * or `{ ok: false, errors }` with a list of human-readable error strings.
 *
 * Usage:
 *   const result = validateScanBundle(rawJson);
 *   if (!result.ok) {
 *     // handle result.errors
 *   }
 *   // result.bundle is now typed as ScanBundle
 */
export function validateScanBundle(input: unknown): ScanValidationResult {
  if (!isObject(input)) {
    return { ok: false, errors: ['Scan bundle must be a non-null JSON object'] };
  }

  const raw = input as UnknownScanBundle;

  // Version check first — produces a structured rejection before any deeper
  // structural validation so callers can distinguish between
  // 'invalid shape' and 'unsupported version'.
  if (!isString(raw['version'])) {
    return { ok: false, errors: ['version: must be a string'] };
  }

  const isSupported = (SUPPORTED_SCAN_BUNDLE_VERSIONS as readonly string[]).includes(raw['version']);
  if (!isSupported) {
    return {
      ok: false,
      errors: [
        `version '${raw['version']}' is not supported. ` +
          `Supported versions: ${SUPPORTED_SCAN_BUNDLE_VERSIONS.join(', ')}`,
      ],
    };
  }

  // Deep structural validation for the detected version.
  const structuralErrors = validateBundleV1(raw);
  if (structuralErrors.length > 0) {
    return { ok: false, errors: structuralErrors };
  }

  // All structural checks passed.  assertIsScanBundleV1 narrows the type so
  // the compiler has explicit proof that runtime validation has confirmed the
  // shape — no sloppy cast.
  assertIsScanBundleV1(raw);
  return { ok: true, bundle: raw };
}

// ─── SessionCaptureV1 validation ──────────────────────────────────────────────

export interface SessionCaptureValidationSuccess {
  ok: true;
  session: SessionCaptureV1;
}

export interface SessionCaptureValidationFailure {
  ok: false;
  errors: string[];
}

export type SessionCaptureValidationResult =
  | SessionCaptureValidationSuccess
  | SessionCaptureValidationFailure;

/** Supported SessionCaptureV1 contract versions. */
const SUPPORTED_SESSION_CAPTURE_VERSIONS = ['1.0'] as const;

const VALID_SESSION_STATUSES = ['active', 'review', 'ready', 'synced'] as const;
const VALID_ROOM_STATUSES = ['active', 'complete'] as const;
const VALID_OBJECT_TYPES = [
  'radiator',
  'boiler',
  'cylinder',
  'thermostat',
  'flue',
  'pipe',
  'consumer_unit',
  'other',
] as const;
const VALID_OBJECT_STATUSES = ['placed', 'confirmed'] as const;
const VALID_PHOTO_SCOPES = ['session', 'room', 'object'] as const;
const VALID_NOTE_CATEGORIES = [
  'constraint',
  'observation',
  'preference',
  'risk',
  'follow_up',
] as const;
const VALID_EVENT_TYPES = [
  'room_assigned',
  'object_added',
  'photo_taken',
  'note_marker_added',
  'room_finished',
] as const;
const VALID_TRANSCRIPTION_STATUSES = ['pending', 'processing', 'complete'] as const;

function validateRoomV1(value: unknown, path: string): string[] {
  if (!isObject(value)) return [`${path}: must be an object`];
  const errors: string[] = [];
  if (!isString(value['roomId'])) errors.push(`${path}.roomId: must be a string`);
  if (!isString(value['label'])) errors.push(`${path}.label: must be a string`);
  if (!(VALID_ROOM_STATUSES as readonly string[]).includes(value['status'] as string)) {
    errors.push(`${path}.status: must be 'active' | 'complete'`);
  }
  return errors;
}

function validateObjectV1(value: unknown, path: string): string[] {
  if (!isObject(value)) return [`${path}: must be an object`];
  const errors: string[] = [];
  if (!isString(value['objectId'])) errors.push(`${path}.objectId: must be a string`);
  if (!(VALID_OBJECT_TYPES as readonly string[]).includes(value['type'] as string)) {
    errors.push(
      `${path}.type: must be one of ${VALID_OBJECT_TYPES.join(', ')}`
    );
  }
  if (!(VALID_OBJECT_STATUSES as readonly string[]).includes(value['status'] as string)) {
    errors.push(`${path}.status: must be 'placed' | 'confirmed'`);
  }
  if (!isArray(value['photoIds'])) {
    errors.push(`${path}.photoIds: must be an array`);
  } else {
    (value['photoIds'] as unknown[]).forEach((id, i) => {
      if (!isString(id)) errors.push(`${path}.photoIds[${i}]: must be a string`);
    });
  }
  if (!isArray(value['noteMarkerIds'])) {
    errors.push(`${path}.noteMarkerIds: must be an array`);
  } else {
    (value['noteMarkerIds'] as unknown[]).forEach((id, i) => {
      if (!isString(id)) errors.push(`${path}.noteMarkerIds[${i}]: must be a string`);
    });
  }
  return errors;
}

function validatePhotoV1(value: unknown, path: string): string[] {
  if (!isObject(value)) return [`${path}: must be an object`];
  const errors: string[] = [];
  if (!isString(value['photoId'])) errors.push(`${path}.photoId: must be a string`);
  if (!isString(value['uri'])) errors.push(`${path}.uri: must be a string`);
  if (!isString(value['createdAt'])) errors.push(`${path}.createdAt: must be a string`);
  if (!(VALID_PHOTO_SCOPES as readonly string[]).includes(value['scope'] as string)) {
    errors.push(`${path}.scope: must be 'session' | 'room' | 'object'`);
  }
  return errors;
}

function validateAudioSegmentV1(value: unknown, path: string): string[] {
  if (!isObject(value)) return [`${path}: must be an object`];
  const errors: string[] = [];
  if (!isString(value['segmentId'])) errors.push(`${path}.segmentId: must be a string`);
  if (!isString(value['uri'])) errors.push(`${path}.uri: must be a string`);
  if (!isString(value['startedAt'])) errors.push(`${path}.startedAt: must be a string`);
  if (!isString(value['endedAt'])) errors.push(`${path}.endedAt: must be a string`);
  return errors;
}

function validateAudioV1(value: unknown, path: string): string[] {
  if (!isObject(value)) return [`${path}: must be an object`];
  const errors: string[] = [];
  if (value['mode'] !== 'continuous') {
    errors.push(`${path}.mode: must be 'continuous'`);
  }
  if (!isArray(value['segments'])) {
    errors.push(`${path}.segments: must be an array`);
  } else {
    (value['segments'] as unknown[]).forEach((seg, i) => {
      errors.push(...validateAudioSegmentV1(seg, `${path}.segments[${i}]`));
    });
  }
  if (isObject(value['transcription'])) {
    const t = value['transcription'];
    if (!(VALID_TRANSCRIPTION_STATUSES as readonly string[]).includes(t['status'] as string)) {
      errors.push(`${path}.transcription.status: must be 'pending' | 'processing' | 'complete'`);
    }
  }
  return errors;
}

function validateNoteMarkerV1(value: unknown, path: string): string[] {
  if (!isObject(value)) return [`${path}: must be an object`];
  const errors: string[] = [];
  if (!isString(value['markerId'])) errors.push(`${path}.markerId: must be a string`);
  if (!isString(value['createdAt'])) errors.push(`${path}.createdAt: must be a string`);
  if (
    value['category'] !== undefined &&
    !(VALID_NOTE_CATEGORIES as readonly string[]).includes(value['category'] as string)
  ) {
    errors.push(
      `${path}.category: must be one of ${VALID_NOTE_CATEGORIES.join(', ')}`
    );
  }
  return errors;
}

function validateSessionEventV1(value: unknown, path: string): string[] {
  if (!isObject(value)) return [`${path}: must be an object`];
  const errors: string[] = [];
  if (!isString(value['eventId'])) errors.push(`${path}.eventId: must be a string`);
  if (!(VALID_EVENT_TYPES as readonly string[]).includes(value['type'] as string)) {
    errors.push(
      `${path}.type: must be one of ${VALID_EVENT_TYPES.join(', ')}`
    );
  }
  if (!isString(value['timestamp'])) errors.push(`${path}.timestamp: must be a string`);
  return errors;
}

function validateSessionCaptureV1Fields(raw: UnknownSessionCapture): string[] {
  const errors: string[] = [];
  if (!isString(raw['sessionId'])) errors.push('sessionId: must be a string');
  if (!isString(raw['startedAt'])) errors.push('startedAt: must be a string');
  if (!isString(raw['updatedAt'])) errors.push('updatedAt: must be a string');
  if (!(VALID_SESSION_STATUSES as readonly string[]).includes(raw['status'] as string)) {
    errors.push("status: must be 'active' | 'review' | 'ready' | 'synced'");
  }

  if (!isArray(raw['rooms'])) {
    errors.push('rooms: must be an array');
  } else {
    raw['rooms'].forEach((r, i) => {
      errors.push(...validateRoomV1(r, `rooms[${i}]`));
    });
  }

  if (!isArray(raw['objects'])) {
    errors.push('objects: must be an array');
  } else {
    raw['objects'].forEach((o, i) => {
      errors.push(...validateObjectV1(o, `objects[${i}]`));
    });
  }

  if (!isArray(raw['photos'])) {
    errors.push('photos: must be an array');
  } else {
    raw['photos'].forEach((p, i) => {
      errors.push(...validatePhotoV1(p, `photos[${i}]`));
    });
  }

  errors.push(...validateAudioV1(raw['audio'], 'audio'));

  if (!isArray(raw['notes'])) {
    errors.push('notes: must be an array');
  } else {
    raw['notes'].forEach((n, i) => {
      errors.push(...validateNoteMarkerV1(n, `notes[${i}]`));
    });
  }

  if (!isArray(raw['events'])) {
    errors.push('events: must be an array');
  } else {
    raw['events'].forEach((e, i) => {
      errors.push(...validateSessionEventV1(e, `events[${i}]`));
    });
  }

  return errors;
}

function assertIsSessionCaptureV1(value: unknown): asserts value is SessionCaptureV1 {
  if (!isObject(value)) {
    throw new Error('assertIsSessionCaptureV1: expected a non-null object');
  }
  const errors = validateSessionCaptureV1Fields(value);
  if (errors.length > 0) {
    throw new Error(
      `assertIsSessionCaptureV1: structural validation failed — ${errors.join('; ')}`
    );
  }
}

/**
 * validateSessionCapture — entry-point validator for an unknown SessionCaptureV1
 * payload.
 *
 * Returns `{ ok: true, session }` when the payload passes all structural
 * checks, or `{ ok: false, errors }` with a list of human-readable error
 * strings.
 *
 * Usage:
 *   const result = validateSessionCapture(rawJson);
 *   if (!result.ok) {
 *     // handle result.errors
 *   }
 *   // result.session is now typed as SessionCaptureV1
 */
export function validateSessionCapture(input: unknown): SessionCaptureValidationResult {
  if (!isObject(input)) {
    return { ok: false, errors: ['Session capture must be a non-null JSON object'] };
  }

  const raw = input as UnknownSessionCapture;

  if (!isString(raw['version'])) {
    return { ok: false, errors: ['version: must be a string'] };
  }

  const isSupported = (SUPPORTED_SESSION_CAPTURE_VERSIONS as readonly string[]).includes(
    raw['version']
  );
  if (!isSupported) {
    return {
      ok: false,
      errors: [
        `version '${raw['version']}' is not supported. ` +
          `Supported versions: ${SUPPORTED_SESSION_CAPTURE_VERSIONS.join(', ')}`,
      ],
    };
  }

  const structuralErrors = validateSessionCaptureV1Fields(raw);
  if (structuralErrors.length > 0) {
    return { ok: false, errors: structuralErrors };
  }

  assertIsSessionCaptureV1(raw);
  return { ok: true, session: raw };
}
