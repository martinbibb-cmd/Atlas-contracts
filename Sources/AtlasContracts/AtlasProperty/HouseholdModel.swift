// HouseholdModel.swift
//
// HouseholdModelV1 — occupant composition, behaviour, preferences, and
// constraints captured during the survey visit.
//
// IMPORTANT: This file defines only the shared contract boundary.

import Foundation

// MARK: - HotWaterUsageModelV1

/// Hot-water usage pattern for the household.
public struct HotWaterUsageModelV1: Codable, Sendable, Equatable {

    /// Estimated daily hot-water usage in litres.
    public let dailyLitres: FieldValue<Double>?

    /// Peak demand pattern.
    public let peakDemand: FieldValue<HotWaterPeakDemand>?

    /// Whether there is a bath in the property.
    public let bathPresent: FieldValue<Bool>?

    /// Number of showers.
    public let showerCount: FieldValue<Int>?

    /// Whether an electric shower is present.
    public let electricShowerPresent: FieldValue<Bool>?

    public init(
        dailyLitres: FieldValue<Double>? = nil,
        peakDemand: FieldValue<HotWaterPeakDemand>? = nil,
        bathPresent: FieldValue<Bool>? = nil,
        showerCount: FieldValue<Int>? = nil,
        electricShowerPresent: FieldValue<Bool>? = nil
    ) {
        self.dailyLitres = dailyLitres
        self.peakDemand = peakDemand
        self.bathPresent = bathPresent
        self.showerCount = showerCount
        self.electricShowerPresent = electricShowerPresent
    }
}

/// Hot-water peak demand pattern.
public enum HotWaterPeakDemand: String, Codable, Sendable, Equatable {
    case morningOnly         = "morning_only"
    case morningAndEvening   = "morning_and_evening"
    case spread
    case unknown
}

// MARK: - HeatingPatternModelV1

/// Space-heating usage pattern for the household.
public struct HeatingPatternModelV1: Codable, Sendable, Equatable {
    public let hoursPerDay: FieldValue<Double>?
    public let continuousHeating: FieldValue<Bool>?
    public let comfortTempC: FieldValue<Double>?
    public let zoningApproach: FieldValue<ZoningApproach>?

    public init(
        hoursPerDay: FieldValue<Double>? = nil,
        continuousHeating: FieldValue<Bool>? = nil,
        comfortTempC: FieldValue<Double>? = nil,
        zoningApproach: FieldValue<ZoningApproach>? = nil
    ) {
        self.hoursPerDay = hoursPerDay
        self.continuousHeating = continuousHeating
        self.comfortTempC = comfortTempC
        self.zoningApproach = zoningApproach
    }
}

/// Space-heating zoning approach.
public enum ZoningApproach: String, Codable, Sendable, Equatable {
    case wholeHouse  = "whole_house"
    case zoned
    case singleZone  = "single_zone"
    case unknown
}

// MARK: - PreferencesModelV1

/// Customer technology and upgrade preferences.
public struct PreferencesModelV1: Codable, Sendable, Equatable {
    public let heatPumpInterest: FieldValue<InterestLevel>?
    public let solarInterest: FieldValue<InterestLevel>?
    public let smartControlsInterest: FieldValue<InterestLevel>?
    public let gasFreeWillingness: FieldValue<GasFreeWillingness>?
    public let budgetBand: FieldValue<BudgetBand>?
    public let notes: String?

    public init(
        heatPumpInterest: FieldValue<InterestLevel>? = nil,
        solarInterest: FieldValue<InterestLevel>? = nil,
        smartControlsInterest: FieldValue<InterestLevel>? = nil,
        gasFreeWillingness: FieldValue<GasFreeWillingness>? = nil,
        budgetBand: FieldValue<BudgetBand>? = nil,
        notes: String? = nil
    ) {
        self.heatPumpInterest = heatPumpInterest
        self.solarInterest = solarInterest
        self.smartControlsInterest = smartControlsInterest
        self.gasFreeWillingness = gasFreeWillingness
        self.budgetBand = budgetBand
        self.notes = notes
    }
}

/// Interest level in a technology or upgrade.
public enum InterestLevel: String, Codable, Sendable, Equatable {
    case high
    case medium
    case low
    case none
    case unknown
}

/// Willingness to consider a gas-free installation.
public enum GasFreeWillingness: String, Codable, Sendable, Equatable {
    case willing
    case uncertain
    case unwilling
    case unknown
}

/// Budget range preference.
public enum BudgetBand: String, Codable, Sendable, Equatable {
    case budget
    case mid
    case premium
    case unknown
}

// MARK: - CustomerConstraintV1

/// A customer-stated or engineer-observed constraint.
public struct CustomerConstraintV1: Codable, Sendable, Equatable {
    /// Machine-readable constraint code.
    public let code: String
    /// Human-readable description.
    public let description: String
    /// How the constraint was identified.
    public let source: FieldValue<CustomerConstraintSource>

    public init(code: String, description: String, source: FieldValue<CustomerConstraintSource>) {
        self.code = code
        self.description = description
        self.source = source
    }
}

/// Origin of a customer constraint.
public enum CustomerConstraintSource: String, Codable, Sendable, Equatable {
    case customerStated  = "customer_stated"
    case engineerObserved = "engineer_observed"
    case imported
}

// MARK: - HouseholdCompositionV1

/// Household composition by age band.
public struct HouseholdCompositionV1: Codable, Sendable, Equatable {
    public let adultCount: FieldValue<Int>
    public let childCount0to4: FieldValue<Int>
    public let childCount5to10: FieldValue<Int>
    public let childCount11to17: FieldValue<Int>
    public let youngAdultCount18to25AtHome: FieldValue<Int>

    public init(
        adultCount: FieldValue<Int>,
        childCount0to4: FieldValue<Int>,
        childCount5to10: FieldValue<Int>,
        childCount11to17: FieldValue<Int>,
        youngAdultCount18to25AtHome: FieldValue<Int>
    ) {
        self.adultCount = adultCount
        self.childCount0to4 = childCount0to4
        self.childCount5to10 = childCount5to10
        self.childCount11to17 = childCount11to17
        self.youngAdultCount18to25AtHome = youngAdultCount18to25AtHome
    }
}

// MARK: - OccupancyPattern

/// Typical weekday occupancy pattern.
public enum OccupancyPattern: String, Codable, Sendable, Equatable {
    case usuallyOut   = "usually_out"
    case steadyHome   = "steady_home"
    case mixed
    case unknown
}

// MARK: - HouseholdModelV1

/// Occupant composition, behaviour, preferences, and constraints.
public struct HouseholdModelV1: Codable, Sendable, Equatable {
    public let composition: HouseholdCompositionV1
    public let occupancyPattern: FieldValue<OccupancyPattern>?
    public let hotWaterUsage: HotWaterUsageModelV1?
    public let heatingPattern: HeatingPatternModelV1?
    public let preferences: PreferencesModelV1?
    public let constraints: [CustomerConstraintV1]?

    public init(
        composition: HouseholdCompositionV1,
        occupancyPattern: FieldValue<OccupancyPattern>? = nil,
        hotWaterUsage: HotWaterUsageModelV1? = nil,
        heatingPattern: HeatingPatternModelV1? = nil,
        preferences: PreferencesModelV1? = nil,
        constraints: [CustomerConstraintV1]? = nil
    ) {
        self.composition = composition
        self.occupancyPattern = occupancyPattern
        self.hotWaterUsage = hotWaterUsage
        self.heatingPattern = heatingPattern
        self.preferences = preferences
        self.constraints = constraints
    }
}
