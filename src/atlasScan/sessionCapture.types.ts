/**
 * sessionCapture.types.ts
 *
 * SessionCaptureV2 — the payload exported by Atlas Scan.
 *
 * Design principles:
 *   - Capture only: raw observations from the field, nothing derived.
 *   - No heat-loss outputs, recommendation scores, engine summaries, or
 *     proposal design state.
 *   - Transcripts are kept; raw audio URIs are kept as asset references only.
 *   - 3D scan bundles are referenced by URI, not inlined.
 *   - All IDs are strings (UUID recommended).
 */

// ─── Coordinate reference ──────────────────────────────────────────────────────

/**
 * A lightweight 2-D or 3-D point reference captured during the scan.
 * Coordinates are in the local scan coordinate space (metric metres).
 */
export interface CapturedPointRef {
  x: number;
  y: number;
  z?: number;
}

// ─── Room scan ────────────────────────────────────────────────────────────────

/**
 * A raw LiDAR / RoomPlan room scan captured during the session.
 *
 * The scan asset (USDZ, point cloud, etc.) is stored externally and
 * referenced by URI.  Only metadata and asset references live here.
 */
export interface CapturedRoomScan {
  /** Unique identifier for this scan (UUID string). */
  id: string;
  /** ISO-8601 timestamp of when the scan was captured. */
  capturedAt: string;
  /** Optional human-readable label for the room (e.g. "Kitchen"). */
  label?: string;
  /** Remote URI of the raw scan asset bundle (e.g. USDZ or ZIP of PLY). */
  scanBundleUri?: string;
  /** Remote URI of a 2-D floor-plan preview image. */
  floorPlanPreviewUri?: string;
  /** Remote URI of a thumbnail image. */
  thumbnailUri?: string;
  /**
   * Approximate floor area of the room in m², as reported by the capture
   * pipeline.  This is a raw measurement — not an engine-validated figure.
   */
  rawAreaM2?: number;
  /**
   * Approximate ceiling height in metres, as reported by the capture
   * pipeline.
   */
  rawHeightM?: number;
}

// ─── Photo ────────────────────────────────────────────────────────────────────

/**
 * A photo captured during the survey session.
 */
export interface CapturedPhoto {
  /** Unique identifier (UUID string). */
  id: string;
  /** Remote or local URI of the full-resolution image. */
  uri: string;
  /** Optional URI of a smaller preview / thumbnail image. */
  thumbnailUri?: string;
  /** ISO-8601 timestamp of when the photo was taken. */
  capturedAt: string;
  /** Optional reference to the room this photo was taken in. */
  roomId?: string;
  /** Optional reference to a placed object this photo documents. */
  linkedObjectId?: string;
  /** Optional free-text note entered at capture time. */
  note?: string;
}

// ─── Voice note ───────────────────────────────────────────────────────────────

/**
 * A voice note captured during the survey session.
 *
 * Only the transcript is stored in the canonical contract.  The raw audio
 * asset, if retained, lives outside this payload.
 */
export interface CapturedVoiceNote {
  /** Unique identifier (UUID string). */
  id: string;
  /**
   * Transcript of the voice note.
   *
   * May be empty if transcription has not completed; use `startedAt`
   * and `endedAt` to track the time range.
   */
  transcript: string;
  /** ISO-8601 timestamp of when the note recording started. */
  startedAt: string;
  /** ISO-8601 timestamp of when the note recording ended (absent if still recording). */
  endedAt?: string;
  /** Optional reference to the room this note was recorded in. */
  roomId?: string;
  /** Optional reference to a placed object this note relates to. */
  linkedObjectId?: string;
}

// ─── Placed object ────────────────────────────────────────────────────────────

/**
 * A physical object (system component or evidence point) placed by the
 * engineer during the survey session.
 *
 * Placed objects are the primary anchor for evidence (photos, voice notes).
 * They describe what was observed — not what is recommended.
 */
export interface CapturedPlacedObject {
  /** Unique identifier (UUID string). */
  id: string;
  /**
   * Kind of object placed.
   *
   * These are observable field categories — not engine system roles.
   */
  kind:
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
    | 'generic_note';
  /** Optional human-readable label (e.g. "Worcester 30i", "TRV bedroom"). */
  label?: string;
  /** Optional reference to the room this object is located in. */
  roomId?: string;
  /** IDs of photos linked to this object. */
  linkedPhotoIds?: string[];
  /** Optional position in local scan coordinate space. */
  position?: CapturedPointRef;
  /** ISO-8601 timestamp of when this object was placed. */
  createdAt: string;
}

// ─── Floor plan snapshot ──────────────────────────────────────────────────────

/**
 * A floor-plan snapshot captured or exported during the session.
 *
 * Floor-plan snapshots are 2-D evidence images — they are not the canonical
 * spatial model.  They are stored here as capture artefacts only.
 */
export interface CapturedFloorPlanSnapshot {
  /** Unique identifier (UUID string). */
  id: string;
  /** Remote URI of the floor-plan image. */
  uri: string;
  /** ISO-8601 timestamp of when the snapshot was taken. */
  capturedAt: string;
  /** Optional human-readable label (e.g. "Ground Floor"). */
  label?: string;
}

// ─── SessionCaptureV2 ─────────────────────────────────────────────────────────

/**
 * SessionCaptureV2 — the top-level payload exported by Atlas Scan.
 *
 * This contract is capture-only.  It records raw field observations from
 * a single property survey visit: room scans, photos, voice notes, placed
 * objects, and floor-plan snapshots.
 *
 * What is NOT included:
 *   - Heat-loss outputs or U-value calculations
 *   - Recommendation scores or "best system" selections
 *   - Proposal design state
 *   - Engine summaries or derived values
 *
 * Consumers (Atlas Mind) should derive semantic models from this payload
 * rather than mutating it.
 */
export interface SessionCaptureV2 {
  /** Contract discriminant — always 'atlas.scan.session.v2'. */
  schemaVersion: 'atlas.scan.session.v2';
  /** Unique identifier for this session (UUID string). */
  sessionId: string;
  /** Optional reference to the property this session belongs to. */
  propertyId?: string;
  /** Optional reference to the visit record this session belongs to. */
  visitId?: string;
  /** ISO-8601 timestamp of when the session was created. */
  createdAt: string;
  /** ISO-8601 timestamp of the last update to this payload. */
  updatedAt: string;

  /** Job / visit reference metadata. */
  job: {
    /** External visit or job reference identifier. */
    visitReference: string;
  };

  /** Optional capture device metadata. */
  device?: {
    /** Mobile platform used for capture. */
    platform: 'ios';
    /** App version string (e.g. "2.4.1"). */
    appVersion?: string;
    /** Whether the device has a LiDAR sensor available. */
    lidarAvailable?: boolean;
  };

  /** All raw capture data from the session. */
  captures: {
    /** Raw LiDAR / RoomPlan room scans. */
    roomScans: CapturedRoomScan[];
    /** Photos taken as evidence. */
    photos: CapturedPhoto[];
    /** Voice notes recorded during the session. */
    voiceNotes: CapturedVoiceNote[];
    /** System components and evidence points placed by the engineer. */
    placedObjects: CapturedPlacedObject[];
    /** 2-D floor-plan snapshots (evidence only; not canonical spatial truth). */
    floorPlanSnapshots: CapturedFloorPlanSnapshot[];
  };
}

/**
 * A raw unknown input — used at the validation boundary before the payload
 * has been confirmed to match SessionCaptureV2.
 */
export type UnknownSessionCaptureV2 = Record<string, unknown>;
