/**
 * sessionCaptureV1.types.ts
 *
 * SessionCaptureV1 — the canonical scan handoff contract between Atlas Scan
 * and Atlas Mind.
 *
 * This is the single source of truth for a complete property survey session.
 * It carries raw field observations — rooms, objects, photos, transcript,
 * notes, and a timeline — together with provenance metadata on each piece of
 * evidence.
 *
 * Design principles:
 *   - visitId and sessionId are always required; they are the cross-system keys.
 *   - Spatial confidence is explicit on every evidence item.
 *   - Orphan references (photo → missing room, marker → missing photo) are
 *     invalid and must be rejected at the validation boundary.
 *   - Transcript text is the canonical voice record; raw audio URIs are kept
 *     only in the asset manifest.
 *   - No derived values, engine outputs, or recommendation scores belong here.
 */

// ─── Spatial confidence ───────────────────────────────────────────────────────

/**
 * Spatial confidence of a captured entity.
 *
 * scanned        — derived from LiDAR / RoomPlan geometry
 * manually_placed — placed manually by the engineer
 * photo_linked   — inferred from a linked photo
 * inferred       — inferred from context (e.g. room adjacency)
 * needs_review   — flagged for engineer review before use
 */
export type SpatialConfidence =
  | 'scanned'
  | 'manually_placed'
  | 'photo_linked'
  | 'inferred'
  | 'needs_review';

// ─── Evidence provenance ──────────────────────────────────────────────────────

/**
 * Provenance record attached to each piece of captured evidence.
 *
 * source     — how this evidence was obtained
 * capturedAt — ISO-8601 timestamp of capture
 * roomId     — room context, if applicable
 * objectId   — object marker context, if applicable
 * assetId    — reference to an entry in the session assetManifest, if any
 * confidence — spatial confidence level for this evidence item
 */
export interface EvidenceProvenanceV1 {
  source: 'capture' | 'manual' | 'inferred' | 'import';
  capturedAt: string;
  roomId?: string;
  objectId?: string;
  assetId?: string;
  confidence: SpatialConfidence;
}

// ─── Session status ───────────────────────────────────────────────────────────

/**
 * Lifecycle status of a capture session.
 *
 * active   — capture is in progress
 * review   — capture complete; awaiting engineer review
 * ready    — reviewed and ready for Atlas Mind ingestion
 * synced   — successfully ingested by Atlas Mind
 * exported — final package exported and delivered
 */
export type SessionCaptureStatus =
  | 'active'
  | 'review'
  | 'ready'
  | 'synced'
  | 'exported';

// ─── Room ─────────────────────────────────────────────────────────────────────

/**
 * Lifecycle status of a captured room.
 *
 * active   — room capture in progress
 * complete — room capture complete
 */
export type RoomCaptureStatus = 'active' | 'complete';

/**
 * A room captured during the survey session.
 *
 * Room provides context (label, status, optional geometry) for evidence
 * linkage.  Objects and photos may reference a room by roomId.
 */
export interface SessionRoomV1 {
  /** Unique identifier (UUID string). */
  roomId: string;
  /** Human-readable label (e.g. "Kitchen", "Boiler Room"). */
  label: string;
  /** Capture lifecycle status. */
  status: RoomCaptureStatus;
  /** Which storey this room is on (0 = ground). */
  floorIndex?: number;
  /** Optional raw geometry reference. */
  geometry?: {
    /** URI of raw scan asset (USDZ, PLY, etc.). */
    meshRef?: string;
    /** Axis-aligned bounding box expressed as [minX, minY, minZ, maxX, maxY, maxZ]. */
    bounds?: number[];
    /** Approximate floor area in m², as reported by the capture pipeline. */
    rawAreaM2?: number;
    /** Approximate ceiling height in metres, as reported by the capture pipeline. */
    rawHeightM?: number;
  };
  /** Provenance of this room's capture data. */
  provenance?: EvidenceProvenanceV1;
}

// ─── Spatial model ────────────────────────────────────────────────────────────

/**
 * Per-room geometry within the spatial model.
 */
export interface SpatialRoomGeometryV1 {
  /** Reference to the corresponding SessionRoomV1.roomId. */
  roomId: string;
  /** Calculated floor area in m². */
  areaM2?: number;
  /** Ceiling height in metres. */
  heightM?: number;
  /** Spatial confidence for this room's geometry. */
  confidence: SpatialConfidence;
}

/**
 * The spatial model produced by the LiDAR / RoomPlan scan.
 *
 * This is the 3-D representation of the property.  The raw asset is stored
 * externally and referenced by URI; only metadata and per-room summaries live
 * here.
 */
export interface SpatialModelV1 {
  /** URI of the 3-D scan asset (USDZ, point cloud, etc.). */
  modelRef?: string;
  /** Coordinate convention used in this model. */
  coordinateConvention: 'metric_m';
  /** ISO-8601 timestamp of when the spatial model was captured. */
  capturedAt: string;
  /** Overall spatial confidence for the model. */
  confidence: SpatialConfidence;
  /** Per-room geometry summaries. */
  rooms: SpatialRoomGeometryV1[];
}

// ─── Object markers ───────────────────────────────────────────────────────────

/**
 * Observable field categories for a placed object marker.
 *
 * These are capture categories — not engine system roles.
 */
export type ObjectMarkerKind =
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

/**
 * An object marker placed by the engineer during the survey.
 *
 * Object markers are the primary anchor for evidence.  Photos and notes
 * should prefer attaching to markers where possible.
 */
export interface ObjectMarkerV1 {
  /** Unique identifier (UUID string). */
  markerId: string;
  /** Category of system component or evidence point. */
  kind: ObjectMarkerKind;
  /** Optional human-readable label (e.g. "Worcester 30i", "TRV bedroom"). */
  label?: string;
  /** Optional reference to the room this marker is in. */
  roomId?: string;
  /** Optional position in scan coordinate space (metric metres). */
  position?: { x: number; y: number; z?: number };
  /** IDs of photos linked to this marker (must reference valid photo.photoId entries). */
  linkedPhotoIds: string[];
  /** IDs of notes linked to this marker (must reference valid note.noteId entries). */
  linkedNoteIds: string[];
  /** ISO-8601 timestamp of when this marker was placed. */
  createdAt: string;
  /** Provenance of this marker. */
  provenance: EvidenceProvenanceV1;
}

// ─── Photos ───────────────────────────────────────────────────────────────────

/**
 * A photo captured as evidence during the survey session.
 */
export interface SessionPhotoV1 {
  /** Unique identifier (UUID string). */
  photoId: string;
  /** Reference to an entry in the session assetManifest. */
  assetId?: string;
  /** URI of the full-resolution image (local or remote). */
  uri: string;
  /** URI of a smaller preview image. */
  thumbnailUri?: string;
  /** ISO-8601 timestamp of capture. */
  capturedAt: string;
  /** Optional reference to the room this photo was taken in. */
  roomId?: string;
  /** Optional reference to the object marker this photo documents. */
  objectMarkerId?: string;
  /** Optional semantic tags (e.g. 'data_plate', 'clearance', 'flue_terminal'). */
  tags?: string[];
  /** Optional free-text note entered at capture time. */
  note?: string;
  /** Provenance of this photo. */
  provenance: EvidenceProvenanceV1;
}

// ─── Transcript ───────────────────────────────────────────────────────────────

/**
 * A single segment of transcribed audio.
 */
export interface TranscriptSegmentV1 {
  /** Unique identifier (UUID string). */
  segmentId: string;
  /** Transcribed text for this segment. */
  text: string;
  /** ISO-8601 timestamp of when this segment started. */
  startedAt: string;
  /** ISO-8601 timestamp of when this segment ended. */
  endedAt?: string;
  /** Optional room context at time of recording. */
  roomId?: string;
  /** Optional object marker context at time of recording. */
  objectMarkerId?: string;
}

/**
 * Transcript of voice notes captured during the session.
 *
 * The canonical record is the text only.  Raw audio URIs, if retained, live
 * in the assetManifest and are not part of the handoff payload.
 */
export interface TranscriptV1 {
  /** Processing status of the transcript. */
  status: 'pending' | 'processing' | 'complete' | 'failed';
  /** Full transcribed text, once available. */
  text?: string;
  /** Ordered list of transcript segments, if segmented transcription is available. */
  segments?: TranscriptSegmentV1[];
}

// ─── Notes ────────────────────────────────────────────────────────────────────

/**
 * Semantic category for a session note.
 */
export type NoteCategoryV1 =
  | 'constraint'
  | 'observation'
  | 'preference'
  | 'risk'
  | 'follow_up';

/**
 * A text note captured during the survey session.
 *
 * Notes may be free-form observations, flagged constraints, or follow-up
 * actions.  They are separate from transcript segments — they are entered
 * deliberately, not derived from continuous audio.
 */
export interface SessionNoteV1 {
  /** Unique identifier (UUID string). */
  noteId: string;
  /** Note text. */
  text: string;
  /** ISO-8601 timestamp of creation. */
  createdAt: string;
  /** Optional room context. */
  roomId?: string;
  /** Optional object marker context. */
  objectMarkerId?: string;
  /** Optional semantic category. */
  category?: NoteCategoryV1;
}

// ─── Timeline events ──────────────────────────────────────────────────────────

/**
 * Type of a session timeline event.
 */
export type TimelineEventType =
  | 'session_started'
  | 'room_started'
  | 'room_completed'
  | 'object_placed'
  | 'photo_taken'
  | 'note_added'
  | 'session_completed'
  | 'session_exported';

/**
 * A single entry in the session timeline event stream.
 *
 * The timeline enables full replay, debugging, and explainability.
 */
export interface TimelineEventV1 {
  /** Unique identifier (UUID string). */
  eventId: string;
  /** Type of event. */
  type: TimelineEventType;
  /** ISO-8601 timestamp of the event. */
  timestamp: string;
  /** Room context at time of event, if applicable. */
  roomId?: string;
  /** Object marker context at time of event, if applicable. */
  objectId?: string;
}

// ─── Asset manifest ───────────────────────────────────────────────────────────

/**
 * Kind of asset referenced in the manifest.
 */
export type AssetKindV1 = 'photo' | 'spatial_model' | 'floor_plan' | 'audio';

/**
 * A single entry in the session asset manifest.
 *
 * All externally stored assets (photos, scan bundles, audio) are declared
 * here.  Evidence records reference assetId to link back to this manifest.
 */
export interface AssetManifestEntryV1 {
  /** Unique identifier for this asset (UUID string). */
  assetId: string;
  /** Kind of asset. */
  kind: AssetKindV1;
  /** URI of the asset (local file path or remote URL). */
  uri: string;
  /** MIME type of the asset (e.g. 'image/jpeg', 'model/vnd.usdz+zip'). */
  mimeType?: string;
  /** File size in bytes. */
  sizeBytes?: number;
  /** ISO-8601 timestamp of when this asset was captured. */
  capturedAt: string;
}

// ─── Device metadata ──────────────────────────────────────────────────────────

/**
 * Capture device and app metadata.
 */
export interface DeviceMetadataV1 {
  /** Mobile platform used for capture. */
  platform: 'ios';
  /** Device model identifier (e.g. "iPhone 15 Pro"). */
  model?: string;
  /** App version string (e.g. "3.0.0"). */
  appVersion?: string;
  /** Whether the device has a LiDAR sensor available. */
  lidarAvailable?: boolean;
}

// ─── Review state ─────────────────────────────────────────────────────────────

/**
 * Review lifecycle status.
 *
 * pending   — not yet submitted for review
 * in_review — submitted and under review
 * approved  — reviewed and approved for use in outputs
 * rejected  — reviewed and rejected; requires correction
 */
export type ReviewStatus = 'pending' | 'in_review' | 'approved' | 'rejected';

/**
 * Review and completion state for the capture session.
 *
 * Customer-facing outputs must only use evidence from sessions whose review
 * status is 'approved'.
 */
export interface ReviewStateV1 {
  /** Current review status. */
  status: ReviewStatus;
  /** Identifier of the reviewer (e.g. engineer ID or email). */
  reviewedBy?: string;
  /** ISO-8601 timestamp of when review was completed. */
  reviewedAt?: string;
  /** Free-text review notes. */
  notes?: string;
}

// ─── SessionCaptureV1 ─────────────────────────────────────────────────────────

/**
 * SessionCaptureV1 — the canonical scan handoff contract.
 *
 * This is the single top-level payload produced by Atlas Scan and consumed
 * by Atlas Mind.  It describes raw field observations from a single property
 * survey visit: rooms, objects, photos, transcript, notes, and a timeline.
 *
 * visitId and sessionId are always required; they are the authoritative
 * cross-system identifiers.
 *
 * What is NOT included:
 *   - Heat-loss outputs or U-value calculations
 *   - Recommendation scores or system selections
 *   - Proposal design state
 *   - Engine summaries or derived values
 *
 * Consumers (Atlas Mind) derive semantic models from this payload; they do
 * not mutate it.
 */
export interface SessionCaptureV1 {
  /** Contract discriminant — always 'atlas.scan.session.v1'. */
  schemaVersion: 'atlas.scan.session.v1';
  /**
   * Unique identifier for the property visit this session belongs to.
   *
   * Must match the visit record in Atlas Mind.  This is the authoritative
   * cross-system key linking the capture to the scheduled visit.
   */
  visitId: string;
  /** Unique identifier for this capture session (UUID string). */
  sessionId: string;
  /** Lifecycle status of the session. */
  status: SessionCaptureStatus;
  /** ISO-8601 timestamp of when capture started. */
  captureStartedAt: string;
  /** ISO-8601 timestamp of when capture completed (absent if still active). */
  captureCompletedAt?: string;
  /** Rooms visited during the session. */
  rooms: SessionRoomV1[];
  /** Spatial / 3-D model produced by the LiDAR scan, if available. */
  spatialModel?: SpatialModelV1;
  /** Object markers placed by the engineer. */
  objectMarkers: ObjectMarkerV1[];
  /** Photos taken as evidence. */
  photos: SessionPhotoV1[];
  /** Transcript of voice notes (text only; raw audio stays in assetManifest). */
  transcript?: TranscriptV1;
  /** Deliberate text notes entered during the session. */
  notes: SessionNoteV1[];
  /** Ordered timeline event stream (enables replay and explainability). */
  timelineEvents: TimelineEventV1[];
  /**
   * Manifest of all externally stored assets referenced by this session.
   *
   * Evidence records reference assetId to link back to this manifest.
   */
  assetManifest: AssetManifestEntryV1[];
  /** Capture device and app metadata. */
  device?: DeviceMetadataV1;
  /** Review and completion state. */
  review?: ReviewStateV1;
}

/**
 * A raw unknown input — used at the validation boundary before the payload
 * has been confirmed to match SessionCaptureV1.
 */
export type UnknownSessionCaptureV1 = Record<string, unknown>;
