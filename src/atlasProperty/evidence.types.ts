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

// ─── Vec3 ─────────────────────────────────────────────────────────────────────

/**
 * A 3-D vector / point in metres, used for spatial evidence positioning.
 *
 * x, y — horizontal plane.
 * z    — vertical (elevation) in metres.
 */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

// ─── SpatialEvidence3D ────────────────────────────────────────────────────────

/**
 * SpatialEvidence3D — an internal room scan captured as walkthrough evidence.
 *
 * Produced by RoomPlan / LiDAR-based indoor capture.  Stores the scan asset
 * and metadata only; no derived calculations or mutations to the building model
 * should flow from this type.
 *
 * Rules:
 *   - No derived maths from this asset
 *   - No direct mutation of AtlasRoomV1 from the scan model
 *   - File stored externally; only metadata lives in the canonical JSON
 *   - Visible in engineer and portal surfaces as evidence only
 */
export interface SpatialEvidence3D {
  /** Unique identifier (UUID string). */
  id: string;
  /** ID of the property this scan belongs to. */
  propertyId: string;
  /** ID of the capture session that produced this scan. */
  sourceSessionId: string;
  /** Discriminant — always 'internal_room_scan' for this type. */
  kind: 'internal_room_scan';
  /** File format of the 3D asset. */
  format: 'usdz' | 'glb' | 'realitykit';
  /** Remote URL of the 3D asset file. */
  fileUrl: string;
  /** Remote URL of a preview image (thumbnail) for the scan. */
  previewImageUrl?: string;
  /** IDs of the building-model rooms this scan is linked to. */
  linkedRoomIds?: string[];
  /** IDs of the thermal zones this scan is linked to. */
  linkedZoneIds?: string[];
  /** Approximate spatial extents of the captured area in metres. */
  bounds?: {
    width: number;
    length: number;
    height: number;
  };
  /** Capture device and session metadata. */
  captureMeta?: {
    /** Hardware identifier of the capture device (e.g. 'iPhone 15 Pro'). */
    device: string;
    /** ISO-8601 timestamp of capture. */
    timestamp: string;
    /** Capture confidence score in [0, 1]. */
    confidence?: number;
  };
}

// ─── ExternalClearanceSceneV1 ─────────────────────────────────────────────────

/**
 * ExternalClearanceSceneV1 — an outdoor flue-clearance compliance scene.
 *
 * Captured outside the property to tag the flue terminal, nearby openings,
 * and other features that affect flue-clearance compliance.  Compliance
 * logic runs from the structured measurements and tagged features, not from
 * raw point-cloud geometry.
 *
 * Rules:
 *   - Compliance logic must use structured measurements / tagged features only
 *   - Point cloud / mesh are optional evidence assets
 *   - No raw point-cloud parsing in report rendering
 *   - No large binary blobs inlined into the JSON payload
 */
export interface ExternalClearanceSceneV1 {
  /** Unique identifier (UUID string). */
  id: string;
  /** ID of the property this scene belongs to. */
  propertyId: string;
  /** ID of the capture session that produced this scene. */
  sourceSessionId: string;
  /** Discriminant — always 'external_flue_clearance' for this type. */
  kind: 'external_flue_clearance';
  /** Optional remote evidence assets (preview, mesh, point cloud). */
  evidence: {
    /** Remote URL of a preview image for the scene. */
    previewImageUrl?: string;
    /** Remote URL of a 3D mesh / scene model. */
    modelUrl?: string;
    /** Remote URL of a raw point-cloud asset (evidence only). */
    pointCloudUrl?: string;
  };
  /** Spatial description of the flue terminal location. */
  flueTerminal?: {
    /** Terminal position in scene coordinate space. */
    position3D?: Vec3;
    /** Outward normal vector of the terminal face. */
    normal?: Vec3;
    /** Height of the terminal above ground level in metres. */
    heightAboveGroundM?: number;
  };
  /** Nearby features tagged during the outdoor capture. */
  nearbyFeatures: Array<{
    /** Unique identifier for this feature (UUID string). */
    id: string;
    /** Classification of the nearby feature. */
    type:
      | 'window'
      | 'door'
      | 'air_brick'
      | 'boundary'
      | 'eaves'
      | 'gutter'
      | 'soil_stack'
      | 'opening'
      | 'adjacent_flue'
      | 'balcony';
    /** Position of the feature in scene coordinate space. */
    position3D?: Vec3;
    /** Measured or derived distance from the terminal to this feature in metres. */
    distanceToTerminalM?: number;
    /** Free-text notes about this feature. */
    notes?: string;
  }>;
  /** Structured measurements between the terminal and tagged features. */
  measurements: Array<{
    /** Unique identifier for this measurement (UUID string). */
    id: string;
    /** What is being measured. */
    kind: 'terminal_to_opening' | 'terminal_to_boundary' | 'terminal_to_eaves';
    /** Measurement value in metres. */
    valueM: number;
    /** Whether the value was directly measured or computationally derived. */
    source: 'measured' | 'derived';
  }>;
  /** Compliance outcome derived from the structured measurements. */
  compliance?: {
    /** Reference to the gas-safety / building standard applied (e.g. 'BS 5440-1'). */
    standardRef?: string;
    /** Human-readable compliance warnings. */
    warnings?: string[];
    /** Overall pass/fail outcome. */
    pass?: boolean;
  };
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
  /**
   * Internal room scan evidence captured using RoomPlan / LiDAR.
   * Optional; absent if no indoor 3D scan has been performed for this property.
   */
  spatialEvidence3d?: SpatialEvidence3D[];
  /**
   * External flue-clearance scenes captured outside the property.
   * Optional; absent if no outdoor clearance scan has been performed.
   */
  externalClearanceScenes?: ExternalClearanceSceneV1[];
}
