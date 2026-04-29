/**
 * sessionCaptureV2.types.ts
 *
 * SessionCaptureV2 — the canonical scan-to-Mind handoff contract.
 *
 * This is the single source of truth for a complete property survey exported
 * by Atlas Scan iOS.  It carries field observations — room scans, object pins,
 * photos, voice notes (transcript text only), floor-plan snapshots, and QA
 * flags — together with top-level session and device metadata.
 *
 * Design principles:
 *   - sessionId and visitReference are always required cross-system keys.
 *   - Raw audio must never be exported; only transcript text travels here.
 *   - Orphan references (photo → missing room, objectPin → missing photo) are
 *     invalid and must be rejected at the validation boundary.
 *   - No derived values, engine outputs, or recommendation scores belong here.
 *   - ScanBundleV1 and ScanJob are NOT production handoff contracts; use only
 *     SessionCaptureV2 for the Atlas Scan → Atlas Mind boundary.
 */

// ─── Schema version ───────────────────────────────────────────────────────────

/** The only supported schemaVersion string for SessionCaptureV2 payloads. */
export const SESSION_CAPTURE_V2_SCHEMA_VERSION =
  'atlas.scan.session.v2' as const;

export type SessionCaptureV2SchemaVersion =
  typeof SESSION_CAPTURE_V2_SCHEMA_VERSION;

// ─── Object pin kinds ─────────────────────────────────────────────────────────

/**
 * Observable field categories for a placed object pin.
 *
 * These are capture categories — not engine system roles.
 */
export type ObjectPinKindV2 =
  | 'boiler'
  | 'cylinder'
  | 'radiator'
  | 'flue'
  | 'gas_meter'
  | 'airing_cupboard'
  | 'control'
  | 'pump'
  | 'valve'
  | 'evidence_point'
  | 'generic_note'
  | 'pipe'
  | 'consumer_unit';

// ─── QA flag kinds ────────────────────────────────────────────────────────────

/**
 * Semantic category for a QA flag raised during the scan session.
 */
export type QAFlagKindV2 =
  | 'low_confidence'
  | 'missing_room'
  | 'incomplete_scan'
  | 'review_required'
  | 'access_issue'
  | 'other';

// ─── Room scans ───────────────────────────────────────────────────────────────

/**
 * A room captured during the survey session.
 *
 * Carries the geometry summary produced by the LiDAR / RoomPlan pipeline
 * and the human-readable label entered by the engineer.
 */
export interface RoomScanV2 {
  /** Unique identifier (UUID string). */
  roomId: string;
  /** Human-readable label (e.g. "Kitchen", "Boiler Room"). */
  label: string;
  /** Which storey this room is on (0 = ground floor). */
  floorIndex?: number;
  /** ISO-8601 timestamp of when this room was captured. */
  capturedAt: string;
  /** URI of the raw scan mesh asset (USDZ, PLY, etc.), if available. */
  meshRef?: string;
  /** Calculated floor area in m², as reported by the capture pipeline. */
  areaM2?: number;
  /** Calculated ceiling height in metres, as reported by the capture pipeline. */
  heightM?: number;
}

// ─── Photos ───────────────────────────────────────────────────────────────────

/**
 * A photo captured as evidence during the survey session.
 *
 * Photos are the primary photographic evidence record.  They may be linked
 * to a room, an object pin, or both.
 */
export interface PhotoV2 {
  /** Unique identifier (UUID string). */
  photoId: string;
  /** URI of the full-resolution image (local or remote). */
  uri: string;
  /** URI of a smaller preview image. */
  thumbnailUri?: string;
  /** ISO-8601 timestamp of capture. */
  capturedAt: string;
  /** Optional reference to the room this photo was taken in. */
  roomId?: string;
  /** Optional reference to the object pin this photo documents. */
  objectPinId?: string;
  /** Optional semantic tags (e.g. 'data_plate', 'clearance', 'flue_terminal'). */
  tags?: string[];
  /** Optional free-text note entered at capture time. */
  note?: string;
}

// ─── Voice notes ──────────────────────────────────────────────────────────────

/**
 * A voice note captured during the survey session.
 *
 * IMPORTANT: Only transcript text is exported.  Raw audio URIs, audio data,
 * or audio file references must never appear in this payload.  Any payload
 * containing raw audio fields is invalid and will be rejected.
 */
export interface VoiceNoteV2 {
  /** Unique identifier (UUID string). */
  noteId: string;
  /** Transcribed text of the voice note. */
  text: string;
  /** ISO-8601 timestamp of when this note was recorded. */
  capturedAt: string;
  /** Optional reference to the room context at time of recording. */
  roomId?: string;
  /** Optional reference to the object pin context at time of recording. */
  objectPinId?: string;
}

// ─── Object pins ──────────────────────────────────────────────────────────────

/**
 * An object pin placed by the engineer during the survey.
 *
 * Object pins are the primary anchor for evidence.  Photos and voice notes
 * should prefer attaching to pins where possible.
 */
export interface ObjectPinV2 {
  /** Unique identifier (UUID string). */
  pinId: string;
  /** Category of system component or evidence point. */
  kind: ObjectPinKindV2;
  /** Optional human-readable label (e.g. "Worcester 30i", "TRV bedroom"). */
  label?: string;
  /** Optional reference to the room this pin is in. */
  roomId?: string;
  /** Optional position in scan coordinate space (metric metres). */
  position?: { x: number; y: number; z?: number };
  /** IDs of photos linked to this pin (must reference valid photo.photoId entries). */
  linkedPhotoIds: string[];
  /** IDs of voice notes linked to this pin (must reference valid voiceNote.noteId entries). */
  linkedNoteIds: string[];
  /** ISO-8601 timestamp of when this pin was placed. */
  createdAt: string;
}

// ─── Floor-plan snapshots ─────────────────────────────────────────────────────

/**
 * A floor-plan snapshot exported from the capture session.
 *
 * Snapshots are 2-D overhead images generated from the scan geometry.
 * One snapshot per floor is typical.
 */
export interface FloorPlanSnapshotV2 {
  /** Unique identifier (UUID string). */
  snapshotId: string;
  /** URI of the floor-plan image (PNG or SVG). */
  uri: string;
  /** Storey index this snapshot covers (0 = ground floor). */
  floorIndex: number;
  /** ISO-8601 timestamp of when this snapshot was generated. */
  capturedAt: string;
}

// ─── QA flags ─────────────────────────────────────────────────────────────────

/**
 * A QA flag raised during the scan session.
 *
 * QA flags surface issues that require human review before the session data
 * can be used in downstream outputs.
 */
export interface QAFlagV2 {
  /** Unique identifier (UUID string). */
  flagId: string;
  /** Semantic category of the flag. */
  kind: QAFlagKindV2;
  /** Human-readable description of the issue. */
  message: string;
  /** Optional reference to the room this flag pertains to. */
  roomId?: string;
  /** Optional reference to the object pin this flag pertains to. */
  objectPinId?: string;
  /** ISO-8601 timestamp of when this flag was raised. */
  createdAt: string;
}

// ─── SessionCaptureV2 ─────────────────────────────────────────────────────────

/**
 * SessionCaptureV2 — the canonical scan-to-Mind handoff contract.
 *
 * This is the single top-level payload produced by Atlas Scan and consumed
 * by Atlas Mind.  It describes raw field observations from a single property
 * survey visit: room scans, object pins, photos, voice notes (transcript text
 * only), floor-plan snapshots, and QA flags.
 *
 * sessionId and visitReference are always required; they are the authoritative
 * cross-system identifiers.
 *
 * What is NOT included:
 *   - Raw audio data, audio URIs, or audio file references
 *   - Heat-loss outputs or U-value calculations
 *   - Recommendation scores or system selections
 *   - Proposal design state
 *   - Engine summaries or derived values
 *
 * ScanBundleV1 and ScanJob are NOT production handoff contracts.  SessionCaptureV2
 * is the only supported contract for the Atlas Scan → Atlas Mind boundary.
 *
 * Consumers (Atlas Mind) derive semantic models from this payload; they do
 * not mutate it.
 */
export interface SessionCaptureV2 {
  /** Contract discriminant — always 'atlas.scan.session.v2'. */
  schemaVersion: SessionCaptureV2SchemaVersion;
  /** Unique identifier for this capture session (UUID string). */
  sessionId: string;
  /**
   * Reference to the property visit this session belongs to.
   *
   * Must match the visit record in Atlas Mind.  This is the authoritative
   * cross-system key linking the capture to the scheduled visit.
   */
  visitReference: string;
  /** ISO-8601 timestamp of when capture started. */
  capturedAt: string;
  /** ISO-8601 timestamp of when this payload was exported by Atlas Scan. */
  exportedAt: string;
  /** Device model identifier (e.g. "iPhone 15 Pro"). */
  deviceModel: string;
  /** Rooms captured during the session. */
  roomScans: RoomScanV2[];
  /** Photos taken as evidence. */
  photos: PhotoV2[];
  /**
   * Voice notes captured during the session (transcript text only).
   *
   * Raw audio must not be exported.  Any payload containing raw audio
   * fields will be rejected at the validation boundary.
   */
  voiceNotes: VoiceNoteV2[];
  /** Object pins placed by the engineer. */
  objectPins: ObjectPinV2[];
  /** Floor-plan snapshots generated from the scan geometry. */
  floorPlanSnapshots: FloorPlanSnapshotV2[];
  /** QA flags raised during the session. */
  qaFlags: QAFlagV2[];
}

/**
 * A raw unknown input — used at the validation boundary before the payload
 * has been confirmed to match SessionCaptureV2.
 */
export type UnknownSessionCaptureV2 = Record<string, unknown>;
