/**
 * validation.test.ts
 *
 * Tests for the scan bundle validation boundary.
 *
 * Coverage:
 *   1. Valid single-room bundle accepted
 *   2. Valid multi-room bundle accepted
 *   3. Low-confidence bundle accepted (confidence is not a rejection criterion)
 *   4. Partial-missing-openings bundle accepted
 *   5. Invalid schema rejected with error messages
 *   6. Unsupported version rejected with version string in error
 *   7. Null / non-object inputs rejected
 *   8. Missing version field rejected
 *   9. Type assertion narrows correctly after validation boundary
 *  10. isUnsupportedVersion helper behaves correctly
 *  11. isSupportedVersion helper behaves correctly
 */

import { describe, it, expect } from 'vitest';
import { validateScanBundle } from '../../src/scan/validation';
import { isSupportedVersion, isUnsupportedVersion, SUPPORTED_SCAN_BUNDLE_VERSIONS } from '../../src/scan/versions';
import type { ScanBundleV1 } from '../../src/scan/types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

import validSingleRoom from '../../fixtures/valid-single-room.json';
import validMultiRoom from '../../fixtures/valid-multi-room.json';
import lowConfidence from '../../fixtures/low-confidence.json';
import partialMissingOpenings from '../../fixtures/partial-missing-openings.json';
import invalidSchema from '../../fixtures/invalid-schema.json';
import unsupportedVersion from '../../fixtures/unsupported-version.json';

// ─── 1. Valid single-room bundle ──────────────────────────────────────────────

describe('validateScanBundle — valid single-room fixture', () => {
  it('returns ok: true', () => {
    const result = validateScanBundle(validSingleRoom);
    expect(result.ok).toBe(true);
  });

  it('returns the bundle with the correct bundleId', () => {
    const result = validateScanBundle(validSingleRoom);
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.bundle.bundleId).toBe('fixture-single-room-001');
  });

  it('returns the bundle typed as ScanBundleV1 with version "1.0"', () => {
    const result = validateScanBundle(validSingleRoom);
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.bundle.version).toBe('1.0');
  });

  it('returns one room', () => {
    const result = validateScanBundle(validSingleRoom);
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.bundle.rooms).toHaveLength(1);
  });

  it('returns correct room id', () => {
    const result = validateScanBundle(validSingleRoom);
    if (!result.ok) throw new Error('Expected ok: true');
    const room = result.bundle.rooms[0];
    expect(room?.id).toBe('room-living-01');
  });
});

// ─── 2. Valid multi-room bundle ───────────────────────────────────────────────

describe('validateScanBundle — valid multi-room fixture', () => {
  it('returns ok: true', () => {
    const result = validateScanBundle(validMultiRoom);
    expect(result.ok).toBe(true);
  });

  it('returns three rooms', () => {
    const result = validateScanBundle(validMultiRoom);
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.bundle.rooms).toHaveLength(3);
  });
});

// ─── 3. Low-confidence bundle ─────────────────────────────────────────────────

describe('validateScanBundle — low-confidence fixture', () => {
  it('returns ok: true (low confidence is not a validation failure)', () => {
    const result = validateScanBundle(lowConfidence);
    expect(result.ok).toBe(true);
  });

  it('returns the QA flag from the bundle', () => {
    const result = validateScanBundle(lowConfidence);
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.bundle.qaFlags).toHaveLength(1);
    expect(result.bundle.qaFlags[0]?.code).toBe('PARTIAL_COVERAGE');
  });
});

// ─── 4. Partial-missing-openings bundle ───────────────────────────────────────

describe('validateScanBundle — partial-missing-openings fixture', () => {
  it('returns ok: true', () => {
    const result = validateScanBundle(partialMissingOpenings);
    expect(result.ok).toBe(true);
  });

  it('returns the dining room', () => {
    const result = validateScanBundle(partialMissingOpenings);
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.bundle.rooms[0]?.id).toBe('room-dining-01');
  });
});

// ─── 5. Invalid schema ────────────────────────────────────────────────────────

describe('validateScanBundle — invalid-schema fixture', () => {
  it('returns ok: false', () => {
    const result = validateScanBundle(invalidSchema);
    expect(result.ok).toBe(false);
  });

  it('returns a non-empty errors array', () => {
    const result = validateScanBundle(invalidSchema);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('mentions the bad polygon field in errors', () => {
    const result = validateScanBundle(invalidSchema);
    if (result.ok) throw new Error('Expected ok: false');
    const combined = result.errors.join(' ');
    expect(combined).toContain('polygon');
  });

  it('mentions the bad areaM2 field in errors', () => {
    const result = validateScanBundle(invalidSchema);
    if (result.ok) throw new Error('Expected ok: false');
    const combined = result.errors.join(' ');
    expect(combined).toContain('areaM2');
  });
});

// ─── 6. Unsupported version ───────────────────────────────────────────────────

describe('validateScanBundle — unsupported-version fixture', () => {
  it('returns ok: false', () => {
    const result = validateScanBundle(unsupportedVersion);
    expect(result.ok).toBe(false);
  });

  it('includes the unsupported version string in the error message', () => {
    const result = validateScanBundle(unsupportedVersion);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.errors[0]).toContain('99.0');
  });

  it('lists the supported versions in the error message', () => {
    const result = validateScanBundle(unsupportedVersion);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.errors[0]).toContain('1.0');
  });
});

// ─── 7. Null / non-object inputs ─────────────────────────────────────────────

describe('validateScanBundle — null / non-object inputs', () => {
  it('rejects null', () => {
    const result = validateScanBundle(null);
    expect(result.ok).toBe(false);
  });

  it('rejects a string', () => {
    const result = validateScanBundle('not-a-bundle');
    expect(result.ok).toBe(false);
  });

  it('rejects an array', () => {
    const result = validateScanBundle([]);
    expect(result.ok).toBe(false);
  });

  it('rejects an empty object', () => {
    const result = validateScanBundle({});
    expect(result.ok).toBe(false);
  });

  it('rejects undefined', () => {
    const result = validateScanBundle(undefined);
    expect(result.ok).toBe(false);
  });

  it('rejects a number', () => {
    const result = validateScanBundle(42);
    expect(result.ok).toBe(false);
  });
});

// ─── 8. Missing version field ────────────────────────────────────────────────

describe('validateScanBundle — missing or non-string version', () => {
  it('rejects when version field is absent', () => {
    const result = validateScanBundle({ bundleId: 'x', rooms: [], anchors: [], qaFlags: [], meta: {} });
    expect(result.ok).toBe(false);
  });

  it('rejects when version field is a number', () => {
    const result = validateScanBundle({ version: 1, bundleId: 'x', rooms: [], anchors: [], qaFlags: [], meta: {} });
    expect(result.ok).toBe(false);
  });

  it('error message mentions "version"', () => {
    const result = validateScanBundle({ bundleId: 'x' });
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.errors[0]).toContain('version');
  });
});

// ─── 9. Type assertion narrows correctly ────────────────────────────────────

describe('validateScanBundle — TypeScript type narrowing', () => {
  it('bundle is typed as ScanBundleV1 after validation (compile-time proof)', () => {
    const result = validateScanBundle(validSingleRoom);
    if (!result.ok) throw new Error('Expected ok: true');

    // This assignment would be a compile error if bundle were not typed as
    // ScanBundleV1 — it is the proof that assertIsScanBundleV1 did its job.
    const typed: ScanBundleV1 = result.bundle;
    expect(typed.version).toBe('1.0');
    expect(typeof typed.bundleId).toBe('string');
    expect(Array.isArray(typed.rooms)).toBe(true);
  });
});

// ─── 10. isUnsupportedVersion helper ─────────────────────────────────────────

describe('isUnsupportedVersion', () => {
  it('returns true for a future version string', () => {
    expect(isUnsupportedVersion({ version: '99.0' })).toBe(true);
  });

  it('returns false for a supported version', () => {
    expect(isUnsupportedVersion({ version: '1.0' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isUnsupportedVersion(null)).toBe(false);
  });

  it('returns false for an object with a non-string version', () => {
    expect(isUnsupportedVersion({ version: 1 })).toBe(false);
  });

  it('returns false for an object with no version field', () => {
    expect(isUnsupportedVersion({})).toBe(false);
  });
});

// ─── 11. isSupportedVersion helper ───────────────────────────────────────────

describe('isSupportedVersion', () => {
  it('returns true for "1.0"', () => {
    expect(isSupportedVersion('1.0')).toBe(true);
  });

  it('returns false for "99.0"', () => {
    expect(isSupportedVersion('99.0')).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isSupportedVersion(undefined)).toBe(false);
  });

  it('SUPPORTED_SCAN_BUNDLE_VERSIONS contains "1.0"', () => {
    expect(SUPPORTED_SCAN_BUNDLE_VERSIONS).toContain('1.0');
  });
});
