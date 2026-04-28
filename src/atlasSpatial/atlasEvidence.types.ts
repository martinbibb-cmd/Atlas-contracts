/**
 * atlasEvidence.types.ts
 *
 * AtlasEvidenceMarkerV1 — a spatial evidence marker attached to a spatial model.
 *
 * Evidence markers link raw capture artefacts (photos, voice notes, scan
 * bundles) to spatial entities in the model, providing a traceable chain from
 * observation to semantic truth.
 */

// ─── Evidence source reference ────────────────────────────────────────────────

/**
 * A typed reference to a capture artefact that supports a claim.
 */
export type AtlasEvidenceSourceRef =
  | {
      /** Reference to a CapturedPhoto by ID. */
      type: 'photo';
      captureId: string;
      sessionId?: string;
    }
  | {
      /** Reference to a CapturedVoiceNote by ID. */
      type: 'voice_note';
      captureId: string;
      sessionId?: string;
    }
  | {
      /** Reference to a CapturedRoomScan by ID. */
      type: 'room_scan';
      captureId: string;
      sessionId?: string;
    }
  | {
      /** Reference to a CapturedPlacedObject by ID. */
      type: 'placed_object';
      captureId: string;
      sessionId?: string;
    }
  | {
      /** A manually entered text note (not from a capture session). */
      type: 'text_note';
      text: string;
    };

// ─── Evidence marker ─────────────────────────────────────────────────────────

/**
 * AtlasEvidenceMarkerV1 — a named evidence reference attached to a spatial model.
 *
 * Markers are not editable entities; they are provenance anchors that link
 * spatial entities to their supporting capture artefacts.
 *
 * `entityId` — the spatial entity this marker supports (room, emitter, etc.)
 * `sources`  — one or more capture artefacts that constitute this evidence
 * `note`     — optional free-text note from the engineer
 */
export interface AtlasEvidenceMarkerV1 {
  /** Unique identifier (UUID string). */
  id: string;
  /** ID of the spatial entity this marker is attached to. */
  entityId: string;
  /** One or more source references that constitute this evidence. */
  sources: AtlasEvidenceSourceRef[];
  /** Optional free-text note explaining the evidence. */
  note?: string;
  /** ISO-8601 timestamp of when this marker was created. */
  createdAt: string;
}
