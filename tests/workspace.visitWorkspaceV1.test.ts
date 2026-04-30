/**
 * workspace.visitWorkspaceV1.test.ts
 *
 * Tests for VisitWorkspaceV1 and ReviewDecisionsV1 contracts — types,
 * validators, and the cross-repo fixtures.
 *
 * Coverage:
 *
 * validateVisitWorkspaceV1:
 *   1.  Valid fixture passes
 *   2.  Non-JSON (null) input rejected
 *   3.  Non-JSON (array) input rejected
 *   4.  Wrong version rejected
 *   5.  Missing version rejected
 *   6.  Missing visitReference rejected
 *   7.  Missing sessionId rejected
 *   8.  Missing createdAt rejected
 *   9.  Missing updatedAt rejected
 *   10. Invalid createdAt (non-ISO) rejected
 *   11. Missing files rejected
 *   12. Missing files.sessionCapture rejected
 *   13. Missing files.reviewDecisions rejected
 *   14. Empty string files.sessionCapture rejected
 *   15. Optional files.atlasProperty present — must be non-empty string
 *   16. Missing assets rejected
 *   17. Missing assets.photosDir rejected
 *   18. Missing assets.floorPlansDir rejected
 *   19. TypeScript narrowing: workspace is typed as VisitWorkspaceV1 after ok: true
 *   20. Fixture: version is '1.0'
 *   21. Fixture: visitReference matches expected value
 *   22. Fixture: sessionId matches expected value
 *   23. Fixture: files.sessionCapture is non-empty
 *   24. Fixture: assets.photosDir is non-empty
 *
 * validateReviewDecisionsV1:
 *   25. Valid fixture passes
 *   26. Non-JSON (null) input rejected
 *   27. Missing sessionId rejected
 *   28. Missing decisions rejected
 *   29. decisions not an array rejected
 *   30. Decision missing ref rejected
 *   31. Decision invalid kind rejected
 *   32. Decision invalid reviewStatus rejected
 *   33. Decision includeInCustomerReport non-boolean rejected
 *   34. Decision reviewedAt non-ISO rejected
 *   35. Empty decisions array passes (no decisions yet is valid)
 *   36. TypeScript narrowing: reviewDecisions typed as ReviewDecisionsV1 after ok: true
 *   37. Fixture: sessionId matches expected value
 *   38. Fixture: decisions array is non-empty
 *   39. Fixture: all decisions have valid kind values
 *   40. Fixture: all decisions have valid reviewStatus values
 *
 * Coexistence:
 *   41. workspace.sessionId matches reviewDecisions.sessionId in fixtures
 */

import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
import {
  validateVisitWorkspaceV1,
  validateReviewDecisionsV1,
} from '../src/workspace/visitWorkspaceV1.schema';
import { VISIT_WORKSPACE_V1_VERSION } from '../src/workspace/visitWorkspaceV1.types';
import type {
  VisitWorkspaceV1,
  ReviewDecisionsV1,
} from '../src/workspace/visitWorkspaceV1.types';

// ─── Load fixtures ────────────────────────────────────────────────────────────

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const workspaceFixture: Record<string, unknown> = require('../fixtures/workspace_v1_example.json') as Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const reviewDecisionsFixture: Record<string, unknown> = require('../fixtures/review_decisions_v1_example.json') as Record<string, unknown>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cloneWorkspace(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { ...workspaceFixture, ...overrides };
}

function cloneReviewDecisions(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { ...reviewDecisionsFixture, ...overrides };
}

// ─── validateVisitWorkspaceV1 ─────────────────────────────────────────────────

describe('validateVisitWorkspaceV1', () => {
  it('1. valid fixture passes', () => {
    const result = validateVisitWorkspaceV1(workspaceFixture);
    expect(result.ok).toBe(true);
  });

  it('2. Non-JSON (null) input rejected', () => {
    const result = validateVisitWorkspaceV1(null);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/non-null object/i);
  });

  it('3. Non-JSON (array) input rejected', () => {
    const result = validateVisitWorkspaceV1([]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/non-null object/i);
  });

  it('4. Wrong version rejected', () => {
    const result = validateVisitWorkspaceV1(cloneWorkspace({ version: '2.0' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/version/i);
  });

  it('5. Missing version rejected', () => {
    const { version: _v, ...rest } = workspaceFixture as Record<string, unknown>;
    const result = validateVisitWorkspaceV1(rest);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/version/i);
  });

  it('6. Missing visitReference rejected', () => {
    const { visitReference: _vr, ...rest } = workspaceFixture as Record<string, unknown>;
    const result = validateVisitWorkspaceV1(rest);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/visitReference/i);
  });

  it('7. Missing sessionId rejected', () => {
    const { sessionId: _s, ...rest } = workspaceFixture as Record<string, unknown>;
    const result = validateVisitWorkspaceV1(rest);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/sessionId/i);
  });

  it('8. Missing createdAt rejected', () => {
    const result = validateVisitWorkspaceV1(cloneWorkspace({ createdAt: undefined }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/createdAt/i);
  });

  it('9. Missing updatedAt rejected', () => {
    const result = validateVisitWorkspaceV1(cloneWorkspace({ updatedAt: undefined }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/updatedAt/i);
  });

  it('10. Invalid createdAt (non-ISO) rejected', () => {
    const result = validateVisitWorkspaceV1(cloneWorkspace({ createdAt: 'not-a-date' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/createdAt/i);
  });

  it('11. Missing files rejected', () => {
    const { files: _f, ...rest } = workspaceFixture as Record<string, unknown>;
    const result = validateVisitWorkspaceV1(rest);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/files/i);
  });

  it('12. Missing files.sessionCapture rejected', () => {
    const files = { ...(workspaceFixture['files'] as Record<string, unknown>), sessionCapture: undefined };
    const result = validateVisitWorkspaceV1(cloneWorkspace({ files }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/sessionCapture/i);
  });

  it('13. Missing files.reviewDecisions rejected', () => {
    const files = { ...(workspaceFixture['files'] as Record<string, unknown>), reviewDecisions: undefined };
    const result = validateVisitWorkspaceV1(cloneWorkspace({ files }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/reviewDecisions/i);
  });

  it('14. Empty string files.sessionCapture rejected', () => {
    const files = { ...(workspaceFixture['files'] as Record<string, unknown>), sessionCapture: '' };
    const result = validateVisitWorkspaceV1(cloneWorkspace({ files }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/sessionCapture/i);
  });

  it('15. Optional files.atlasProperty present as empty string rejected', () => {
    const files = { ...(workspaceFixture['files'] as Record<string, unknown>), atlasProperty: '' };
    const result = validateVisitWorkspaceV1(cloneWorkspace({ files }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/atlasProperty/i);
  });

  it('16. Missing assets rejected', () => {
    const { assets: _a, ...rest } = workspaceFixture as Record<string, unknown>;
    const result = validateVisitWorkspaceV1(rest);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/assets/i);
  });

  it('17. Missing assets.photosDir rejected', () => {
    const assets = { ...(workspaceFixture['assets'] as Record<string, unknown>), photosDir: undefined };
    const result = validateVisitWorkspaceV1(cloneWorkspace({ assets }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/photosDir/i);
  });

  it('18. Missing assets.floorPlansDir rejected', () => {
    const assets = { ...(workspaceFixture['assets'] as Record<string, unknown>), floorPlansDir: undefined };
    const result = validateVisitWorkspaceV1(cloneWorkspace({ assets }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/floorPlansDir/i);
  });

  it('19. TypeScript narrowing: workspace is typed as VisitWorkspaceV1 after ok: true', () => {
    const result = validateVisitWorkspaceV1(workspaceFixture);
    if (result.ok) {
      const workspace: VisitWorkspaceV1 = result.workspace;
      expect(workspace.version).toBe(VISIT_WORKSPACE_V1_VERSION);
    } else {
      throw new Error('Expected ok: true');
    }
  });

  it('20. Fixture: version is "1.0"', () => {
    const result = validateVisitWorkspaceV1(workspaceFixture);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.workspace.version).toBe('1.0');
  });

  it('21. Fixture: visitReference matches expected value', () => {
    const result = validateVisitWorkspaceV1(workspaceFixture);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.workspace.visitReference).toBe('visit-2025-06-15-smith-road');
  });

  it('22. Fixture: sessionId matches expected value', () => {
    const result = validateVisitWorkspaceV1(workspaceFixture);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.workspace.sessionId).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
  });

  it('23. Fixture: files.sessionCapture is non-empty', () => {
    const result = validateVisitWorkspaceV1(workspaceFixture);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.workspace.files.sessionCapture.length).toBeGreaterThan(0);
  });

  it('24. Fixture: assets.photosDir is non-empty', () => {
    const result = validateVisitWorkspaceV1(workspaceFixture);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.workspace.assets.photosDir.length).toBeGreaterThan(0);
  });
});

// ─── validateReviewDecisionsV1 ────────────────────────────────────────────────

describe('validateReviewDecisionsV1', () => {
  it('25. Valid fixture passes', () => {
    const result = validateReviewDecisionsV1(reviewDecisionsFixture);
    expect(result.ok).toBe(true);
  });

  it('26. Non-JSON (null) input rejected', () => {
    const result = validateReviewDecisionsV1(null);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/non-null object/i);
  });

  it('27. Missing sessionId rejected', () => {
    const { sessionId: _s, ...rest } = reviewDecisionsFixture as Record<string, unknown>;
    const result = validateReviewDecisionsV1(rest);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/sessionId/i);
  });

  it('28. Missing decisions rejected', () => {
    const { decisions: _d, ...rest } = reviewDecisionsFixture as Record<string, unknown>;
    const result = validateReviewDecisionsV1(rest);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/decisions/i);
  });

  it('29. decisions not an array rejected', () => {
    const result = validateReviewDecisionsV1(cloneReviewDecisions({ decisions: {} }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/decisions/i);
  });

  it('30. Decision missing ref rejected', () => {
    const decisions = [{ kind: 'photo', reviewStatus: 'confirmed' }];
    const result = validateReviewDecisionsV1(cloneReviewDecisions({ decisions }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/ref/i);
  });

  it('31. Decision invalid kind rejected', () => {
    const decisions = [{ ref: 'photo-001', kind: 'video', reviewStatus: 'confirmed' }];
    const result = validateReviewDecisionsV1(cloneReviewDecisions({ decisions }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/kind/i);
  });

  it('32. Decision invalid reviewStatus rejected', () => {
    const decisions = [{ ref: 'photo-001', kind: 'photo', reviewStatus: 'approved' }];
    const result = validateReviewDecisionsV1(cloneReviewDecisions({ decisions }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/reviewStatus/i);
  });

  it('33. Decision includeInCustomerReport non-boolean rejected', () => {
    const decisions = [{ ref: 'photo-001', kind: 'photo', reviewStatus: 'confirmed', includeInCustomerReport: 'yes' }];
    const result = validateReviewDecisionsV1(cloneReviewDecisions({ decisions }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/includeInCustomerReport/i);
  });

  it('34. Decision reviewedAt non-ISO rejected', () => {
    const decisions = [{ ref: 'photo-001', kind: 'photo', reviewStatus: 'confirmed', reviewedAt: 'yesterday' }];
    const result = validateReviewDecisionsV1(cloneReviewDecisions({ decisions }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/reviewedAt/i);
  });

  it('35. Empty decisions array passes', () => {
    const result = validateReviewDecisionsV1(cloneReviewDecisions({ decisions: [] }));
    expect(result.ok).toBe(true);
  });

  it('36. TypeScript narrowing: reviewDecisions typed as ReviewDecisionsV1 after ok: true', () => {
    const result = validateReviewDecisionsV1(reviewDecisionsFixture);
    if (result.ok) {
      const rd: ReviewDecisionsV1 = result.reviewDecisions;
      expect(typeof rd.sessionId).toBe('string');
    } else {
      throw new Error('Expected ok: true');
    }
  });

  it('37. Fixture: sessionId matches expected value', () => {
    const result = validateReviewDecisionsV1(reviewDecisionsFixture);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.reviewDecisions.sessionId).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
  });

  it('38. Fixture: decisions array is non-empty', () => {
    const result = validateReviewDecisionsV1(reviewDecisionsFixture);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.reviewDecisions.decisions.length).toBeGreaterThan(0);
  });

  it('39. Fixture: all decisions have valid kind values', () => {
    const result = validateReviewDecisionsV1(reviewDecisionsFixture);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const validKinds = new Set(['photo', 'object_pin', 'floor_plan']);
      for (const d of result.reviewDecisions.decisions) {
        expect(validKinds.has(d.kind)).toBe(true);
      }
    }
  });

  it('40. Fixture: all decisions have valid reviewStatus values', () => {
    const result = validateReviewDecisionsV1(reviewDecisionsFixture);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const validStatuses = new Set(['pending', 'confirmed', 'rejected']);
      for (const d of result.reviewDecisions.decisions) {
        expect(validStatuses.has(d.reviewStatus)).toBe(true);
      }
    }
  });
});

// ─── Coexistence ──────────────────────────────────────────────────────────────

describe('Coexistence: SessionCaptureV2 + ReviewDecisionsV1 in same workspace', () => {
  it('41. workspace.sessionId matches reviewDecisions.sessionId in fixtures', () => {
    const wsResult = validateVisitWorkspaceV1(workspaceFixture);
    const rdResult = validateReviewDecisionsV1(reviewDecisionsFixture);
    expect(wsResult.ok).toBe(true);
    expect(rdResult.ok).toBe(true);
    if (wsResult.ok && rdResult.ok) {
      expect(wsResult.workspace.sessionId).toBe(rdResult.reviewDecisions.sessionId);
    }
  });
});
