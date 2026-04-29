/**
 * atlasScan.sessionCaptureV1.test.ts
 *
 * Tests for the canonical SessionCaptureV1 contract — types, validator, and
 * fixture builders.
 *
 * Coverage:
 *   1.  Full valid capture accepted
 *   2.  Partial room capture (no spatial model) accepted
 *   3.  Photo-only capture (no rooms) accepted
 *   4.  Transcript-only capture accepted
 *   5.  Flue clearance capture accepted
 *   6.  Invalid: wrong schemaVersion rejected
 *   7.  Invalid: missing schemaVersion rejected
 *   8.  Invalid: missing visitId rejected
 *   9.  Invalid: missing sessionId rejected
 *   10. Invalid: bad status rejected
 *   11. Invalid: bad captureStartedAt rejected
 *   12. Invalid: bad room (missing roomId) rejected
 *   13. Invalid: bad room status rejected
 *   14. Invalid: bad spatialModel (missing coordinateConvention) rejected
 *   15. Invalid: bad objectMarker kind rejected
 *   16. Invalid: bad objectMarker createdAt rejected
 *   17. Invalid: bad objectMarker provenance rejected
 *   18. Invalid: bad photo (missing uri) rejected
 *   19. Invalid: bad photo provenance confidence rejected
 *   20. Invalid: bad transcript status rejected
 *   21. Invalid: bad note (missing noteId) rejected
 *   22. Invalid: bad timeline event type rejected
 *   23. Invalid: bad assetManifest entry (missing uri) rejected
 *   24. Invalid: bad review status rejected
 *   25. Orphan: photo.roomId references non-existent room rejected
 *   26. Orphan: photo.objectMarkerId references non-existent marker rejected
 *   27. Orphan: objectMarker.roomId references non-existent room rejected
 *   28. Orphan: objectMarker.linkedPhotoIds references non-existent photo rejected
 *   29. Orphan: objectMarker.linkedNoteIds references non-existent note rejected
 *   30. Orphan: note.roomId references non-existent room rejected
 *   31. Orphan: note.objectMarkerId references non-existent marker rejected
 *   32. TypeScript narrowing: session is typed as SessionCaptureV1 after ok: true
 *   33. Full fixture has expected visitId and sessionId
 *   34. Full fixture has spatial model with correct coordinate convention
 *   35. Full fixture object markers have provenance
 *   36. Photo-only fixture validates with empty rooms and objectMarkers
 *   37. Transcript-only fixture validates with complete transcript text
 */

import { describe, it, expect } from 'vitest';
import { validateSessionCaptureV1 } from '../src/atlasScan/sessionCaptureV1.schema';
import {
  buildFullSessionCaptureV1,
  buildPartialRoomCapture,
  buildPhotoOnlyCapture,
  buildTranscriptOnlyCapture,
  buildFlueClearanceCapture,
  buildInvalidMissingVisitId,
  buildInvalidMissingSessionId,
  buildInvalidOrphanPhotoRoom,
  buildInvalidOrphanMarkerPhoto,
} from '../src/atlasScan/sessionCaptureV1.fixtures';
import type { SessionCaptureV1 } from '../src/atlasScan/sessionCaptureV1.types';

// ─── 1. Full valid capture ────────────────────────────────────────────────────

describe('validateSessionCaptureV1 — full valid capture', () => {
  it('returns ok: true', () => {
    const result = validateSessionCaptureV1(buildFullSessionCaptureV1());
    expect(result.ok).toBe(true);
  });

  it('returns the correct schemaVersion', () => {
    const result = validateSessionCaptureV1(buildFullSessionCaptureV1());
    if (!result.ok) throw new Error(result.error);
    expect(result.session.schemaVersion).toBe('atlas.scan.session.v1');
  });

  it('returns the correct visitId', () => {
    const result = validateSessionCaptureV1(buildFullSessionCaptureV1());
    if (!result.ok) throw new Error(result.error);
    expect(result.session.visitId).toBe('visit-fixture-full-001');
  });

  it('returns the correct sessionId', () => {
    const result = validateSessionCaptureV1(buildFullSessionCaptureV1());
    if (!result.ok) throw new Error(result.error);
    expect(result.session.sessionId).toBe('session-fixture-full-001');
  });

  it('returns two rooms', () => {
    const result = validateSessionCaptureV1(buildFullSessionCaptureV1());
    if (!result.ok) throw new Error(result.error);
    expect(result.session.rooms).toHaveLength(2);
  });

  it('returns two object markers', () => {
    const result = validateSessionCaptureV1(buildFullSessionCaptureV1());
    if (!result.ok) throw new Error(result.error);
    expect(result.session.objectMarkers).toHaveLength(2);
  });

  it('returns three photos', () => {
    const result = validateSessionCaptureV1(buildFullSessionCaptureV1());
    if (!result.ok) throw new Error(result.error);
    expect(result.session.photos).toHaveLength(3);
  });

  it('returns a complete transcript', () => {
    const result = validateSessionCaptureV1(buildFullSessionCaptureV1());
    if (!result.ok) throw new Error(result.error);
    expect(result.session.transcript?.status).toBe('complete');
  });

  it('returns one note', () => {
    const result = validateSessionCaptureV1(buildFullSessionCaptureV1());
    if (!result.ok) throw new Error(result.error);
    expect(result.session.notes).toHaveLength(1);
  });

  it('returns timeline events', () => {
    const result = validateSessionCaptureV1(buildFullSessionCaptureV1());
    if (!result.ok) throw new Error(result.error);
    expect(result.session.timelineEvents.length).toBeGreaterThan(0);
  });

  it('returns a non-empty asset manifest', () => {
    const result = validateSessionCaptureV1(buildFullSessionCaptureV1());
    if (!result.ok) throw new Error(result.error);
    expect(result.session.assetManifest.length).toBeGreaterThan(0);
  });
});

// ─── 2. Partial room capture ──────────────────────────────────────────────────

describe('validateSessionCaptureV1 — partial room capture', () => {
  it('returns ok: true', () => {
    const result = validateSessionCaptureV1(buildPartialRoomCapture());
    expect(result.ok).toBe(true);
  });

  it('has no spatialModel', () => {
    const result = validateSessionCaptureV1(buildPartialRoomCapture());
    if (!result.ok) throw new Error(result.error);
    expect(result.session.spatialModel).toBeUndefined();
  });

  it('has one room', () => {
    const result = validateSessionCaptureV1(buildPartialRoomCapture());
    if (!result.ok) throw new Error(result.error);
    expect(result.session.rooms).toHaveLength(1);
  });
});

// ─── 3. Photo-only capture ────────────────────────────────────────────────────

describe('validateSessionCaptureV1 — photo-only capture', () => {
  it('returns ok: true', () => {
    const result = validateSessionCaptureV1(buildPhotoOnlyCapture());
    expect(result.ok).toBe(true);
  });

  it('has empty rooms', () => {
    const result = validateSessionCaptureV1(buildPhotoOnlyCapture());
    if (!result.ok) throw new Error(result.error);
    expect(result.session.rooms).toHaveLength(0);
  });

  it('has empty objectMarkers', () => {
    const result = validateSessionCaptureV1(buildPhotoOnlyCapture());
    if (!result.ok) throw new Error(result.error);
    expect(result.session.objectMarkers).toHaveLength(0);
  });

  it('has two photos', () => {
    const result = validateSessionCaptureV1(buildPhotoOnlyCapture());
    if (!result.ok) throw new Error(result.error);
    expect(result.session.photos).toHaveLength(2);
  });
});

// ─── 4. Transcript-only capture ───────────────────────────────────────────────

describe('validateSessionCaptureV1 — transcript-only capture', () => {
  it('returns ok: true', () => {
    const result = validateSessionCaptureV1(buildTranscriptOnlyCapture());
    expect(result.ok).toBe(true);
  });

  it('has complete transcript with text', () => {
    const result = validateSessionCaptureV1(buildTranscriptOnlyCapture());
    if (!result.ok) throw new Error(result.error);
    expect(result.session.transcript?.status).toBe('complete');
    expect(typeof result.session.transcript?.text).toBe('string');
    expect((result.session.transcript?.text ?? '').length).toBeGreaterThan(0);
  });

  it('has empty photos', () => {
    const result = validateSessionCaptureV1(buildTranscriptOnlyCapture());
    if (!result.ok) throw new Error(result.error);
    expect(result.session.photos).toHaveLength(0);
  });
});

// ─── 5. Flue clearance capture ────────────────────────────────────────────────

describe('validateSessionCaptureV1 — flue clearance capture', () => {
  it('returns ok: true', () => {
    const result = validateSessionCaptureV1(buildFlueClearanceCapture());
    expect(result.ok).toBe(true);
  });

  it('has a flue objectMarker', () => {
    const result = validateSessionCaptureV1(buildFlueClearanceCapture());
    if (!result.ok) throw new Error(result.error);
    expect(result.session.objectMarkers[0]?.kind).toBe('flue');
  });

  it('has a risk note', () => {
    const result = validateSessionCaptureV1(buildFlueClearanceCapture());
    if (!result.ok) throw new Error(result.error);
    expect(result.session.notes[0]?.category).toBe('risk');
  });
});

// ─── 6. Wrong schemaVersion ───────────────────────────────────────────────────

describe('validateSessionCaptureV1 — wrong schemaVersion', () => {
  it('returns ok: false', () => {
    const input = { ...buildFullSessionCaptureV1(), schemaVersion: 'atlas.scan.session.v2' };
    const result = validateSessionCaptureV1(input);
    expect(result.ok).toBe(false);
  });

  it('mentions schemaVersion in the error', () => {
    const input = { ...buildFullSessionCaptureV1(), schemaVersion: 'wrong' };
    const result = validateSessionCaptureV1(input);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/schemaVersion/);
  });
});

// ─── 7. Missing schemaVersion ─────────────────────────────────────────────────

describe('validateSessionCaptureV1 — missing schemaVersion', () => {
  it('returns ok: false', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { schemaVersion: _sv, ...rest } = buildFullSessionCaptureV1();
    const result = validateSessionCaptureV1(rest);
    expect(result.ok).toBe(false);
  });
});

// ─── 8. Missing visitId ───────────────────────────────────────────────────────

describe('validateSessionCaptureV1 — missing visitId', () => {
  it('returns ok: false', () => {
    const result = validateSessionCaptureV1(buildInvalidMissingVisitId());
    expect(result.ok).toBe(false);
  });

  it('mentions visitId in the error', () => {
    const result = validateSessionCaptureV1(buildInvalidMissingVisitId());
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/visitId/);
  });
});

// ─── 9. Missing sessionId ─────────────────────────────────────────────────────

describe('validateSessionCaptureV1 — missing sessionId', () => {
  it('returns ok: false', () => {
    const result = validateSessionCaptureV1(buildInvalidMissingSessionId());
    expect(result.ok).toBe(false);
  });

  it('mentions sessionId in the error', () => {
    const result = validateSessionCaptureV1(buildInvalidMissingSessionId());
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/sessionId/);
  });
});

// ─── 10. Bad status ───────────────────────────────────────────────────────────

describe('validateSessionCaptureV1 — bad status', () => {
  it('returns ok: false for unknown status', () => {
    const input = { ...buildFullSessionCaptureV1(), status: 'draft' };
    const result = validateSessionCaptureV1(input);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/status/);
  });
});

// ─── 11. Bad captureStartedAt ─────────────────────────────────────────────────

describe('validateSessionCaptureV1 — bad captureStartedAt', () => {
  it('returns ok: false', () => {
    const input = { ...buildFullSessionCaptureV1(), captureStartedAt: 'not-a-date' };
    const result = validateSessionCaptureV1(input);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/captureStartedAt/);
  });
});

// ─── 12. Bad room — missing roomId ────────────────────────────────────────────

describe('validateSessionCaptureV1 — bad room', () => {
  it('rejects room without roomId', () => {
    const input = {
      ...buildFullSessionCaptureV1(),
      rooms: [{ label: 'No ID Room', status: 'active' }],
      objectMarkers: [],
      photos: [],
      notes: [],
    };
    const result = validateSessionCaptureV1(input);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/roomId/);
  });
});

// ─── 13. Bad room status ──────────────────────────────────────────────────────

describe('validateSessionCaptureV1 — bad room status', () => {
  it('rejects invalid room status', () => {
    const input = {
      ...buildFullSessionCaptureV1(),
      rooms: [{ roomId: 'r1', label: 'Room', status: 'scanning' }],
      objectMarkers: [],
      photos: [],
      notes: [],
    };
    const result = validateSessionCaptureV1(input);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/status/);
  });
});

// ─── 14. Bad spatialModel ─────────────────────────────────────────────────────

describe('validateSessionCaptureV1 — bad spatialModel', () => {
  it('rejects spatialModel without coordinateConvention', () => {
    const input = {
      ...buildFullSessionCaptureV1(),
      spatialModel: {
        capturedAt: '2025-06-01T09:25:00Z',
        confidence: 'scanned',
        rooms: [],
      },
    };
    const result = validateSessionCaptureV1(input);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/coordinateConvention/);
  });
});

// ─── 15. Bad objectMarker kind ────────────────────────────────────────────────

describe('validateSessionCaptureV1 — bad objectMarker kind', () => {
  it('rejects unknown kind', () => {
    const base = buildPhotoOnlyCapture();
    const input = {
      ...base,
      objectMarkers: [
        {
          markerId: 'm1',
          kind: 'flux_capacitor',
          linkedPhotoIds: [],
          linkedNoteIds: [],
          createdAt: '2025-06-01T09:00:00Z',
          provenance: {
            source: 'capture',
            capturedAt: '2025-06-01T09:00:00Z',
            confidence: 'scanned',
          },
        },
      ],
    };
    const result = validateSessionCaptureV1(input);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/kind/);
  });
});

// ─── 16. Bad objectMarker createdAt ──────────────────────────────────────────

describe('validateSessionCaptureV1 — bad objectMarker createdAt', () => {
  it('rejects non-ISO createdAt', () => {
    const base = buildPhotoOnlyCapture();
    const input = {
      ...base,
      objectMarkers: [
        {
          markerId: 'm1',
          kind: 'boiler',
          linkedPhotoIds: [],
          linkedNoteIds: [],
          createdAt: 'yesterday',
          provenance: { source: 'capture', capturedAt: '2025-06-01T09:00:00Z', confidence: 'scanned' },
        },
      ],
    };
    const result = validateSessionCaptureV1(input);
    expect(result.ok).toBe(false);
  });
});

// ─── 17. Bad objectMarker provenance ─────────────────────────────────────────

describe('validateSessionCaptureV1 — bad objectMarker provenance', () => {
  it('rejects invalid provenance source', () => {
    const base = buildPhotoOnlyCapture();
    const input = {
      ...base,
      objectMarkers: [
        {
          markerId: 'm1',
          kind: 'boiler',
          linkedPhotoIds: [],
          linkedNoteIds: [],
          createdAt: '2025-06-01T09:00:00Z',
          provenance: { source: 'alien', capturedAt: '2025-06-01T09:00:00Z', confidence: 'scanned' },
        },
      ],
    };
    const result = validateSessionCaptureV1(input);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/source/);
  });
});

// ─── 18. Bad photo — missing uri ─────────────────────────────────────────────

describe('validateSessionCaptureV1 — bad photo', () => {
  it('rejects photo without uri', () => {
    const base = buildPhotoOnlyCapture();
    const input = {
      ...base,
      photos: [
        {
          photoId: 'p1',
          capturedAt: '2025-06-01T09:00:00Z',
          provenance: { source: 'capture', capturedAt: '2025-06-01T09:00:00Z', confidence: 'photo_linked' },
        },
      ],
    };
    const result = validateSessionCaptureV1(input);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/uri/);
  });
});

// ─── 19. Bad photo provenance confidence ─────────────────────────────────────

describe('validateSessionCaptureV1 — bad photo provenance confidence', () => {
  it('rejects unknown confidence value', () => {
    const base = buildPhotoOnlyCapture();
    const input = {
      ...base,
      photos: [
        {
          ...base.photos[0],
          provenance: { source: 'capture', capturedAt: '2025-06-01T09:00:00Z', confidence: 'great' },
        },
      ],
    };
    const result = validateSessionCaptureV1(input);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/confidence/);
  });
});

// ─── 20. Bad transcript status ────────────────────────────────────────────────

describe('validateSessionCaptureV1 — bad transcript status', () => {
  it('rejects unknown transcript status', () => {
    const input = {
      ...buildFullSessionCaptureV1(),
      transcript: { status: 'transcribing', text: 'some text' },
    };
    const result = validateSessionCaptureV1(input);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/transcript\.status/);
  });
});

// ─── 21. Bad note — missing noteId ────────────────────────────────────────────

describe('validateSessionCaptureV1 — bad note', () => {
  it('rejects note without noteId', () => {
    const input = {
      ...buildPhotoOnlyCapture(),
      notes: [{ text: 'A note', createdAt: '2025-06-01T09:00:00Z' }],
    };
    const result = validateSessionCaptureV1(input);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/noteId/);
  });
});

// ─── 22. Bad timeline event type ──────────────────────────────────────────────

describe('validateSessionCaptureV1 — bad timeline event type', () => {
  it('rejects unknown event type', () => {
    const input = {
      ...buildPhotoOnlyCapture(),
      timelineEvents: [
        { eventId: 'e1', type: 'alien_abduction', timestamp: '2025-06-01T09:00:00Z' },
      ],
    };
    const result = validateSessionCaptureV1(input);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/TimelineEventType/);
  });
});

// ─── 23. Bad assetManifest entry ──────────────────────────────────────────────

describe('validateSessionCaptureV1 — bad assetManifest entry', () => {
  it('rejects entry without uri', () => {
    const input = {
      ...buildPhotoOnlyCapture(),
      assetManifest: [
        { assetId: 'a1', kind: 'photo', capturedAt: '2025-06-01T09:00:00Z' },
      ],
    };
    const result = validateSessionCaptureV1(input);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/uri/);
  });
});

// ─── 24. Bad review status ────────────────────────────────────────────────────

describe('validateSessionCaptureV1 — bad review status', () => {
  it('rejects unknown review status', () => {
    const input = {
      ...buildPhotoOnlyCapture(),
      review: { status: 'maybe' },
    };
    const result = validateSessionCaptureV1(input);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/review\.status/);
  });
});

// ─── 25. Orphan: photo.roomId → non-existent room ────────────────────────────

describe('validateSessionCaptureV1 — orphan photo.roomId', () => {
  it('returns ok: false', () => {
    const result = validateSessionCaptureV1(buildInvalidOrphanPhotoRoom());
    expect(result.ok).toBe(false);
  });

  it('mentions orphan room reference in the error', () => {
    const result = validateSessionCaptureV1(buildInvalidOrphanPhotoRoom());
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/room-that-does-not-exist/);
  });
});

// ─── 26. Orphan: photo.objectMarkerId → non-existent marker ─────────────────

describe('validateSessionCaptureV1 — orphan photo.objectMarkerId', () => {
  it('returns ok: false when objectMarkerId references a non-existent marker', () => {
    const base = buildPhotoOnlyCapture();
    const input = {
      ...base,
      photos: [
        {
          ...base.photos[0],
          objectMarkerId: 'marker-ghost',
        },
      ],
    };
    const result = validateSessionCaptureV1(input);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/marker-ghost/);
  });
});

// ─── 27. Orphan: objectMarker.roomId → non-existent room ────────────────────

describe('validateSessionCaptureV1 — orphan objectMarker.roomId', () => {
  it('returns ok: false when objectMarker.roomId references a non-existent room', () => {
    const base = buildPhotoOnlyCapture();
    const input = {
      ...base,
      objectMarkers: [
        {
          markerId: 'm1',
          kind: 'boiler',
          roomId: 'room-ghost',
          linkedPhotoIds: [],
          linkedNoteIds: [],
          createdAt: '2025-06-01T09:00:00Z',
          provenance: { source: 'capture', capturedAt: '2025-06-01T09:00:00Z', confidence: 'scanned' },
        },
      ],
    };
    const result = validateSessionCaptureV1(input);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/room-ghost/);
  });
});

// ─── 28. Orphan: objectMarker.linkedPhotoIds → non-existent photo ────────────

describe('validateSessionCaptureV1 — orphan objectMarker.linkedPhotoIds', () => {
  it('returns ok: false', () => {
    const result = validateSessionCaptureV1(buildInvalidOrphanMarkerPhoto());
    expect(result.ok).toBe(false);
  });

  it('mentions the orphan photo ID in the error', () => {
    const result = validateSessionCaptureV1(buildInvalidOrphanMarkerPhoto());
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/photo-that-does-not-exist/);
  });
});

// ─── 29. Orphan: objectMarker.linkedNoteIds → non-existent note ──────────────

describe('validateSessionCaptureV1 — orphan objectMarker.linkedNoteIds', () => {
  it('returns ok: false when linkedNoteIds references a non-existent note', () => {
    const base = buildPhotoOnlyCapture();
    const input = {
      ...base,
      objectMarkers: [
        {
          markerId: 'm1',
          kind: 'boiler',
          linkedPhotoIds: [],
          linkedNoteIds: ['note-ghost'],
          createdAt: '2025-06-01T09:00:00Z',
          provenance: { source: 'capture', capturedAt: '2025-06-01T09:00:00Z', confidence: 'scanned' },
        },
      ],
    };
    const result = validateSessionCaptureV1(input);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/note-ghost/);
  });
});

// ─── 30. Orphan: note.roomId → non-existent room ─────────────────────────────

describe('validateSessionCaptureV1 — orphan note.roomId', () => {
  it('returns ok: false when note.roomId references a non-existent room', () => {
    const base = buildPhotoOnlyCapture();
    const input = {
      ...base,
      notes: [
        {
          noteId: 'n1',
          text: 'Orphan note',
          createdAt: '2025-06-01T09:00:00Z',
          roomId: 'room-ghost',
        },
      ],
    };
    const result = validateSessionCaptureV1(input);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/room-ghost/);
  });
});

// ─── 31. Orphan: note.objectMarkerId → non-existent marker ───────────────────

describe('validateSessionCaptureV1 — orphan note.objectMarkerId', () => {
  it('returns ok: false when note.objectMarkerId references a non-existent marker', () => {
    const base = buildPhotoOnlyCapture();
    const input = {
      ...base,
      notes: [
        {
          noteId: 'n1',
          text: 'Orphan note',
          createdAt: '2025-06-01T09:00:00Z',
          objectMarkerId: 'marker-ghost',
        },
      ],
    };
    const result = validateSessionCaptureV1(input);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected ok: false');
    expect(result.error).toMatch(/marker-ghost/);
  });
});

// ─── 32. TypeScript narrowing ─────────────────────────────────────────────────

describe('validateSessionCaptureV1 — TypeScript narrowing', () => {
  it('narrows to SessionCaptureV1 after ok: true check', () => {
    const result = validateSessionCaptureV1(buildFullSessionCaptureV1());
    if (!result.ok) throw new Error(result.error);
    const session: SessionCaptureV1 = result.session;
    expect(session.schemaVersion).toBe('atlas.scan.session.v1');
  });
});

// ─── 33. Full fixture expected IDs ────────────────────────────────────────────

describe('validateSessionCaptureV1 — full fixture IDs', () => {
  it('has the expected visitId', () => {
    const result = validateSessionCaptureV1(buildFullSessionCaptureV1());
    if (!result.ok) throw new Error(result.error);
    expect(result.session.visitId).toBe('visit-fixture-full-001');
  });

  it('has the expected sessionId', () => {
    const result = validateSessionCaptureV1(buildFullSessionCaptureV1());
    if (!result.ok) throw new Error(result.error);
    expect(result.session.sessionId).toBe('session-fixture-full-001');
  });
});

// ─── 34. Full fixture spatial model ──────────────────────────────────────────

describe('validateSessionCaptureV1 — full fixture spatial model', () => {
  it('has metric_m coordinate convention', () => {
    const result = validateSessionCaptureV1(buildFullSessionCaptureV1());
    if (!result.ok) throw new Error(result.error);
    expect(result.session.spatialModel?.coordinateConvention).toBe('metric_m');
  });

  it('has scanned confidence', () => {
    const result = validateSessionCaptureV1(buildFullSessionCaptureV1());
    if (!result.ok) throw new Error(result.error);
    expect(result.session.spatialModel?.confidence).toBe('scanned');
  });
});

// ─── 35. Full fixture object marker provenance ────────────────────────────────

describe('validateSessionCaptureV1 — full fixture object marker provenance', () => {
  it('first object marker has provenance', () => {
    const result = validateSessionCaptureV1(buildFullSessionCaptureV1());
    if (!result.ok) throw new Error(result.error);
    expect(result.session.objectMarkers[0]?.provenance).toBeDefined();
  });

  it('first object marker has manually_placed confidence', () => {
    const result = validateSessionCaptureV1(buildFullSessionCaptureV1());
    if (!result.ok) throw new Error(result.error);
    expect(result.session.objectMarkers[0]?.provenance.confidence).toBe('manually_placed');
  });
});

// ─── 36. Photo-only fixture empty rooms/markers ───────────────────────────────

describe('validateSessionCaptureV1 — photo-only empty rooms and markers', () => {
  it('validates with empty rooms', () => {
    const result = validateSessionCaptureV1(buildPhotoOnlyCapture());
    if (!result.ok) throw new Error(result.error);
    expect(result.session.rooms).toHaveLength(0);
  });

  it('validates with empty objectMarkers', () => {
    const result = validateSessionCaptureV1(buildPhotoOnlyCapture());
    if (!result.ok) throw new Error(result.error);
    expect(result.session.objectMarkers).toHaveLength(0);
  });
});

// ─── 37. Transcript-only fixture text content ─────────────────────────────────

describe('validateSessionCaptureV1 — transcript-only text content', () => {
  it('transcript text is non-empty', () => {
    const result = validateSessionCaptureV1(buildTranscriptOnlyCapture());
    if (!result.ok) throw new Error(result.error);
    expect((result.session.transcript?.text ?? '').length).toBeGreaterThan(50);
  });

  it('transcript has two segments', () => {
    const result = validateSessionCaptureV1(buildTranscriptOnlyCapture());
    if (!result.ok) throw new Error(result.error);
    expect(result.session.transcript?.segments).toHaveLength(2);
  });
});
