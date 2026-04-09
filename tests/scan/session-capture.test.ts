/**
 * session-capture.test.ts
 *
 * Tests for the SessionCaptureV1 validation boundary.
 *
 * Coverage:
 *   1. Valid session capture accepted
 *   2. Unsupported version rejected
 *   3. Missing version rejected
 *   4. Null / non-object inputs rejected
 *   5. Missing required top-level fields rejected
 *   6. Invalid room entries rejected
 *   7. Invalid object entries rejected
 *   8. Invalid photo entries rejected
 *   9. Invalid audio structure rejected
 *  10. Invalid note marker entries rejected
 *  11. Invalid event entries rejected
 *  12. Minimal valid session (empty arrays, no optional fields)
 *  13. TypeScript type narrowing — session is typed as SessionCaptureV1 after validation
 */

import { describe, it, expect } from 'vitest';
import { validateSessionCapture } from '../../src/scan/validation';
import type { SessionCaptureV1 } from '../../src/scan/types';

import validSessionCapture from '../../fixtures/valid-session-capture.json';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal structurally valid SessionCaptureV1 payload. */
function minimalSession(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    version: '1.0',
    sessionId: 'test-session-001',
    startedAt: '2025-06-01T09:00:00Z',
    updatedAt: '2025-06-01T09:00:00Z',
    status: 'active',
    rooms: [],
    objects: [],
    photos: [],
    audio: { mode: 'continuous', segments: [] },
    notes: [],
    events: [],
    ...overrides,
  };
}

// ─── 1. Valid session capture fixture ─────────────────────────────────────────

describe('validateSessionCapture — valid fixture', () => {
  it('returns ok: true', () => {
    const result = validateSessionCapture(validSessionCapture);
    expect(result.ok).toBe(true);
  });

  it('returns the session with the correct sessionId', () => {
    const result = validateSessionCapture(validSessionCapture);
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.session.sessionId).toBe('session-fixture-001');
  });

  it('returns session with version "1.0"', () => {
    const result = validateSessionCapture(validSessionCapture);
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.session.version).toBe('1.0');
  });

  it('returns correct room count', () => {
    const result = validateSessionCapture(validSessionCapture);
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.session.rooms).toHaveLength(2);
  });

  it('returns correct object count', () => {
    const result = validateSessionCapture(validSessionCapture);
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.session.objects).toHaveLength(2);
  });

  it('returns correct photo count', () => {
    const result = validateSessionCapture(validSessionCapture);
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.session.photos).toHaveLength(3);
  });

  it('returns continuous audio mode', () => {
    const result = validateSessionCapture(validSessionCapture);
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.session.audio.mode).toBe('continuous');
  });

  it('returns correct audio segment count', () => {
    const result = validateSessionCapture(validSessionCapture);
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.session.audio.segments).toHaveLength(2);
  });

  it('returns correct note count', () => {
    const result = validateSessionCapture(validSessionCapture);
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.session.notes).toHaveLength(2);
  });

  it('returns correct event count', () => {
    const result = validateSessionCapture(validSessionCapture);
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.session.events).toHaveLength(10);
  });

  it('returns the property address', () => {
    const result = validateSessionCapture(validSessionCapture);
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.session.property?.address).toBe('14 Elm Street');
  });

  it('returns device model', () => {
    const result = validateSessionCapture(validSessionCapture);
    if (!result.ok) throw new Error('Expected ok: true');
    expect(result.session.device?.model).toBe('iPhone 15 Pro');
  });
});

// ─── 2. Unsupported version ────────────────────────────────────────────────────

describe('validateSessionCapture — unsupported version', () => {
  it('returns ok: false', () => {
    const result = validateSessionCapture(minimalSession({ version: '99.0' }));
    expect(result.ok).toBe(false);
  });

  it('includes the unsupported version in the error message', () => {
    const result = validateSessionCapture(minimalSession({ version: '99.0' }));
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.errors[0]).toContain('99.0');
  });

  it('lists supported versions in the error message', () => {
    const result = validateSessionCapture(minimalSession({ version: '99.0' }));
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.errors[0]).toContain('1.0');
  });
});

// ─── 3. Missing version ────────────────────────────────────────────────────────

describe('validateSessionCapture — missing version', () => {
  it('returns ok: false when version is absent', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { version: _v, ...noVersion } = minimalSession();
    const result = validateSessionCapture(noVersion);
    expect(result.ok).toBe(false);
  });

  it('error message mentions "version"', () => {
    const { version: _v, ...noVersion } = minimalSession();
    const result = validateSessionCapture(noVersion);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.errors[0]).toContain('version');
  });

  it('returns ok: false when version is a number', () => {
    const result = validateSessionCapture(minimalSession({ version: 1 }));
    expect(result.ok).toBe(false);
  });
});

// ─── 4. Null / non-object inputs ──────────────────────────────────────────────

describe('validateSessionCapture — null / non-object inputs', () => {
  it('rejects null', () => {
    expect(validateSessionCapture(null).ok).toBe(false);
  });

  it('rejects a string', () => {
    expect(validateSessionCapture('not-a-session').ok).toBe(false);
  });

  it('rejects an array', () => {
    expect(validateSessionCapture([]).ok).toBe(false);
  });

  it('rejects undefined', () => {
    expect(validateSessionCapture(undefined).ok).toBe(false);
  });

  it('rejects a number', () => {
    expect(validateSessionCapture(42).ok).toBe(false);
  });
});

// ─── 5. Missing required top-level fields ─────────────────────────────────────

describe('validateSessionCapture — missing required fields', () => {
  it('rejects when sessionId is absent', () => {
    const { sessionId: _s, ...payload } = minimalSession() as Record<string, unknown>;
    const result = validateSessionCapture(payload);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.errors.join(' ')).toContain('sessionId');
  });

  it('rejects when startedAt is absent', () => {
    const { startedAt: _s, ...payload } = minimalSession() as Record<string, unknown>;
    const result = validateSessionCapture(payload);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.errors.join(' ')).toContain('startedAt');
  });

  it('rejects when updatedAt is absent', () => {
    const { updatedAt: _u, ...payload } = minimalSession() as Record<string, unknown>;
    const result = validateSessionCapture(payload);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.errors.join(' ')).toContain('updatedAt');
  });

  it('rejects when status is invalid', () => {
    const result = validateSessionCapture(minimalSession({ status: 'unknown_status' }));
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.errors.join(' ')).toContain('status');
  });

  it('rejects when rooms is not an array', () => {
    const result = validateSessionCapture(minimalSession({ rooms: 'not-an-array' }));
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.errors.join(' ')).toContain('rooms');
  });

  it('rejects when audio is missing', () => {
    const { audio: _a, ...payload } = minimalSession() as Record<string, unknown>;
    const result = validateSessionCapture(payload);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.errors.join(' ')).toContain('audio');
  });
});

// ─── 6. Invalid room entries ──────────────────────────────────────────────────

describe('validateSessionCapture — invalid room', () => {
  it('rejects room missing roomId', () => {
    const result = validateSessionCapture(
      minimalSession({ rooms: [{ label: 'Kitchen', status: 'active' }] })
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.errors.join(' ')).toContain('roomId');
  });

  it('rejects room with invalid status', () => {
    const result = validateSessionCapture(
      minimalSession({ rooms: [{ roomId: 'r1', label: 'Kitchen', status: 'bad' }] })
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.errors.join(' ')).toContain('status');
  });
});

// ─── 7. Invalid object entries ────────────────────────────────────────────────

describe('validateSessionCapture — invalid object', () => {
  it('rejects object missing objectId', () => {
    const result = validateSessionCapture(
      minimalSession({
        objects: [{ type: 'boiler', status: 'placed', photoIds: [], noteMarkerIds: [] }],
      })
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.errors.join(' ')).toContain('objectId');
  });

  it('rejects object with invalid type', () => {
    const result = validateSessionCapture(
      minimalSession({
        objects: [{ objectId: 'o1', type: 'invalid_type', status: 'placed', photoIds: [], noteMarkerIds: [] }],
      })
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.errors.join(' ')).toContain('type');
  });

  it('rejects object with invalid status', () => {
    const result = validateSessionCapture(
      minimalSession({
        objects: [{ objectId: 'o1', type: 'boiler', status: 'unknown', photoIds: [], noteMarkerIds: [] }],
      })
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.errors.join(' ')).toContain('status');
  });

  it('rejects object with missing photoIds', () => {
    const result = validateSessionCapture(
      minimalSession({
        objects: [{ objectId: 'o1', type: 'boiler', status: 'placed', noteMarkerIds: [] }],
      })
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.errors.join(' ')).toContain('photoIds');
  });
});

// ─── 8. Invalid photo entries ─────────────────────────────────────────────────

describe('validateSessionCapture — invalid photo', () => {
  it('rejects photo missing photoId', () => {
    const result = validateSessionCapture(
      minimalSession({
        photos: [{ uri: 'file://x.jpg', createdAt: '2025-06-01T09:00:00Z', scope: 'session' }],
      })
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.errors.join(' ')).toContain('photoId');
  });

  it('rejects photo with invalid scope', () => {
    const result = validateSessionCapture(
      minimalSession({
        photos: [{ photoId: 'p1', uri: 'file://x.jpg', createdAt: '2025-06-01T09:00:00Z', scope: 'invalid' }],
      })
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.errors.join(' ')).toContain('scope');
  });
});

// ─── 9. Invalid audio structure ───────────────────────────────────────────────

describe('validateSessionCapture — invalid audio', () => {
  it('rejects audio with wrong mode', () => {
    const result = validateSessionCapture(
      minimalSession({ audio: { mode: 'push_to_talk', segments: [] } })
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.errors.join(' ')).toContain('mode');
  });

  it('rejects audio with missing segments', () => {
    const result = validateSessionCapture(
      minimalSession({ audio: { mode: 'continuous' } })
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.errors.join(' ')).toContain('segments');
  });

  it('rejects audio segment missing segmentId', () => {
    const result = validateSessionCapture(
      minimalSession({
        audio: {
          mode: 'continuous',
          segments: [{ uri: 'file://a.m4a', startedAt: '2025-06-01T09:00:00Z', endedAt: '2025-06-01T09:10:00Z' }],
        },
      })
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.errors.join(' ')).toContain('segmentId');
  });

  it('rejects audio transcription with invalid status', () => {
    const result = validateSessionCapture(
      minimalSession({
        audio: {
          mode: 'continuous',
          segments: [],
          transcription: { status: 'unknown_status' },
        },
      })
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.errors.join(' ')).toContain('transcription');
  });
});

// ─── 10. Invalid note marker entries ─────────────────────────────────────────

describe('validateSessionCapture — invalid note marker', () => {
  it('rejects note missing markerId', () => {
    const result = validateSessionCapture(
      minimalSession({ notes: [{ createdAt: '2025-06-01T09:00:00Z' }] })
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.errors.join(' ')).toContain('markerId');
  });

  it('rejects note with invalid category', () => {
    const result = validateSessionCapture(
      minimalSession({
        notes: [{ markerId: 'm1', createdAt: '2025-06-01T09:00:00Z', category: 'bad_category' }],
      })
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.errors.join(' ')).toContain('category');
  });
});

// ─── 11. Invalid event entries ────────────────────────────────────────────────

describe('validateSessionCapture — invalid event', () => {
  it('rejects event missing eventId', () => {
    const result = validateSessionCapture(
      minimalSession({ events: [{ type: 'room_assigned', timestamp: '2025-06-01T09:01:00Z' }] })
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.errors.join(' ')).toContain('eventId');
  });

  it('rejects event with invalid type', () => {
    const result = validateSessionCapture(
      minimalSession({
        events: [{ eventId: 'e1', type: 'bad_type', timestamp: '2025-06-01T09:01:00Z' }],
      })
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.errors.join(' ')).toContain('type');
  });

  it('rejects event missing timestamp', () => {
    const result = validateSessionCapture(
      minimalSession({ events: [{ eventId: 'e1', type: 'room_assigned' }] })
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.errors.join(' ')).toContain('timestamp');
  });
});

// ─── 12. Minimal valid session ────────────────────────────────────────────────

describe('validateSessionCapture — minimal valid session', () => {
  it('accepts a session with all empty arrays and no optional fields', () => {
    const result = validateSessionCapture(minimalSession());
    expect(result.ok).toBe(true);
  });

  it('accepts all valid status values', () => {
    for (const status of ['active', 'review', 'ready', 'synced'] as const) {
      const result = validateSessionCapture(minimalSession({ status }));
      expect(result.ok).toBe(true);
    }
  });

  it('accepts all valid object types', () => {
    for (const type of [
      'radiator', 'boiler', 'cylinder', 'thermostat',
      'flue', 'pipe', 'consumer_unit', 'other',
    ] as const) {
      const result = validateSessionCapture(
        minimalSession({
          objects: [{ objectId: 'o1', type, status: 'placed', photoIds: [], noteMarkerIds: [] }],
        })
      );
      expect(result.ok).toBe(true);
    }
  });

  it('accepts all valid note marker categories', () => {
    for (const category of [
      'constraint', 'observation', 'preference', 'risk', 'follow_up',
    ] as const) {
      const result = validateSessionCapture(
        minimalSession({
          notes: [{ markerId: 'm1', createdAt: '2025-06-01T09:00:00Z', category }],
        })
      );
      expect(result.ok).toBe(true);
    }
  });

  it('accepts all valid event types', () => {
    for (const type of [
      'room_assigned', 'object_added', 'photo_taken', 'note_marker_added', 'room_finished',
    ] as const) {
      const result = validateSessionCapture(
        minimalSession({
          events: [{ eventId: 'e1', type, timestamp: '2025-06-01T09:01:00Z' }],
        })
      );
      expect(result.ok).toBe(true);
    }
  });

  it('accepts all valid photo scopes', () => {
    for (const scope of ['session', 'room', 'object'] as const) {
      const result = validateSessionCapture(
        minimalSession({
          photos: [{ photoId: 'p1', uri: 'file://x.jpg', createdAt: '2025-06-01T09:00:00Z', scope }],
        })
      );
      expect(result.ok).toBe(true);
    }
  });
});

// ─── 13. TypeScript type narrowing ────────────────────────────────────────────

describe('validateSessionCapture — TypeScript type narrowing', () => {
  it('session is typed as SessionCaptureV1 after validation (compile-time proof)', () => {
    const result = validateSessionCapture(validSessionCapture);
    if (!result.ok) throw new Error('Expected ok: true');

    // This assignment would be a compile error if session were not typed as
    // SessionCaptureV1 — it is the proof that assertIsSessionCaptureV1 did its job.
    const typed: SessionCaptureV1 = result.session;
    expect(typed.version).toBe('1.0');
    expect(typeof typed.sessionId).toBe('string');
    expect(Array.isArray(typed.rooms)).toBe(true);
    expect(Array.isArray(typed.objects)).toBe(true);
    expect(Array.isArray(typed.photos)).toBe(true);
    expect(typed.audio.mode).toBe('continuous');
    expect(Array.isArray(typed.notes)).toBe(true);
    expect(Array.isArray(typed.events)).toBe(true);
  });
});
