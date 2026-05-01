// SessionCaptureV2.swift
//
// SessionCaptureV2 — hardened capture-evidence contract for Atlas Scan.
//
// This file defines the capture payload that Scan produces and Mind ingests.
// It is capture-only: no handoff behaviour, no engine outputs, no derived values.
//
// Design principles:
//   - All evidence items carry provenance and reviewStatus.
//   - Rejected evidence remains in capture history but must not appear in
//     customer-facing outputs.
//   - Manual object pins default to reviewStatus: confirmed.
//   - Scan/inferred object pins default to reviewStatus: pending.
//   - Object-scope photos default includeInCustomerReport: false.
//   - Room/floor-plan/overview photos may be explicitly included.
//   - No ScanToMindHandoffV1 is defined here.

import Foundation

// MARK: - ReviewStatusV1

/// QA review status for a piece of capture evidence.
///
/// - `pending`:   captured but not yet reviewed
/// - `confirmed`: reviewed and accepted
/// - `rejected`:  reviewed and rejected; must remain in history but must not
///                be used in customer-facing outputs
public enum ReviewStatusV1: String, Codable, Sendable, Equatable {
    case pending
    case confirmed
    case rejected
}

// MARK: - CaptureProvenanceV1

/// How a piece of capture evidence was produced.
///
/// - `manual`:     explicitly placed or entered by the engineer
/// - `scan`:       derived from LiDAR / RoomPlan pipeline
/// - `photo`:      captured via camera
/// - `transcript`: produced from voice/dictation transcription
/// - `inferred`:   inferred by the app or engine from surrounding context
/// - `imported`:   brought in from an external source
public enum CaptureProvenanceV1: String, Codable, Sendable, Equatable {
    case manual
    case scan
    case photo
    case transcript
    case inferred
    case imported
}

// MARK: - CaptureRoomV1

/// A room recorded during the survey session.
public struct CaptureRoomV1: Codable, Sendable, Equatable {
    /// Unique identifier (UUID string).
    public let id: String
    /// Optional human-readable name (e.g. "Kitchen").
    public let name: String?
    /// Storey index (0 = ground floor).
    public let floorIndex: Int?
    /// IDs of other rooms that are logically linked (e.g. open-plan spaces).
    public let linkedRoomIds: [String]?
    /// QA review status for this room.
    public let reviewStatus: ReviewStatusV1
    /// How this room was added to the capture.
    public let provenance: CaptureProvenanceV1

    public init(
        id: String,
        name: String? = nil,
        floorIndex: Int? = nil,
        linkedRoomIds: [String]? = nil,
        reviewStatus: ReviewStatusV1,
        provenance: CaptureProvenanceV1
    ) {
        self.id = id
        self.name = name
        self.floorIndex = floorIndex
        self.linkedRoomIds = linkedRoomIds
        self.reviewStatus = reviewStatus
        self.provenance = provenance
    }
}

// MARK: - CoordinateSpaceV1

/// Coordinate space in which a spatial point is expressed.
public enum CoordinateSpaceV1: String, Codable, Sendable, Equatable {
    case roomPlan = "room_plan"
    case floorPlan = "floor_plan"
    case world
}

// MARK: - CapturePoint3DV1

/// A spatial point used in capture evidence.
public struct CapturePoint3DV1: Codable, Sendable, Equatable {
    public let x: Double
    public let y: Double
    public let z: Double?
    public let coordinateSpace: CoordinateSpaceV1

    public init(
        x: Double,
        y: Double,
        z: Double? = nil,
        coordinateSpace: CoordinateSpaceV1
    ) {
        self.x = x
        self.y = y
        self.z = z
        self.coordinateSpace = coordinateSpace
    }
}

// MARK: - CapturePhotoV1

/// Camera mode used when a photo was taken.
public enum CameraMode: String, Codable, Sendable, Equatable {
    case standard
    case wide
    case panorama
}

/// A photo captured as evidence during the survey.
///
/// Default: `includeInCustomerReport` is `false` for object-scope photos.
/// Room/floor-plan/overview photos may be explicitly set to `true`.
public struct CapturePhotoV1: Codable, Sendable, Equatable {
    public let id: String
    public let roomId: String?
    public let provenance: CaptureProvenanceV1
    public let reviewStatus: ReviewStatusV1
    public let capturedAt: String
    public let notes: String?
    /// URI of the image asset (local or remote).
    public let uri: String
    /// Optional human-readable label.
    public let label: String?
    /// Optional reference to the object pin this photo documents.
    public let objectId: String?
    /// Whether this photo should appear in the customer-facing report.
    public let includeInCustomerReport: Bool
    /// Camera mode used when the photo was taken.
    public let cameraMode: CameraMode?

    public init(
        id: String,
        roomId: String? = nil,
        provenance: CaptureProvenanceV1,
        reviewStatus: ReviewStatusV1,
        capturedAt: String,
        notes: String? = nil,
        uri: String,
        label: String? = nil,
        objectId: String? = nil,
        includeInCustomerReport: Bool,
        cameraMode: CameraMode? = nil
    ) {
        self.id = id
        self.roomId = roomId
        self.provenance = provenance
        self.reviewStatus = reviewStatus
        self.capturedAt = capturedAt
        self.notes = notes
        self.uri = uri
        self.label = label
        self.objectId = objectId
        self.includeInCustomerReport = includeInCustomerReport
        self.cameraMode = cameraMode
    }

    // Provide a CodingKeys enum so the `kind` discriminant round-trips correctly.
    private enum CodingKeys: String, CodingKey {
        case kind, id, roomId, provenance, reviewStatus, capturedAt, notes
        case uri, label, objectId, includeInCustomerReport, cameraMode
    }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        roomId = try c.decodeIfPresent(String.self, forKey: .roomId)
        provenance = try c.decode(CaptureProvenanceV1.self, forKey: .provenance)
        reviewStatus = try c.decode(ReviewStatusV1.self, forKey: .reviewStatus)
        capturedAt = try c.decode(String.self, forKey: .capturedAt)
        notes = try c.decodeIfPresent(String.self, forKey: .notes)
        uri = try c.decode(String.self, forKey: .uri)
        label = try c.decodeIfPresent(String.self, forKey: .label)
        objectId = try c.decodeIfPresent(String.self, forKey: .objectId)
        includeInCustomerReport = try c.decode(Bool.self, forKey: .includeInCustomerReport)
        cameraMode = try c.decodeIfPresent(CameraMode.self, forKey: .cameraMode)
    }

    public func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode("photo", forKey: .kind)
        try c.encode(id, forKey: .id)
        try c.encodeIfPresent(roomId, forKey: .roomId)
        try c.encode(provenance, forKey: .provenance)
        try c.encode(reviewStatus, forKey: .reviewStatus)
        try c.encode(capturedAt, forKey: .capturedAt)
        try c.encodeIfPresent(notes, forKey: .notes)
        try c.encode(uri, forKey: .uri)
        try c.encodeIfPresent(label, forKey: .label)
        try c.encodeIfPresent(objectId, forKey: .objectId)
        try c.encode(includeInCustomerReport, forKey: .includeInCustomerReport)
        try c.encodeIfPresent(cameraMode, forKey: .cameraMode)
    }
}

// MARK: - CaptureTranscriptV1

/// Source of a transcript item.
public enum TranscriptSource: String, Codable, Sendable, Equatable {
    case voiceNote = "voice_note"
    case dictation
    case manualNote = "manual_note"
}

/// A transcript captured as evidence during the survey.
///
/// Raw audio must never appear here; only the transcribed text travels in the
/// capture payload.
public struct CaptureTranscriptV1: Codable, Sendable, Equatable {
    public let id: String
    public let roomId: String?
    public let provenance: CaptureProvenanceV1
    public let reviewStatus: ReviewStatusV1
    public let capturedAt: String
    public let notes: String?
    /// Transcribed or manually entered text.
    public let text: String
    /// How the text was produced.
    public let source: TranscriptSource

    public init(
        id: String,
        roomId: String? = nil,
        provenance: CaptureProvenanceV1,
        reviewStatus: ReviewStatusV1,
        capturedAt: String,
        notes: String? = nil,
        text: String,
        source: TranscriptSource
    ) {
        self.id = id
        self.roomId = roomId
        self.provenance = provenance
        self.reviewStatus = reviewStatus
        self.capturedAt = capturedAt
        self.notes = notes
        self.text = text
        self.source = source
    }

    private enum CodingKeys: String, CodingKey {
        case kind, id, roomId, provenance, reviewStatus, capturedAt, notes, text, source
    }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        roomId = try c.decodeIfPresent(String.self, forKey: .roomId)
        provenance = try c.decode(CaptureProvenanceV1.self, forKey: .provenance)
        reviewStatus = try c.decode(ReviewStatusV1.self, forKey: .reviewStatus)
        capturedAt = try c.decode(String.self, forKey: .capturedAt)
        notes = try c.decodeIfPresent(String.self, forKey: .notes)
        text = try c.decode(String.self, forKey: .text)
        source = try c.decode(TranscriptSource.self, forKey: .source)
    }

    public func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode("transcript", forKey: .kind)
        try c.encode(id, forKey: .id)
        try c.encodeIfPresent(roomId, forKey: .roomId)
        try c.encode(provenance, forKey: .provenance)
        try c.encode(reviewStatus, forKey: .reviewStatus)
        try c.encode(capturedAt, forKey: .capturedAt)
        try c.encodeIfPresent(notes, forKey: .notes)
        try c.encode(text, forKey: .text)
        try c.encode(source, forKey: .source)
    }
}

// MARK: - CaptureObjectPinV1

/// Category of the system component or evidence point for an object pin.
public enum ObjectPinType: String, Codable, Sendable, Equatable {
    case boiler
    case cylinder
    case buffer
    case tank
    case radiator
    case controlSystem = "control_system"
    case controlUser = "control_user"
    case flue
    case gasMeter = "gas_meter"
    case waterMain = "water_main"
    case other
}

/// Confidence level of a spatial anchor.
public enum AnchorConfidence: String, Codable, Sendable, Equatable {
    case screenOnly = "screen_only"
    case raycastEstimated = "raycast_estimated"
    case worldLocked = "world_locked"
}

/// An object pin placed on a heating/plumbing system component or point of interest.
///
/// Default review status by provenance:
///   - `manual`  → `confirmed`
///   - `scan` / `inferred` → `pending`
public struct CaptureObjectPinV1: Codable, Sendable, Equatable {
    public let id: String
    public let roomId: String?
    public let provenance: CaptureProvenanceV1
    public let reviewStatus: ReviewStatusV1
    public let capturedAt: String
    public let notes: String?
    /// Category of the system component or evidence point.
    public let objectType: ObjectPinType
    /// Optional human-readable label (e.g. "Worcester 30i").
    public let label: String?
    /// Spatial location of the pin.
    public let location: CapturePoint3DV1
    /// Confidence of the spatial anchor.
    public let anchorConfidence: AnchorConfidence

    public init(
        id: String,
        roomId: String? = nil,
        provenance: CaptureProvenanceV1,
        reviewStatus: ReviewStatusV1,
        capturedAt: String,
        notes: String? = nil,
        objectType: ObjectPinType,
        label: String? = nil,
        location: CapturePoint3DV1,
        anchorConfidence: AnchorConfidence
    ) {
        self.id = id
        self.roomId = roomId
        self.provenance = provenance
        self.reviewStatus = reviewStatus
        self.capturedAt = capturedAt
        self.notes = notes
        self.objectType = objectType
        self.label = label
        self.location = location
        self.anchorConfidence = anchorConfidence
    }

    private enum CodingKeys: String, CodingKey {
        case kind, id, roomId, provenance, reviewStatus, capturedAt, notes
        case objectType, label, location, anchorConfidence
    }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        roomId = try c.decodeIfPresent(String.self, forKey: .roomId)
        provenance = try c.decode(CaptureProvenanceV1.self, forKey: .provenance)
        reviewStatus = try c.decode(ReviewStatusV1.self, forKey: .reviewStatus)
        capturedAt = try c.decode(String.self, forKey: .capturedAt)
        notes = try c.decodeIfPresent(String.self, forKey: .notes)
        objectType = try c.decode(ObjectPinType.self, forKey: .objectType)
        label = try c.decodeIfPresent(String.self, forKey: .label)
        location = try c.decode(CapturePoint3DV1.self, forKey: .location)
        anchorConfidence = try c.decode(AnchorConfidence.self, forKey: .anchorConfidence)
    }

    public func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode("object_pin", forKey: .kind)
        try c.encode(id, forKey: .id)
        try c.encodeIfPresent(roomId, forKey: .roomId)
        try c.encode(provenance, forKey: .provenance)
        try c.encode(reviewStatus, forKey: .reviewStatus)
        try c.encode(capturedAt, forKey: .capturedAt)
        try c.encodeIfPresent(notes, forKey: .notes)
        try c.encode(objectType, forKey: .objectType)
        try c.encodeIfPresent(label, forKey: .label)
        try c.encode(location, forKey: .location)
        try c.encode(anchorConfidence, forKey: .anchorConfidence)
    }
}

// MARK: - CapturePipeRouteV1

/// Service type carried by a pipe route.
public enum PipeRouteType: String, Codable, Sendable, Equatable {
    case heatingFlow = "heating_flow"
    case heatingReturn = "heating_return"
    case hotWater = "hot_water"
    case coldWater = "cold_water"
    case gas
    case condensate
    case discharge
    case unknown
}

/// Installation status of a pipe route.
public enum PipeRouteStatus: String, Codable, Sendable, Equatable {
    case existing
    case proposed
    case assumed
}

/// A routed pipe run captured during the survey.
public struct CapturePipeRouteV1: Codable, Sendable, Equatable {
    public let id: String
    public let roomId: String?
    public let provenance: CaptureProvenanceV1
    public let reviewStatus: ReviewStatusV1
    public let capturedAt: String
    public let notes: String?
    /// Service type carried by this route.
    public let routeType: PipeRouteType
    /// Whether this route already exists, is proposed, or is assumed.
    public let status: PipeRouteStatus
    /// Ordered sequence of waypoints defining the route.
    public let points: [CapturePoint3DV1]

    public init(
        id: String,
        roomId: String? = nil,
        provenance: CaptureProvenanceV1,
        reviewStatus: ReviewStatusV1,
        capturedAt: String,
        notes: String? = nil,
        routeType: PipeRouteType,
        status: PipeRouteStatus,
        points: [CapturePoint3DV1]
    ) {
        self.id = id
        self.roomId = roomId
        self.provenance = provenance
        self.reviewStatus = reviewStatus
        self.capturedAt = capturedAt
        self.notes = notes
        self.routeType = routeType
        self.status = status
        self.points = points
    }

    private enum CodingKeys: String, CodingKey {
        case kind, id, roomId, provenance, reviewStatus, capturedAt, notes
        case routeType, status, points
    }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        roomId = try c.decodeIfPresent(String.self, forKey: .roomId)
        provenance = try c.decode(CaptureProvenanceV1.self, forKey: .provenance)
        reviewStatus = try c.decode(ReviewStatusV1.self, forKey: .reviewStatus)
        capturedAt = try c.decode(String.self, forKey: .capturedAt)
        notes = try c.decodeIfPresent(String.self, forKey: .notes)
        routeType = try c.decode(PipeRouteType.self, forKey: .routeType)
        status = try c.decode(PipeRouteStatus.self, forKey: .status)
        points = try c.decode([CapturePoint3DV1].self, forKey: .points)
    }

    public func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode("pipe_route", forKey: .kind)
        try c.encode(id, forKey: .id)
        try c.encodeIfPresent(roomId, forKey: .roomId)
        try c.encode(provenance, forKey: .provenance)
        try c.encode(reviewStatus, forKey: .reviewStatus)
        try c.encode(capturedAt, forKey: .capturedAt)
        try c.encodeIfPresent(notes, forKey: .notes)
        try c.encode(routeType, forKey: .routeType)
        try c.encode(status, forKey: .status)
        try c.encode(points, forKey: .points)
    }
}

// MARK: - CapturePointCloudAssetV1

/// File format of a point cloud / 3-D mesh asset.
public enum PointCloudFormat: String, Codable, Sendable, Equatable {
    case usdz
    case ply
    case las
    case e57
    case imageDepth = "image_depth"
    case other
}

/// A point cloud or 3-D mesh asset captured during the survey.
///
/// Kept separate from photos because point cloud assets are raw geometry
/// exports — not photographic evidence.
public struct CapturePointCloudAssetV1: Codable, Sendable, Equatable {
    public let id: String
    public let roomId: String?
    public let provenance: CaptureProvenanceV1
    public let reviewStatus: ReviewStatusV1
    public let capturedAt: String
    public let notes: String?
    /// URI of the asset file (local or remote).
    public let uri: String
    /// File format of the asset.
    public let format: PointCloudFormat
    /// Optional human-readable label.
    public let label: String?
    /// Whether this asset should appear in the customer-facing report.
    public let includeInCustomerReport: Bool

    public init(
        id: String,
        roomId: String? = nil,
        provenance: CaptureProvenanceV1,
        reviewStatus: ReviewStatusV1,
        capturedAt: String,
        notes: String? = nil,
        uri: String,
        format: PointCloudFormat,
        label: String? = nil,
        includeInCustomerReport: Bool
    ) {
        self.id = id
        self.roomId = roomId
        self.provenance = provenance
        self.reviewStatus = reviewStatus
        self.capturedAt = capturedAt
        self.notes = notes
        self.uri = uri
        self.format = format
        self.label = label
        self.includeInCustomerReport = includeInCustomerReport
    }

    private enum CodingKeys: String, CodingKey {
        case kind, id, roomId, provenance, reviewStatus, capturedAt, notes
        case uri, format, label, includeInCustomerReport
    }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        roomId = try c.decodeIfPresent(String.self, forKey: .roomId)
        provenance = try c.decode(CaptureProvenanceV1.self, forKey: .provenance)
        reviewStatus = try c.decode(ReviewStatusV1.self, forKey: .reviewStatus)
        capturedAt = try c.decode(String.self, forKey: .capturedAt)
        notes = try c.decodeIfPresent(String.self, forKey: .notes)
        uri = try c.decode(String.self, forKey: .uri)
        format = try c.decode(PointCloudFormat.self, forKey: .format)
        label = try c.decodeIfPresent(String.self, forKey: .label)
        includeInCustomerReport = try c.decode(Bool.self, forKey: .includeInCustomerReport)
    }

    public func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode("point_cloud_asset", forKey: .kind)
        try c.encode(id, forKey: .id)
        try c.encodeIfPresent(roomId, forKey: .roomId)
        try c.encode(provenance, forKey: .provenance)
        try c.encode(reviewStatus, forKey: .reviewStatus)
        try c.encode(capturedAt, forKey: .capturedAt)
        try c.encodeIfPresent(notes, forKey: .notes)
        try c.encode(uri, forKey: .uri)
        try c.encode(format, forKey: .format)
        try c.encodeIfPresent(label, forKey: .label)
        try c.encode(includeInCustomerReport, forKey: .includeInCustomerReport)
    }
}

// MARK: - SessionCaptureV2

/// SessionCaptureV2 — the hardened capture-evidence payload produced by Atlas
/// Scan and ingested by Atlas Mind.
///
/// This is capture-only.  No handoff behaviour, engine outputs, recommendation
/// scores, proposal design state, or derived values belong here.
///
/// What IS included:
///   - rooms, photos, transcripts, object pins, pipe routes, point cloud assets
///   - provenance and reviewStatus on every evidence item
///   - visitId and optional visitNumber / brandId for cross-system keying
///
/// What is NOT included:
///   - Raw audio data or audio URIs
///   - Heat-loss outputs or U-value calculations
///   - Recommendation scores or system selections
///   - Proposal design state
///   - Engine summaries or derived values
///   - ScanToMindHandoffV1 (not yet)
public struct SessionCaptureV2: Codable, Sendable, Equatable {
    /// Contract discriminant — always "2.0".
    public let version: String
    /// Authoritative cross-system visit identifier.
    public let visitId: String
    /// Optional human-readable visit reference number (e.g. "VN-0042").
    public let visitNumber: String?
    /// Optional brand identifier for white-label deployments.
    public let brandId: String?
    /// Rooms recorded during the session.
    public let rooms: [CaptureRoomV1]
    /// Photos captured as evidence.
    public let photos: [CapturePhotoV1]
    /// Transcripts (voice notes, dictation, manual notes).
    public let transcripts: [CaptureTranscriptV1]
    /// Object pins placed during the session.
    public let objectPins: [CaptureObjectPinV1]
    /// Pipe routes captured during the session.
    public let pipeRoutes: [CapturePipeRouteV1]
    /// Point cloud and 3-D mesh assets exported from the session.
    public let pointCloudAssets: [CapturePointCloudAssetV1]
    /// ISO-8601 timestamp of when this payload was first created.
    public let createdAt: String
    /// ISO-8601 timestamp of the last update to this payload.
    public let updatedAt: String

    public init(
        visitId: String,
        visitNumber: String? = nil,
        brandId: String? = nil,
        rooms: [CaptureRoomV1] = [],
        photos: [CapturePhotoV1] = [],
        transcripts: [CaptureTranscriptV1] = [],
        objectPins: [CaptureObjectPinV1] = [],
        pipeRoutes: [CapturePipeRouteV1] = [],
        pointCloudAssets: [CapturePointCloudAssetV1] = [],
        createdAt: String,
        updatedAt: String
    ) {
        self.version = "2.0"
        self.visitId = visitId
        self.visitNumber = visitNumber
        self.brandId = brandId
        self.rooms = rooms
        self.photos = photos
        self.transcripts = transcripts
        self.objectPins = objectPins
        self.pipeRoutes = pipeRoutes
        self.pointCloudAssets = pointCloudAssets
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}
