/**
 * types.ts
 *
 * Versioned scan bundle contract definitions.
 *
 * These types represent the external boundary between any future native scan
 * client (e.g. an iOS RoomPlan companion app) and the Atlas web app.
 *
 * IMPORTANT: This package defines only the incoming scan contract and its
 * validation boundary.  Atlas remains the owner of canonical truth and
 * importer / mapping behaviour.
 *
 * The current supported contract version is "1.0".
 */

// ─── Coordinate conventions ───────────────────────────────────────────────────

/**
 * Coordinate convention used in the scan bundle.
 *
 * 'metric_m' — SI metres, right-handed coordinate system, Y-up (default for
 *   RoomPlan-style outputs).  The Atlas importer normalises to canvas units.
 */
export type ScanCoordinateConvention = 'metric_m';

// ─── Quality / confidence ─────────────────────────────────────────────────────

/**
 * Banded confidence rating for a scanned entity.
 *
 * high   — scanner had good coverage, measurement uncertainty < 5 cm
 * medium — partial coverage or occlusion, uncertainty 5–20 cm
 * low    — estimated / inferred, uncertainty > 20 cm or reconstruction artefact
 */
export type ScanConfidenceBand = 'high' | 'medium' | 'low';

/**
 * A QA flag attached to a scanned entity or to the whole bundle.
 *
 * code      — machine-readable flag code
 * message   — human-readable description
 * severity  — 'info' | 'warning' | 'error'
 * entityId  — optional reference to the affected entity within the bundle
 */
export interface ScanQAFlag {
  code: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  entityId?: string;
}

// ─── Scan geometry primitives ─────────────────────────────────────────────────

/**
 * A 2-D point in scan coordinate space (before normalisation to Atlas canvas
 * units).
 *
 * x, y — horizontal-plane coordinates in metres (origin arbitrary, set by
 *         scanner).
 */
export interface ScanPoint2D {
  x: number;
  y: number;
}

/**
 * A 3-D point in scan coordinate space.
 *
 * x, y — horizontal plane.
 * z    — vertical (elevation) in metres.
 */
export interface ScanPoint3D extends ScanPoint2D {
  z: number;
}

// ─── Opening (door / window) ──────────────────────────────────────────────────

/**
 * An opening detected on a wall by the scanner.
 *
 * widthM   — detected opening width in metres
 * heightM  — detected opening height in metres (0 if not captured)
 * offsetM  — distance from the wall's start point to the opening centre
 * type     — 'door' | 'window' | 'unknown'
 * confidence — scanner confidence in this detection
 */
export interface ScanOpening {
  id: string;
  widthM: number;
  heightM: number;
  offsetM: number;
  type: 'door' | 'window' | 'unknown';
  confidence: ScanConfidenceBand;
}

// ─── Wall ────────────────────────────────────────────────────────────────────

/**
 * A wall segment detected by the scanner.
 *
 * start / end    — endpoints in scan coordinate space (metric_m)
 * heightM        — wall height (ceiling-to-floor) in metres; 0 if not captured
 * thicknessMm    — estimated wall thickness in millimetres; 0 if unknown
 * kind           — 'internal' | 'external' | 'unknown'
 * openings       — detected openings (doors / windows) on this wall
 * confidence     — scanner confidence in this wall segment
 */
export interface ScanWall {
  id: string;
  start: ScanPoint3D;
  end: ScanPoint3D;
  heightM: number;
  thicknessMm: number;
  kind: 'internal' | 'external' | 'unknown';
  openings: ScanOpening[];
  confidence: ScanConfidenceBand;
}

// ─── Detected object ──────────────────────────────────────────────────────────

/**
 * An object detected in the room by the scanner (furniture, fixtures, etc.).
 *
 * category    — broad class of the object (e.g. 'furniture', 'appliance')
 * label       — scanner's best-guess label (e.g. 'sofa', 'washing_machine')
 * boundingBox — axis-aligned bounding box in scan coordinate space
 * confidence  — scanner confidence in this detection
 */
export interface ScanDetectedObject {
  id: string;
  category: string;
  label: string;
  boundingBox: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  };
  confidence: ScanConfidenceBand;
}

// ─── Anchor ───────────────────────────────────────────────────────────────────

/**
 * A georeferencing anchor that links scan coordinate space to the real world.
 *
 * type         — 'gps' | 'qr_code' | 'manual' | 'unknown'
 * position     — anchor position in scan coordinate space
 * realWorldRef — optional external reference (e.g. GPS coordinate, QR payload)
 * confidence   — how reliable this anchor is
 *
 * Anchors are optional.  If absent the importer treats the origin as arbitrary.
 */
export interface ScanAnchor {
  id: string;
  type: 'gps' | 'qr_code' | 'manual' | 'unknown';
  position: ScanPoint3D;
  realWorldRef?: string;
  confidence: ScanConfidenceBand;
}

// ─── Room ─────────────────────────────────────────────────────────────────────

/**
 * A room captured by the scanner.
 *
 * label           — scanner's suggested room label (free-text; may be empty)
 * floorIndex      — which storey this room is on (0 = ground, 1 = first, etc.)
 * polygon         — floor polygon boundary in scan coordinate space (metric_m)
 * areaM2          — calculated floor area in m²
 * heightM         — ceiling height in metres
 * walls           — walls bounding this room
 * detectedObjects — objects detected inside this room
 * confidence      — scanner confidence in the overall room geometry
 */
export interface ScanRoom {
  id: string;
  label: string;
  floorIndex: number;
  polygon: ScanPoint2D[];
  areaM2: number;
  heightM: number;
  walls: ScanWall[];
  detectedObjects: ScanDetectedObject[];
  confidence: ScanConfidenceBand;
}

// ─── Scan metadata ────────────────────────────────────────────────────────────

/**
 * Metadata about the scan session that produced this bundle.
 *
 * capturedAt            — ISO-8601 timestamp of when the scan was taken
 * deviceModel           — scanner hardware identifier (e.g. 'iPhone 15 Pro')
 * scannerApp            — app name and version (e.g. 'AtlasScan 1.0.0')
 * coordinateConvention  — coordinate system used in this bundle
 * propertyRef           — optional Atlas property / visit ID this scan is for
 * operatorNotes         — free-text notes from the operator
 */
export interface ScanMeta {
  capturedAt: string;
  deviceModel: string;
  scannerApp: string;
  coordinateConvention: ScanCoordinateConvention;
  propertyRef?: string;
  operatorNotes?: string;
}

// ─── Top-level bundle ─────────────────────────────────────────────────────────

/**
 * ScanBundleV1 — the raw scan-geometry payload sent from a scan client.
 *
 * This type carries **only** the geometry and scan metadata produced by the
 * scanner: rooms, walls, anchors, QA flags, and scan session metadata.
 *
 * Session-level artefacts captured during the same visit (voice notes, photos,
 * tagged objects, etc.) belong on VisitCapture, not here.  Keeping this type
 * focused on raw scan geometry ensures the contract boundary remains clear.
 *
 * version  — contract version string; must be one of SUPPORTED_SCAN_BUNDLE_VERSIONS.
 *            The importer rejects bundles whose version is not supported.
 * bundleId — unique identifier for this bundle (generated by the scan client).
 * rooms    — list of captured rooms.
 * anchors  — optional georeferencing anchors.
 * qaFlags  — QA flags raised by the scan client during capture.
 * meta     — capture session metadata.
 */
export interface ScanBundleV1 {
  version: '1.0';
  bundleId: string;
  rooms: ScanRoom[];
  anchors: ScanAnchor[];
  qaFlags: ScanQAFlag[];
  meta: ScanMeta;
}

/**
 * ScanBundle — discriminated union of all versioned scan bundle shapes.
 *
 * Use this type when accepting an unknown bundle (e.g. from a file or network).
 * The importer inspects the `version` field to select the correct handler.
 *
 * Note: ScanBundle / ScanBundleV1 carries only raw scan geometry.
 * For the complete portable visit artifact (scan + voice notes + future artefacts)
 * use VisitCapture.
 */
export type ScanBundle = ScanBundleV1;

/**
 * A raw unknown input — used at the validation boundary before the bundle has
 * been confirmed to match any versioned contract.
 */
export type UnknownScanBundle = Record<string, unknown>;

// ─── Voice note types ─────────────────────────────────────────────────────────

/**
 * Semantic category of a voice note.
 *
 * observation        — a general field observation
 * customerPreference — a captured customer preference or request
 * installConstraint  — an installation constraint noted during capture
 * risk               — a risk item flagged during capture
 * followUp           — a follow-up action to be taken after the visit
 * other              — uncategorised note
 */
export type VoiceNoteKind =
  | 'observation'
  | 'customerPreference'
  | 'installConstraint'
  | 'risk'
  | 'followUp'
  | 'other';

/**
 * Status of an automatic speech-to-text transcript for a voice note.
 *
 * notRequested — no transcript has been requested
 * pending      — transcript has been requested and is being processed
 * complete     — transcript is available
 * failed       — transcription attempt failed
 */
export type TranscriptStatus = 'notRequested' | 'pending' | 'complete' | 'failed';

/**
 * Upload / remote synchronisation state of a voice note asset.
 *
 * localOnly — audio exists only on the local device; not yet queued for upload
 * queued    — queued for upload but not yet transferred
 * uploaded  — successfully uploaded to remote storage
 * failed    — upload attempt failed; retry may be possible
 */
export type VoiceNoteSyncState = 'localOnly' | 'queued' | 'uploaded' | 'failed';

/**
 * A portable voice note attached to a visit session.
 *
 * A VoiceNote may be linked to an individual room (linkedRoomID) or a detected
 * object (linkedObjectID), or it may stand as a session-level note when both
 * link fields are absent.
 *
 * All optional fields are absent-safe: older payloads that lack them remain
 * decodable.  transcriptStatus defaults to 'notRequested' and syncState
 * defaults to 'localOnly' when not present.
 */
export interface VoiceNote {
  /** Unique identifier for this voice note (UUID string). */
  id: string;
  /** ISO-8601 timestamp of when the note was recorded. */
  createdAt: string;
  /** Duration of the audio recording in seconds. */
  duration: number;
  /** Local audio filename (on-device; may be absent in remote payloads). */
  localFilename?: string;
  /** Remote asset identifier once the audio has been uploaded. */
  remoteAssetID?: string;
  /** ID of the room this note is linked to, if any (UUID string). */
  linkedRoomID?: string;
  /** ID of the detected object this note is linked to, if any (UUID string). */
  linkedObjectID?: string;
  /** Semantic category of this note. */
  kind: VoiceNoteKind;
  /** Optional free-text caption supplied by the operator. */
  caption?: string;
  /** Transcript text, once available. */
  transcript?: string;
  /** Current status of the speech-to-text transcript. */
  transcriptStatus: TranscriptStatus;
  /** Current upload / remote sync state. */
  syncState: VoiceNoteSyncState;
  /**
   * Verbatim snippet from the transcript that triggered a fact extraction.
   *
   * When the SessionKnowledgeExtractor derives a structured fact from this
   * voice note (e.g. household composition, boiler age), this field carries
   * the exact transcript segment responsible for that extraction.  Displaying
   * this snippet to the user ("You mentioned 'three kids'…") lets them verify
   * and, if needed, correct the extracted fact immediately.
   *
   * Absent when no fact has been extracted, or when the triggering snippet
   * cannot be isolated.
   */
  triggerSnippet?: string;
}

// ─── Visit capture ────────────────────────────────────────────────────────────

/**
 * VisitCapture — the portable top-level artifact for a complete property visit session.
 *
 * A VisitCapture wraps the raw scan-geometry bundle (ScanBundleV1) and augments
 * it with session-level artefacts such as voice notes.  Future artefact types
 * (photos, tagged objects, issues, session metadata) will also be added here,
 * not to ScanBundleV1.
 *
 * scanBundle  — the raw scan-geometry bundle captured during this visit
 * voiceNotes  — voice notes recorded during the visit session (optional; defaults to [])
 */
export interface VisitCapture {
  scanBundle: ScanBundleV1;
  voiceNotes?: VoiceNote[];
}

// ─── SessionCaptureV1 ─────────────────────────────────────────────────────────
//
// A UI-agnostic, session-based capture contract that represents the structured
// memory of a house survey.  It describes what was captured — rooms, objects,
// evidence, and timeline — without encoding any UI concepts.
//
// Design principles:
//   - Session is the root of truth; everything hangs off a session.
//   - Room provides context, not containment; objects may exist before room
//     assignment.
//   - Object is the primary anchor for evidence (photos + notes).
//   - Audio is captured continuously; markers provide in-session structure.
//   - Timeline (events) enables replay, debugging, and explainability.
//
// This feeds Atlas ingestion, engineer reports, customer portal, and the
// recommendation engine.

/**
 * Lifecycle status of a capture session.
 *
 * active  — capture is in progress
 * review  — capture complete; awaiting operator review
 * ready   — reviewed and ready for Atlas ingestion
 * synced  — successfully ingested by Atlas
 */
export type SessionStatusV1 = 'active' | 'review' | 'ready' | 'synced';

/**
 * Lifecycle status of a captured room.
 *
 * active   — room capture is in progress
 * complete — room capture is complete
 */
export type RoomStatusV1 = 'active' | 'complete';

/**
 * Type of a captured object (heating / plumbing system components).
 */
export type CapturedObjectType =
  | 'radiator'
  | 'boiler'
  | 'cylinder'
  | 'thermostat'
  | 'flue'
  | 'pipe'
  | 'consumer_unit'
  | 'other';

/**
 * Confidence level of a 3D anchor placement.
 *
 * Values are expressed as a number in [0, 1] where 1 = highest confidence.
 */
export type AnchorConfidence = number;

/**
 * Placement status of a captured object.
 *
 * placed    — object has been placed in the scene (initial position)
 * confirmed — operator has confirmed the object's position and type
 */
export type CapturedObjectStatus = 'placed' | 'confirmed';

/**
 * Evidence scope for a photo — whether it documents the whole session, a
 * specific room, or a specific object.
 */
export type PhotoScope = 'session' | 'room' | 'object';

/**
 * Semantic category of a note marker.
 *
 * constraint   — installation or access constraint
 * observation  — general field observation
 * preference   — captured customer preference or request
 * risk         — a risk item noted during capture
 * follow_up    — a follow-up action to be taken after the visit
 */
export type NoteMarkerCategory =
  | 'constraint'
  | 'observation'
  | 'preference'
  | 'risk'
  | 'follow_up';

/**
 * Type of a session timeline event.
 */
export type SessionEventType =
  | 'room_assigned'
  | 'object_added'
  | 'photo_taken'
  | 'note_marker_added'
  | 'room_finished';

/**
 * RoomV1 — a room captured during a survey session.
 *
 * Room provides context (label, status, optional geometry) rather than acting
 * as a strict container.  Objects may exist before being assigned to a room.
 *
 * roomId   — unique identifier for this room (UUID string)
 * label    — human-readable room label (e.g. "Kitchen", "Boiler Room")
 * status   — 'active' | 'complete'
 * geometry — optional spatial data (mesh reference and bounding coordinates)
 */
export interface RoomV1 {
  roomId: string;
  label: string;
  status: RoomStatusV1;
  geometry?: {
    meshRef?: string;
    bounds?: number[];
  };
}

/**
 * ObjectV1 — a captured heating / plumbing object that anchors evidence.
 *
 * Object is the primary carrier of meaning within a session.  Photos and note
 * markers should prefer attaching to objects where possible.
 *
 * objectId        — unique identifier (UUID string)
 * type            — the kind of system component captured
 * roomId          — optional reference to the room the object is in
 * anchor          — optional 3D placement in scene coordinate space
 * status          — 'placed' | 'confirmed'
 * metadata        — optional subtype and free-text notes
 * photoIds        — IDs of photos attached to this object
 * noteMarkerIds   — IDs of note markers attached to this object
 */
export interface ObjectV1 {
  objectId: string;
  type: CapturedObjectType;
  roomId?: string;
  anchor?: {
    position?: [number, number, number];
    normal?: [number, number, number];
    confidence?: AnchorConfidence;
  };
  status: CapturedObjectStatus;
  metadata?: {
    subtype?: string;
    notes?: string;
  };
  photoIds: string[];
  noteMarkerIds: string[];
}

/**
 * PhotoV1 — a photo captured as evidence during the session.
 *
 * Photos are evidence-first: they may document the session as a whole, a
 * specific room, or a specific object.
 *
 * photoId   — unique identifier (UUID string)
 * uri       — local or remote URI of the image asset
 * createdAt — ISO-8601 timestamp of capture
 * scope     — 'session' | 'room' | 'object'
 * roomId    — required when scope is 'room'
 * objectId  — required when scope is 'object'
 * tags      — optional semantic tags (e.g. 'data_plate', 'clearance', 'condition')
 */
export interface PhotoV1 {
  photoId: string;
  uri: string;
  createdAt: string;
  scope: PhotoScope;
  roomId?: string;
  objectId?: string;
  tags?: string[];
}

/**
 * AudioSegmentV1 — a single segment of continuous audio captured during the session.
 *
 * segmentId — unique identifier (UUID string)
 * uri       — local or remote URI of the audio asset
 * startedAt — ISO-8601 timestamp of segment start
 * endedAt   — ISO-8601 timestamp of segment end
 */
export interface AudioSegmentV1 {
  segmentId: string;
  uri: string;
  startedAt: string;
  endedAt: string;
}

/**
 * AudioV1 — continuous audio capture data for the session.
 *
 * Audio is always captured in 'continuous' mode during a session.  Individual
 * segments cover the full session timeline and are used for transcription and
 * marker context.
 *
 * mode          — always 'continuous'
 * segments      — ordered list of audio segments
 * transcription — optional transcription state and text
 */
export interface AudioV1 {
  mode: 'continuous';
  segments: AudioSegmentV1[];
  transcription?: {
    status: 'pending' | 'processing' | 'complete';
    text?: string;
  };
}

/**
 * NoteMarkerV1 — a timestamped marker placed during the session to flag a
 * point of interest in the audio timeline.
 *
 * markerId  — unique identifier (UUID string)
 * createdAt — ISO-8601 timestamp of marker creation
 * roomId    — optional room context at time of marker
 * objectId  — optional object context at time of marker
 * category  — optional semantic category
 * text      — optional quick label or short note
 */
export interface NoteMarkerV1 {
  markerId: string;
  createdAt: string;
  roomId?: string;
  objectId?: string;
  category?: NoteMarkerCategory;
  text?: string;
}

/**
 * SessionEventV1 — a single entry in the session timeline event stream.
 *
 * The event stream provides full replay capability, debugging, and
 * explainability for Atlas engineers.
 *
 * eventId   — unique identifier (UUID string)
 * type      — the kind of event that occurred
 * timestamp — ISO-8601 timestamp of the event
 * roomId    — room context at time of event (if applicable)
 * objectId  — object context at time of event (if applicable)
 */
export interface SessionEventV1 {
  eventId: string;
  type: SessionEventType;
  timestamp: string;
  roomId?: string;
  objectId?: string;
}

/**
 * SessionCaptureV1 — the top-level capture contract for a structured house
 * survey session.
 *
 * This is the root of truth for a complete Atlas capture session.  It
 * describes what was captured (rooms, objects, photos, audio, note markers,
 * and a timeline of events) without encoding any UI-specific concepts.
 *
 * version      — contract version string; always '1.0'
 * sessionId    — unique identifier for this session (UUID string)
 * startedAt    — ISO-8601 timestamp of session start
 * updatedAt    — ISO-8601 timestamp of last update
 * completedAt  — ISO-8601 timestamp of session completion (absent if active)
 * status       — current lifecycle status of the session
 * property     — optional property address information
 * rooms        — rooms visited during the session
 * objects      — captured system objects (radiators, boilers, etc.)
 * photos       — photos taken as evidence
 * audio        — continuous audio capture data
 * notes        — timestamped note markers placed during the session
 * events       — ordered timeline event stream (enables replay / debugging)
 * device       — optional device and app metadata
 */
export interface SessionCaptureV1 {
  version: '1.0';
  sessionId: string;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  status: SessionStatusV1;
  property?: {
    address?: string;
    postcode?: string;
  };
  rooms: RoomV1[];
  objects: ObjectV1[];
  photos: PhotoV1[];
  audio: AudioV1;
  notes: NoteMarkerV1[];
  events: SessionEventV1[];
  device?: {
    model?: string;
    os?: string;
    appVersion?: string;
  };
}

/**
 * A raw unknown input — used at the validation boundary before the session
 * capture has been confirmed to match the versioned contract.
 */
export type UnknownSessionCapture = Record<string, unknown>;

// ─── Scan import conflict types ───────────────────────────────────────────────
//
// When a LiDAR scan bundle is imported into a property record that already
// has manually-entered field values, discrepancies between the two may arise
// (e.g. the engineer measured a room as 12 m² but the scan reads 14.2 m²).
//
// These types represent the structured output of the conflict-detection step
// in the scan import pipeline.  A Conflict Resolution UI can present each
// ScanImportConflictItemV1 to the user as a side-by-side choice rather than
// silently overwriting the existing value.

/**
 * The kind of value discrepancy detected during scan import.
 *
 * area_mismatch    — floor area differs between manual entry and scan
 * height_mismatch  — ceiling height differs
 * opening_mismatch — an opening (door/window) count or dimension differs
 * other            — any other field-level discrepancy
 */
export type ScanImportConflictKind =
  | 'area_mismatch'
  | 'height_mismatch'
  | 'opening_mismatch'
  | 'other';

/**
 * The two competing values for a single conflicting field.
 *
 * fieldPath   — dot-notation path to the conflicting field
 *               (e.g. "building.rooms[2].areaM2")
 * manualValue — the value already stored in the property record
 * scanValue   — the value detected by the LiDAR scan
 * unit        — optional SI unit label (e.g. 'm²', 'm')
 */
export interface ScanImportConflictFieldV1 {
  fieldPath: string;
  manualValue: unknown;
  scanValue: unknown;
  unit?: string;
}

/**
 * A single detected conflict between manual data and an incoming scan.
 *
 * conflictId  — unique identifier for this conflict item (UUID string)
 * kind        — category of the discrepancy
 * roomId      — the room affected, if the conflict is room-scoped
 * field       — the specific field that differs and its two values
 * detectedAt  — ISO-8601 timestamp of when the conflict was detected
 */
export interface ScanImportConflictItemV1 {
  conflictId: string;
  kind: ScanImportConflictKind;
  roomId?: string;
  field: ScanImportConflictFieldV1;
  detectedAt: string;
}

/**
 * The full set of conflicts produced by a single scan import operation.
 *
 * A non-empty `conflicts` array indicates that the Conflict Resolution UI
 * should be shown before applying the scan data to the property record.
 *
 * bundleId    — ID of the incoming ScanBundleV1 that triggered conflicts
 * propertyId  — ID of the AtlasPropertyV1 being updated
 * conflicts   — ordered list of detected conflicts (empty ⟹ no conflicts)
 * generatedAt — ISO-8601 timestamp of when this conflict set was produced
 */
export interface ScanImportConflictSetV1 {
  bundleId: string;
  propertyId: string;
  conflicts: ScanImportConflictItemV1[];
  generatedAt: string;
}

// ─── Install markup models ────────────────────────────────────────────────────
//
// Canonical models for structured install markup produced by the scan app and
// consumed by the recommendation engine.  These types are the shared contract
// that decouples capture intent (atlas-scans-ios) from interpretation
// (atlas-recommendation) and ensures one portable, engine-readable truth.
//
// Design principles:
//   - All spatial data is in scan coordinate space (metric_m, Y-up).
//   - Confidence distinguishes measured geometry from drawn or estimated intent.
//   - Layers separate existing system state from proposed changes.

/**
 * Type of an install object placed on a floor plan or wall photo.
 *
 * Extensible: the 'other' variant captures types not yet enumerated.
 */
export type InstallObjectType =
  | 'boiler'
  | 'cylinder'
  | 'radiator'
  | 'thermostat'
  | 'flue'
  | 'pump'
  | 'valve'
  | 'consumer_unit'
  | 'other';

/**
 * Source of an install object placement.
 *
 * scan     — derived from LiDAR / RoomPlan geometry
 * manual   — placed manually by the engineer via gesture
 * inferred — inferred by the engine from surrounding context
 */
export type InstallObjectSource = 'scan' | 'manual' | 'inferred';

/**
 * A 3-D size in metres.
 *
 * These are object-local dimensions, not world-space axes.
 * widthM, depthM, heightM describe the bounding box extents
 * independent of the object's orientation in scan coordinate space.
 */
export interface InstallDimensions {
  /** Width (horizontal extent, e.g. left-to-right) in metres. */
  widthM: number;
  /** Depth (horizontal extent, e.g. front-to-back) in metres. */
  depthM: number;
  /** Height (vertical extent) in metres. */
  heightM: number;
}

/**
 * Orientation of an install object expressed as a rotation in degrees about
 * the vertical (Z) axis relative to the scan coordinate frame.
 */
export interface InstallOrientation {
  /** Rotation about the Z axis in degrees (0–360). */
  yawDeg: number;
}

/**
 * InstallObjectModelV1 — a single install object placed on a floor plan or
 * wall photo.
 *
 * id          — unique identifier (UUID string)
 * type        — category of system component
 * position    — centre position in scan coordinate space (metric_m)
 * dimensions  — approximate bounding dimensions in metres
 * orientation — rotational orientation about the vertical axis
 * source      — how the placement was derived
 */
export interface InstallObjectModelV1 {
  id: string;
  type: InstallObjectType;
  position: ScanPoint3D;
  dimensions: InstallDimensions;
  orientation: InstallOrientation;
  source: InstallObjectSource;
}

/**
 * Kind of an install route, reflecting the service carried by the pipe or
 * cable run.
 *
 * flow    — primary flow (heating / hot water)
 * return  — return leg
 * gas     — gas supply pipe
 * cold    — cold water supply
 * hot     — hot water distribution
 * flue    — flue / exhaust run
 * other   — uncategorised route
 */
export type InstallRouteKind =
  | 'flow'
  | 'return'
  | 'gas'
  | 'cold'
  | 'hot'
  | 'flue'
  | 'other';

/**
 * How a pipe run is mounted / concealed.
 *
 * surface — exposed on wall or floor surface
 * boxed   — enclosed in a boxing or duct
 * buried  — buried in floor screed or wall chase
 * other   — other mounting arrangement
 */
export type InstallMounting = 'surface' | 'boxed' | 'buried' | 'other';

/**
 * Confidence level of a route path.
 *
 * measured  — path derived from scan geometry (highest confidence)
 * drawn     — path drawn manually by the engineer
 * estimated — path inferred or approximated
 */
export type InstallRouteConfidence = 'measured' | 'drawn' | 'estimated';

/**
 * A single waypoint on an install route path.
 *
 * Extends ScanPoint3D with an optional elevation offset that can represent a
 * pipe rising to ceiling height independently of the scan-space Z axis.
 */
export interface InstallPathPoint extends ScanPoint3D {
  /** Optional elevation above floor level in metres (supplements z). */
  elevationOffsetM?: number;
}

/**
 * InstallRouteModelV1 — a routed pipe or cable run between two or more points.
 *
 * id         — unique identifier (UUID string)
 * kind       — service type carried by this route
 * diameterMm — nominal pipe / conduit diameter in millimetres
 * path       — ordered sequence of waypoints defining the route geometry
 * mounting   — how the route is mounted or concealed
 * confidence — how the path geometry was derived
 */
export interface InstallRouteModelV1 {
  id: string;
  kind: InstallRouteKind;
  diameterMm: number;
  path: InstallPathPoint[];
  mounting: InstallMounting;
  confidence: InstallRouteConfidence;
}

/**
 * A spatial annotation attached to an install layer (e.g. a constraint note
 * or measurement label placed on the plan).
 *
 * id       — unique identifier (UUID string)
 * text     — free-text annotation content
 * position — optional spatial anchor in scan coordinate space
 */
export interface InstallAnnotation {
  id: string;
  text: string;
  position?: ScanPoint3D;
}

/**
 * InstallLayerModelV1 — a layered view of install routes separating existing
 * system pipework from proposed new routes.
 *
 * existing — routes that are already installed in the property
 * proposed — routes being planned as part of the new installation
 * notes    — spatial annotations attached to this layer (constraints,
 *            measurements, labels)
 *
 * This separation is key: it lets the recommendation engine reason about
 * re-use of existing routes versus the cost and complexity of new routes,
 * and lets reports show clear "before / after" overlays.
 */
export interface InstallLayerModelV1 {
  existing: InstallRouteModelV1[];
  proposed: InstallRouteModelV1[];
  notes: InstallAnnotation[];
}

