// InstallMarkup.swift
//
// Canonical install markup models for atlas-contracts.
//
// These types define the shared contract boundary for structured install markup
// produced by the scan app (atlas-scans-ios) and consumed by the recommendation
// engine (atlas-recommendation).  All spatial data is in scan coordinate space
// (metric_m, Y-up).
//
// Design principles:
//   - All spatial data is in scan coordinate space (metric_m, Y-up).
//   - Confidence distinguishes measured geometry from drawn or estimated intent.
//   - Layers separate existing system state from proposed changes.
//
// IMPORTANT: This file defines only the shared contract boundary.
// App-layer concerns (UI state, gesture handling, view models) must not
// appear here.

import Foundation

// MARK: - Install object

/// Type of an install object placed on a floor plan or wall photo.
///
/// - `boiler`:        gas/oil/heat-pump boiler unit
/// - `cylinder`:      hot water storage cylinder
/// - `radiator`:      panel or column radiator
/// - `thermostat`:    room thermostat or smart control
/// - `flue`:          flue terminal or exhaust run
/// - `pump`:          circulating pump
/// - `valve`:         isolation or zone valve
/// - `consumerUnit`:  electrical consumer unit
/// - `other`:         any type not yet enumerated
public enum InstallObjectType: String, Codable, Sendable, Equatable {
    case boiler
    case cylinder
    case radiator
    case thermostat
    case flue
    case pump
    case valve
    case consumerUnit = "consumer_unit"
    case other
}

/// Source of an install object placement.
///
/// - `scan`:     derived from LiDAR / RoomPlan geometry
/// - `manual`:   placed manually by the engineer via gesture
/// - `inferred`: inferred by the engine from surrounding context
public enum InstallObjectSource: String, Codable, Sendable, Equatable {
    case scan
    case manual
    case inferred
}

/// A 3-D size in metres.
public struct InstallDimensions: Codable, Sendable, Equatable {
    /// Width along the X axis in metres.
    public let widthM: Double
    /// Depth along the Y axis in metres.
    public let depthM: Double
    /// Height along the Z axis in metres.
    public let heightM: Double

    public init(widthM: Double, depthM: Double, heightM: Double) {
        self.widthM = widthM
        self.depthM = depthM
        self.heightM = heightM
    }
}

/// Orientation of an install object expressed as a rotation about the vertical (Z) axis.
public struct InstallOrientation: Codable, Sendable, Equatable {
    /// Rotation about the Z axis in degrees (0–360).
    public let yawDeg: Double

    public init(yawDeg: Double) {
        self.yawDeg = yawDeg
    }
}

/// InstallObjectModelV1 — a single install object placed on a floor plan or
/// wall photo.
///
/// - `id`:          unique identifier (UUID string)
/// - `type`:        category of system component
/// - `position`:    centre position in scan coordinate space (metric_m)
/// - `dimensions`:  approximate bounding dimensions in metres
/// - `orientation`: rotational orientation about the vertical axis
/// - `source`:      how the placement was derived
public struct InstallObjectModelV1: Codable, Sendable, Equatable {
    public let id: String
    public let type: InstallObjectType
    public let position: ScanPoint3D
    public let dimensions: InstallDimensions
    public let orientation: InstallOrientation
    public let source: InstallObjectSource

    public init(
        id: String,
        type: InstallObjectType,
        position: ScanPoint3D,
        dimensions: InstallDimensions,
        orientation: InstallOrientation,
        source: InstallObjectSource
    ) {
        self.id = id
        self.type = type
        self.position = position
        self.dimensions = dimensions
        self.orientation = orientation
        self.source = source
    }
}

// MARK: - Install route

/// Kind of an install route, reflecting the service carried by the pipe or
/// cable run.
///
/// - `flow`:   primary flow (heating / hot water)
/// - `return`: return leg
/// - `gas`:    gas supply pipe
/// - `cold`:   cold water supply
/// - `hot`:    hot water distribution
/// - `flue`:   flue / exhaust run
/// - `other`:  uncategorised route
public enum InstallRouteKind: String, Codable, Sendable, Equatable {
    case flow
    case `return`
    case gas
    case cold
    case hot
    case flue
    case other
}

/// How a pipe run is mounted or concealed.
///
/// - `surface`: exposed on wall or floor surface
/// - `boxed`:   enclosed in a boxing or duct
/// - `buried`:  buried in floor screed or wall chase
/// - `other`:   other mounting arrangement
public enum InstallMounting: String, Codable, Sendable, Equatable {
    case surface
    case boxed
    case buried
    case other
}

/// Confidence level of a route path.
///
/// - `measured`:  path derived from scan geometry (highest confidence)
/// - `drawn`:     path drawn manually by the engineer
/// - `estimated`: path inferred or approximated
public enum InstallRouteConfidence: String, Codable, Sendable, Equatable {
    case measured
    case drawn
    case estimated
}

/// A single waypoint on an install route path.
///
/// Extends `ScanPoint3D` with an optional elevation offset that can represent
/// a pipe rising to ceiling height independently of the scan-space Z axis.
public struct InstallPathPoint: Codable, Sendable, Equatable {
    /// Horizontal X coordinate in metres.
    public let x: Double
    /// Horizontal Y coordinate in metres.
    public let y: Double
    /// Vertical Z coordinate in metres.
    public let z: Double
    /// Optional elevation above floor level in metres (supplements z).
    public let elevationOffsetM: Double?

    public init(x: Double, y: Double, z: Double, elevationOffsetM: Double? = nil) {
        self.x = x
        self.y = y
        self.z = z
        self.elevationOffsetM = elevationOffsetM
    }
}

/// InstallRouteModelV1 — a routed pipe or cable run between two or more points.
///
/// - `id`:         unique identifier (UUID string)
/// - `kind`:       service type carried by this route
/// - `diameterMm`: nominal pipe / conduit diameter in millimetres
/// - `path`:       ordered sequence of waypoints defining the route geometry
/// - `mounting`:   how the route is mounted or concealed
/// - `confidence`: how the path geometry was derived
public struct InstallRouteModelV1: Codable, Sendable, Equatable {
    public let id: String
    public let kind: InstallRouteKind
    public let diameterMm: Double
    public let path: [InstallPathPoint]
    public let mounting: InstallMounting
    public let confidence: InstallRouteConfidence

    public init(
        id: String,
        kind: InstallRouteKind,
        diameterMm: Double,
        path: [InstallPathPoint],
        mounting: InstallMounting,
        confidence: InstallRouteConfidence
    ) {
        self.id = id
        self.kind = kind
        self.diameterMm = diameterMm
        self.path = path
        self.mounting = mounting
        self.confidence = confidence
    }
}

// MARK: - Install annotation

/// A spatial annotation attached to an install layer (e.g. a constraint note
/// or measurement label placed on the plan).
///
/// - `id`:       unique identifier (UUID string)
/// - `text`:     free-text annotation content
/// - `position`: optional spatial anchor in scan coordinate space
public struct InstallAnnotation: Codable, Sendable, Equatable {
    public let id: String
    public let text: String
    public let position: ScanPoint3D?

    public init(id: String, text: String, position: ScanPoint3D? = nil) {
        self.id = id
        self.text = text
        self.position = position
    }
}

// MARK: - Install layer

/// InstallLayerModelV1 — a layered view of install routes separating existing
/// system pipework from proposed new routes.
///
/// - `existing`: routes already installed in the property
/// - `proposed`: routes being planned as part of the new installation
/// - `notes`:    spatial annotations (constraints, measurements, labels)
///
/// This separation lets the recommendation engine reason about re-use of
/// existing routes versus the cost and complexity of new routes, and lets
/// reports show clear "before / after" overlays.
public struct InstallLayerModelV1: Codable, Sendable, Equatable {
    public let existing: [InstallRouteModelV1]
    public let proposed: [InstallRouteModelV1]
    public let notes: [InstallAnnotation]

    public init(
        existing: [InstallRouteModelV1],
        proposed: [InstallRouteModelV1],
        notes: [InstallAnnotation]
    ) {
        self.existing = existing
        self.proposed = proposed
        self.notes = notes
    }
}
