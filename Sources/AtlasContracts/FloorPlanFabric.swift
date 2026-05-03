// FloorPlanFabric.swift
//
// Floor-plan perimeter and material capture contracts for Atlas Scan.
//
// These types represent measured/captured fabric data only.
// They carry no heat-loss calculation, no U-value derivation, and no
// recommendation logic.
//
// Design principles:
//   - Every boundary and opening carries provenance and reviewStatus.
//   - Rejected evidence remains in history but must not feed customer outputs.
//   - LiDAR-derived boundaries default to reviewStatus: pending.
//   - Manually confirmed boundaries can be set to reviewStatus: confirmed.
//   - Unknown material is valid — engineers are not required to identify it.

import Foundation

// MARK: - FloorPlanBoundaryKindV1

/// The structural kind of a floor-plan boundary segment.
///
/// - `externalWall`: separates the dwelling from outside
/// - `internalWall`: separates two rooms within the same dwelling
/// - `partyWall`:    shared with a neighbouring property
/// - `floorEdge`:    lower horizontal boundary of a room
/// - `ceilingEdge`:  upper horizontal boundary of a room
/// - `unknown`:      kind not yet identified
public enum FloorPlanBoundaryKindV1: String, Codable, Sendable, Equatable {
    case externalWall = "external_wall"
    case internalWall = "internal_wall"
    case partyWall    = "party_wall"
    case floorEdge    = "floor_edge"
    case ceilingEdge  = "ceiling_edge"
    case unknown
}

// MARK: - FloorPlanOpeningKindV1

/// The kind of an opening within a boundary segment.
///
/// - `door`:       standard hinged or sliding door
/// - `window`:     fixed or openable window
/// - `patioDoor`:  full-height glazed patio or French door
/// - `rooflight`:  overhead glazing in a ceiling or roof
/// - `openArch`:   open archway with no door
/// - `unknown`:    kind not yet identified
public enum FloorPlanOpeningKindV1: String, Codable, Sendable, Equatable {
    case door
    case window
    case patioDoor  = "patio_door"
    case rooflight
    case openArch   = "open_arch"
    case unknown
}

// MARK: - FabricMaterialV1

/// The construction material recorded for a boundary or opening.
///
/// This is captured evidence — not a derived or modelled value.
/// `unknown` is valid; engineers are not required to identify the material.
public enum FabricMaterialV1: String, Codable, Sendable, Equatable {
    case solidBrick            = "solid_brick"
    case cavityWall            = "cavity_wall"
    case insulatedCavity       = "insulated_cavity"
    case timberFrame           = "timber_frame"
    case stone
    case singleGlazing         = "single_glazing"
    case doubleGlazing         = "double_glazing"
    case tripleGlazing         = "triple_glazing"
    case insulatedDoor         = "insulated_door"
    case uninsulatedDoor       = "uninsulated_door"
    case suspendedTimberFloor  = "suspended_timber_floor"
    case solidFloor            = "solid_floor"
    case insulatedFloor        = "insulated_floor"
    case pitchedRoof           = "pitched_roof"
    case flatRoof              = "flat_roof"
    case insulatedRoof         = "insulated_roof"
    case unknown
}

// MARK: - FloorPlanPointV1

/// A 2-D or 3-D point in a named coordinate space.
///
/// `coordinateSpace` uses `CoordinateSpaceV1` defined in `SessionCaptureV2.swift`.
///
/// - `roomPlan`:  local to the current room's scan capture
/// - `floorPlan`: normalised to the storey floor plan
/// - `world`:     ARKit world coordinate space
public struct FloorPlanPointV1: Codable, Sendable, Equatable {
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

// MARK: - FloorPlanBoundaryV1

/// A single boundary segment of a room's perimeter.
///
/// Each boundary is defined by a start/end point pair.  Optional dimensions
/// (length, height) and material may be attached.
///
/// Default reviewStatus by provenance:
///   - `scan` (LiDAR)  → `pending`
///   - `manual`        → `confirmed`
public struct FloorPlanBoundaryV1: Codable, Sendable, Equatable {
    /// Unique identifier (UUID string).
    public let id: String
    /// ID of the room this boundary belongs to.
    public let roomId: String
    /// Structural kind of this boundary.
    public let kind: FloorPlanBoundaryKindV1
    /// Start point of the boundary segment.
    public let start: FloorPlanPointV1
    /// End point of the boundary segment.
    public let end: FloorPlanPointV1
    /// Measured or estimated length in millimetres.
    public let lengthMm: Double?
    /// Measured or estimated height in millimetres.
    public let heightMm: Double?
    /// Construction material, if identified.
    public let material: FabricMaterialV1?
    /// QA review status.
    public let reviewStatus: ReviewStatusV1
    /// How this boundary was produced.
    public let provenance: CaptureProvenanceV1
    /// Optional free-text engineer note.
    public let notes: String?

    public init(
        id: String,
        roomId: String,
        kind: FloorPlanBoundaryKindV1,
        start: FloorPlanPointV1,
        end: FloorPlanPointV1,
        lengthMm: Double? = nil,
        heightMm: Double? = nil,
        material: FabricMaterialV1? = nil,
        reviewStatus: ReviewStatusV1,
        provenance: CaptureProvenanceV1,
        notes: String? = nil
    ) {
        self.id = id
        self.roomId = roomId
        self.kind = kind
        self.start = start
        self.end = end
        self.lengthMm = lengthMm
        self.heightMm = heightMm
        self.material = material
        self.reviewStatus = reviewStatus
        self.provenance = provenance
        self.notes = notes
    }
}

// MARK: - FloorPlanOpeningV1

/// A door, window, or other opening within a room boundary.
///
/// An opening may reference a parent boundary (`boundaryId`) but is not
/// required to — e.g. a rooflight does not sit within a wall boundary.
public struct FloorPlanOpeningV1: Codable, Sendable, Equatable {
    /// Unique identifier (UUID string).
    public let id: String
    /// ID of the room this opening belongs to.
    public let roomId: String
    /// Optional reference to the parent boundary segment.
    public let boundaryId: String?
    /// Kind of opening.
    public let kind: FloorPlanOpeningKindV1
    /// Spatial position of the opening centre.
    public let position: FloorPlanPointV1
    /// Width in millimetres.
    public let widthMm: Double?
    /// Height in millimetres.
    public let heightMm: Double?
    /// Construction material, if identified.
    public let material: FabricMaterialV1?
    /// QA review status.
    public let reviewStatus: ReviewStatusV1
    /// How this opening was produced.
    public let provenance: CaptureProvenanceV1
    /// Optional free-text engineer note.
    public let notes: String?

    public init(
        id: String,
        roomId: String,
        boundaryId: String? = nil,
        kind: FloorPlanOpeningKindV1,
        position: FloorPlanPointV1,
        widthMm: Double? = nil,
        heightMm: Double? = nil,
        material: FabricMaterialV1? = nil,
        reviewStatus: ReviewStatusV1,
        provenance: CaptureProvenanceV1,
        notes: String? = nil
    ) {
        self.id = id
        self.roomId = roomId
        self.boundaryId = boundaryId
        self.kind = kind
        self.position = position
        self.widthMm = widthMm
        self.heightMm = heightMm
        self.material = material
        self.reviewStatus = reviewStatus
        self.provenance = provenance
        self.notes = notes
    }
}

// MARK: - FloorPlanRoomFabricV1

/// Measured fabric data for a single room.
///
/// `floorAreaM2`, `ceilingHeightMm`, and `perimeterMm` are optional aggregates
/// that may be derived from the boundary list or entered manually.
public struct FloorPlanRoomFabricV1: Codable, Sendable, Equatable {
    /// ID of the room (matches CaptureRoomV1.id in SessionCaptureV2).
    public let roomId: String
    /// Floor area in square metres.
    public let floorAreaM2: Double?
    /// Ceiling height in millimetres.
    public let ceilingHeightMm: Double?
    /// Total room perimeter in millimetres.
    public let perimeterMm: Double?
    /// Boundary segments forming the room perimeter.
    public let boundaries: [FloorPlanBoundaryV1]
    /// Openings (doors, windows, etc.) within the room.
    public let openings: [FloorPlanOpeningV1]
    /// QA review status for this room's fabric data.
    public let reviewStatus: ReviewStatusV1
    /// How this room's fabric data was produced.
    public let provenance: CaptureProvenanceV1

    public init(
        roomId: String,
        floorAreaM2: Double? = nil,
        ceilingHeightMm: Double? = nil,
        perimeterMm: Double? = nil,
        boundaries: [FloorPlanBoundaryV1] = [],
        openings: [FloorPlanOpeningV1] = [],
        reviewStatus: ReviewStatusV1,
        provenance: CaptureProvenanceV1
    ) {
        self.roomId = roomId
        self.floorAreaM2 = floorAreaM2
        self.ceilingHeightMm = ceilingHeightMm
        self.perimeterMm = perimeterMm
        self.boundaries = boundaries
        self.openings = openings
        self.reviewStatus = reviewStatus
        self.provenance = provenance
    }
}

// MARK: - FloorPlanFabricCaptureV1

/// FloorPlanFabricCaptureV1 — the top-level container for floor-plan perimeter
/// and material capture data produced by Atlas Scan.
///
/// This is measured/captured fabric data only.  It is NOT:
///   - a heat-loss calculation
///   - a U-value model
///   - a recommendation or design output
///
/// What IS included:
///   - room perimeters (boundary segments with kind, dimensions, material)
///   - openings (doors, windows) with dimensions and material
///   - provenance and reviewStatus on every item
///   - visitId for cross-system keying
public struct FloorPlanFabricCaptureV1: Codable, Sendable, Equatable {
    /// Contract discriminant — always "1.0".
    public let version: String
    /// Authoritative cross-system visit identifier.
    public let visitId: String
    /// Fabric data for each room captured in this visit.
    public let rooms: [FloorPlanRoomFabricV1]
    /// ISO-8601 timestamp of when this payload was first created.
    public let createdAt: String
    /// ISO-8601 timestamp of the last update to this payload.
    public let updatedAt: String

    public init(
        visitId: String,
        rooms: [FloorPlanRoomFabricV1] = [],
        createdAt: String,
        updatedAt: String
    ) {
        self.version = "1.0"
        self.visitId = visitId
        self.rooms = rooms
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}
