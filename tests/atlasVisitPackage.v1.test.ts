/**
 * atlasVisitPackage.v1.test.ts
 *
 * Tests for the AtlasVisitPackageV1 contract — types, constants, validator,
 * and the cross-repo fixture.
 *
 * Coverage:
 *
 * Constants:
 *   1.  ATLAS_VISIT_PACKAGE_V1_FORMAT is 'AtlasVisitPackageV1'
 *   2.  ATLAS_VISIT_PACKAGE_V1_EXTENSION is '.atlasvisit'
 *   3.  ATLAS_VISIT_PACKAGE_MANIFEST_V1_SCHEMA_VERSION is '1.0'
 *   4.  ATLAS_VISIT_PACKAGE_V1_WORKSPACE_FILE is 'workspace.json'
 *   5.  ATLAS_VISIT_PACKAGE_V1_SESSION_CAPTURE_FILE is 'session_capture_v2.json'
 *   6.  ATLAS_VISIT_PACKAGE_V1_REVIEW_DECISIONS_FILE is 'review_decisions.json'
 *   7.  ATLAS_VISIT_PACKAGE_V1_PHOTOS_DIR is 'photos'
 *   8.  ATLAS_VISIT_PACKAGE_V1_FLOORPLANS_DIR is 'floorplans'
 *
 * validateAtlasVisitPackageManifestV1:
 *   9.  Valid fixture passes
 *   10. Non-JSON (null) input rejected
 *   11. Non-JSON (array) input rejected
 *   12. Wrong format rejected
 *   13. Missing format rejected
 *   14. Wrong schemaVersion rejected
 *   15. Missing schemaVersion rejected
 *   16. Missing visitReference rejected
 *   17. Empty visitReference rejected
 *   18. Missing sessionId rejected
 *   19. Missing createdAt rejected
 *   20. Invalid createdAt (non-ISO) rejected
 *   21. Missing workspaceFile rejected
 *   22. Empty workspaceFile rejected
 *   23. Missing sessionCaptureFile rejected
 *   24. Missing reviewDecisionsFile rejected
 *   25. Missing photosDir rejected
 *   26. Missing floorplansDir rejected
 *   27. TypeScript narrowing: manifest is typed as AtlasVisitPackageManifestV1 after ok: true
 *   28. Extra unknown fields are tolerated
 *
 * Fixture assertions:
 *   29. Fixture: format is 'AtlasVisitPackageV1'
 *   30. Fixture: schemaVersion is '1.0'
 *   31. Fixture: visitReference matches expected value
 *   32. Fixture: sessionId matches expected value
 *   33. Fixture: workspaceFile is 'workspace.json'
 *   34. Fixture: sessionCaptureFile is 'session_capture_v2.json'
 *   35. Fixture: reviewDecisionsFile is 'review_decisions.json'
 *   36. Fixture: photosDir is 'photos'
 *   37. Fixture: floorplansDir is 'floorplans'
 *
 * Cross-fixture coexistence:
 *   38. Fixture sessionId matches workspace_v1_example.json sessionId
 *   39. Fixture visitReference matches workspace_v1_example.json visitReference
 */

import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
import {
  validateAtlasVisitPackageManifestV1,
  ATLAS_VISIT_PACKAGE_V1_FORMAT,
  ATLAS_VISIT_PACKAGE_V1_EXTENSION,
  ATLAS_VISIT_PACKAGE_MANIFEST_V1_SCHEMA_VERSION,
  ATLAS_VISIT_PACKAGE_V1_WORKSPACE_FILE,
  ATLAS_VISIT_PACKAGE_V1_SESSION_CAPTURE_FILE,
  ATLAS_VISIT_PACKAGE_V1_REVIEW_DECISIONS_FILE,
  ATLAS_VISIT_PACKAGE_V1_PHOTOS_DIR,
  ATLAS_VISIT_PACKAGE_V1_FLOORPLANS_DIR,
} from '../src/atlasVisitPackage/index';
import type { AtlasVisitPackageManifestV1 } from '../src/atlasVisitPackage/index';

// ─── Load fixtures ────────────────────────────────────────────────────────────

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const manifestFixture: Record<string, unknown> = require('../fixtures/atlas_visit_package_v1_manifest_example.json') as Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const workspaceFixture: Record<string, unknown> = require('../fixtures/workspace_v1_example.json') as Record<string, unknown>;

// ─── Helper ───────────────────────────────────────────────────────────────────

function cloneManifest(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { ...manifestFixture, ...overrides };
}

// ─── Constants ────────────────────────────────────────────────────────────────

describe('AtlasVisitPackageV1 constants', () => {
  it('1. ATLAS_VISIT_PACKAGE_V1_FORMAT is "AtlasVisitPackageV1"', () => {
    expect(ATLAS_VISIT_PACKAGE_V1_FORMAT).toBe('AtlasVisitPackageV1');
  });

  it('2. ATLAS_VISIT_PACKAGE_V1_EXTENSION is ".atlasvisit"', () => {
    expect(ATLAS_VISIT_PACKAGE_V1_EXTENSION).toBe('.atlasvisit');
  });

  it('3. ATLAS_VISIT_PACKAGE_MANIFEST_V1_SCHEMA_VERSION is "1.0"', () => {
    expect(ATLAS_VISIT_PACKAGE_MANIFEST_V1_SCHEMA_VERSION).toBe('1.0');
  });

  it('4. ATLAS_VISIT_PACKAGE_V1_WORKSPACE_FILE is "workspace.json"', () => {
    expect(ATLAS_VISIT_PACKAGE_V1_WORKSPACE_FILE).toBe('workspace.json');
  });

  it('5. ATLAS_VISIT_PACKAGE_V1_SESSION_CAPTURE_FILE is "session_capture_v2.json"', () => {
    expect(ATLAS_VISIT_PACKAGE_V1_SESSION_CAPTURE_FILE).toBe('session_capture_v2.json');
  });

  it('6. ATLAS_VISIT_PACKAGE_V1_REVIEW_DECISIONS_FILE is "review_decisions.json"', () => {
    expect(ATLAS_VISIT_PACKAGE_V1_REVIEW_DECISIONS_FILE).toBe('review_decisions.json');
  });

  it('7. ATLAS_VISIT_PACKAGE_V1_PHOTOS_DIR is "photos"', () => {
    expect(ATLAS_VISIT_PACKAGE_V1_PHOTOS_DIR).toBe('photos');
  });

  it('8. ATLAS_VISIT_PACKAGE_V1_FLOORPLANS_DIR is "floorplans"', () => {
    expect(ATLAS_VISIT_PACKAGE_V1_FLOORPLANS_DIR).toBe('floorplans');
  });
});

// ─── validateAtlasVisitPackageManifestV1 ─────────────────────────────────────

describe('validateAtlasVisitPackageManifestV1', () => {
  it('9. Valid fixture passes', () => {
    const result = validateAtlasVisitPackageManifestV1(manifestFixture);
    expect(result.ok).toBe(true);
  });

  it('10. Non-JSON (null) input rejected', () => {
    const result = validateAtlasVisitPackageManifestV1(null);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/non-null object/i);
  });

  it('11. Non-JSON (array) input rejected', () => {
    const result = validateAtlasVisitPackageManifestV1([]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/non-null object/i);
  });

  it('12. Wrong format rejected', () => {
    const result = validateAtlasVisitPackageManifestV1(cloneManifest({ format: 'AtlasScanPackageV1' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/format/i);
  });

  it('13. Missing format rejected', () => {
    const { format: _f, ...rest } = manifestFixture;
    const result = validateAtlasVisitPackageManifestV1(rest);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/format/i);
  });

  it('14. Wrong schemaVersion rejected', () => {
    const result = validateAtlasVisitPackageManifestV1(cloneManifest({ schemaVersion: '2.0' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/schemaVersion/i);
  });

  it('15. Missing schemaVersion rejected', () => {
    const { schemaVersion: _s, ...rest } = manifestFixture;
    const result = validateAtlasVisitPackageManifestV1(rest);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/schemaVersion/i);
  });

  it('16. Missing visitReference rejected', () => {
    const { visitReference: _vr, ...rest } = manifestFixture;
    const result = validateAtlasVisitPackageManifestV1(rest);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/visitReference/i);
  });

  it('17. Empty visitReference rejected', () => {
    const result = validateAtlasVisitPackageManifestV1(cloneManifest({ visitReference: '' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/visitReference/i);
  });

  it('18. Missing sessionId rejected', () => {
    const { sessionId: _s, ...rest } = manifestFixture;
    const result = validateAtlasVisitPackageManifestV1(rest);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/sessionId/i);
  });

  it('19. Missing createdAt rejected', () => {
    const result = validateAtlasVisitPackageManifestV1(cloneManifest({ createdAt: undefined }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/createdAt/i);
  });

  it('20. Invalid createdAt (non-ISO) rejected', () => {
    const result = validateAtlasVisitPackageManifestV1(cloneManifest({ createdAt: 'not-a-date' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/createdAt/i);
  });

  it('21. Missing workspaceFile rejected', () => {
    const { workspaceFile: _w, ...rest } = manifestFixture;
    const result = validateAtlasVisitPackageManifestV1(rest);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/workspaceFile/i);
  });

  it('22. Empty workspaceFile rejected', () => {
    const result = validateAtlasVisitPackageManifestV1(cloneManifest({ workspaceFile: '' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/workspaceFile/i);
  });

  it('23. Missing sessionCaptureFile rejected', () => {
    const { sessionCaptureFile: _sc, ...rest } = manifestFixture;
    const result = validateAtlasVisitPackageManifestV1(rest);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/sessionCaptureFile/i);
  });

  it('24. Missing reviewDecisionsFile rejected', () => {
    const { reviewDecisionsFile: _rd, ...rest } = manifestFixture;
    const result = validateAtlasVisitPackageManifestV1(rest);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/reviewDecisionsFile/i);
  });

  it('25. Missing photosDir rejected', () => {
    const { photosDir: _p, ...rest } = manifestFixture;
    const result = validateAtlasVisitPackageManifestV1(rest);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/photosDir/i);
  });

  it('26. Missing floorplansDir rejected', () => {
    const { floorplansDir: _fp, ...rest } = manifestFixture;
    const result = validateAtlasVisitPackageManifestV1(rest);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/floorplansDir/i);
  });

  it('27. TypeScript narrowing: manifest is typed as AtlasVisitPackageManifestV1 after ok: true', () => {
    const result = validateAtlasVisitPackageManifestV1(manifestFixture);
    if (result.ok) {
      const manifest: AtlasVisitPackageManifestV1 = result.manifest;
      expect(manifest.format).toBe(ATLAS_VISIT_PACKAGE_V1_FORMAT);
    } else {
      throw new Error('Expected ok: true');
    }
  });

  it('28. Extra unknown fields are tolerated', () => {
    const result = validateAtlasVisitPackageManifestV1(
      cloneManifest({ unknownFutureField: 'some-value', anotherExtra: 42 }),
    );
    expect(result.ok).toBe(true);
  });
});

// ─── Fixture assertions ───────────────────────────────────────────────────────

describe('AtlasVisitPackageManifestV1 fixture', () => {
  it('29. Fixture: format is "AtlasVisitPackageV1"', () => {
    const result = validateAtlasVisitPackageManifestV1(manifestFixture);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.manifest.format).toBe('AtlasVisitPackageV1');
  });

  it('30. Fixture: schemaVersion is "1.0"', () => {
    const result = validateAtlasVisitPackageManifestV1(manifestFixture);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.manifest.schemaVersion).toBe('1.0');
  });

  it('31. Fixture: visitReference matches expected value', () => {
    const result = validateAtlasVisitPackageManifestV1(manifestFixture);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.manifest.visitReference).toBe('visit-2025-06-15-smith-road');
  });

  it('32. Fixture: sessionId matches expected value', () => {
    const result = validateAtlasVisitPackageManifestV1(manifestFixture);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.manifest.sessionId).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
  });

  it('33. Fixture: workspaceFile is "workspace.json"', () => {
    const result = validateAtlasVisitPackageManifestV1(manifestFixture);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.manifest.workspaceFile).toBe('workspace.json');
  });

  it('34. Fixture: sessionCaptureFile is "session_capture_v2.json"', () => {
    const result = validateAtlasVisitPackageManifestV1(manifestFixture);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.manifest.sessionCaptureFile).toBe('session_capture_v2.json');
  });

  it('35. Fixture: reviewDecisionsFile is "review_decisions.json"', () => {
    const result = validateAtlasVisitPackageManifestV1(manifestFixture);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.manifest.reviewDecisionsFile).toBe('review_decisions.json');
  });

  it('36. Fixture: photosDir is "photos"', () => {
    const result = validateAtlasVisitPackageManifestV1(manifestFixture);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.manifest.photosDir).toBe('photos');
  });

  it('37. Fixture: floorplansDir is "floorplans"', () => {
    const result = validateAtlasVisitPackageManifestV1(manifestFixture);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.manifest.floorplansDir).toBe('floorplans');
  });
});

// ─── Cross-fixture coexistence ────────────────────────────────────────────────

describe('Cross-fixture coexistence: AtlasVisitPackageManifestV1 + VisitWorkspaceV1', () => {
  it('38. Fixture sessionId matches workspace_v1_example.json sessionId', () => {
    const result = validateAtlasVisitPackageManifestV1(manifestFixture);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.manifest.sessionId).toBe(workspaceFixture['sessionId']);
    }
  });

  it('39. Fixture visitReference matches workspace_v1_example.json visitReference', () => {
    const result = validateAtlasVisitPackageManifestV1(manifestFixture);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.manifest.visitReference).toBe(workspaceFixture['visitReference']);
    }
  });
});
