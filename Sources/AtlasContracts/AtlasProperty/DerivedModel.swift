// DerivedModel.swift
//
// DerivedModelV1 — calculated outputs produced from captured survey data.
//
// Design rule: derived values must never be mixed into capture truth.
// Everything in DerivedModelV1 is produced by the calculation engine,
// not captured directly by the engineer.
//
// IMPORTANT: This file defines only the shared contract boundary.

import Foundation

// MARK: - Spatial aggregates

/// Spatial aggregates derived from the building model.
public struct DerivedSpatialV1: Codable, Sendable, Equatable {
    /// Total treated floor area in m².
    public let totalFloorAreaM2: Double?
    /// Heated floor area in m².
    public let heatedAreaM2: Double?
    /// Number of storeys above ground.
    public let storeyCount: Int?

    public init(totalFloorAreaM2: Double? = nil, heatedAreaM2: Double? = nil, storeyCount: Int? = nil) {
        self.totalFloorAreaM2 = totalFloorAreaM2
        self.heatedAreaM2 = heatedAreaM2
        self.storeyCount = storeyCount
    }
}

// MARK: - Room heat-loss result

/// Heat-loss result for a single room.
public struct RoomHeatLossResultV1: Codable, Sendable, Equatable {
    public let roomId: String
    public let fabricLossW: Double?
    public let ventilationLossW: Double?
    public let totalLossW: Double?
    public let requiredEmitterOutputW: Double?

    public init(
        roomId: String,
        fabricLossW: Double? = nil,
        ventilationLossW: Double? = nil,
        totalLossW: Double? = nil,
        requiredEmitterOutputW: Double? = nil
    ) {
        self.roomId = roomId
        self.fabricLossW = fabricLossW
        self.ventilationLossW = ventilationLossW
        self.totalLossW = totalLossW
        self.requiredEmitterOutputW = requiredEmitterOutputW
    }
}

// MARK: - Zone heat-loss result

/// Heat-loss result for a thermal zone.
public struct ZoneHeatLossResultV1: Codable, Sendable, Equatable {
    public let zoneId: String
    public let totalLossW: Double?
    public let requiredFlowTempC: Double?

    public init(zoneId: String, totalLossW: Double? = nil, requiredFlowTempC: Double? = nil) {
        self.zoneId = zoneId
        self.totalLossW = totalLossW
        self.requiredFlowTempC = requiredFlowTempC
    }
}

// MARK: - Heat loss outputs

/// Heat-loss calculation outputs.
public struct DerivedHeatLossV1: Codable, Sendable, Equatable {
    public let peakWatts: FieldValue<Double>?
    public let roomResults: [RoomHeatLossResultV1]?
    public let zoneResults: [ZoneHeatLossResultV1]?

    public init(
        peakWatts: FieldValue<Double>? = nil,
        roomResults: [RoomHeatLossResultV1]? = nil,
        zoneResults: [ZoneHeatLossResultV1]? = nil
    ) {
        self.peakWatts = peakWatts
        self.roomResults = roomResults
        self.zoneResults = zoneResults
    }
}

// MARK: - Hydraulics

/// Hydraulic survey measurements.
public struct DerivedHydraulicsV1: Codable, Sendable, Equatable {
    public let mainsFlowLpm: FieldValue<Double>?
    public let dynamicPressureBar: FieldValue<Double>?

    public init(mainsFlowLpm: FieldValue<Double>? = nil, dynamicPressureBar: FieldValue<Double>? = nil) {
        self.mainsFlowLpm = mainsFlowLpm
        self.dynamicPressureBar = dynamicPressureBar
    }
}

// MARK: - DerivedModelV1

/// Calculated outputs derived from the captured survey data.
public struct DerivedModelV1: Codable, Sendable, Equatable {
    public let spatial: DerivedSpatialV1?
    public let heatLoss: DerivedHeatLossV1?
    public let hydraulics: DerivedHydraulicsV1?

    public init(
        spatial: DerivedSpatialV1? = nil,
        heatLoss: DerivedHeatLossV1? = nil,
        hydraulics: DerivedHydraulicsV1? = nil
    ) {
        self.spatial = spatial
        self.heatLoss = heatLoss
        self.hydraulics = hydraulics
    }
}
