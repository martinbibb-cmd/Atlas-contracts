/**
 * atlasScan.sessionCapture.test.ts
 *
 * Tests for SessionCaptureV2 types, validation, and fixture builders.
 *
 * Coverage:
 *   1. Valid full fixture accepted
 *   2. Minimal fixture (empty arrays) accepted
 *   3. Wrong schemaVersion rejected
 *   4. Missing schemaVersion rejected
 *   5. Missing sessionId rejected
 *   6. Missing createdAt rejected
 *   7. Missing job.visitReference rejected
 *   8. Non-array captures fields rejected
 *   9. Invalid roomScan item rejected
 *  10. Invalid photo item rejected
 *  11. Invalid voiceNote item rejected
 *  12. Invalid placedObject kind rejected
 *  13. Invalid placedObject createdAt rejected
 *  14. Invalid floorPlanSnapshot rejected
 *  15. TypeScript narrowing: session is typed as SessionCaptureV2 after ok: true
 *  16. job.appointmentId present in the full fixture
 *  17. Missing job.appointmentId rejected
 */

import { describe, it, expect } from 'vitest';
import { validateSessionCaptureV2 } from '../src/atlasScan/sessionCapture.schema';
import {
  buildSessionCaptureV2,
  buildMinimalSessionCaptureV2,
} from '../src/atlasScan/sessionCapture.fixtures';
import type { SessionCaptureV2 } from '../src/atlasScan/sessionCapture.types';

// ─── 1. Valid full fixture ────────────────────────────────────────────────────

describe('validateSessionCaptureV2 — full fixture', () => {
  it('returns ok: true', () => {
    const result = validateSessionCaptureV2(buildSessionCaptureV2());
    expect(result.ok).toBe(true);
  });

  it('returns the correct sessionId', () => {
    const result = validateSessionCaptureV2(buildSessionCaptureV2());
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.session.sessionId).toBe('session-v2-fixture-001');
  });

  it('returns the correct schemaVersion', () => {
    const result = validateSessionCaptureV2(buildSessionCaptureV2());
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.session.schemaVersion).toBe('atlas.scan.session.v2');
  });

  it('returns captures with one room scan', () => {
    const result = validateSessionCaptureV2(buildSessionCaptureV2());
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.session.captures.roomScans).toHaveLength(1);
  });

  it('returns captures with one photo', () => {
    const result = validateSessionCaptureV2(buildSessionCaptureV2());
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.session.captures.photos).toHaveLength(1);
  });

  it('returns captures with one voice note', () => {
    const result = validateSessionCaptureV2(buildSessionCaptureV2());
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.session.captures.voiceNotes).toHaveLength(1);
  });

  it('returns captures with one placed object', () => {
    const result = validateSessionCaptureV2(buildSessionCaptureV2());
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.session.captures.placedObjects).toHaveLength(1);
  });

  it('returns captures with one floor plan snapshot', () => {
    const result = validateSessionCaptureV2(buildSessionCaptureV2());
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.session.captures.floorPlanSnapshots).toHaveLength(1);
  });
});

// ─── 2. Minimal fixture ───────────────────────────────────────────────────────

describe('validateSessionCaptureV2 — minimal fixture', () => {
  it('returns ok: true for empty captures', () => {
    const result = validateSessionCaptureV2(buildMinimalSessionCaptureV2());
    expect(result.ok).toBe(true);
  });

  it('has empty capture arrays', () => {
    const result = validateSessionCaptureV2(buildMinimalSessionCaptureV2());
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.session.captures.roomScans).toHaveLength(0);
    expect(result.session.captures.photos).toHaveLength(0);
    expect(result.session.captures.voiceNotes).toHaveLength(0);
    expect(result.session.captures.placedObjects).toHaveLength(0);
    expect(result.session.captures.floorPlanSnapshots).toHaveLength(0);
  });
});

// ─── 3. Wrong schemaVersion ───────────────────────────────────────────────────

describe('validateSessionCaptureV2 — wrong schemaVersion', () => {
  it('returns ok: false', () => {
    const input = { ...buildSessionCaptureV2(), schemaVersion: 'atlas.scan.session.v1' };
    const result = validateSessionCaptureV2(input);
    expect(result.ok).toBe(false);
  });

  it('returns an error mentioning schemaVersion', () => {
    const input = { ...buildSessionCaptureV2(), schemaVersion: 'wrong' };
    const result = validateSessionCaptureV2(input);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/schemaVersion/);
  });
});

// ─── 4. Missing schemaVersion ─────────────────────────────────────────────────

describe('validateSessionCaptureV2 — missing schemaVersion', () => {
  it('returns ok: false', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { schemaVersion: _sv, ...rest } = buildSessionCaptureV2();
    const result = validateSessionCaptureV2(rest);
    expect(result.ok).toBe(false);
  });
});

// ─── 5. Missing sessionId ─────────────────────────────────────────────────────

describe('validateSessionCaptureV2 — missing sessionId', () => {
  it('returns ok: false', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { sessionId: _sid, ...rest } = buildSessionCaptureV2();
    const result = validateSessionCaptureV2(rest);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/sessionId/);
  });
});

// ─── 6. Missing createdAt ─────────────────────────────────────────────────────

describe('validateSessionCaptureV2 — missing createdAt', () => {
  it('returns ok: false', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { createdAt: _ca, ...rest } = buildSessionCaptureV2();
    const result = validateSessionCaptureV2(rest);
    expect(result.ok).toBe(false);
  });
});

// ─── 7. Missing job.visitReference ───────────────────────────────────────────

describe('validateSessionCaptureV2 — missing job.visitReference', () => {
  it('returns ok: false', () => {
    const input = { ...buildSessionCaptureV2(), job: {} };
    const result = validateSessionCaptureV2(input);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/visitReference/);
  });
});

// ─── 8. Non-array captures fields ────────────────────────────────────────────

describe('validateSessionCaptureV2 — non-array captures', () => {
  it('rejects non-array roomScans', () => {
    const input = {
      ...buildSessionCaptureV2(),
      captures: { ...buildSessionCaptureV2().captures, roomScans: 'not-an-array' },
    };
    const result = validateSessionCaptureV2(input);
    expect(result.ok).toBe(false);
  });

  it('rejects non-array photos', () => {
    const input = {
      ...buildSessionCaptureV2(),
      captures: { ...buildSessionCaptureV2().captures, photos: null },
    };
    const result = validateSessionCaptureV2(input);
    expect(result.ok).toBe(false);
  });
});

// ─── 9. Invalid roomScan item ─────────────────────────────────────────────────

describe('validateSessionCaptureV2 — invalid roomScan item', () => {
  it('rejects roomScan without id', () => {
    const input = {
      ...buildSessionCaptureV2(),
      captures: {
        ...buildSessionCaptureV2().captures,
        roomScans: [{ capturedAt: '2025-06-01T09:05:00Z' }],
      },
    };
    const result = validateSessionCaptureV2(input);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/roomScans\[0\]\.id/);
  });

  it('rejects roomScan with invalid capturedAt', () => {
    const input = {
      ...buildSessionCaptureV2(),
      captures: {
        ...buildSessionCaptureV2().captures,
        roomScans: [{ id: 'r1', capturedAt: 'not-a-date' }],
      },
    };
    const result = validateSessionCaptureV2(input);
    expect(result.ok).toBe(false);
  });
});

// ─── 10. Invalid photo item ───────────────────────────────────────────────────

describe('validateSessionCaptureV2 — invalid photo item', () => {
  it('rejects photo without uri', () => {
    const input = {
      ...buildSessionCaptureV2(),
      captures: {
        ...buildSessionCaptureV2().captures,
        photos: [{ id: 'p1', capturedAt: '2025-06-01T09:10:00Z' }],
      },
    };
    const result = validateSessionCaptureV2(input);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/photos\[0\]\.uri/);
  });
});

// ─── 11. Invalid voiceNote item ───────────────────────────────────────────────

describe('validateSessionCaptureV2 — invalid voiceNote item', () => {
  it('rejects voiceNote without transcript field', () => {
    const input = {
      ...buildSessionCaptureV2(),
      captures: {
        ...buildSessionCaptureV2().captures,
        voiceNotes: [{ id: 'v1', startedAt: '2025-06-01T09:15:00Z' }],
      },
    };
    const result = validateSessionCaptureV2(input);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/transcript/);
  });
});

// ─── 12. Invalid placedObject kind ───────────────────────────────────────────

describe('validateSessionCaptureV2 — invalid placedObject kind', () => {
  it('rejects unknown kind', () => {
    const input = {
      ...buildSessionCaptureV2(),
      captures: {
        ...buildSessionCaptureV2().captures,
        placedObjects: [{ id: 'o1', kind: 'flux_capacitor', createdAt: '2025-06-01T09:20:00Z' }],
      },
    };
    const result = validateSessionCaptureV2(input);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/kind/);
  });
});

// ─── 13. Invalid placedObject createdAt ──────────────────────────────────────

describe('validateSessionCaptureV2 — invalid placedObject createdAt', () => {
  it('rejects non-ISO createdAt', () => {
    const input = {
      ...buildSessionCaptureV2(),
      captures: {
        ...buildSessionCaptureV2().captures,
        placedObjects: [{ id: 'o1', kind: 'boiler', createdAt: 'yesterday' }],
      },
    };
    const result = validateSessionCaptureV2(input);
    expect(result.ok).toBe(false);
  });
});

// ─── 14. Invalid floorPlanSnapshot ───────────────────────────────────────────

describe('validateSessionCaptureV2 — invalid floorPlanSnapshot', () => {
  it('rejects snapshot without uri', () => {
    const input = {
      ...buildSessionCaptureV2(),
      captures: {
        ...buildSessionCaptureV2().captures,
        floorPlanSnapshots: [{ id: 'fps1', capturedAt: '2025-06-01T09:25:00Z' }],
      },
    };
    const result = validateSessionCaptureV2(input);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/uri/);
  });
});

// ─── 15. TypeScript narrowing ─────────────────────────────────────────────────

describe('validateSessionCaptureV2 — TypeScript narrowing', () => {
  it('narrows to SessionCaptureV2 after ok: true check', () => {
    const result = validateSessionCaptureV2(buildSessionCaptureV2());
    if (!result.ok) throw new Error('Expected ok: true');
    // If this compiles, the type narrowing is working
    const session: SessionCaptureV2 = result.session;
    expect(session.schemaVersion).toBe('atlas.scan.session.v2');
  });
});

// ─── 16. job.appointmentId — presence and validation ─────────────────────────

describe('validateSessionCaptureV2 — job.appointmentId present in full fixture', () => {
  it('returns the correct appointmentId', () => {
    const result = validateSessionCaptureV2(buildSessionCaptureV2());
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.session.job.appointmentId).toBe('appt-fixture-001');
  });

  it('returns the correct visitReference alongside appointmentId', () => {
    const result = validateSessionCaptureV2(buildSessionCaptureV2());
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.session.job.visitReference).toBe('JOB-2025-0601');
  });
});

// ─── 17. Missing job.appointmentId ───────────────────────────────────────────

describe('validateSessionCaptureV2 — missing job.appointmentId', () => {
  it('returns ok: false when appointmentId is absent', () => {
    const input = {
      ...buildSessionCaptureV2(),
      job: { visitReference: 'JOB-2025-0601' },
    };
    const result = validateSessionCaptureV2(input);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/appointmentId/);
  });

  it('returns ok: false when appointmentId is an empty string', () => {
    const input = {
      ...buildSessionCaptureV2(),
      job: { visitReference: 'JOB-2025-0601', appointmentId: '' },
    };
    const result = validateSessionCaptureV2(input);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/appointmentId/);
  });
});
