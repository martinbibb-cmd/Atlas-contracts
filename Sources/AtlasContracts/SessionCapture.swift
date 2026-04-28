// SessionCapture.swift
//
// SessionCaptureV1 — the top-level capture contract for a structured house
// survey session.
//
// This contract represents what was captured during a survey (rooms, objects,
// evidence, and timeline) without encoding any UI-specific concepts.
//
// Design principles:
//   - Session is the root of truth; everything hangs off a session.
//   - Room provides context, not containment; objects may exist before room
//     assignment.
//   - Object is the primary anchor for evidence (photos + notes).
//   - Audio is captured continuously; markers provide in-session structure.
//   - Timeline (events) enables replay, debugging, and explainability.
//
// IMPORTANT: This file defines only the shared contract boundary.
// App-layer concerns (UI state, navigation, view models, recorder state)
// must not appear here.

import Foundation

// MARK: - Session status

/// Lifecycle status of a capture session.
///
/// - `active`:  capture is in progress
/// - `review`:  capture complete; awaiting operator review
/// - `ready`:   reviewed and ready for Atlas ingestion
/// - `synced`:  successfully ingested by Atlas
public enum SessionStatusV1: String, Codable, Sendable, Equatable {
    case active
    case review
    case ready
    case synced
}

// MARK: - Room

/// Lifecycle status of a captured room.
///
/// - `active`:   room capture is in progress
/// - `complete`: room capture is complete
public enum RoomStatusV1: String, Codable, Sendable, Equatable {
    case active
    case complete
}

/// RoomV1 — a room captured during a survey session.
///
/// Room provides context (label, status, optional geometry) rather than acting
/// as a strict container.  Objects may exist before being assigned to a room.
public struct RoomV1: Codable, Sendable, Equatable {
    /// Unique identifier for this room (UUID string).
    public let roomId: String
    /// Human-readable room label (e.g. "Kitchen", "Boiler Room").
    public let label: String
    /// Lifecycle status of the room.
    public let status: RoomStatusV1
    /// Optional spatial data (mesh reference and bounding coordinates).
    public let geometry: RoomGeometry?

    /// Optional spatial data for a room.
    public struct RoomGeometry: Codable, Sendable, Equatable {
        /// Optional reference to the room mesh asset.
        public let meshRef: String?
        /// Optional bounding coordinates in scene space.
        public let bounds: [Double]?

        public init(meshRef: String? = nil, bounds: [Double]? = nil) {
            self.meshRef = meshRef
            self.bounds = bounds
        }
    }

    public init(
        roomId: String,
        label: String,
        status: RoomStatusV1,
        geometry: RoomGeometry? = nil
    ) {
        self.roomId = roomId
        self.label = label
        self.status = status
        self.geometry = geometry
    }
}

// MARK: - Object

/// Type of a captured object (heating / plumbing system components).
public enum CapturedObjectType: String, Codable, Sendable, Equatable {
    case radiator
    case boiler
    case cylinder
    case thermostat
    case flue
    case pipe
    case consumerUnit = "consumer_unit"
    case other
}

/// Placement status of a captured object.
///
/// - `placed`:    object has been placed in the scene (initial position)
/// - `confirmed`: operator has confirmed the object's position and type
public enum CapturedObjectStatus: String, Codable, Sendable, Equatable {
    case placed
    case confirmed
}

/// 3D anchor data for a captured object.
public struct CapturedObjectAnchor: Codable, Sendable, Equatable {
    /// Position of the object in scene coordinate space (x, y, z in metres).
    public let position: [Double]?
    /// Surface normal at the anchor point (x, y, z unit vector).
    public let normal: [Double]?
    /// Confidence level of the placement (0–1).
    public let confidence: Double?

    public init(
        position: [Double]? = nil,
        normal: [Double]? = nil,
        confidence: Double? = nil
    ) {
        self.position = position
        self.normal = normal
        self.confidence = confidence
    }
}

/// Additional metadata for a captured object.
public struct CapturedObjectMetadata: Codable, Sendable, Equatable {
    /// Optional subtype or model information.
    public let subtype: String?
    /// Optional free-text notes from the operator.
    public let notes: String?

    public init(subtype: String? = nil, notes: String? = nil) {
        self.subtype = subtype
        self.notes = notes
    }
}

/// ObjectV1 — a captured heating / plumbing object that anchors evidence.
///
/// Object is the primary carrier of meaning within a session.  Photos and note
/// markers should prefer attaching to objects where possible.
public struct ObjectV1: Codable, Sendable, Equatable {
    /// Unique identifier for this object (UUID string).
    public let objectId: String
    /// The kind of system component captured.
    public let type: CapturedObjectType
    /// Optional reference to the room the object is in (UUID string).
    public let roomId: String?
    /// Optional 3D placement in scene coordinate space.
    public let anchor: CapturedObjectAnchor?
    /// Placement status of the object.
    public let status: CapturedObjectStatus
    /// Optional subtype and free-text notes.
    public let metadata: CapturedObjectMetadata?
    /// IDs of photos attached to this object.
    public let photoIds: [String]
    /// IDs of note markers attached to this object.
    public let noteMarkerIds: [String]

    public init(
        objectId: String,
        type: CapturedObjectType,
        roomId: String? = nil,
        anchor: CapturedObjectAnchor? = nil,
        status: CapturedObjectStatus,
        metadata: CapturedObjectMetadata? = nil,
        photoIds: [String] = [],
        noteMarkerIds: [String] = []
    ) {
        self.objectId = objectId
        self.type = type
        self.roomId = roomId
        self.anchor = anchor
        self.status = status
        self.metadata = metadata
        self.photoIds = photoIds
        self.noteMarkerIds = noteMarkerIds
    }
}

// MARK: - Photo

/// Evidence scope for a photo — whether it documents the whole session, a
/// specific room, or a specific object.
public enum PhotoScope: String, Codable, Sendable, Equatable {
    case session
    case room
    case object
}

/// PhotoV1 — a photo captured as evidence during the session.
///
/// Photos are evidence-first: they may document the session as a whole, a
/// specific room, or a specific object.
public struct PhotoV1: Codable, Sendable, Equatable {
    /// Unique identifier for this photo (UUID string).
    public let photoId: String
    /// Local or remote URI of the image asset.
    public let uri: String
    /// ISO-8601 timestamp of capture.
    public let createdAt: String
    /// Evidence scope (session / room / object).
    public let scope: PhotoScope
    /// ID of the room this photo documents (required when scope is `room`).
    public let roomId: String?
    /// ID of the object this photo documents (required when scope is `object`).
    public let objectId: String?
    /// Optional semantic tags (e.g. "data_plate", "clearance", "condition").
    public let tags: [String]?

    public init(
        photoId: String,
        uri: String,
        createdAt: String,
        scope: PhotoScope,
        roomId: String? = nil,
        objectId: String? = nil,
        tags: [String]? = nil
    ) {
        self.photoId = photoId
        self.uri = uri
        self.createdAt = createdAt
        self.scope = scope
        self.roomId = roomId
        self.objectId = objectId
        self.tags = tags
    }
}

// MARK: - Audio

/// AudioSegmentV1 — a single segment of continuous audio captured during the
/// session.
public struct AudioSegmentV1: Codable, Sendable, Equatable {
    /// Unique identifier for this segment (UUID string).
    public let segmentId: String
    /// Local or remote URI of the audio asset.
    public let uri: String
    /// ISO-8601 timestamp of segment start.
    public let startedAt: String
    /// ISO-8601 timestamp of segment end.
    public let endedAt: String

    public init(
        segmentId: String,
        uri: String,
        startedAt: String,
        endedAt: String
    ) {
        self.segmentId = segmentId
        self.uri = uri
        self.startedAt = startedAt
        self.endedAt = endedAt
    }
}

/// Transcription status for the audio of a session.
///
/// - `pending`:    transcription has been requested and is queued
/// - `processing`: transcription is actively being processed
/// - `complete`:   transcription text is available
public enum AudioTranscriptionStatus: String, Codable, Sendable, Equatable {
    case pending
    case processing
    case complete
}

/// Transcription state and optional text for audio capture.
public struct AudioTranscription: Codable, Sendable, Equatable {
    /// Current processing status.
    public let status: AudioTranscriptionStatus
    /// Transcription text, once available.
    public let text: String?

    public init(status: AudioTranscriptionStatus, text: String? = nil) {
        self.status = status
        self.text = text
    }
}

/// AudioV1 — continuous audio capture data for the session.
///
/// Audio is always captured in 'continuous' mode during a session.  Individual
/// segments cover the full session timeline and are used for transcription and
/// marker context.
public struct AudioV1: Codable, Sendable, Equatable {
    /// Audio capture mode — always `"continuous"`.
    public let mode: String
    /// Ordered list of audio segments.
    public let segments: [AudioSegmentV1]
    /// Optional transcription state and text.
    public let transcription: AudioTranscription?

    public init(
        segments: [AudioSegmentV1] = [],
        transcription: AudioTranscription? = nil
    ) {
        self.mode = "continuous"
        self.segments = segments
        self.transcription = transcription
    }
}

// MARK: - Note marker

/// Semantic category of a note marker.
public enum NoteMarkerCategory: String, Codable, Sendable, Equatable {
    /// Installation or access constraint.
    case constraint
    /// General field observation.
    case observation
    /// Captured customer preference or request.
    case preference
    /// A risk item noted during capture.
    case risk
    /// A follow-up action to be taken after the visit.
    case followUp = "follow_up"
}

/// NoteMarkerV1 — a timestamped marker placed during the session to flag a
/// point of interest in the audio timeline.
public struct NoteMarkerV1: Codable, Sendable, Equatable {
    /// Unique identifier for this marker (UUID string).
    public let markerId: String
    /// ISO-8601 timestamp of marker creation.
    public let createdAt: String
    /// Optional room context at time of marker (UUID string).
    public let roomId: String?
    /// Optional object context at time of marker (UUID string).
    public let objectId: String?
    /// Optional semantic category.
    public let category: NoteMarkerCategory?
    /// Optional quick label or short note.
    public let text: String?

    public init(
        markerId: String,
        createdAt: String,
        roomId: String? = nil,
        objectId: String? = nil,
        category: NoteMarkerCategory? = nil,
        text: String? = nil
    ) {
        self.markerId = markerId
        self.createdAt = createdAt
        self.roomId = roomId
        self.objectId = objectId
        self.category = category
        self.text = text
    }
}

// MARK: - Session event

/// Type of a session timeline event.
public enum SessionEventType: String, Codable, Sendable, Equatable {
    case roomAssigned = "room_assigned"
    case objectAdded = "object_added"
    case photoTaken = "photo_taken"
    case noteMarkerAdded = "note_marker_added"
    case roomFinished = "room_finished"
}

/// SessionEventV1 — a single entry in the session timeline event stream.
///
/// The event stream provides full replay capability, debugging, and
/// explainability for Atlas engineers.
public struct SessionEventV1: Codable, Sendable, Equatable {
    /// Unique identifier for this event (UUID string).
    public let eventId: String
    /// The kind of event that occurred.
    public let type: SessionEventType
    /// ISO-8601 timestamp of the event.
    public let timestamp: String
    /// Room context at time of event (UUID string), if applicable.
    public let roomId: String?
    /// Object context at time of event (UUID string), if applicable.
    public let objectId: String?

    public init(
        eventId: String,
        type: SessionEventType,
        timestamp: String,
        roomId: String? = nil,
        objectId: String? = nil
    ) {
        self.eventId = eventId
        self.type = type
        self.timestamp = timestamp
        self.roomId = roomId
        self.objectId = objectId
    }
}

// MARK: - Top-level session capture

/// Property address information for a session.
public struct SessionPropertyV1: Codable, Sendable, Equatable {
    /// Street address of the property.
    public let address: String?
    /// Postcode of the property.
    public let postcode: String?

    public init(address: String? = nil, postcode: String? = nil) {
        self.address = address
        self.postcode = postcode
    }
}

/// Device and app metadata captured at session start.
public struct SessionDeviceV1: Codable, Sendable, Equatable {
    /// Device model (e.g. "iPhone 15 Pro").
    public let model: String?
    /// Operating system version (e.g. "iOS 17.4").
    public let os: String?
    /// App version string (e.g. "1.0.0").
    public let appVersion: String?

    public init(model: String? = nil, os: String? = nil, appVersion: String? = nil) {
        self.model = model
        self.os = os
        self.appVersion = appVersion
    }
}

/// SessionCaptureV1 — the top-level capture contract for a structured house
/// survey session.
///
/// This is the root of truth for a complete Atlas capture session.  It
/// describes what was captured (rooms, objects, photos, audio, note markers,
/// and a timeline of events) without encoding any UI-specific concepts.
///
/// - `version`:         contract version string; always `"1.0"`.
/// - `sessionId`:       unique identifier for this session (UUID string).
/// - `appointmentId`:   authoritative cross-system appointment key.  Must match
///                      `AppointmentV1.appointmentId` for the appointment that
///                      triggered this visit.  Required — Atlas Scan iOS must
///                      always capture the appointment reference before starting
///                      a session so the resulting payload can be matched back
///                      by Atlas Recommendation.
/// - `startedAt`:       ISO-8601 timestamp of session start.
/// - `updatedAt`:       ISO-8601 timestamp of last update.
/// - `completedAt`:     ISO-8601 timestamp of session completion (absent if active).
/// - `status`:          current lifecycle status of the session.
/// - `property`:        optional property address information.
/// - `rooms`:           rooms visited during the session.
/// - `objects`:         captured system objects (radiators, boilers, etc.).
/// - `photos`:          photos taken as evidence.
/// - `audio`:           continuous audio capture data.
/// - `notes`:           timestamped note markers placed during the session.
/// - `events`:          ordered timeline event stream (enables replay / debugging).
/// - `device`:          optional device and app metadata.
public struct SessionCaptureV1: Codable, Sendable, Equatable {
    public let version: String
    public let sessionId: String
    /// Authoritative cross-system appointment key.
    ///
    /// Must match `AppointmentV1.appointmentId` for the appointment that
    /// triggered this visit.  Atlas Recommendation uses this field to associate
    /// the submitted session capture with the correct appointment record.
    public let appointmentId: String
    public let startedAt: String
    public let updatedAt: String
    public let completedAt: String?
    public let status: SessionStatusV1
    public let property: SessionPropertyV1?
    public let rooms: [RoomV1]
    public let objects: [ObjectV1]
    public let photos: [PhotoV1]
    public let audio: AudioV1
    public let notes: [NoteMarkerV1]
    public let events: [SessionEventV1]
    public let device: SessionDeviceV1?

    public init(
        version: String = "1.0",
        sessionId: String,
        appointmentId: String,
        startedAt: String,
        updatedAt: String,
        completedAt: String? = nil,
        status: SessionStatusV1,
        property: SessionPropertyV1? = nil,
        rooms: [RoomV1] = [],
        objects: [ObjectV1] = [],
        photos: [PhotoV1] = [],
        audio: AudioV1 = AudioV1(),
        notes: [NoteMarkerV1] = [],
        events: [SessionEventV1] = [],
        device: SessionDeviceV1? = nil
    ) {
        self.version = version
        self.sessionId = sessionId
        self.appointmentId = appointmentId
        self.startedAt = startedAt
        self.updatedAt = updatedAt
        self.completedAt = completedAt
        self.status = status
        self.property = property
        self.rooms = rooms
        self.objects = objects
        self.photos = photos
        self.audio = audio
        self.notes = notes
        self.events = events
        self.device = device
    }
}
