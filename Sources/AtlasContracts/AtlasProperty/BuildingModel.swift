// BuildingModel.swift
//
// BuildingModelV1 — the physical truth layer of an AtlasPropertyV1.
//
// Hierarchy:
//   BuildingModelV1
//     ├─ floors[]           — storey metadata
//     ├─ rooms[]            — spatial truth (labelled floor polygons)
//     ├─ zones[]            — thermal / heat-loss zones
//     ├─ boundaries[]       — envelope elements
//     ├─ openings[]         — doors, windows, rooflights
//     ├─ emitters[]         — CH emitters
//     ├─ systemComponents[] — plant (boiler, cylinder, manifold, meter, flue)
//     ├─ pipeRoutes[]?      — optional pipe-routing data
//     └─ services?          — utility / services model
//
// IMPORTANT: This file defines only the shared contract boundary.

import Foundation

// MARK: - FloorV1

/// A single storey of the building.
public struct FloorV1: Codable, Sendable, Equatable {
    /// Unique identifier (UUID string).
    public let floorId: String
    /// Storey index: 0 = ground, 1 = first, -1 = basement.
    public let index: Int
    /// Human-readable label (e.g. "Ground Floor", "Loft").
    public let label: String
    /// Floor-to-ceiling height in metres.
    public let heightM: FieldValue<Double>?

    public init(floorId: String, index: Int, label: String, heightM: FieldValue<Double>? = nil) {
        self.floorId = floorId
        self.index = index
        self.label = label
        self.heightM = heightM
    }
}

// MARK: - PropertyRoomV1

/// Spatial room within the building.
///
/// Named `PropertyRoomV1` in Swift to avoid collision with `RoomV1` from
/// `SessionCaptureV1`.  The JSON key is "roomId" which maps correctly.
public struct PropertyRoomV1: Codable, Sendable, Equatable {
    /// Unique identifier (UUID string).
    public let roomId: String
    /// ID of the floor this room sits on.
    public let floorId: String
    /// Human-readable label (e.g. "Kitchen", "Master Bedroom").
    public let label: String
    /// Calculated floor area in m².
    public let areaM2: FieldValue<Double>?
    /// Ceiling height in metres.
    public let heightM: FieldValue<Double>?
    /// Whether this room is in the heated envelope.
    public let heated: Bool?
    /// Reference to the scan bundle room this was derived from (ScanRoom.id).
    public let scanRoomRef: String?

    public init(
        roomId: String,
        floorId: String,
        label: String,
        areaM2: FieldValue<Double>? = nil,
        heightM: FieldValue<Double>? = nil,
        heated: Bool? = nil,
        scanRoomRef: String? = nil
    ) {
        self.roomId = roomId
        self.floorId = floorId
        self.label = label
        self.areaM2 = areaM2
        self.heightM = heightM
        self.heated = heated
        self.scanRoomRef = scanRoomRef
    }
}

// MARK: - ThermalZoneV1

/// A thermal zone used for heat-loss and SAP calculation.
public struct ThermalZoneV1: Codable, Sendable, Equatable {
    /// Unique identifier (UUID string).
    public let zoneId: String
    /// Human-readable zone label.
    public let label: String
    /// Room IDs that make up this zone.
    public let roomIds: [String]
    /// Design indoor temperature in °C.
    public let designTempC: FieldValue<Double>?
    /// Whether this zone is part of the heated envelope.
    public let heated: Bool?

    public init(
        zoneId: String,
        label: String,
        roomIds: [String],
        designTempC: FieldValue<Double>? = nil,
        heated: Bool? = nil
    ) {
        self.zoneId = zoneId
        self.label = label
        self.roomIds = roomIds
        self.designTempC = designTempC
        self.heated = heated
    }
}

// MARK: - BoundaryType

/// Building envelope element type.
public enum BoundaryType: String, Codable, Sendable, Equatable {
    case externalWall   = "external_wall"
    case roof
    case groundFloor    = "ground_floor"
    case partyWall      = "party_wall"
    case internalWall   = "internal_wall"
    case ceiling
    case unknown
}

// MARK: - BoundaryV1

/// A building envelope element that contributes to heat loss.
public struct BoundaryV1: Codable, Sendable, Equatable {
    public let boundaryId: String
    public let type: BoundaryType
    public let roomIds: [String]
    public let grossAreaM2: FieldValue<Double>?
    public let construction: FieldValue<String>?
    public let uValueWm2K: FieldValue<Double>?
    public let cavityFilled: FieldValue<Bool>?

    public init(
        boundaryId: String,
        type: BoundaryType,
        roomIds: [String],
        grossAreaM2: FieldValue<Double>? = nil,
        construction: FieldValue<String>? = nil,
        uValueWm2K: FieldValue<Double>? = nil,
        cavityFilled: FieldValue<Bool>? = nil
    ) {
        self.boundaryId = boundaryId
        self.type = type
        self.roomIds = roomIds
        self.grossAreaM2 = grossAreaM2
        self.construction = construction
        self.uValueWm2K = uValueWm2K
        self.cavityFilled = cavityFilled
    }
}

// MARK: - OpeningType

/// Type of opening in a boundary element.
public enum OpeningType: String, Codable, Sendable, Equatable {
    case window
    case door
    case rooflight
    case unknown
}

// MARK: - OpeningV1

/// An opening (door, window, or rooflight) in a boundary element.
public struct OpeningV1: Codable, Sendable, Equatable {
    public let openingId: String
    public let boundaryId: String
    public let type: OpeningType
    public let widthM: FieldValue<Double>?
    public let heightM: FieldValue<Double>?
    public let areaM2: FieldValue<Double>?
    public let uValueWm2K: FieldValue<Double>?
    public let glazingDescription: FieldValue<String>?
    public let scanOpeningRef: String?

    public init(
        openingId: String,
        boundaryId: String,
        type: OpeningType,
        widthM: FieldValue<Double>? = nil,
        heightM: FieldValue<Double>? = nil,
        areaM2: FieldValue<Double>? = nil,
        uValueWm2K: FieldValue<Double>? = nil,
        glazingDescription: FieldValue<String>? = nil,
        scanOpeningRef: String? = nil
    ) {
        self.openingId = openingId
        self.boundaryId = boundaryId
        self.type = type
        self.widthM = widthM
        self.heightM = heightM
        self.areaM2 = areaM2
        self.uValueWm2K = uValueWm2K
        self.glazingDescription = glazingDescription
        self.scanOpeningRef = scanOpeningRef
    }
}

// MARK: - EmitterType

/// Central-heating emitter type.
public enum EmitterType: String, Codable, Sendable, Equatable {
    case panelRadiator  = "panel_radiator"
    case columnRadiator = "column_radiator"
    case towelRail      = "towel_rail"
    case ufhLoop        = "ufh_loop"
    case fanCoil        = "fan_coil"
    case unknown
}

// MARK: - EmitterV1

/// A central-heating emitter (radiator, towel rail, or underfloor-heating loop).
public struct EmitterV1: Codable, Sendable, Equatable {
    public let emitterId: String
    public let roomId: String
    public let type: EmitterType
    public let description: FieldValue<String>?
    public let ratedOutputW: FieldValue<Double>?
    public let correctedOutputW: FieldValue<Double>?
    public let trvFitted: FieldValue<Bool>?

    public init(
        emitterId: String,
        roomId: String,
        type: EmitterType,
        description: FieldValue<String>? = nil,
        ratedOutputW: FieldValue<Double>? = nil,
        correctedOutputW: FieldValue<Double>? = nil,
        trvFitted: FieldValue<Bool>? = nil
    ) {
        self.emitterId = emitterId
        self.roomId = roomId
        self.type = type
        self.description = description
        self.ratedOutputW = ratedOutputW
        self.correctedOutputW = correctedOutputW
        self.trvFitted = trvFitted
    }
}

// MARK: - SystemComponentCategory

/// Broad category of a system plant component.
public enum SystemComponentCategory: String, Codable, Sendable, Equatable {
    case boiler
    case heatPump   = "heat_pump"
    case cylinder
    case manifold
    case pump
    case meter
    case flue
    case controls
    case other
}

// MARK: - ComponentCondition

/// Operational condition rating for a component.
public enum ComponentCondition: String, Codable, Sendable, Equatable {
    case good
    case fair
    case poor
    case unknown
}

// MARK: - SystemComponentV1

/// A named physical plant item (boiler, cylinder, manifold, meter, flue, etc.).
public struct SystemComponentV1: Codable, Sendable, Equatable {
    public let componentId: String
    public let category: SystemComponentCategory
    public let label: String?
    public let roomId: String?
    public let manufacturer: FieldValue<String>?
    public let model: FieldValue<String>?
    public let installYear: FieldValue<Int>?
    public let condition: FieldValue<ComponentCondition>?
    public let notes: String?

    public init(
        componentId: String,
        category: SystemComponentCategory,
        label: String? = nil,
        roomId: String? = nil,
        manufacturer: FieldValue<String>? = nil,
        model: FieldValue<String>? = nil,
        installYear: FieldValue<Int>? = nil,
        condition: FieldValue<ComponentCondition>? = nil,
        notes: String? = nil
    ) {
        self.componentId = componentId
        self.category = category
        self.label = label
        self.roomId = roomId
        self.manufacturer = manufacturer
        self.model = model
        self.installYear = installYear
        self.condition = condition
        self.notes = notes
    }
}

// MARK: - PipeMedium

/// Fluid medium carried by a pipe route.
public enum PipeMedium: String, Codable, Sendable, Equatable {
    case heatingFlow   = "heating_flow"
    case heatingReturn = "heating_return"
    case dhwHot        = "dhw_hot"
    case dhwCold       = "dhw_cold"
    case unknown
}

// MARK: - PipeMaterial

/// Pipe material classification.
public enum PipeMaterial: String, Codable, Sendable, Equatable {
    case copper
    case plastic
    case steel
    case unknown
}

// MARK: - PipeRouteV1

/// A pipe or duct route traced during the survey.
public struct PipeRouteV1: Codable, Sendable, Equatable {
    public let routeId: String
    public let medium: PipeMedium
    public let diameterMm: FieldValue<Double>?
    public let material: FieldValue<PipeMaterial>?
    public let roomIds: [String]?
    public let lengthM: FieldValue<Double>?
    public let insulated: FieldValue<Bool>?

    public init(
        routeId: String,
        medium: PipeMedium,
        diameterMm: FieldValue<Double>? = nil,
        material: FieldValue<PipeMaterial>? = nil,
        roomIds: [String]? = nil,
        lengthM: FieldValue<Double>? = nil,
        insulated: FieldValue<Bool>? = nil
    ) {
        self.routeId = routeId
        self.medium = medium
        self.diameterMm = diameterMm
        self.material = material
        self.roomIds = roomIds
        self.lengthM = lengthM
        self.insulated = insulated
    }
}

// MARK: - ServicesModelV1

/// Utility and services model for the property.
public struct ServicesModelV1: Codable, Sendable, Equatable {
    /// Gas supply details.
    public let gas: GasServiceV1?
    /// Electricity supply details.
    public let electricity: ElectricityServiceV1?
    /// Water supply details.
    public let water: WaterServiceV1?

    public init(
        gas: GasServiceV1? = nil,
        electricity: ElectricityServiceV1? = nil,
        water: WaterServiceV1? = nil
    ) {
        self.gas = gas
        self.electricity = electricity
        self.water = water
    }
}

/// Gas supply details.
public struct GasServiceV1: Codable, Sendable, Equatable {
    public let present: FieldValue<Bool>
    public let meterAccessible: FieldValue<Bool>?
    public let meterLocation: FieldValue<String>?

    public init(
        present: FieldValue<Bool>,
        meterAccessible: FieldValue<Bool>? = nil,
        meterLocation: FieldValue<String>? = nil
    ) {
        self.present = present
        self.meterAccessible = meterAccessible
        self.meterLocation = meterLocation
    }
}

/// Electricity phase classification.
public enum ElectricityPhase: String, Codable, Sendable, Equatable {
    case single
    case three
    case unknown
}

/// Electricity supply details.
public struct ElectricityServiceV1: Codable, Sendable, Equatable {
    public let phase: FieldValue<ElectricityPhase>?
    public let mainFuseAmps: FieldValue<Double>?
    public let consumerUnitSpareWays: FieldValue<Bool>?

    public init(
        phase: FieldValue<ElectricityPhase>? = nil,
        mainFuseAmps: FieldValue<Double>? = nil,
        consumerUnitSpareWays: FieldValue<Bool>? = nil
    ) {
        self.phase = phase
        self.mainFuseAmps = mainFuseAmps
        self.consumerUnitSpareWays = consumerUnitSpareWays
    }
}

/// Water supply details.
public struct WaterServiceV1: Codable, Sendable, Equatable {
    public let mainsPressure: FieldValue<Bool>?
    public let stopCockLocation: FieldValue<String>?

    public init(mainsPressure: FieldValue<Bool>? = nil, stopCockLocation: FieldValue<String>? = nil) {
        self.mainsPressure = mainsPressure
        self.stopCockLocation = stopCockLocation
    }
}

// MARK: - BuildingModelV1

/// The physical truth layer of an AtlasPropertyV1.
public struct BuildingModelV1: Codable, Sendable, Equatable {
    public let floors: [FloorV1]
    public let rooms: [PropertyRoomV1]
    public let zones: [ThermalZoneV1]
    public let boundaries: [BoundaryV1]
    public let openings: [OpeningV1]
    public let emitters: [EmitterV1]
    public let systemComponents: [SystemComponentV1]
    public let pipeRoutes: [PipeRouteV1]?
    public let services: ServicesModelV1?

    public init(
        floors: [FloorV1] = [],
        rooms: [PropertyRoomV1] = [],
        zones: [ThermalZoneV1] = [],
        boundaries: [BoundaryV1] = [],
        openings: [OpeningV1] = [],
        emitters: [EmitterV1] = [],
        systemComponents: [SystemComponentV1] = [],
        pipeRoutes: [PipeRouteV1]? = nil,
        services: ServicesModelV1? = nil
    ) {
        self.floors = floors
        self.rooms = rooms
        self.zones = zones
        self.boundaries = boundaries
        self.openings = openings
        self.emitters = emitters
        self.systemComponents = systemComponents
        self.pipeRoutes = pipeRoutes
        self.services = services
    }
}
