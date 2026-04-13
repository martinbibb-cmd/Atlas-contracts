// InstallMarkup.swift
//
// Canonical install markup models for Atlas — objects, routes, and layers.
//
// These types represent install intent captured during a property survey:
// physical objects placed in scene coordinate space, pipe/service routes,
// and layered overlays that distinguish existing from proposed work.
//
// Design principles:
//   - All coordinates use the same ScanPoint3D space as scan geometry.
//   - Confidence differentiates measured (LiDAR/ARKit), hand-drawn, and
//     estimated routes so the recommendation engine can weight them.
//   - Layers separate existing from proposed work — enabling "before / after"
//     visualisation and disruption analysis without mixing concerns.
//   - These types are the single canonical source; scan, engine, and reports
//     all consume the same shapes.
//
// IMPORTANT: This file defines only the shared contract boundary.
// App-layer concerns (gesture state, undo stacks, render state) must not
// appear here.

import Foundation

// MARK: - InstallObjectType

/// Type of a physical install object placed in the scene.
public enum InstallObjectType: String, Codable, Sendable, Equatable {
    case boiler
    case cylinder
    case radiator
    case thermostat
    case flue
    case pump
    case valve
    case other
}

// MARK: - InstallObjectSource

/// How an install object was placed in the scene.
///
/// - `scan`:     position derived from LiDAR / ARKit scan data
/// - `manual`:   position set by the engineer via gesture markup
/// - `inferred`: position estimated by the system from context
public enum InstallObjectSource: String, Codable, Sendable, Equatable {
    case scan
    case manual
    case inferred
}

// MARK: - InstallObjectDimensions

/// Axis-aligned bounding dimensions of an install object in metres.
public struct InstallObjectDimensions: Codable, Sendable, Equatable {
    /// Width in metres.
    public let widthM: Double
    /// Height in metres.
    public let heightM: Double
    /// Depth in metres.
    public let depthM: Double

    public init(widthM: Double, heightM: Double, depthM: Double) {
        self.widthM = widthM
        self.heightM = heightM
        self.depthM = depthM
    }
}

// MARK: - InstallObjectOrientation

/// Heading of the object's primary face in the horizontal plane.
public struct InstallObjectOrientation: Codable, Sendable, Equatable {
    /// Clockwise heading in degrees (0 = north / positive-Y axis).
    public let yawDeg: Double

    public init(yawDeg: Double) {
        self.yawDeg = yawDeg
    }
}

// MARK: - InstallObjectModelV1

/// InstallObjectModelV1 — a physical heating or plumbing object placed in scene
/// coordinate space.
///
/// - `id`:          unique identifier (UUID string)
/// - `type`:        kind of install object
/// - `position`:    3-D centroid in scan coordinate space (metric_m)
/// - `dimensions`:  optional axis-aligned bounding dimensions in metres
/// - `orientation`: optional heading of the object's primary face
/// - `source`:      how the placement was determined
public struct InstallObjectModelV1: Codable, Sendable, Equatable {
    public let id: String
    public let type: InstallObjectType
    public let position: ScanPoint3D
    public let dimensions: InstallObjectDimensions?
    public let orientation: InstallObjectOrientation?
    public let source: InstallObjectSource

    public init(
        id: String,
        type: InstallObjectType,
        position: ScanPoint3D,
        dimensions: InstallObjectDimensions? = nil,
        orientation: InstallObjectOrientation? = nil,
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

// MARK: - InstallRouteKind

/// Semantic kind of a pipe or service route.
///
/// - `flow`:     primary flow pipe (hot / heating flow)
/// - `return`:   return pipe
/// - `gas`:      gas supply pipe
/// - `flue`:     flue / exhaust duct
/// - `overflow`: overflow / pressure-relief pipe
/// - `other`:    any other service route
public enum InstallRouteKind: String, Codable, Sendable, Equatable {
    case flow
    case `return`
    case gas
    case flue
    case overflow
    case other
}

// MARK: - InstallRouteMounting

/// How a route is physically mounted.
///
/// - `surface`:   surface-mounted (visible pipework)
/// - `boxed`:     concealed in a duct or boxing
/// - `buried`:    buried in wall, floor, or ceiling void
/// - `suspended`: suspended from ceiling or structural element
/// - `other`:     any other mounting arrangement
public enum InstallRouteMounting: String, Codable, Sendable, Equatable {
    case surface
    case boxed
    case buried
    case suspended
    case other
}

// MARK: - InstallRouteConfidence

/// Confidence level of a route's geometry.
///
/// - `measured`:  spatially anchored from scan, markers, or known dimensions
/// - `drawn`:     hand-drawn by engineer via gesture markup
/// - `estimated`: generated or inferred by the system
public enum InstallRouteConfidence: String, Codable, Sendable, Equatable {
    case measured
    case drawn
    case estimated
}

// MARK: - InstallPathPoint

/// A single waypoint along an install route path.
public struct InstallPathPoint: Codable, Sendable, Equatable {
    /// Position in scan coordinate space (metric_m).
    public let position: ScanPoint3D

    public init(position: ScanPoint3D) {
        self.position = position
    }
}

// MARK: - InstallRouteModelV1

/// InstallRouteModelV1 — a single pipe or service route through the property.
///
/// - `id`:          unique identifier (UUID string)
/// - `kind`:        semantic type of the route
/// - `diameterMm`:  nominal pipe diameter in millimetres
/// - `path`:        ordered list of waypoints defining the route centreline
/// - `mounting`:    how the route is physically concealed or exposed
/// - `confidence`:  how the route geometry was determined
public struct InstallRouteModelV1: Codable, Sendable, Equatable {
    public let id: String
    public let kind: InstallRouteKind
    public let diameterMm: Double
    public let path: [InstallPathPoint]
    public let mounting: InstallRouteMounting
    public let confidence: InstallRouteConfidence

    public init(
        id: String,
        kind: InstallRouteKind,
        diameterMm: Double,
        path: [InstallPathPoint],
        mounting: InstallRouteMounting,
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

// MARK: - InstallAnnotation

/// A spatial annotation attached to an install layer.
///
/// - `id`:       unique identifier (UUID string)
/// - `text`:     human-readable note text
/// - `position`: optional 3-D anchor point in scan coordinate space
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

// MARK: - InstallLayerModelV1

/// InstallLayerModelV1 — a layered overlay of existing and proposed routes for
/// a property.
///
/// Separating existing from proposed routes enables:
///   - "before / after" visualisation
///   - disruption analysis (which existing routes are disturbed)
///   - complexity scoring (length, bends, visibility of new work)
///
/// - `existing`: routes present in the property today
/// - `proposed`: routes forming part of the proposed installation
/// - `notes`:    spatial annotations contextualising the layer
public struct InstallLayerModelV1: Codable, Sendable, Equatable {
    public let existing: [InstallRouteModelV1]
    public let proposed: [InstallRouteModelV1]
    public let notes: [InstallAnnotation]

    public init(
        existing: [InstallRouteModelV1] = [],
        proposed: [InstallRouteModelV1] = [],
        notes: [InstallAnnotation] = []
    ) {
        self.existing = existing
        self.proposed = proposed
        self.notes = notes
    }
}
