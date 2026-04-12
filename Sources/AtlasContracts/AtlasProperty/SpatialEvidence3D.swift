// SpatialEvidence3D.swift
//
// SpatialEvidence3D — internal room scan captured as walkthrough evidence.
//
// Produced by RoomPlan / LiDAR-based indoor capture.  Stores the scan asset
// and metadata only; no derived calculations or mutations to the building
// model should flow from this type.
//
// Rules:
//   - No derived maths from this asset
//   - No direct mutation of AtlasRoomV1 from the scan model
//   - File stored externally; only metadata lives in the canonical JSON
//   - Visible in engineer and portal surfaces as evidence only
//
// IMPORTANT: This file defines only the shared contract boundary.

import Foundation

// MARK: - SpatialEvidence3DFormat

/// File format of a 3D scan asset.
public enum SpatialEvidence3DFormat: String, Codable, Sendable, Equatable {
    case usdz
    case glb
    case realitykit
}

// MARK: - SpatialEvidence3DBounds

/// Approximate spatial extents of the captured area in metres.
public struct SpatialEvidence3DBounds: Codable, Sendable, Equatable {
    public let width: Double
    public let length: Double
    public let height: Double

    public init(width: Double, length: Double, height: Double) {
        self.width = width
        self.length = length
        self.height = height
    }
}

// MARK: - SpatialEvidence3DCaptureMeta

/// Capture device and session metadata for a 3D scan.
public struct SpatialEvidence3DCaptureMeta: Codable, Sendable, Equatable {
    /// Hardware identifier of the capture device (e.g. "iPhone 15 Pro").
    public let device: String
    /// ISO-8601 timestamp of capture.
    public let timestamp: String
    /// Capture confidence score in [0, 1].
    public let confidence: Double?

    public init(device: String, timestamp: String, confidence: Double? = nil) {
        self.device = device
        self.timestamp = timestamp
        self.confidence = confidence
    }
}

// MARK: - SpatialEvidence3D

/// An internal room scan captured as walkthrough evidence.
///
/// Produced by RoomPlan / LiDAR-based indoor capture.  This type carries only
/// the scan asset URL and capture metadata.  No derived calculations or
/// mutations to the building model should flow from this contract.
public struct SpatialEvidence3D: Codable, Sendable, Equatable {
    /// Unique identifier (UUID string).
    public let id: String
    /// ID of the property this scan belongs to.
    public let propertyId: String
    /// ID of the capture session that produced this scan.
    public let sourceSessionId: String
    /// Discriminant — always `"internal_room_scan"`.
    public let kind: String
    /// File format of the 3D asset.
    public let format: SpatialEvidence3DFormat
    /// Remote URL of the 3D asset file.
    public let fileUrl: String
    /// Remote URL of a preview image (thumbnail) for the scan.
    public let previewImageUrl: String?
    /// IDs of the building-model rooms this scan is linked to.
    public let linkedRoomIds: [String]?
    /// IDs of the thermal zones this scan is linked to.
    public let linkedZoneIds: [String]?
    /// Approximate spatial extents of the captured area in metres.
    public let bounds: SpatialEvidence3DBounds?
    /// Capture device and session metadata.
    public let captureMeta: SpatialEvidence3DCaptureMeta?

    public init(
        id: String,
        propertyId: String,
        sourceSessionId: String,
        format: SpatialEvidence3DFormat,
        fileUrl: String,
        previewImageUrl: String? = nil,
        linkedRoomIds: [String]? = nil,
        linkedZoneIds: [String]? = nil,
        bounds: SpatialEvidence3DBounds? = nil,
        captureMeta: SpatialEvidence3DCaptureMeta? = nil
    ) {
        self.id = id
        self.propertyId = propertyId
        self.sourceSessionId = sourceSessionId
        self.kind = "internal_room_scan"
        self.format = format
        self.fileUrl = fileUrl
        self.previewImageUrl = previewImageUrl
        self.linkedRoomIds = linkedRoomIds
        self.linkedZoneIds = linkedZoneIds
        self.bounds = bounds
        self.captureMeta = captureMeta
    }
}
