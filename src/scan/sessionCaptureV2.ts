/**
 * sessionCaptureV2.ts
 *
 * SessionCaptureV2 — hardened capture-evidence contract for Atlas Scan.
 *
 * This file defines the capture payload that Scan produces and Mind ingests.
 * It is capture-only: no handoff behaviour, no engine outputs, no derived values.
 *
 * Design principles:
 *   - All evidence items carry provenance and reviewStatus.
 *   - Rejected evidence remains in capture history but must not appear in
 *     customer-facing outputs.
 *   - Manual object pins default to reviewStatus: 'confirmed'.
 *   - Scan/inferred object pins default to reviewStatus: 'pending'.
 *   - Object-scope photos default includeInCustomerReport: false.
 *   - Room/floor-plan/overview photos may be explicitly included.
 *   - No ScanToMindHandoffV1 is defined here.
 */

// ─── Review status ────────────────────────────────────────────────────────────

/**
 * QA review status for a piece of capture evidence.
 *
 * - `pending`   — captured but not yet reviewed
 * - `confirmed` — reviewed and accepted
 * - `rejected`  — reviewed and rejected; must remain in history but must not
 *                 be used in customer-facing outputs
 */
export type ReviewStatusV1 = 'pending' | 'confirmed' | 'rejected';

// ─── Capture provenance ───────────────────────────────────────────────────────

/**
 * How a piece of capture evidence was produced.
 *
 * - `manual`     — explicitly placed or entered by the engineer
 * - `scan`       — derived from LiDAR / RoomPlan pipeline
 * - `photo`      — captured via camera
 * - `transcript` — produced from voice/dictation transcription
 * - `inferred`   — inferred by the app or engine from surrounding context
 * - `imported`   — brought in from an external source
 */
export type CaptureProvenanceV1 =
  | 'manual'
  | 'scan'
  | 'photo'
  | 'transcript'
  | 'inferred'
  | 'imported';

// ─── Base evidence fields ─────────────────────────────────────────────────────

/**
 * Common fields shared by all capture evidence items.
 */
export interface CaptureEvidenceBaseV1 {
  /** Unique identifier (UUID string). */
  id: string;
  /** Optional reference to the room this evidence is associated with. */
  roomId?: string;
  /** How this evidence was produced. */
  provenance: CaptureProvenanceV1;
  /** QA review status. */
  reviewStatus: ReviewStatusV1;
  /** ISO-8601 timestamp of capture. */
  capturedAt: string;
  /** Optional free-text note entered at capture time. */
  notes?: string;
}

// ─── Photo evidence ───────────────────────────────────────────────────────────

/**
 * A photo captured as evidence during the survey.
 *
 * Default: `includeInCustomerReport` is `false` for object-scope photos.
 * Room/floor-plan/overview photos may be explicitly set to `true`.
 */
export interface CapturePhotoV1 extends CaptureEvidenceBaseV1 {
  kind: 'photo';
  /** URI of the image asset (local or remote). */
  uri: string;
  /** Optional human-readable label. */
  label?: string;
  /** Optional reference to the object pin this photo documents. */
  objectId?: string;
  /**
   * Whether this photo should appear in the customer-facing report.
   *
   * Object-scope photos default to `false`.  Room/overview photos may be
   * explicitly set to `true`.
   */
  includeInCustomerReport: boolean;
  /** Camera mode used when the photo was taken. */
  cameraMode?: 'standard' | 'wide' | 'panorama';
}

// ─── Transcript evidence ──────────────────────────────────────────────────────

/**
 * A transcript (voice note, dictation, or manual note) captured as evidence.
 *
 * Raw audio must never appear here; only the transcribed text travels in the
 * capture payload.
 */
export interface CaptureTranscriptV1 extends CaptureEvidenceBaseV1 {
  kind: 'transcript';
  /** Transcribed or manually entered text. */
  text: string;
  /** How the text was produced. */
  source: 'voice_note' | 'dictation' | 'manual_note';
}

// ─── Object pin evidence ──────────────────────────────────────────────────────

/**
 * A pin placed on a heating/plumbing system component or point of interest.
 *
 * Default review status by provenance:
 *   - `manual`  → `confirmed`
 *   - `scan` / `inferred` → `pending`
 */
export interface CaptureObjectPinV1 extends CaptureEvidenceBaseV1 {
  kind: 'object_pin';
  /** Category of the system component or evidence point. */
  objectType:
    | 'boiler'
    | 'cylinder'
    | 'buffer'
    | 'tank'
    | 'radiator'
    | 'control_system'
    | 'control_user'
    | 'flue'
    | 'gas_meter'
    | 'water_main'
    | 'other';
  /** Optional human-readable label (e.g. "Worcester 30i"). */
  label?: string;
  /** Spatial location of the pin. */
  location: {
    x: number;
    y: number;
    z?: number;
    coordinateSpace: 'room_plan' | 'floor_plan' | 'world';
  };
  /**
   * Confidence of the spatial anchor.
   *
   * - `screen_only`        — position mapped to screen coordinates only
   * - `raycast_estimated`  — position estimated via ARKit raycast
   * - `world_locked`       — position locked to world coordinate space
   */
  anchorConfidence: 'screen_only' | 'raycast_estimated' | 'world_locked';
}

// ─── Pipe route evidence ──────────────────────────────────────────────────────

/**
 * A routed pipe run captured during the survey.
 */
export interface CapturePipeRouteV1 extends CaptureEvidenceBaseV1 {
  kind: 'pipe_route';
  /** Service type carried by this route. */
  routeType:
    | 'heating_flow'
    | 'heating_return'
    | 'hot_water'
    | 'cold_water'
    | 'gas'
    | 'condensate'
    | 'discharge'
    | 'unknown';
  /** Whether this route already exists, is proposed, or is assumed. */
  status: 'existing' | 'proposed' | 'assumed';
  /** Ordered sequence of waypoints defining the route. */
  points: Array<{
    x: number;
    y: number;
    z?: number;
    coordinateSpace: 'room_plan' | 'floor_plan' | 'world';
  }>;
}

// ─── Room ─────────────────────────────────────────────────────────────────────

/**
 * A room recorded during the survey session.
 */
export interface CaptureRoomV1 {
  /** Unique identifier (UUID string). */
  id: string;
  /** Optional human-readable name (e.g. "Kitchen"). */
  name?: string;
  /** Storey index (0 = ground floor). */
  floorIndex?: number;
  /** IDs of other rooms that are logically linked (e.g. open-plan spaces). */
  linkedRoomIds?: string[];
  /** QA review status for this room. */
  reviewStatus: ReviewStatusV1;
  /** How this room was added to the capture. */
  provenance: CaptureProvenanceV1;
}

// ─── Point cloud asset ────────────────────────────────────────────────────────

/**
 * A point cloud or 3-D mesh asset captured during the survey.
 *
 * Kept separate from photos because point cloud assets are raw geometry
 * exports — not photographic evidence.
 */
export interface CapturePointCloudAssetV1 extends CaptureEvidenceBaseV1 {
  kind: 'point_cloud_asset';
  /** URI of the asset file (local or remote). */
  uri: string;
  /** File format of the asset. */
  format: 'usdz' | 'ply' | 'las' | 'e57' | 'image_depth' | 'other';
  /** Optional human-readable label. */
  label?: string;
  /**
   * Whether this asset should appear in the customer-facing report.
   */
  includeInCustomerReport: boolean;
}

// ─── SessionCaptureV2 ─────────────────────────────────────────────────────────

/**
 * SessionCaptureV2 — the hardened capture-evidence payload produced by Atlas
 * Scan and ingested by Atlas Mind.
 *
 * This is capture-only.  No handoff behaviour, engine outputs, recommendation
 * scores, proposal design state, or derived values belong here.
 *
 * What IS included:
 *   - rooms, photos, transcripts, object pins, pipe routes, point cloud assets
 *   - provenance and reviewStatus on every evidence item
 *   - visitId and optional visitNumber / brandId for cross-system keying
 *
 * What is NOT included:
 *   - Raw audio data or audio URIs
 *   - Heat-loss outputs or U-value calculations
 *   - Recommendation scores or system selections
 *   - Proposal design state
 *   - Engine summaries or derived values
 *   - ScanToMindHandoffV1 (not yet)
 */
export interface SessionCaptureV2 {
  /** Contract discriminant — always '2.0'. */
  version: '2.0';
  /** Authoritative cross-system visit identifier. */
  visitId: string;
  /** Optional human-readable visit reference number (e.g. 'VN-0042'). */
  visitNumber?: string;
  /** Optional brand identifier for white-label deployments. */
  brandId?: string;
  /** Rooms recorded during the session. */
  rooms: CaptureRoomV1[];
  /** Photos captured as evidence. */
  photos: CapturePhotoV1[];
  /** Transcripts (voice notes, dictation, manual notes). */
  transcripts: CaptureTranscriptV1[];
  /** Object pins placed during the session. */
  objectPins: CaptureObjectPinV1[];
  /** Pipe routes captured during the session. */
  pipeRoutes: CapturePipeRouteV1[];
  /** Point cloud and 3-D mesh assets exported from the session. */
  pointCloudAssets: CapturePointCloudAssetV1[];
  /** ISO-8601 timestamp of when this payload was first created. */
  createdAt: string;
  /** ISO-8601 timestamp of the last update to this payload. */
  updatedAt: string;
}
