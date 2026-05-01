/**
 * visit.test.ts
 *
 * Tests for the AtlasVisitV1 contract and related types.
 *
 * Coverage:
 *   1. EMPTY_ATLAS_VISIT_READINESS_V1 has all flags false.
 *   2. A minimal AtlasVisitV1 compiles/validates by shape.
 *   3. brandId is optional.
 *   4. visitNumber is optional.
 *   5. status accepts all defined values.
 */

import { describe, it, expect } from 'vitest';
import {
  EMPTY_ATLAS_VISIT_READINESS_V1,
} from '../../src/scan/visit';
import type {
  AtlasVisitV1,
  AtlasVisitStatusV1,
} from '../../src/scan/visit';

// ─── 1. EMPTY_ATLAS_VISIT_READINESS_V1 ────────────────────────────────────────

describe('EMPTY_ATLAS_VISIT_READINESS_V1', () => {
  it('has all flags set to false', () => {
    expect(EMPTY_ATLAS_VISIT_READINESS_V1.hasRooms).toBe(false);
    expect(EMPTY_ATLAS_VISIT_READINESS_V1.hasPhotos).toBe(false);
    expect(EMPTY_ATLAS_VISIT_READINESS_V1.hasHeatingSystem).toBe(false);
    expect(EMPTY_ATLAS_VISIT_READINESS_V1.hasHotWaterSystem).toBe(false);
    expect(EMPTY_ATLAS_VISIT_READINESS_V1.hasKeyObjectBoiler).toBe(false);
    expect(EMPTY_ATLAS_VISIT_READINESS_V1.hasKeyObjectFlue).toBe(false);
    expect(EMPTY_ATLAS_VISIT_READINESS_V1.hasAnyNotes).toBe(false);
  });
});

// ─── 2. Minimal AtlasVisitV1 shape ────────────────────────────────────────────

describe('AtlasVisitV1 shape', () => {
  it('accepts a minimal valid visit', () => {
    const visit: AtlasVisitV1 = {
      version: '1.0',
      visitId: 'visit-001',
      sourceApp: 'scan_ios',
      status: 'draft',
      readiness: EMPTY_ATLAS_VISIT_READINESS_V1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    expect(visit.version).toBe('1.0');
    expect(visit.visitId).toBe('visit-001');
    expect(visit.sourceApp).toBe('scan_ios');
    expect(visit.status).toBe('draft');
  });
});

// ─── 3. brandId is optional ───────────────────────────────────────────────────

describe('AtlasVisitV1 — brandId', () => {
  it('is absent when not provided', () => {
    const visit: AtlasVisitV1 = {
      version: '1.0',
      visitId: 'visit-002',
      sourceApp: 'scan_ios',
      status: 'capturing',
      readiness: EMPTY_ATLAS_VISIT_READINESS_V1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    expect(visit.brandId).toBeUndefined();
  });

  it('can be provided', () => {
    const visit: AtlasVisitV1 = {
      version: '1.0',
      visitId: 'visit-003',
      brandId: 'brand-abc',
      sourceApp: 'scan_ios',
      status: 'complete',
      readiness: EMPTY_ATLAS_VISIT_READINESS_V1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    expect(visit.brandId).toBe('brand-abc');
  });
});

// ─── 4. visitNumber is optional ───────────────────────────────────────────────

describe('AtlasVisitV1 — visitNumber', () => {
  it('is absent when not provided', () => {
    const visit: AtlasVisitV1 = {
      version: '1.0',
      visitId: 'visit-004',
      sourceApp: 'scan_ios',
      status: 'draft',
      readiness: EMPTY_ATLAS_VISIT_READINESS_V1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    expect(visit.visitNumber).toBeUndefined();
  });

  it('can be provided', () => {
    const visit: AtlasVisitV1 = {
      version: '1.0',
      visitId: 'visit-005',
      visitNumber: 'VN-0042',
      sourceApp: 'mind_pwa',
      status: 'planning',
      readiness: EMPTY_ATLAS_VISIT_READINESS_V1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    expect(visit.visitNumber).toBe('VN-0042');
  });
});

// ─── 5. status accepts all defined values ─────────────────────────────────────

describe('AtlasVisitStatusV1', () => {
  const allStatuses: AtlasVisitStatusV1[] = [
    'draft',
    'capturing',
    'planning',
    'ready_to_complete',
    'complete',
    'synced',
    'archived',
  ];

  for (const status of allStatuses) {
    it(`accepts status '${status}'`, () => {
      const visit: AtlasVisitV1 = {
        version: '1.0',
        visitId: `visit-status-${status}`,
        sourceApp: 'import',
        status,
        readiness: EMPTY_ATLAS_VISIT_READINESS_V1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };
      expect(visit.status).toBe(status);
    });
  }
});
