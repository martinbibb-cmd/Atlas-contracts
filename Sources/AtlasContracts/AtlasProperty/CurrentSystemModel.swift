// CurrentSystemModel.swift
//
// CurrentSystemModelV1 — the existing heating and hot-water system as surveyed.
//
// Gives Atlas Mind a proper place to receive "what system is there now" without
// reusing UI-specific survey state from Atlas Scan.
//
// IMPORTANT: This file defines only the shared contract boundary.

import Foundation

// MARK: - SystemFamily

/// High-level heating system family classification.
public enum SystemFamily: String, Codable, Sendable, Equatable {
    case combi
    case system
    case regular
    case heatPump  = "heat_pump"
    case hybrid
    case unknown
}

// MARK: - DhwType

/// Domestic hot-water provision type.
public enum DhwType: String, Codable, Sendable, Equatable {
    case combi
    case ventedCylinder   = "vented_cylinder"
    case unventedCylinder = "unvented_cylinder"
    case thermalStore     = "thermal_store"
    case mixergy
    case unknown
}

// MARK: - FuelType

/// Heating fuel type.
public enum FuelType: String, Codable, Sendable, Equatable {
    case naturalGas    = "natural_gas"
    case lpg
    case oil
    case electricity
    case biomass
    case solidFuel     = "solid_fuel"
    case districtHeat  = "district_heat"
    case unknown
}

// MARK: - FlueType

/// Boiler / heat-source flue type.
public enum FlueType: String, Codable, Sendable, Equatable {
    case balanced
    case openFlue    = "open_flue"
    case condensing
    case unknown
}

// MARK: - HeatSourceV1

/// Primary heat source details.
public struct HeatSourceV1: Codable, Sendable, Equatable {
    public let fuel: FieldValue<FuelType>?
    public let ratedOutputKw: FieldValue<Double>?
    public let efficiencyPercent: FieldValue<Double>?
    public let flueType: FieldValue<FlueType>?
    public let flueGasHeatRecovery: FieldValue<Bool>?
    public let manufacturer: FieldValue<String>?
    public let model: FieldValue<String>?
    public let installYear: FieldValue<Int>?

    public init(
        fuel: FieldValue<FuelType>? = nil,
        ratedOutputKw: FieldValue<Double>? = nil,
        efficiencyPercent: FieldValue<Double>? = nil,
        flueType: FieldValue<FlueType>? = nil,
        flueGasHeatRecovery: FieldValue<Bool>? = nil,
        manufacturer: FieldValue<String>? = nil,
        model: FieldValue<String>? = nil,
        installYear: FieldValue<Int>? = nil
    ) {
        self.fuel = fuel
        self.ratedOutputKw = ratedOutputKw
        self.efficiencyPercent = efficiencyPercent
        self.flueType = flueType
        self.flueGasHeatRecovery = flueGasHeatRecovery
        self.manufacturer = manufacturer
        self.model = model
        self.installYear = installYear
    }
}

// MARK: - CylinderV1

/// Hot-water cylinder details.
public struct CylinderV1: Codable, Sendable, Equatable {
    public let volumeLitres: FieldValue<Double>?
    public let insulated: FieldValue<Bool>?
    public let insulationType: FieldValue<String>?
    public let immersionFitted: FieldValue<Bool>?
    public let solarCoilPresent: FieldValue<Bool>?
    public let location: FieldValue<String>?

    public init(
        volumeLitres: FieldValue<Double>? = nil,
        insulated: FieldValue<Bool>? = nil,
        insulationType: FieldValue<String>? = nil,
        immersionFitted: FieldValue<Bool>? = nil,
        solarCoilPresent: FieldValue<Bool>? = nil,
        location: FieldValue<String>? = nil
    ) {
        self.volumeLitres = volumeLitres
        self.insulated = insulated
        self.insulationType = insulationType
        self.immersionFitted = immersionFitted
        self.solarCoilPresent = solarCoilPresent
        self.location = location
    }
}

// MARK: - ProgrammerType

/// Heating programmer / timer type.
public enum ProgrammerType: String, Codable, Sendable, Equatable {
    case basicTimer      = "basic_timer"
    case programmable
    case smart
    case none
    case unknown
}

// MARK: - RoomThermostatType

/// Room thermostat type.
public enum RoomThermostatType: String, Codable, Sendable, Equatable {
    case mechanical
    case digital
    case smart
    case none
    case unknown
}

// MARK: - ControlsV1

/// Heating and hot-water controls.
public struct ControlsV1: Codable, Sendable, Equatable {
    public let programmerType: FieldValue<ProgrammerType>?
    public let roomThermostatType: FieldValue<RoomThermostatType>?
    public let cylinderThermostat: FieldValue<Bool>?
    public let zoneCount: FieldValue<Int>?
    public let trvsPresent: FieldValue<Bool>?
    public let smartMeterIntegration: FieldValue<Bool>?

    public init(
        programmerType: FieldValue<ProgrammerType>? = nil,
        roomThermostatType: FieldValue<RoomThermostatType>? = nil,
        cylinderThermostat: FieldValue<Bool>? = nil,
        zoneCount: FieldValue<Int>? = nil,
        trvsPresent: FieldValue<Bool>? = nil,
        smartMeterIntegration: FieldValue<Bool>? = nil
    ) {
        self.programmerType = programmerType
        self.roomThermostatType = roomThermostatType
        self.cylinderThermostat = cylinderThermostat
        self.zoneCount = zoneCount
        self.trvsPresent = trvsPresent
        self.smartMeterIntegration = smartMeterIntegration
    }
}

// MARK: - DistributionPipeMaterial

/// Distribution pipe material.
public enum DistributionPipeMaterial: String, Codable, Sendable, Equatable {
    case copper
    case plastic
    case steel
    case mixed
    case unknown
}

// MARK: - DistributionV1

/// Heat distribution circuit details.
public struct DistributionV1: Codable, Sendable, Equatable {
    public let pipeMaterial: FieldValue<DistributionPipeMaterial>?
    public let dominantPipeDiameterMm: FieldValue<Double>?
    public let flowTempC: FieldValue<Double>?
    public let returnTempC: FieldValue<Double>?
    public let balanced: FieldValue<Bool>?
    public let systemVolumeLitres: FieldValue<Double>?

    public init(
        pipeMaterial: FieldValue<DistributionPipeMaterial>? = nil,
        dominantPipeDiameterMm: FieldValue<Double>? = nil,
        flowTempC: FieldValue<Double>? = nil,
        returnTempC: FieldValue<Double>? = nil,
        balanced: FieldValue<Bool>? = nil,
        systemVolumeLitres: FieldValue<Double>? = nil
    ) {
        self.pipeMaterial = pipeMaterial
        self.dominantPipeDiameterMm = dominantPipeDiameterMm
        self.flowTempC = flowTempC
        self.returnTempC = returnTempC
        self.balanced = balanced
        self.systemVolumeLitres = systemVolumeLitres
    }
}

// MARK: - SystemConditionRating

/// Overall condition rating for the existing system.
public enum SystemConditionRating: String, Codable, Sendable, Equatable {
    case good
    case fair
    case poor
    case critical
    case unknown
}

// MARK: - ConditionModelV1

/// Overall condition assessment of the existing heating system.
public struct ConditionModelV1: Codable, Sendable, Equatable {
    public let overall: FieldValue<SystemConditionRating>?
    public let heatingAdequate: FieldValue<Bool>?
    public let knownFaults: FieldValue<Bool>?
    public let notes: String?

    public init(
        overall: FieldValue<SystemConditionRating>? = nil,
        heatingAdequate: FieldValue<Bool>? = nil,
        knownFaults: FieldValue<Bool>? = nil,
        notes: String? = nil
    ) {
        self.overall = overall
        self.heatingAdequate = heatingAdequate
        self.knownFaults = knownFaults
        self.notes = notes
    }
}

// MARK: - WaterVisualAssessment

/// Visual assessment of system water clarity.
public enum WaterVisualAssessment: String, Codable, Sendable, Equatable {
    case clean
    case slightlyDirty = "slightly_dirty"
    case veryDirty     = "very_dirty"
    case unknown
}

// MARK: - WaterQualityModelV1

/// System water quality data captured during the survey.
public struct WaterQualityModelV1: Codable, Sendable, Equatable {
    public let magneticFilterPresent: FieldValue<Bool>?
    public let inhibitorPresent: FieldValue<Bool>?
    public let inhibitorType: FieldValue<String>?
    public let ph: FieldValue<Double>?
    public let tdsPpm: FieldValue<Double>?
    public let visualAssessment: FieldValue<WaterVisualAssessment>?

    public init(
        magneticFilterPresent: FieldValue<Bool>? = nil,
        inhibitorPresent: FieldValue<Bool>? = nil,
        inhibitorType: FieldValue<String>? = nil,
        ph: FieldValue<Double>? = nil,
        tdsPpm: FieldValue<Double>? = nil,
        visualAssessment: FieldValue<WaterVisualAssessment>? = nil
    ) {
        self.magneticFilterPresent = magneticFilterPresent
        self.inhibitorPresent = inhibitorPresent
        self.inhibitorType = inhibitorType
        self.ph = ph
        self.tdsPpm = tdsPpm
        self.visualAssessment = visualAssessment
    }
}

// MARK: - InstallConstraintSeverity

/// Severity of an installation constraint.
public enum InstallConstraintSeverity: String, Codable, Sendable, Equatable {
    case blocking
    case significant
    case minor
}

// MARK: - InstallConstraintV1

/// An engineer-observed or customer-stated constraint affecting installation.
public struct InstallConstraintV1: Codable, Sendable, Equatable {
    public let code: String
    public let description: String
    public let severity: InstallConstraintSeverity

    public init(code: String, description: String, severity: InstallConstraintSeverity) {
        self.code = code
        self.description = description
        self.severity = severity
    }
}

// MARK: - CurrentSystemModelV1

/// The existing heating and hot-water system as surveyed.
public struct CurrentSystemModelV1: Codable, Sendable, Equatable {
    public let family: FieldValue<SystemFamily>
    public let dhwType: FieldValue<DhwType>?
    public let heatSource: HeatSourceV1?
    public let cylinder: CylinderV1?
    public let controls: ControlsV1?
    public let distribution: DistributionV1?
    public let condition: ConditionModelV1?
    public let waterQuality: WaterQualityModelV1?
    public let constraints: [InstallConstraintV1]?

    public init(
        family: FieldValue<SystemFamily>,
        dhwType: FieldValue<DhwType>? = nil,
        heatSource: HeatSourceV1? = nil,
        cylinder: CylinderV1? = nil,
        controls: ControlsV1? = nil,
        distribution: DistributionV1? = nil,
        condition: ConditionModelV1? = nil,
        waterQuality: WaterQualityModelV1? = nil,
        constraints: [InstallConstraintV1]? = nil
    ) {
        self.family = family
        self.dhwType = dhwType
        self.heatSource = heatSource
        self.cylinder = cylinder
        self.controls = controls
        self.distribution = distribution
        self.condition = condition
        self.waterQuality = waterQuality
        self.constraints = constraints
    }
}
