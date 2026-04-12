// ExternalClearanceScene.swift
//
// ExternalClearanceSceneV1 — outdoor flue-clearance compliance scene.
//
// Captured outside the property to tag the flue terminal, nearby openings,
// and other features that affect flue-clearance compliance.  Compliance
// logic runs from the structured measurements and tagged features, not from
// raw point-cloud geometry.
//
// Rules:
//   - Compliance logic must use structured measurements / tagged features only
//   - Point cloud / mesh are optional evidence assets
//   - No raw point-cloud parsing in report rendering
//   - No large binary blobs inlined into the JSON payload
//
// IMPORTANT: This file defines only the shared contract boundary.

import Foundation

// MARK: - Vec3

/// A 3-D vector / point in metres, used for spatial evidence positioning.
///
/// - `x`, `y` — horizontal plane.
/// - `z`      — vertical (elevation) in metres.
public struct Vec3: Codable, Sendable, Equatable {
    public let x: Double
    public let y: Double
    public let z: Double

    public init(x: Double, y: Double, z: Double) {
        self.x = x
        self.y = y
        self.z = z
    }
}

// MARK: - ClearanceEvidenceAssets

/// Optional remote evidence assets for an external clearance scene.
public struct ClearanceEvidenceAssets: Codable, Sendable, Equatable {
    /// Remote URL of a preview image for the scene.
    public let previewImageUrl: String?
    /// Remote URL of a 3D mesh / scene model.
    public let modelUrl: String?
    /// Remote URL of a raw point-cloud asset (evidence only).
    public let pointCloudUrl: String?

    public init(
        previewImageUrl: String? = nil,
        modelUrl: String? = nil,
        pointCloudUrl: String? = nil
    ) {
        self.previewImageUrl = previewImageUrl
        self.modelUrl = modelUrl
        self.pointCloudUrl = pointCloudUrl
    }
}

// MARK: - FlueTerminalLocation

/// Spatial description of the flue terminal location.
public struct FlueTerminalLocation: Codable, Sendable, Equatable {
    /// Terminal position in scene coordinate space.
    public let position3D: Vec3?
    /// Outward normal vector of the terminal face.
    public let normal: Vec3?
    /// Height of the terminal above ground level in metres.
    public let heightAboveGroundM: Double?

    public init(
        position3D: Vec3? = nil,
        normal: Vec3? = nil,
        heightAboveGroundM: Double? = nil
    ) {
        self.position3D = position3D
        self.normal = normal
        self.heightAboveGroundM = heightAboveGroundM
    }
}

// MARK: - NearbyFeatureType

/// Classification of a feature tagged near the flue terminal.
public enum NearbyFeatureType: String, Codable, Sendable, Equatable {
    case window
    case door
    case airBrick       = "air_brick"
    case boundary
    case eaves
    case gutter
    case soilStack      = "soil_stack"
    case opening
    case adjacentFlue   = "adjacent_flue"
    case balcony
}

// MARK: - NearbyFeature

/// A feature tagged near the flue terminal during the outdoor capture.
public struct NearbyFeature: Codable, Sendable, Equatable {
    /// Unique identifier for this feature (UUID string).
    public let id: String
    /// Classification of the nearby feature.
    public let type: NearbyFeatureType
    /// Position of the feature in scene coordinate space.
    public let position3D: Vec3?
    /// Measured or derived distance from the terminal to this feature in metres.
    public let distanceToTerminalM: Double?
    /// Free-text notes about this feature.
    public let notes: String?

    public init(
        id: String,
        type: NearbyFeatureType,
        position3D: Vec3? = nil,
        distanceToTerminalM: Double? = nil,
        notes: String? = nil
    ) {
        self.id = id
        self.type = type
        self.position3D = position3D
        self.distanceToTerminalM = distanceToTerminalM
        self.notes = notes
    }
}

// MARK: - ClearanceMeasurementKind

/// What is being measured in a clearance measurement.
public enum ClearanceMeasurementKind: String, Codable, Sendable, Equatable {
    case terminalToOpening  = "terminal_to_opening"
    case terminalToBoundary = "terminal_to_boundary"
    case terminalToEaves    = "terminal_to_eaves"
}

// MARK: - ClearanceMeasurementSource

/// Whether a clearance measurement was directly measured or computationally derived.
public enum ClearanceMeasurementSource: String, Codable, Sendable, Equatable {
    case measured
    case derived
}

// MARK: - ClearanceMeasurement

/// A structured measurement between the flue terminal and a tagged feature.
public struct ClearanceMeasurement: Codable, Sendable, Equatable {
    /// Unique identifier for this measurement (UUID string).
    public let id: String
    /// What is being measured.
    public let kind: ClearanceMeasurementKind
    /// Measurement value in metres.
    public let valueM: Double
    /// Whether the value was directly measured or computationally derived.
    public let source: ClearanceMeasurementSource

    public init(
        id: String,
        kind: ClearanceMeasurementKind,
        valueM: Double,
        source: ClearanceMeasurementSource
    ) {
        self.id = id
        self.kind = kind
        self.valueM = valueM
        self.source = source
    }
}

// MARK: - ClearanceComplianceResult

/// Compliance outcome derived from the structured measurements of a clearance scene.
public struct ClearanceComplianceResult: Codable, Sendable, Equatable {
    /// Reference to the gas-safety / building standard applied (e.g. "BS 5440-1").
    public let standardRef: String?
    /// Human-readable compliance warnings.
    public let warnings: [String]?
    /// Overall pass/fail outcome.
    public let pass: Bool?

    public init(
        standardRef: String? = nil,
        warnings: [String]? = nil,
        pass: Bool? = nil
    ) {
        self.standardRef = standardRef
        self.warnings = warnings
        self.pass = pass
    }
}

// MARK: - ExternalClearanceSceneV1

/// An outdoor flue-clearance compliance scene.
///
/// Captures the area outside the property, tagging the flue terminal and
/// nearby openings or obstacles.  Compliance logic runs from the structured
/// ``measurements`` and ``nearbyFeatures``, not from raw point-cloud geometry.
public struct ExternalClearanceSceneV1: Codable, Sendable, Equatable {
    /// Unique identifier (UUID string).
    public let id: String
    /// ID of the property this scene belongs to.
    public let propertyId: String
    /// ID of the capture session that produced this scene.
    public let sourceSessionId: String
    /// Discriminant — always `"external_flue_clearance"`.
    public let kind: String
    /// Optional remote evidence assets (preview, mesh, point cloud).
    public let evidence: ClearanceEvidenceAssets
    /// Spatial description of the flue terminal location.
    public let flueTerminal: FlueTerminalLocation?
    /// Nearby features tagged during the outdoor capture.
    public let nearbyFeatures: [NearbyFeature]
    /// Structured measurements between the terminal and tagged features.
    public let measurements: [ClearanceMeasurement]
    /// Compliance outcome derived from the structured measurements.
    public let compliance: ClearanceComplianceResult?

    public init(
        id: String,
        propertyId: String,
        sourceSessionId: String,
        evidence: ClearanceEvidenceAssets = ClearanceEvidenceAssets(),
        flueTerminal: FlueTerminalLocation? = nil,
        nearbyFeatures: [NearbyFeature] = [],
        measurements: [ClearanceMeasurement] = [],
        compliance: ClearanceComplianceResult? = nil
    ) {
        self.id = id
        self.propertyId = propertyId
        self.sourceSessionId = sourceSessionId
        self.kind = "external_flue_clearance"
        self.evidence = evidence
        self.flueTerminal = flueTerminal
        self.nearbyFeatures = nearbyFeatures
        self.measurements = measurements
        self.compliance = compliance
    }
}
