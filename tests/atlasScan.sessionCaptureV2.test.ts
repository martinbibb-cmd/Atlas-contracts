/**
 * atlasScan.sessionCaptureV2.test.ts
 *
 * Tests for the canonical SessionCaptureV2 contract — types, validator, and
 * the cross-repo fixture.
 *
 * Coverage:
 *   1.  Valid fixture passes
 *   2.  Wrong schemaVersion rejected
 *   3.  Missing schemaVersion rejected
 *   4.  Missing sessionId rejected
 *   5.  Missing visitReference rejected
 *   6.  Missing capturedAt rejected
 *   7.  Missing exportedAt rejected
 *   8.  Missing deviceModel rejected
 *   9.  Missing roomScans rejected
 *   10. Missing photos rejected
 *   11. Missing voiceNotes rejected
 *   12. Missing objectPins rejected
 *   13. Missing floorPlanSnapshots rejected
 *   14. Missing qaFlags rejected
 *   15. Empty capture (all arrays empty) rejected
 *   16. Raw audioUri in voiceNote rejected
 *   17. Raw audioRef in voiceNote rejected
 *   18. Raw audioData in voiceNote rejected
 *   19. Bad roomScan (missing roomId) rejected
 *   20. Bad photo (missing uri) rejected
 *   21. Bad voiceNote (missing text) rejected
 *   22. Bad objectPin (invalid kind) rejected
 *   23. Bad floorPlanSnapshot (missing floorIndex) rejected
 *   24. Bad qaFlag (invalid kind) rejected
 *   25. Orphan: photo.roomId references non-existent roomScan rejected
 *   26. Orphan: photo.objectPinId references non-existent objectPin rejected
 *   27. Orphan: objectPin.roomId references non-existent roomScan rejected
 *   28. Orphan: objectPin.linkedPhotoIds references non-existent photo rejected
 *   29. Orphan: objectPin.linkedNoteIds references non-existent voiceNote rejected
 *   30. Orphan: voiceNote.roomId references non-existent roomScan rejected
 *   31. Orphan: voiceNote.objectPinId references non-existent objectPin rejected
 *   32. Orphan: qaFlag.roomId references non-existent roomScan rejected
 *   33. Orphan: qaFlag.objectPinId references non-existent objectPin rejected
 *   34. TypeScript narrowing: session is typed as SessionCaptureV2 after ok: true
 *   35. Fixture round-trip: core field names are unchanged
 *   36. Fixture: sessionId matches expected value
 *   37. Fixture: visitReference matches expected value
 *   38. Fixture: roomScans array is non-empty
 *   39. Fixture: voiceNotes have no audioUri, audioRef, or audioData fields
 *   40. Non-JSON (null) input rejected
 *   41. Non-JSON (array) input rejected
 */

import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
import { validateSessionCaptureV2 } from '../src/atlasScan/sessionCaptureV2.schema';
import type { SessionCaptureV2 } from '../src/atlasScan/sessionCaptureV2.types';

// ─── Load canonical fixture ───────────────────────────────────────────────────

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fixture: Record<string, unknown> = require('../fixtures/session_capture_v2_example.json') as Record<string, unknown>;

// ─── Fixture helpers ──────────────────────────────────────────────────────────

function cloneFixture(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { ...fixture, ...overrides };
}

function cloneFixtureWithout(...keys: string[]): Record<string, unknown> {
  const copy = { ...fixture };
  for (const key of keys) {
    delete copy[key];
  }
  return copy;
}

// ─── 1. Valid fixture passes ──────────────────────────────────────────────────

describe('validateSessionCaptureV2 — fixture', () => {
  it('1. valid fixture passes', () => {
    const result = validateSessionCaptureV2(fixture);
    if (!result.ok) throw new Error(result.error);
    expect(result.ok).toBe(true);
  });

  it('35. fixture round-trip: schemaVersion field name and value are unchanged', () => {
    const result = validateSessionCaptureV2(fixture);
    if (!result.ok) throw new Error(result.error);
    expect(result.session.schemaVersion).toBe('atlas.scan.session.v2');
  });

  it('36. fixture: sessionId matches expected value', () => {
    const result = validateSessionCaptureV2(fixture);
    if (!result.ok) throw new Error(result.error);
    expect(result.session.sessionId).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
  });

  it('37. fixture: visitReference matches expected value', () => {
    const result = validateSessionCaptureV2(fixture);
    if (!result.ok) throw new Error(result.error);
    expect(result.session.visitReference).toBe('visit-2025-06-15-smith-road');
  });

  it('38. fixture: roomScans array is non-empty', () => {
    const result = validateSessionCaptureV2(fixture);
    if (!result.ok) throw new Error(result.error);
    expect(result.session.roomScans.length).toBeGreaterThan(0);
  });

  it('39. fixture: voiceNotes have no raw audio fields', () => {
    const result = validateSessionCaptureV2(fixture);
    if (!result.ok) throw new Error(result.error);
    for (const note of result.session.voiceNotes) {
      const raw = note as Record<string, unknown>;
      expect(raw['audioUri']).toBeUndefined();
      expect(raw['audioRef']).toBeUndefined();
      expect(raw['audioData']).toBeUndefined();
    }
  });
});

// ─── 2–3. schemaVersion ───────────────────────────────────────────────────────

describe('validateSessionCaptureV2 — schemaVersion', () => {
  it('2. wrong schemaVersion rejected', () => {
    const result = validateSessionCaptureV2(cloneFixture({ schemaVersion: 'atlas.scan.session.v1' }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('schemaVersion');
  });

  it('3. missing schemaVersion rejected', () => {
    const result = validateSessionCaptureV2(cloneFixtureWithout('schemaVersion'));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('schemaVersion');
  });
});

// ─── 4–8. Required top-level fields ──────────────────────────────────────────

describe('validateSessionCaptureV2 — missing required top-level fields', () => {
  it('4. missing sessionId rejected', () => {
    const result = validateSessionCaptureV2(cloneFixtureWithout('sessionId'));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('sessionId');
  });

  it('5. missing visitReference rejected', () => {
    const result = validateSessionCaptureV2(cloneFixtureWithout('visitReference'));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('visitReference');
  });

  it('6. missing capturedAt rejected', () => {
    const result = validateSessionCaptureV2(cloneFixtureWithout('capturedAt'));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('capturedAt');
  });

  it('7. missing exportedAt rejected', () => {
    const result = validateSessionCaptureV2(cloneFixtureWithout('exportedAt'));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('exportedAt');
  });

  it('8. missing deviceModel rejected', () => {
    const result = validateSessionCaptureV2(cloneFixtureWithout('deviceModel'));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('deviceModel');
  });
});

// ─── 9–14. Missing required array fields ─────────────────────────────────────

describe('validateSessionCaptureV2 — missing required array fields', () => {
  it('9. missing roomScans rejected', () => {
    const result = validateSessionCaptureV2(cloneFixtureWithout('roomScans'));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('roomScans');
  });

  it('10. missing photos rejected', () => {
    const result = validateSessionCaptureV2(cloneFixtureWithout('photos'));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('photos');
  });

  it('11. missing voiceNotes rejected', () => {
    const result = validateSessionCaptureV2(cloneFixtureWithout('voiceNotes'));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('voiceNotes');
  });

  it('12. missing objectPins rejected', () => {
    const result = validateSessionCaptureV2(cloneFixtureWithout('objectPins'));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('objectPins');
  });

  it('13. missing floorPlanSnapshots rejected', () => {
    const result = validateSessionCaptureV2(cloneFixtureWithout('floorPlanSnapshots'));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('floorPlanSnapshots');
  });

  it('14. missing qaFlags rejected', () => {
    const result = validateSessionCaptureV2(cloneFixtureWithout('qaFlags'));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('qaFlags');
  });
});

// ─── 15. Empty capture ────────────────────────────────────────────────────────

describe('validateSessionCaptureV2 — empty capture', () => {
  it('15. empty capture (all arrays empty) rejected', () => {
    const result = validateSessionCaptureV2(
      cloneFixture({
        roomScans: [],
        photos: [],
        voiceNotes: [],
        objectPins: [],
        floorPlanSnapshots: [],
        qaFlags: [],
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('empty');
  });
});

// ─── 16–18. Raw audio fields ──────────────────────────────────────────────────

describe('validateSessionCaptureV2 — raw audio in voiceNotes rejected', () => {
  const minimalNote = {
    noteId: 'note-001',
    text: 'Some transcript text',
    capturedAt: '2025-06-15T09:00:00Z',
  };

  it('16. audioUri in voiceNote rejected', () => {
    const result = validateSessionCaptureV2(
      cloneFixture({
        voiceNotes: [{ ...minimalNote, audioUri: 'file:///recordings/note-001.m4a' }],
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('audioUri');
  });

  it('17. audioRef in voiceNote rejected', () => {
    const result = validateSessionCaptureV2(
      cloneFixture({
        voiceNotes: [{ ...minimalNote, audioRef: 'note-001.m4a' }],
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('audioRef');
  });

  it('18. audioData in voiceNote rejected', () => {
    const result = validateSessionCaptureV2(
      cloneFixture({
        voiceNotes: [{ ...minimalNote, audioData: 'base64encodedaudio==' }],
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('audioData');
  });
});

// ─── 19–24. Bad array items ───────────────────────────────────────────────────

describe('validateSessionCaptureV2 — bad array items rejected', () => {
  it('19. bad roomScan (missing roomId) rejected', () => {
    const result = validateSessionCaptureV2(
      cloneFixture({
        roomScans: [{ label: 'Kitchen', capturedAt: '2025-06-15T09:00:00Z' }],
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('roomId');
  });

  it('20. bad photo (missing uri) rejected', () => {
    const result = validateSessionCaptureV2(
      cloneFixture({
        photos: [{ photoId: 'photo-001', capturedAt: '2025-06-15T09:00:00Z' }],
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('uri');
  });

  it('21. bad voiceNote (missing text field) rejected', () => {
    const result = validateSessionCaptureV2(
      cloneFixture({
        voiceNotes: [{ noteId: 'note-001', capturedAt: '2025-06-15T09:00:00Z' }],
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('text');
  });

  it('22. bad objectPin (invalid kind) rejected', () => {
    const result = validateSessionCaptureV2(
      cloneFixture({
        objectPins: [
          {
            pinId: 'pin-001',
            kind: 'unknown_thing',
            linkedPhotoIds: [],
            linkedNoteIds: [],
            createdAt: '2025-06-15T09:00:00Z',
          },
        ],
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('kind');
  });

  it('23. bad floorPlanSnapshot (missing floorIndex) rejected', () => {
    const result = validateSessionCaptureV2(
      cloneFixture({
        floorPlanSnapshots: [
          {
            snapshotId: 'snap-001',
            uri: 'floor-plans/ground.png',
            capturedAt: '2025-06-15T10:00:00Z',
          },
        ],
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('floorIndex');
  });

  it('24. bad qaFlag (invalid kind) rejected', () => {
    const result = validateSessionCaptureV2(
      cloneFixture({
        qaFlags: [
          {
            flagId: 'flag-001',
            kind: 'not_a_real_kind',
            message: 'Something is wrong',
            createdAt: '2025-06-15T09:00:00Z',
          },
        ],
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('kind');
  });
});

// ─── 25–33. Orphan reference checks ──────────────────────────────────────────

const baseRoom = {
  roomId: 'room-001',
  label: 'Kitchen',
  capturedAt: '2025-06-15T09:00:00Z',
};

const basePhoto = {
  photoId: 'photo-001',
  uri: 'photos/photo-001.jpg',
  capturedAt: '2025-06-15T09:00:00Z',
};

const baseNote = {
  noteId: 'note-001',
  text: 'Transcript text',
  capturedAt: '2025-06-15T09:00:00Z',
};

const basePin = {
  pinId: 'pin-001',
  kind: 'boiler',
  linkedPhotoIds: [],
  linkedNoteIds: [],
  createdAt: '2025-06-15T09:00:00Z',
};

describe('validateSessionCaptureV2 — orphan reference checks', () => {
  it('25. photo.roomId references non-existent roomScan rejected', () => {
    const result = validateSessionCaptureV2(
      cloneFixture({
        roomScans: [baseRoom],
        photos: [{ ...basePhoto, roomId: 'room-does-not-exist' }],
        voiceNotes: [],
        objectPins: [],
        floorPlanSnapshots: [],
        qaFlags: [],
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('room-does-not-exist');
  });

  it('26. photo.objectPinId references non-existent objectPin rejected', () => {
    const result = validateSessionCaptureV2(
      cloneFixture({
        roomScans: [baseRoom],
        photos: [{ ...basePhoto, roomId: 'room-001', objectPinId: 'pin-does-not-exist' }],
        voiceNotes: [],
        objectPins: [],
        floorPlanSnapshots: [],
        qaFlags: [],
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('pin-does-not-exist');
  });

  it('27. objectPin.roomId references non-existent roomScan rejected', () => {
    const result = validateSessionCaptureV2(
      cloneFixture({
        roomScans: [baseRoom],
        photos: [basePhoto],
        voiceNotes: [],
        objectPins: [{ ...basePin, roomId: 'room-does-not-exist' }],
        floorPlanSnapshots: [],
        qaFlags: [],
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('room-does-not-exist');
  });

  it('28. objectPin.linkedPhotoIds references non-existent photo rejected', () => {
    const result = validateSessionCaptureV2(
      cloneFixture({
        roomScans: [baseRoom],
        photos: [basePhoto],
        voiceNotes: [],
        objectPins: [{ ...basePin, linkedPhotoIds: ['photo-does-not-exist'] }],
        floorPlanSnapshots: [],
        qaFlags: [],
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('photo-does-not-exist');
  });

  it('29. objectPin.linkedNoteIds references non-existent voiceNote rejected', () => {
    const result = validateSessionCaptureV2(
      cloneFixture({
        roomScans: [baseRoom],
        photos: [basePhoto],
        voiceNotes: [baseNote],
        objectPins: [{ ...basePin, linkedNoteIds: ['note-does-not-exist'] }],
        floorPlanSnapshots: [],
        qaFlags: [],
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('note-does-not-exist');
  });

  it('30. voiceNote.roomId references non-existent roomScan rejected', () => {
    const result = validateSessionCaptureV2(
      cloneFixture({
        roomScans: [baseRoom],
        photos: [basePhoto],
        voiceNotes: [{ ...baseNote, roomId: 'room-does-not-exist' }],
        objectPins: [],
        floorPlanSnapshots: [],
        qaFlags: [],
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('room-does-not-exist');
  });

  it('31. voiceNote.objectPinId references non-existent objectPin rejected', () => {
    const result = validateSessionCaptureV2(
      cloneFixture({
        roomScans: [baseRoom],
        photos: [basePhoto],
        voiceNotes: [{ ...baseNote, objectPinId: 'pin-does-not-exist' }],
        objectPins: [],
        floorPlanSnapshots: [],
        qaFlags: [],
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('pin-does-not-exist');
  });

  it('32. qaFlag.roomId references non-existent roomScan rejected', () => {
    const result = validateSessionCaptureV2(
      cloneFixture({
        roomScans: [baseRoom],
        photos: [basePhoto],
        voiceNotes: [],
        objectPins: [],
        floorPlanSnapshots: [],
        qaFlags: [
          {
            flagId: 'flag-001',
            kind: 'low_confidence',
            message: 'Issues',
            roomId: 'room-does-not-exist',
            createdAt: '2025-06-15T09:00:00Z',
          },
        ],
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('room-does-not-exist');
  });

  it('33. qaFlag.objectPinId references non-existent objectPin rejected', () => {
    const result = validateSessionCaptureV2(
      cloneFixture({
        roomScans: [baseRoom],
        photos: [basePhoto],
        voiceNotes: [],
        objectPins: [],
        floorPlanSnapshots: [],
        qaFlags: [
          {
            flagId: 'flag-001',
            kind: 'low_confidence',
            message: 'Issues',
            objectPinId: 'pin-does-not-exist',
            createdAt: '2025-06-15T09:00:00Z',
          },
        ],
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('pin-does-not-exist');
  });
});

// ─── 34. TypeScript narrowing ─────────────────────────────────────────────────

describe('validateSessionCaptureV2 — TypeScript narrowing', () => {
  it('34. session is typed as SessionCaptureV2 after ok: true', () => {
    const result = validateSessionCaptureV2(fixture);
    if (!result.ok) throw new Error(result.error);
    // If TypeScript narrows correctly, this assignment compiles without cast.
    const session: SessionCaptureV2 = result.session;
    expect(session.schemaVersion).toBe('atlas.scan.session.v2');
  });
});

// ─── 40–41. Non-JSON inputs ───────────────────────────────────────────────────

describe('validateSessionCaptureV2 — non-JSON inputs', () => {
  it('40. null input rejected', () => {
    const result = validateSessionCaptureV2(null);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('non-null object');
  });

  it('41. array input rejected', () => {
    const result = validateSessionCaptureV2([fixture]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('non-null object');
  });
});
