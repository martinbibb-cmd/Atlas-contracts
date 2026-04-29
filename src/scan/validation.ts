/**
 * validation.ts
 *
 * Runtime validation for install markup models and AtlasProperty version checks.
 *
 * Canonical scan handoff validation:
 *   The canonical contract between Atlas Scan and Atlas Mind is
 *   SessionCaptureV1.  Its validator lives in:
 *     src/atlasScan/sessionCaptureV1.schema.ts → validateSessionCaptureV1()
 *
 * This module validates:
 *   - InstallObjectModelV1  (validateInstallObject)
 *   - InstallRouteModelV1   (validateInstallRoute)
 *   - InstallLayerModelV1   (validateInstallLayer)
 *   - AtlasPropertyV1 version (checkAtlasPropertyVersion)
 */

import type {
  InstallObjectModelV1,
  InstallRouteModelV1,
  InstallLayerModelV1,
} from './types';

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

// ─── AtlasPropertyV1 version check ───────────────────────────────────────────

/**
 * The current canonical version of the AtlasPropertyV1 contract.
 */
export const CURRENT_ATLAS_PROPERTY_VERSION = '1.0' as const;

/**
 * Result of checking an AtlasPropertyV1 version string.
 *
 * current — the model is at the current contract version
 * stale   — the model's version is older than CURRENT_ATLAS_PROPERTY_VERSION
 * unknown — the model's version is not a recognised Atlas property version
 */
export type AtlasPropertyVersionStatus = 'current' | 'stale' | 'unknown';

export interface AtlasPropertyVersionCheckResult {
  status: AtlasPropertyVersionStatus;
  inputVersion?: string;
  warning?: string;
}

const KNOWN_ATLAS_PROPERTY_VERSIONS = ['1.0'] as const;

/**
 * checkAtlasPropertyVersion — inspects the `version` field of an unknown
 * input object and returns a structured status result.
 */
export function checkAtlasPropertyVersion(
  input: unknown
): AtlasPropertyVersionCheckResult {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return {
      status: 'unknown',
      warning: 'Input is not an object; cannot determine AtlasPropertyV1 version.',
    };
  }

  const record = input as Record<string, unknown>;
  const version = record['version'];

  if (typeof version !== 'string' || version.length === 0) {
    return {
      status: 'unknown',
      warning:
        'AtlasPropertyV1 record is missing a version field. ' +
        `Expected '${CURRENT_ATLAS_PROPERTY_VERSION}'.`,
    };
  }

  if (version === CURRENT_ATLAS_PROPERTY_VERSION) {
    return { status: 'current', inputVersion: version };
  }

  const isKnown = (KNOWN_ATLAS_PROPERTY_VERSIONS as readonly string[]).includes(version);
  if (isKnown) {
    return {
      status: 'stale',
      inputVersion: version,
      warning:
        `AtlasPropertyV1 record has version '${version}', which is older than ` +
        `the current contract version '${CURRENT_ATLAS_PROPERTY_VERSION}'. ` +
        'Consider migrating this record before passing it to the recommendation engine.',
    };
  }

  return {
    status: 'unknown',
    inputVersion: version,
    warning:
      `AtlasPropertyV1 record has unrecognised version '${version}'. ` +
      `Current contract version is '${CURRENT_ATLAS_PROPERTY_VERSION}'.`,
  };
}

// ─── Install markup validation ────────────────────────────────────────────────

const VALID_INSTALL_OBJECT_TYPES = [
  'boiler',
  'cylinder',
  'radiator',
  'thermostat',
  'flue',
  'pump',
  'valve',
  'consumer_unit',
  'other',
] as const;

const VALID_INSTALL_OBJECT_SOURCES = ['scan', 'manual', 'inferred'] as const;
const VALID_INSTALL_ROUTE_KINDS = ['flow', 'return', 'gas', 'cold', 'hot', 'flue', 'other'] as const;
const VALID_INSTALL_MOUNTINGS = ['surface', 'boxed', 'buried', 'other'] as const;
const VALID_INSTALL_ROUTE_CONFIDENCES = ['measured', 'drawn', 'estimated'] as const;

function validateInstallPoint3D(value: unknown, path: string): string[] {
  if (!isObject(value)) return [`${path}: must be an object`];
  const errors: string[] = [];
  if (!isNumber(value['x'])) errors.push(`${path}.x: must be a finite number`);
  if (!isNumber(value['y'])) errors.push(`${path}.y: must be a finite number`);
  if (!isNumber(value['z'])) errors.push(`${path}.z: must be a finite number`);
  return errors;
}

function validateInstallDimensions(value: unknown, path: string): string[] {
  if (!isObject(value)) return [`${path}: must be an object`];
  const errors: string[] = [];
  if (!isNumber(value['widthM'])) errors.push(`${path}.widthM: must be a finite number`);
  if (!isNumber(value['depthM'])) errors.push(`${path}.depthM: must be a finite number`);
  if (!isNumber(value['heightM'])) errors.push(`${path}.heightM: must be a finite number`);
  return errors;
}

function validateInstallOrientation(value: unknown, path: string): string[] {
  if (!isObject(value)) return [`${path}: must be an object`];
  const errors: string[] = [];
  if (!isNumber(value['yawDeg'])) errors.push(`${path}.yawDeg: must be a finite number`);
  return errors;
}

function validateInstallObjectModelV1(value: unknown, path: string): string[] {
  if (!isObject(value)) return [`${path}: must be an object`];
  const errors: string[] = [];
  if (!isString(value['id'])) errors.push(`${path}.id: must be a string`);
  if (!(VALID_INSTALL_OBJECT_TYPES as readonly string[]).includes(value['type'] as string)) {
    errors.push(`${path}.type: must be one of ${VALID_INSTALL_OBJECT_TYPES.join(', ')}`);
  }
  errors.push(...validateInstallPoint3D(value['position'], `${path}.position`));
  errors.push(...validateInstallDimensions(value['dimensions'], `${path}.dimensions`));
  errors.push(...validateInstallOrientation(value['orientation'], `${path}.orientation`));
  if (!(VALID_INSTALL_OBJECT_SOURCES as readonly string[]).includes(value['source'] as string)) {
    errors.push(`${path}.source: must be 'scan' | 'manual' | 'inferred'`);
  }
  return errors;
}

function validateInstallPathPoint(value: unknown, path: string): string[] {
  if (!isObject(value)) return [`${path}: must be an object`];
  const errors: string[] = [];
  if (!isNumber(value['x'])) errors.push(`${path}.x: must be a finite number`);
  if (!isNumber(value['y'])) errors.push(`${path}.y: must be a finite number`);
  if (!isNumber(value['z'])) errors.push(`${path}.z: must be a finite number`);
  if (value['elevationOffsetM'] !== undefined && !isNumber(value['elevationOffsetM'])) {
    errors.push(`${path}.elevationOffsetM: must be a finite number when present`);
  }
  return errors;
}

function validateInstallRouteModelV1(value: unknown, path: string): string[] {
  if (!isObject(value)) return [`${path}: must be an object`];
  const errors: string[] = [];
  if (!isString(value['id'])) errors.push(`${path}.id: must be a string`);
  if (!(VALID_INSTALL_ROUTE_KINDS as readonly string[]).includes(value['kind'] as string)) {
    errors.push(`${path}.kind: must be one of ${VALID_INSTALL_ROUTE_KINDS.join(', ')}`);
  }
  if (!isNumber(value['diameterMm'])) errors.push(`${path}.diameterMm: must be a finite number`);
  if (!isArray(value['path'])) {
    errors.push(`${path}.path: must be an array`);
  } else {
    (value['path'] as unknown[]).forEach((pt, i) => {
      errors.push(...validateInstallPathPoint(pt, `${path}.path[${i}]`));
    });
  }
  if (!(VALID_INSTALL_MOUNTINGS as readonly string[]).includes(value['mounting'] as string)) {
    errors.push(`${path}.mounting: must be one of ${VALID_INSTALL_MOUNTINGS.join(', ')}`);
  }
  if (
    !(VALID_INSTALL_ROUTE_CONFIDENCES as readonly string[]).includes(
      value['confidence'] as string
    )
  ) {
    errors.push(`${path}.confidence: must be 'measured' | 'drawn' | 'estimated'`);
  }
  return errors;
}

function validateInstallAnnotation(value: unknown, path: string): string[] {
  if (!isObject(value)) return [`${path}: must be an object`];
  const errors: string[] = [];
  if (!isString(value['id'])) errors.push(`${path}.id: must be a string`);
  if (!isString(value['text'])) errors.push(`${path}.text: must be a string`);
  if (value['position'] !== undefined) {
    errors.push(...validateInstallPoint3D(value['position'], `${path}.position`));
  }
  return errors;
}

// ─── Result types ─────────────────────────────────────────────────────────────

export interface InstallObjectValidationSuccess {
  ok: true;
  object: InstallObjectModelV1;
}

export interface InstallObjectValidationFailure {
  ok: false;
  errors: string[];
}

export type InstallObjectValidationResult =
  | InstallObjectValidationSuccess
  | InstallObjectValidationFailure;

export interface InstallRouteValidationSuccess {
  ok: true;
  route: InstallRouteModelV1;
}

export interface InstallRouteValidationFailure {
  ok: false;
  errors: string[];
}

export type InstallRouteValidationResult =
  | InstallRouteValidationSuccess
  | InstallRouteValidationFailure;

export interface InstallLayerValidationSuccess {
  ok: true;
  layer: InstallLayerModelV1;
}

export interface InstallLayerValidationFailure {
  ok: false;
  errors: string[];
}

export type InstallLayerValidationResult =
  | InstallLayerValidationSuccess
  | InstallLayerValidationFailure;

// ─── Public validators ────────────────────────────────────────────────────────

/**
 * validateInstallObject — validates an unknown input against InstallObjectModelV1.
 */
export function validateInstallObject(input: unknown): InstallObjectValidationResult {
  if (!isObject(input)) {
    return { ok: false, errors: ['Install object must be a non-null JSON object'] };
  }
  const errors = validateInstallObjectModelV1(input, 'installObject');
  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, object: input as InstallObjectModelV1 };
}

/**
 * validateInstallRoute — validates an unknown input against InstallRouteModelV1.
 */
export function validateInstallRoute(input: unknown): InstallRouteValidationResult {
  if (!isObject(input)) {
    return { ok: false, errors: ['Install route must be a non-null JSON object'] };
  }
  const errors = validateInstallRouteModelV1(input, 'installRoute');
  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, route: input as InstallRouteModelV1 };
}

/**
 * validateInstallLayer — validates an unknown input against InstallLayerModelV1.
 */
export function validateInstallLayer(input: unknown): InstallLayerValidationResult {
  if (!isObject(input)) {
    return { ok: false, errors: ['Install layer must be a non-null JSON object'] };
  }
  const errors: string[] = [];
  if (!isArray(input['existing'])) {
    errors.push('existing: must be an array');
  } else {
    (input['existing'] as unknown[]).forEach((r, i) => {
      errors.push(...validateInstallRouteModelV1(r, `existing[${i}]`));
    });
  }
  if (!isArray(input['proposed'])) {
    errors.push('proposed: must be an array');
  } else {
    (input['proposed'] as unknown[]).forEach((r, i) => {
      errors.push(...validateInstallRouteModelV1(r, `proposed[${i}]`));
    });
  }
  if (!isArray(input['notes'])) {
    errors.push('notes: must be an array');
  } else {
    (input['notes'] as unknown[]).forEach((n, i) => {
      errors.push(...validateInstallAnnotation(n, `notes[${i}]`));
    });
  }
  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, layer: input as InstallLayerModelV1 };
}
