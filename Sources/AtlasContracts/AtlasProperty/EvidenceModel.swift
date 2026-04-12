// EvidenceModel.swift
//
// EvidenceModelV1 — first-class evidence layer for an AtlasPropertyV1.
//
// Evidence items are linked to building model entities via EvidenceLinkV1
// so that consumers (portal, report engine, recommendation engine) can
// resolve them in spatial and temporal context.
//
// IMPORTANT: This file defines only the shared contract boundary.

import Foundation

// MARK: - EvidenceLinkV1

/// Spatial and temporal link from an evidence item to a building model entity.
public struct EvidenceLinkV1: Codable, Sendable, Equatable {
    /// ID of the room this evidence is linked to.
    public let roomId: String?
    /// ID of the thermal zone this evidence is linked to.
    public let zoneId: String?
    /// ID of the system component this evidence is linked to.
    public let componentId: String?
    /// ID of the emitter this evidence is linked to.
    public let emitterId: String?
    /// ID of the boundary element this evidence is linked to.
    public let boundaryId: String?
    /// ID of the opening this evidence is linked to.
    public let openingId: String?
    /// Session-relative timestamp in seconds when this evidence was captured.
    public let timestamp: Double?

    public init(
        roomId: String? = nil,
        zoneId: String? = nil,
        componentId: String? = nil,
        emitterId: String? = nil,
        boundaryId: String? = nil,
        openingId: String? = nil,
        timestamp: Double? = nil
    ) {
        self.roomId = roomId
        self.zoneId = zoneId
        self.componentId = componentId
        self.emitterId = emitterId
        self.boundaryId = boundaryId
        self.openingId = openingId
        self.timestamp = timestamp
    }
}

// MARK: - PhotoTag

/// Semantic tag describing what a photo shows.
public enum PhotoTag: String, Codable, Sendable, Equatable {
    case boiler
    case cylinder
    case meter
    case consumerUnit    = "consumer_unit"
    case radiator
    case pipeWork        = "pipe_work"
    case roomOverview    = "room_overview"
    case flue
    case controls
    case defect
    case other
}

// MARK: - PhotoEvidenceV1

/// A photo captured during the survey visit.
public struct PhotoEvidenceV1: Codable, Sendable, Equatable {
    public let photoId: String
    public let capturedAt: String
    public let localFilename: String?
    public let remoteUri: String?
    public let tag: PhotoTag?
    public let link: EvidenceLinkV1?
    public let caption: String?

    public init(
        photoId: String,
        capturedAt: String,
        localFilename: String? = nil,
        remoteUri: String? = nil,
        tag: PhotoTag? = nil,
        link: EvidenceLinkV1? = nil,
        caption: String? = nil
    ) {
        self.photoId = photoId
        self.capturedAt = capturedAt
        self.localFilename = localFilename
        self.remoteUri = remoteUri
        self.tag = tag
        self.link = link
        self.caption = caption
    }
}

// MARK: - VoiceNoteKindV2

/// Semantic category for a property-level voice note.
/// Named `VoiceNoteKindV2` to avoid collision with `VoiceNoteKind` from the
/// scan module.
public enum VoiceNoteKindV2: String, Codable, Sendable, Equatable {
    case observation
    case customerPreference = "customer_preference"
    case installConstraint  = "install_constraint"
    case risk
    case followUp           = "follow_up"
    case other
}

// MARK: - VoiceNoteEvidenceV1

/// A voice note captured during the survey linked to this property.
public struct VoiceNoteEvidenceV1: Codable, Sendable, Equatable {
    public let voiceNoteId: String
    public let capturedAt: String
    public let durationSeconds: Double
    public let transcript: String?
    public let kind: VoiceNoteKindV2?
    public let link: EvidenceLinkV1?

    public init(
        voiceNoteId: String,
        capturedAt: String,
        durationSeconds: Double,
        transcript: String? = nil,
        kind: VoiceNoteKindV2? = nil,
        link: EvidenceLinkV1? = nil
    ) {
        self.voiceNoteId = voiceNoteId
        self.capturedAt = capturedAt
        self.durationSeconds = durationSeconds
        self.transcript = transcript
        self.kind = kind
        self.link = link
    }
}

// MARK: - TextNoteEvidenceV1

/// A free-text note entered by the engineer during or after the visit.
public struct TextNoteEvidenceV1: Codable, Sendable, Equatable {
    public let noteId: String
    public let createdAt: String
    public let body: String
    public let link: EvidenceLinkV1?

    public init(noteId: String, createdAt: String, body: String, link: EvidenceLinkV1? = nil) {
        self.noteId = noteId
        self.createdAt = createdAt
        self.body = body
        self.link = link
    }
}

// MARK: - QAFlagSeverityV2

/// Severity of a property-level QA flag.
/// Named `QAFlagSeverityV2` to avoid collision with `ScanQAFlagSeverity`.
public enum QAFlagSeverityV2: String, Codable, Sendable, Equatable {
    case info
    case warning
    case error
    case blocking
}

// MARK: - QAFlagEntityType

/// Entity type that a QA flag is attached to.
public enum QAFlagEntityType: String, Codable, Sendable, Equatable {
    case room
    case zone
    case component
    case emitter
    case boundary
    case opening
    case property
}

// MARK: - QAFlagV1

/// A QA flag raised against the property record or a building model entity.
public struct QAFlagV1: Codable, Sendable, Equatable {
    public let flagId: String
    public let code: String
    public let message: String
    public let severity: QAFlagSeverityV2
    public let entityId: String?
    public let entityType: QAFlagEntityType?
    public let raisedAt: String?
    public let resolved: Bool?

    public init(
        flagId: String,
        code: String,
        message: String,
        severity: QAFlagSeverityV2,
        entityId: String? = nil,
        entityType: QAFlagEntityType? = nil,
        raisedAt: String? = nil,
        resolved: Bool? = nil
    ) {
        self.flagId = flagId
        self.code = code
        self.message = message
        self.severity = severity
        self.entityId = entityId
        self.entityType = entityType
        self.raisedAt = raisedAt
        self.resolved = resolved
    }
}

// MARK: - TimelineEventType

/// Timeline event type.
public enum TimelineEventType: String, Codable, Sendable, Equatable {
    case sessionStarted   = "session_started"
    case sessionCompleted = "session_completed"
    case roomEntered      = "room_entered"
    case roomCompleted    = "room_completed"
    case photoCaptured    = "photo_captured"
    case noteRecorded     = "note_recorded"
    case syncCompleted    = "sync_completed"
    case custom
}

// MARK: - TimelineEventV1

/// A session timeline event.
public struct TimelineEventV1: Codable, Sendable, Equatable {
    public let eventId: String
    public let occurredAt: String
    public let type: TimelineEventType
    public let roomId: String?

    public init(
        eventId: String,
        occurredAt: String,
        type: TimelineEventType,
        roomId: String? = nil
    ) {
        self.eventId = eventId
        self.occurredAt = occurredAt
        self.type = type
        self.roomId = roomId
    }
}

// MARK: - EvidenceModelV1

/// First-class evidence layer for an AtlasPropertyV1.
public struct EvidenceModelV1: Codable, Sendable, Equatable {
    public let photos: [PhotoEvidenceV1]
    public let voiceNotes: [VoiceNoteEvidenceV1]
    public let textNotes: [TextNoteEvidenceV1]
    public let qaFlags: [QAFlagV1]
    public let events: [TimelineEventV1]
    /// Internal room scan evidence captured using RoomPlan / LiDAR.
    /// Optional; absent if no indoor 3D scan has been performed for this property.
    public let spatialEvidence3d: [SpatialEvidence3D]?
    /// External flue-clearance scenes captured outside the property.
    /// Optional; absent if no outdoor clearance scan has been performed.
    public let externalClearanceScenes: [ExternalClearanceSceneV1]?

    public init(
        photos: [PhotoEvidenceV1] = [],
        voiceNotes: [VoiceNoteEvidenceV1] = [],
        textNotes: [TextNoteEvidenceV1] = [],
        qaFlags: [QAFlagV1] = [],
        events: [TimelineEventV1] = [],
        spatialEvidence3d: [SpatialEvidence3D]? = nil,
        externalClearanceScenes: [ExternalClearanceSceneV1]? = nil
    ) {
        self.photos = photos
        self.voiceNotes = voiceNotes
        self.textNotes = textNotes
        self.qaFlags = qaFlags
        self.events = events
        self.spatialEvidence3d = spatialEvidence3d
        self.externalClearanceScenes = externalClearanceScenes
    }
}
