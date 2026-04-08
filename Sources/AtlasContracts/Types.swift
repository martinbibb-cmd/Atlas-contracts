// Types.swift
//
// Versioned scan bundle contract definitions.
//
// These types represent the external boundary between any future native scan
// client (e.g. an iOS RoomPlan companion app) and the Atlas web app.
//
// IMPORTANT: This package defines only the incoming scan contract and its
// validation boundary.  Atlas remains the owner of canonical truth and
// importer / mapping behaviour.
//
// The current supported contract version is "1.0".

import Foundation

// MARK: - Coordinate conventions

/// Coordinate convention used in the scan bundle.
///
/// `metricM` — SI metres, right-handed coordinate system, Y-up (default for
/// RoomPlan-style outputs).  The Atlas importer normalises to canvas units.
public enum ScanCoordinateConvention: String, Codable, Sendable {
    case metricM = "metric_m"
}

// MARK: - Quality / confidence

/// Banded confidence rating for a scanned entity.
///
/// - `high`:   scanner had good coverage, measurement uncertainty < 5 cm
/// - `medium`: partial coverage or occlusion, uncertainty 5–20 cm
/// - `low`:    estimated / inferred, uncertainty > 20 cm or reconstruction artefact
public enum ScanConfidenceBand: String, Codable, Sendable {
    case high
    case medium
    case low
}

/// Severity level for a QA flag.
public enum ScanQAFlagSeverity: String, Codable, Sendable {
    case info
    case warning
    case error
}

/// A QA flag attached to a scanned entity or to the whole bundle.
public struct ScanQAFlag: Codable, Sendable, Equatable {
    /// Machine-readable flag code.
    public let code: String
    /// Human-readable description.
    public let message: String
    /// Severity level.
    public let severity: ScanQAFlagSeverity
    /// Optional reference to the affected entity within the bundle.
    public let entityId: String?

    public init(code: String, message: String, severity: ScanQAFlagSeverity, entityId: String? = nil) {
        self.code = code
        self.message = message
        self.severity = severity
        self.entityId = entityId
    }
}

// MARK: - Scan geometry primitives

/// A 2-D point in scan coordinate space (before normalisation to Atlas canvas units).
///
/// `x`, `y` — horizontal-plane coordinates in metres (origin arbitrary, set by scanner).
public struct ScanPoint2D: Codable, Sendable, Equatable {
    public let x: Double
    public let y: Double

    public init(x: Double, y: Double) {
        self.x = x
        self.y = y
    }
}

/// A 3-D point in scan coordinate space.
///
/// `x`, `y` — horizontal plane.
/// `z` — vertical (elevation) in metres.
public struct ScanPoint3D: Codable, Sendable, Equatable {
    public let x: Double
    public let y: Double
    public let z: Double

    public init(x: Double, y: Double, z: Double) {
        self.x = x
        self.y = y
        self.z = z
    }
}

// MARK: - Opening (door / window)

/// Type of opening detected on a wall.
public enum ScanOpeningType: String, Codable, Sendable {
    case door
    case window
    case unknown
}

/// An opening detected on a wall by the scanner.
public struct ScanOpening: Codable, Sendable, Equatable {
    public let id: String
    /// Detected opening width in metres.
    public let widthM: Double
    /// Detected opening height in metres (0 if not captured).
    public let heightM: Double
    /// Distance from the wall's start point to the opening centre.
    public let offsetM: Double
    /// Opening type.
    public let type: ScanOpeningType
    /// Scanner confidence in this detection.
    public let confidence: ScanConfidenceBand

    public init(
        id: String,
        widthM: Double,
        heightM: Double,
        offsetM: Double,
        type: ScanOpeningType,
        confidence: ScanConfidenceBand
    ) {
        self.id = id
        self.widthM = widthM
        self.heightM = heightM
        self.offsetM = offsetM
        self.type = type
        self.confidence = confidence
    }
}

// MARK: - Wall

/// Kind of wall segment.
public enum ScanWallKind: String, Codable, Sendable {
    case `internal`
    case external
    case unknown
}

/// A wall segment detected by the scanner.
public struct ScanWall: Codable, Sendable, Equatable {
    public let id: String
    /// Start endpoint in scan coordinate space (metric_m).
    public let start: ScanPoint3D
    /// End endpoint in scan coordinate space (metric_m).
    public let end: ScanPoint3D
    /// Wall height (ceiling-to-floor) in metres; 0 if not captured.
    public let heightM: Double
    /// Estimated wall thickness in millimetres; 0 if unknown.
    public let thicknessMm: Double
    /// Wall kind.
    public let kind: ScanWallKind
    /// Detected openings (doors / windows) on this wall.
    public let openings: [ScanOpening]
    /// Scanner confidence in this wall segment.
    public let confidence: ScanConfidenceBand

    public init(
        id: String,
        start: ScanPoint3D,
        end: ScanPoint3D,
        heightM: Double,
        thicknessMm: Double,
        kind: ScanWallKind,
        openings: [ScanOpening],
        confidence: ScanConfidenceBand
    ) {
        self.id = id
        self.start = start
        self.end = end
        self.heightM = heightM
        self.thicknessMm = thicknessMm
        self.kind = kind
        self.openings = openings
        self.confidence = confidence
    }
}

// MARK: - Detected object

/// Axis-aligned bounding box in scan coordinate space.
public struct ScanBoundingBox: Codable, Sendable, Equatable {
    public let minX: Double
    public let minY: Double
    public let maxX: Double
    public let maxY: Double
    public let minZ: Double
    public let maxZ: Double

    public init(minX: Double, minY: Double, maxX: Double, maxY: Double, minZ: Double, maxZ: Double) {
        self.minX = minX
        self.minY = minY
        self.maxX = maxX
        self.maxY = maxY
        self.minZ = minZ
        self.maxZ = maxZ
    }
}

/// An object detected in the room by the scanner (furniture, fixtures, etc.).
public struct ScanDetectedObject: Codable, Sendable, Equatable {
    public let id: String
    /// Broad class of the object (e.g. "furniture", "appliance").
    public let category: String
    /// Scanner's best-guess label (e.g. "sofa", "washing_machine").
    public let label: String
    /// Axis-aligned bounding box in scan coordinate space.
    public let boundingBox: ScanBoundingBox
    /// Scanner confidence in this detection.
    public let confidence: ScanConfidenceBand

    public init(
        id: String,
        category: String,
        label: String,
        boundingBox: ScanBoundingBox,
        confidence: ScanConfidenceBand
    ) {
        self.id = id
        self.category = category
        self.label = label
        self.boundingBox = boundingBox
        self.confidence = confidence
    }
}

// MARK: - Anchor

/// Type of georeferencing anchor.
public enum ScanAnchorType: String, Codable, Sendable {
    case gps
    case qrCode = "qr_code"
    case manual
    case unknown
}

/// A georeferencing anchor that links scan coordinate space to the real world.
///
/// Anchors are optional. If absent the importer treats the origin as arbitrary.
public struct ScanAnchor: Codable, Sendable, Equatable {
    public let id: String
    /// Anchor type.
    public let type: ScanAnchorType
    /// Anchor position in scan coordinate space.
    public let position: ScanPoint3D
    /// Optional external reference (e.g. GPS coordinate, QR payload).
    public let realWorldRef: String?
    /// How reliable this anchor is.
    public let confidence: ScanConfidenceBand

    public init(
        id: String,
        type: ScanAnchorType,
        position: ScanPoint3D,
        realWorldRef: String? = nil,
        confidence: ScanConfidenceBand
    ) {
        self.id = id
        self.type = type
        self.position = position
        self.realWorldRef = realWorldRef
        self.confidence = confidence
    }
}

// MARK: - Room

/// A room captured by the scanner.
public struct ScanRoom: Codable, Sendable, Equatable {
    public let id: String
    /// Scanner's suggested room label (free-text; may be empty).
    public let label: String
    /// Which storey this room is on (0 = ground, 1 = first, etc.).
    public let floorIndex: Int
    /// Floor polygon boundary in scan coordinate space (metric_m).
    public let polygon: [ScanPoint2D]
    /// Calculated floor area in m².
    public let areaM2: Double
    /// Ceiling height in metres.
    public let heightM: Double
    /// Walls bounding this room.
    public let walls: [ScanWall]
    /// Objects detected inside this room.
    public let detectedObjects: [ScanDetectedObject]
    /// Scanner confidence in the overall room geometry.
    public let confidence: ScanConfidenceBand

    public init(
        id: String,
        label: String,
        floorIndex: Int,
        polygon: [ScanPoint2D],
        areaM2: Double,
        heightM: Double,
        walls: [ScanWall],
        detectedObjects: [ScanDetectedObject],
        confidence: ScanConfidenceBand
    ) {
        self.id = id
        self.label = label
        self.floorIndex = floorIndex
        self.polygon = polygon
        self.areaM2 = areaM2
        self.heightM = heightM
        self.walls = walls
        self.detectedObjects = detectedObjects
        self.confidence = confidence
    }
}

// MARK: - Scan metadata

/// Metadata about the scan session that produced this bundle.
public struct ScanMeta: Codable, Sendable, Equatable {
    /// ISO-8601 timestamp of when the scan was taken.
    public let capturedAt: String
    /// Scanner hardware identifier (e.g. "iPhone 15 Pro").
    public let deviceModel: String
    /// App name and version (e.g. "AtlasScan 1.0.0").
    public let scannerApp: String
    /// Coordinate system used in this bundle.
    public let coordinateConvention: ScanCoordinateConvention
    /// Optional Atlas property / visit ID this scan is for.
    public let propertyRef: String?
    /// Free-text notes from the operator.
    public let operatorNotes: String?

    public init(
        capturedAt: String,
        deviceModel: String,
        scannerApp: String,
        coordinateConvention: ScanCoordinateConvention,
        propertyRef: String? = nil,
        operatorNotes: String? = nil
    ) {
        self.capturedAt = capturedAt
        self.deviceModel = deviceModel
        self.scannerApp = scannerApp
        self.coordinateConvention = coordinateConvention
        self.propertyRef = propertyRef
        self.operatorNotes = operatorNotes
    }
}

// MARK: - Top-level bundle

/// ScanBundleV1 — the top-level unit of data sent from a future scan client.
///
/// - `version`:    contract version string; must be one of `supportedScanBundleVersions`.
/// - `bundleId`:   unique identifier for this bundle (generated by the scan client).
/// - `rooms`:      list of captured rooms.
/// - `anchors`:    optional georeferencing anchors.
/// - `qaFlags`:    QA flags raised by the scan client during capture.
/// - `meta`:       capture session metadata.
/// - `voiceNotes`: voice notes recorded during the capture session.
///                 Absent in older payloads; decodes to an empty array for
///                 backward compatibility.
public struct ScanBundleV1: Codable, Sendable, Equatable {
    public let version: String
    public let bundleId: String
    public let rooms: [ScanRoom]
    public let anchors: [ScanAnchor]
    public let qaFlags: [ScanQAFlag]
    public let meta: ScanMeta
    /// Voice notes recorded during the session. Defaults to `[]` so that
    /// payloads produced before this field was introduced still decode cleanly.
    public let voiceNotes: [VoiceNote]

    public init(
        version: String = "1.0",
        bundleId: String,
        rooms: [ScanRoom],
        anchors: [ScanAnchor] = [],
        qaFlags: [ScanQAFlag] = [],
        meta: ScanMeta,
        voiceNotes: [VoiceNote] = []
    ) {
        self.version = version
        self.bundleId = bundleId
        self.rooms = rooms
        self.anchors = anchors
        self.qaFlags = qaFlags
        self.meta = meta
        self.voiceNotes = voiceNotes
    }

    // MARK: Backward-compatible decoding

    private enum CodingKeys: String, CodingKey {
        case version, bundleId, rooms, anchors, qaFlags, meta, voiceNotes
    }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        version = try c.decode(String.self, forKey: .version)
        bundleId = try c.decode(String.self, forKey: .bundleId)
        rooms = try c.decode([ScanRoom].self, forKey: .rooms)
        anchors = try c.decode([ScanAnchor].self, forKey: .anchors)
        qaFlags = try c.decode([ScanQAFlag].self, forKey: .qaFlags)
        meta = try c.decode(ScanMeta.self, forKey: .meta)
        voiceNotes = try c.decodeIfPresent([VoiceNote].self, forKey: .voiceNotes) ?? []
    }
}

/// ScanBundle — type alias for the current versioned scan bundle.
///
/// Use this type when accepting an unknown bundle (e.g. from a file or network).
/// The importer inspects the `version` field to select the correct handler.
public typealias ScanBundle = ScanBundleV1
