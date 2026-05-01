/**
 * scanToMindHandoff.test.ts
 *
 * Tests for ScanToMindHandoffV1 and validateScanToMindHandoffV1.
 *
 * Coverage:
 *   1.  valid complete handoff passes validation
 *   2.  visitId mismatch fails
 *   3.  readiness mismatch fails
 *   4.  capture.version other than '2.0' fails
 *   5.  wrong sourceApp fails
 *   6.  wrong targetApp fails
 *   7.  complete_capture with missing readiness flags fails
 *   8.  save_progress allows incomplete readiness
 *   9.  matching brandId passes
 *   10. mismatched brandId fails
 *   11. brandId present on only one side warns
 */

import { describe, it, expect } from 'vitest';
import type { ScanToMindHandoffV1 } from '../../src/scan/scanToMindHandoff';
import { validateScanToMindHandoffV1 } from '../../src/scan/scanToMindHandoff';
import type { AtlasVisitV1, AtlasVisitReadinessV1 } from '../../src/scan/visit';
import type { SessionCaptureV2 } from '../../src/scan/sessionCaptureV2';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FULL_READINESS: AtlasVisitReadinessV1 = {
  hasRooms: true,
  hasPhotos: true,
  hasHeatingSystem: true,
  hasHotWaterSystem: true,
  hasKeyObjectBoiler: true,
  hasKeyObjectFlue: true,
  hasAnyNotes: true,
};

const EMPTY_READINESS: AtlasVisitReadinessV1 = {
  hasRooms: false,
  hasPhotos: false,
  hasHeatingSystem: false,
  hasHotWaterSystem: false,
  hasKeyObjectBoiler: false,
  hasKeyObjectFlue: false,
  hasAnyNotes: false,
};

function makeVisit(
  overrides: Partial<AtlasVisitV1> = {},
): AtlasVisitV1 {
  return {
    version: '1.0',
    visitId: 'visit-001',
    sourceApp: 'scan_ios',
    status: 'complete',
    readiness: FULL_READINESS,
    createdAt: '2025-01-01T09:00:00Z',
    updatedAt: '2025-01-01T09:00:00Z',
    ...overrides,
  };
}

function makeCapture(
  overrides: Partial<SessionCaptureV2> = {},
): SessionCaptureV2 {
  return {
    version: '2.0',
    visitId: 'visit-001',
    rooms: [],
    photos: [],
    transcripts: [],
    objectPins: [],
    pipeRoutes: [],
    pointCloudAssets: [],
    createdAt: '2025-01-01T09:00:00Z',
    updatedAt: '2025-01-01T09:00:00Z',
    ...overrides,
  };
}

function makeHandoff(
  overrides: Partial<ScanToMindHandoffV1> = {},
): ScanToMindHandoffV1 {
  return {
    version: '1.0',
    meta: {
      createdAt: '2025-01-01T09:01:00Z',
      sourceApp: 'scan_ios',
      targetApp: 'mind_pwa',
      handoffReason: 'complete_capture',
      schemaVersion: '1.0',
    },
    visit: makeVisit(),
    readiness: FULL_READINESS,
    capture: makeCapture(),
    ...overrides,
  };
}

// ─── 1. Valid complete handoff ────────────────────────────────────────────────

describe('validateScanToMindHandoffV1 — valid complete handoff', () => {
  it('1. passes for a fully valid complete_capture handoff', () => {
    const result = validateScanToMindHandoffV1(makeHandoff());
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });
});

// ─── 2. visitId mismatch ─────────────────────────────────────────────────────

describe('validateScanToMindHandoffV1 — visitId mismatch', () => {
  it('2. fails when visit.visitId does not match capture.visitId', () => {
    const handoff = makeHandoff({
      capture: makeCapture({ visitId: 'visit-999' }),
    });
    const result = validateScanToMindHandoffV1(handoff);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('visitId'))).toBe(true);
  });
});

// ─── 3. Readiness mismatch ───────────────────────────────────────────────────

describe('validateScanToMindHandoffV1 — readiness mismatch', () => {
  it('3. fails when top-level readiness does not match visit.readiness', () => {
    const handoff = makeHandoff({
      readiness: { ...FULL_READINESS, hasRooms: false },
    });
    const result = validateScanToMindHandoffV1(handoff);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('readiness'))).toBe(true);
  });
});

// ─── 4. capture.version mismatch ─────────────────────────────────────────────

describe('validateScanToMindHandoffV1 — capture.version', () => {
  it("4. fails when capture.version is not '2.0'", () => {
    const handoff = makeHandoff({
      // Force an invalid version for testing purposes
      capture: { ...makeCapture(), version: '1.0' as unknown as '2.0' },
    });
    const result = validateScanToMindHandoffV1(handoff);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('capture.version'))).toBe(true);
  });
});

// ─── 5. Wrong sourceApp ───────────────────────────────────────────────────────

describe('validateScanToMindHandoffV1 — wrong sourceApp', () => {
  it('5. fails when meta.sourceApp is not scan_ios', () => {
    const handoff = makeHandoff({
      meta: {
        ...makeHandoff().meta,
        sourceApp: 'mind_pwa' as unknown as 'scan_ios',
      },
    });
    const result = validateScanToMindHandoffV1(handoff);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('sourceApp'))).toBe(true);
  });
});

// ─── 6. Wrong targetApp ───────────────────────────────────────────────────────

describe('validateScanToMindHandoffV1 — wrong targetApp', () => {
  it('6. fails when meta.targetApp is not mind_pwa', () => {
    const handoff = makeHandoff({
      meta: {
        ...makeHandoff().meta,
        targetApp: 'scan_ios' as unknown as 'mind_pwa',
      },
    });
    const result = validateScanToMindHandoffV1(handoff);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('targetApp'))).toBe(true);
  });
});

// ─── 7. complete_capture with missing readiness flags ─────────────────────────

describe('validateScanToMindHandoffV1 — complete_capture readiness', () => {
  it('7. fails when complete_capture has incomplete readiness', () => {
    const partialReadiness: AtlasVisitReadinessV1 = {
      hasRooms: true,
      hasPhotos: false,
      hasHeatingSystem: false,
      hasHotWaterSystem: false,
      hasKeyObjectBoiler: false,
      hasKeyObjectFlue: false,
      hasAnyNotes: false,
    };
    const handoff = makeHandoff({
      visit: makeVisit({ readiness: partialReadiness }),
      readiness: partialReadiness,
    });
    const result = validateScanToMindHandoffV1(handoff);
    expect(result.ok).toBe(false);
    // Should produce blocking errors for each missing flag
    expect(result.errors.some((e) => e.includes('hasPhotos'))).toBe(true);
    expect(result.errors.some((e) => e.includes('hasHeatingSystem'))).toBe(true);
    expect(result.errors.some((e) => e.includes('hasHotWaterSystem'))).toBe(true);
    expect(result.errors.some((e) => e.includes('hasKeyObjectBoiler'))).toBe(true);
    expect(result.errors.some((e) => e.includes('hasKeyObjectFlue'))).toBe(true);
    expect(result.errors.some((e) => e.includes('hasAnyNotes'))).toBe(true);
  });

  it('7b. fails when complete_capture visit.status is not complete or ready_to_complete', () => {
    const handoff = makeHandoff({
      visit: makeVisit({ status: 'capturing' }),
    });
    const result = validateScanToMindHandoffV1(handoff);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('visit.status'))).toBe(true);
  });
});

// ─── 8. save_progress allows incomplete readiness ─────────────────────────────

describe('validateScanToMindHandoffV1 — save_progress', () => {
  it('8. save_progress passes with all readiness flags false', () => {
    const handoff = makeHandoff({
      meta: {
        createdAt: '2025-01-01T09:01:00Z',
        sourceApp: 'scan_ios',
        targetApp: 'mind_pwa',
        handoffReason: 'save_progress',
        schemaVersion: '1.0',
      },
      visit: makeVisit({ status: 'capturing', readiness: EMPTY_READINESS }),
      readiness: EMPTY_READINESS,
    });
    const result = validateScanToMindHandoffV1(handoff);
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ─── 9. Matching brandId ──────────────────────────────────────────────────────

describe('validateScanToMindHandoffV1 — matching brandId', () => {
  it('9. passes when visit.brandId and capture.brandId match', () => {
    const handoff = makeHandoff({
      visit: makeVisit({ brandId: 'brand-abc' }),
      capture: makeCapture({ brandId: 'brand-abc' }),
    });
    const result = validateScanToMindHandoffV1(handoff);
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });
});

// ─── 10. Mismatched brandId ───────────────────────────────────────────────────

describe('validateScanToMindHandoffV1 — mismatched brandId', () => {
  it('10. fails when visit.brandId and capture.brandId are different', () => {
    const handoff = makeHandoff({
      visit: makeVisit({ brandId: 'brand-abc' }),
      capture: makeCapture({ brandId: 'brand-xyz' }),
    });
    const result = validateScanToMindHandoffV1(handoff);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('brandId'))).toBe(true);
  });
});

// ─── 11. One-sided brandId warns ─────────────────────────────────────────────

describe('validateScanToMindHandoffV1 — one-sided brandId', () => {
  it('11a. warns when brandId is on visit but not capture', () => {
    const handoff = makeHandoff({
      visit: makeVisit({ brandId: 'brand-abc' }),
      capture: makeCapture(),
    });
    const result = validateScanToMindHandoffV1(handoff);
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings.some((w) => w.includes('brandId'))).toBe(true);
  });

  it('11b. warns when brandId is on capture but not visit', () => {
    const handoff = makeHandoff({
      visit: makeVisit(),
      capture: makeCapture({ brandId: 'brand-abc' }),
    });
    const result = validateScanToMindHandoffV1(handoff);
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings.some((w) => w.includes('brandId'))).toBe(true);
  });
});
