/**
 * flueClearanceReview.test.ts
 *
 * Tests for FlueClearanceReviewV1 — engineer review layer for external flue
 * evidence.
 *
 * Coverage:
 *  1.  FlueClearanceReviewV1 — minimal valid record (required fields only)
 *  2.  FlueClearanceReviewV1 — full record (all fields populated)
 *  3.  FlueClearanceReviewV1 — survives JSON round-trip
 *  4.  FlueClearanceReviewStatus — all literals are accepted
 *  5.  FlueClearanceReviewSubmissionStatus — all literals are accepted
 *  6.  FlueClearanceReviewV1 — measurementLineIds may be empty array
 *  7.  FlueClearanceReviewV1 — notes, reviewedByUserId, reviewedAt are optional
 *  8.  FlueClearanceReviewV1 — customerDetailEnabled defaults absent (false)
 *  9.  FlueClearanceReviewV1 — customerDetailEnabled can be explicitly set
 * 10.  FlueClearanceReviewV1 — no pass/fail field present on the type
 */

import { describe, it, expect } from 'vitest';
import type {
  FlueClearanceReviewStatus,
  FlueClearanceReviewSubmissionStatus,
  FlueClearanceReviewV1,
} from '../../src/atlasProperty/index';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roundTrip<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function minimalReview(): FlueClearanceReviewV1 {
  return {
    reviewId: 'review-uuid-001',
    visitId: 'visit-uuid-001',
    externalAreaScanId: 'scan-uuid-001',
    terminalPinId: 'pin-uuid-001',
    measurementLineIds: ['meas-uuid-001', 'meas-uuid-002'],
    status: 'not_reviewed',
    reviewStatus: 'draft',
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('FlueClearanceReviewV1', () => {
  // 1. Minimal valid record
  it('accepts a minimal record with required fields only', () => {
    const review: FlueClearanceReviewV1 = minimalReview();
    expect(review.reviewId).toBe('review-uuid-001');
    expect(review.visitId).toBe('visit-uuid-001');
    expect(review.externalAreaScanId).toBe('scan-uuid-001');
    expect(review.terminalPinId).toBe('pin-uuid-001');
    expect(review.measurementLineIds).toEqual(['meas-uuid-001', 'meas-uuid-002']);
    expect(review.status).toBe('not_reviewed');
    expect(review.reviewStatus).toBe('draft');
  });

  // 2. Full record with all fields
  it('accepts a fully populated record', () => {
    const review: FlueClearanceReviewV1 = {
      reviewId: 'review-uuid-002',
      visitId: 'visit-uuid-002',
      externalAreaScanId: 'scan-uuid-002',
      terminalPinId: 'pin-uuid-002',
      measurementLineIds: ['meas-uuid-003', 'meas-uuid-004', 'meas-uuid-005'],
      status: 'concern',
      notes: 'Flue terminal is 250 mm from an opening — below the 300 mm guidance.',
      reviewedByUserId: 'engineer-uuid-007',
      reviewedAt: '2026-05-05T10:00:00Z',
      reviewStatus: 'submitted',
      customerDetailEnabled: false,
    };
    expect(review.notes).toBeDefined();
    expect(review.reviewedByUserId).toBe('engineer-uuid-007');
    expect(review.reviewedAt).toBe('2026-05-05T10:00:00Z');
    expect(review.customerDetailEnabled).toBe(false);
  });

  // 3. JSON round-trip
  it('survives JSON round-trip', () => {
    const review: FlueClearanceReviewV1 = {
      reviewId: 'review-uuid-003',
      visitId: 'visit-uuid-003',
      externalAreaScanId: 'scan-uuid-003',
      terminalPinId: 'pin-uuid-003',
      measurementLineIds: ['meas-uuid-006'],
      status: 'acceptable',
      notes: 'Clearance adequate.',
      reviewedByUserId: 'engineer-uuid-008',
      reviewedAt: '2026-05-05T11:30:00Z',
      reviewStatus: 'finalised',
      customerDetailEnabled: true,
    };
    const restored = roundTrip(review);
    expect(restored).toEqual(review);
    expect(restored.reviewId).toBe(review.reviewId);
    expect(restored.status).toBe('acceptable');
    expect(restored.reviewStatus).toBe('finalised');
  });

  // 4. FlueClearanceReviewStatus — all literals
  it('accepts all FlueClearanceReviewStatus literals', () => {
    const statuses: FlueClearanceReviewStatus[] = [
      'not_reviewed',
      'needs_review',
      'acceptable',
      'concern',
      'blocked',
    ];
    for (const status of statuses) {
      const review: FlueClearanceReviewV1 = { ...minimalReview(), status };
      expect(review.status).toBe(status);
    }
  });

  // 5. FlueClearanceReviewSubmissionStatus — all literals
  it('accepts all FlueClearanceReviewSubmissionStatus literals', () => {
    const submissionStatuses: FlueClearanceReviewSubmissionStatus[] = [
      'draft',
      'submitted',
      'finalised',
    ];
    for (const reviewStatus of submissionStatuses) {
      const review: FlueClearanceReviewV1 = { ...minimalReview(), reviewStatus };
      expect(review.reviewStatus).toBe(reviewStatus);
    }
  });

  // 6. measurementLineIds may be empty
  it('accepts an empty measurementLineIds array', () => {
    const review: FlueClearanceReviewV1 = {
      ...minimalReview(),
      measurementLineIds: [],
    };
    expect(review.measurementLineIds).toEqual([]);
  });

  // 7. Optional fields are absent from minimal record
  it('notes, reviewedByUserId, and reviewedAt are optional', () => {
    const review: FlueClearanceReviewV1 = minimalReview();
    expect(review.notes).toBeUndefined();
    expect(review.reviewedByUserId).toBeUndefined();
    expect(review.reviewedAt).toBeUndefined();
  });

  // 8. customerDetailEnabled absent by default
  it('customerDetailEnabled is absent when not set', () => {
    const review: FlueClearanceReviewV1 = minimalReview();
    expect(review.customerDetailEnabled).toBeUndefined();
  });

  // 9. customerDetailEnabled can be explicitly set
  it('customerDetailEnabled can be set to true', () => {
    const review: FlueClearanceReviewV1 = {
      ...minimalReview(),
      customerDetailEnabled: true,
    };
    expect(review.customerDetailEnabled).toBe(true);
  });

  // 10. No pass/fail field on the type
  it('has no pass or fail field', () => {
    const review: FlueClearanceReviewV1 = minimalReview();
    // TypeScript enforces no such field; verify at runtime too
    expect((review as Record<string, unknown>)['pass']).toBeUndefined();
    expect((review as Record<string, unknown>)['fail']).toBeUndefined();
    expect((review as Record<string, unknown>)['compliancePass']).toBeUndefined();
  });
});
