/**
 * evidence.types.ts
 *
 * EvidenceModelV1 — first-class evidence layer for an AtlasPropertyV1.
 *
 * Evidence items (photos, voice notes, text notes, QA flags, timeline events)
 * are linked to the building model via EvidenceLinkV1 so that consumers
 * (portal, report engine, recommendation engine) can resolve them in context.
 *
 * Design alignment:
 *   - VoiceNote already carries linkedRoomID and linkedObjectID in the
 *     existing contracts; EvidenceLinkV1 generalises that pattern.
 *   - VisitCapture is the portable visit artefact around the raw scan bundle;
 *     EvidenceModelV1 is the richer property-scoped evidence layer.
 */

// ─── Evidence link ─────────────────────────────────────────────────────────────

/**
 * Spatial and temporal link from an evidence item to a building model entity.
 *
 * All fields are optional: an item may be linked to a specific component,
 * to a room, or may stand as a property-level note with no specific link.
 */
export interface EvidenceLinkV1 {
  /** ID of the room this evidence is linked to (RoomV1.roomId). */
  roomId?: string;
  /** ID of the thermal zone this evidence is linked to. */
  zoneId?: string;
  /** ID of the system component this evidence is linked to. */
  componentId?: string;
  /** ID of the emitter this evidence is linked to. */
  emitterId?: string;
  /** ID of the boundary element this evidence is linked to. */
  boundaryId?: string;
  /** ID of the opening this evidence is linked to. */
  openingId?: string;
  /** Session-relative timestamp in seconds when this evidence was captured. */
  timestamp?: number;
}

// ─── Photo evidence ────────────────────────────────────────────────────────────

/**
 * A photo captured during the survey visit.
 */
export interface PhotoEvidenceV1 {
  /** Unique identifier (UUID string). */
  photoId: string;
  /** ISO-8601 timestamp of when the photo was taken. */
  capturedAt: string;
  /** Local filename on the capture device (absent in remote payloads). */
  localFilename?: string;
  /** Remote asset URI once the photo has been uploaded. */
  remoteUri?: string;
  /** Semantic tag describing what the photo shows. */
  tag?:
    | 'boiler'
    | 'cylinder'
    | 'meter'
    | 'consumer_unit'
    | 'radiator'
    | 'pipe_work'
    | 'room_overview'
    | 'flue'
    | 'controls'
    | 'defect'
    | 'other';
  /** Spatial and temporal link to the building model. */
  link?: EvidenceLinkV1;
  /** Optional caption entered by the engineer. */
  caption?: string;
}

// ─── Voice-note evidence ──────────────────────────────────────────────────────

/**
 * A voice note captured during the survey and linked to this property.
 *
 * Wraps the semantic content of the existing VoiceNote contract with a
 * property-scope link, allowing the evidence layer to reference the same note
 * from multiple building model entities.
 */
export interface VoiceNoteEvidenceV1 {
  /** Unique identifier (UUID string); matches VoiceNote.id in the visit capture. */
  voiceNoteId: string;
  /** ISO-8601 timestamp of when the note was recorded. */
  capturedAt: string;
  /** Duration of the audio in seconds. */
  durationSeconds: number;
  /** Transcript text, once available. */
  transcript?: string;
  /** Semantic category of the note. */
  kind?:
    | 'observation'
    | 'customer_preference'
    | 'install_constraint'
    | 'risk'
    | 'follow_up'
    | 'other';
  /** Spatial and temporal link to the building model. */
  link?: EvidenceLinkV1;
}

// ─── Text note ────────────────────────────────────────────────────────────────

/**
 * A free-text note entered by the engineer during or after the visit.
 */
export interface TextNoteEvidenceV1 {
  /** Unique identifier (UUID string). */
  noteId: string;
  /** ISO-8601 timestamp of when the note was written. */
  createdAt: string;
  /** Note body text. */
  body: string;
  /** Spatial and temporal link to the building model. */
  link?: EvidenceLinkV1;
}

// ─── QA flag ─────────────────────────────────────────────────────────────────

/**
 * A QA flag raised against the property record, a specific building model
 * entity, or an individual evidence item.
 *
 * Distinct from the scan-level ScanQAFlag which is scoped to raw geometry;
 * these flags operate at the property / survey level.
 */
export interface QAFlagV1 {
  /** Unique identifier (UUID string). */
  flagId: string;
  /** Machine-readable flag code. */
  code: string;
  /** Human-readable message. */
  message: string;
  /** Severity level. */
  severity: 'info' | 'warning' | 'error' | 'blocking';
  /** ID of the entity this flag is attached to (room, component, etc.). */
  entityId?: string;
  /** The type of entity the flag relates to. */
  entityType?: 'room' | 'zone' | 'component' | 'emitter' | 'boundary' | 'opening' | 'property';
  /** ISO-8601 timestamp of when the flag was raised. */
  raisedAt?: string;
  /** Whether the flag has been acknowledged / resolved. */
  resolved?: boolean;
}

// ─── Timeline event ───────────────────────────────────────────────────────────

/**
 * A session timeline event, enabling replay and audit trail of the survey.
 */
export interface TimelineEventV1 {
  /** Unique identifier (UUID string). */
  eventId: string;
  /** ISO-8601 timestamp of the event. */
  occurredAt: string;
  /**
   * Event type code.
   * session_started / session_completed — lifecycle events
   * room_entered / room_completed      — room-level lifecycle
   * photo_captured / note_recorded     — evidence capture
   * sync_completed                     — data-sync checkpoint
   * custom                             — app-defined event
   */
  type:
    | 'session_started'
    | 'session_completed'
    | 'room_entered'
    | 'room_completed'
    | 'photo_captured'
    | 'note_recorded'
    | 'sync_completed'
    | 'custom';
  /** ID of the room this event is scoped to, if applicable. */
  roomId?: string;
  /** App-defined payload for 'custom' events. */
  payload?: Record<string, unknown>;
}

// ─── EvidenceModelV1 ─────────────────────────────────────────────────────────

/**
 * First-class evidence layer for an AtlasPropertyV1.
 *
 * All evidence is linked to building model entities via EvidenceLinkV1 so that
 * the portal, recommendation engine, and report generator can resolve evidence
 * in spatial and temporal context.
 */
export interface EvidenceModelV1 {
  /** Photos captured during the survey. */
  photos: PhotoEvidenceV1[];
  /** Voice notes captured during the survey. */
  voiceNotes: VoiceNoteEvidenceV1[];
  /** Text notes entered by the engineer. */
  textNotes: TextNoteEvidenceV1[];
  /** QA flags raised during or after capture. */
  qaFlags: QAFlagV1[];
  /** Ordered survey timeline events. */
  events: TimelineEventV1[];
}
