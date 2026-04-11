// RecommendationWorkspace.swift
//
// RecommendationWorkspaceV1 — a lightweight workspace stub that holds
// recommendation engine outputs without making them canonical property truth.
//
// Design constraint (per Atlas-contracts scope):
//   - This type must NOT become a full recommendation-engine contract.
//   - Its purpose is to give the engine a defined place to attach outputs
//     to the property root WITHOUT spreading raw engine types across other apps.
//   - Detailed engine types belong to Atlas Recommendation, not here.
//
// IMPORTANT: This file defines only the shared contract boundary.

import Foundation

// MARK: - RecommendationCategory

/// Technology category for a recommended measure.
public enum RecommendationCategory: String, Codable, Sendable, Equatable {
    case airSourceHeatPump    = "air_source_heat_pump"
    case groundSourceHeatPump = "ground_source_heat_pump"
    case hybridHeatPump       = "hybrid_heat_pump"
    case replacementBoiler    = "replacement_boiler"
    case solarPv              = "solar_pv"
    case solarThermal         = "solar_thermal"
    case hotWaterCylinder     = "hot_water_cylinder"
    case radiatorUpgrade      = "radiator_upgrade"
    case insulation
    case controlsUpgrade      = "controls_upgrade"
    case other
}

// MARK: - RecommendationItemStatus

/// Readiness status of a recommendation item.
public enum RecommendationItemStatus: String, Codable, Sendable, Equatable {
    case draft
    case underReview = "under_review"
    case accepted
    case rejected
    case superseded
}

// MARK: - RecommendationItemSummaryV1

/// A minimal summary of a single recommended measure.
public struct RecommendationItemSummaryV1: Codable, Sendable, Equatable {
    public let itemId: String
    public let category: RecommendationCategory
    public let label: String
    public let rank: Int?
    public let estimatedCostGbp: Double?
    public let estimatedCarbonSavingKgCo2e: Double?
    public let estimatedBillSavingGbp: Double?
    public let status: RecommendationItemStatus

    public init(
        itemId: String,
        category: RecommendationCategory,
        label: String,
        rank: Int? = nil,
        estimatedCostGbp: Double? = nil,
        estimatedCarbonSavingKgCo2e: Double? = nil,
        estimatedBillSavingGbp: Double? = nil,
        status: RecommendationItemStatus
    ) {
        self.itemId = itemId
        self.category = category
        self.label = label
        self.rank = rank
        self.estimatedCostGbp = estimatedCostGbp
        self.estimatedCarbonSavingKgCo2e = estimatedCarbonSavingKgCo2e
        self.estimatedBillSavingGbp = estimatedBillSavingGbp
        self.status = status
    }
}

// MARK: - RecommendationWorkspaceStatus

/// Readiness status of the recommendation workspace.
public enum RecommendationWorkspaceStatus: String, Codable, Sendable, Equatable {
    case pending
    case draft
    case readyForReview = "ready_for_review"
    case accepted
    case archived
}

// MARK: - RecommendationWorkspaceV1

/// A lightweight workspace attaching recommendation outputs to AtlasPropertyV1.
public struct RecommendationWorkspaceV1: Codable, Sendable, Equatable {
    /// Reference ID within Atlas Recommendation for the full engine workspace.
    public let engineRef: String?
    /// ISO-8601 timestamp of the last engine run.
    public let lastRunAt: String?
    /// Readiness status of the recommendation set.
    public let status: RecommendationWorkspaceStatus
    /// Summary items for each recommended measure.
    public let items: [RecommendationItemSummaryV1]

    public init(
        engineRef: String? = nil,
        lastRunAt: String? = nil,
        status: RecommendationWorkspaceStatus,
        items: [RecommendationItemSummaryV1] = []
    ) {
        self.engineRef = engineRef
        self.lastRunAt = lastRunAt
        self.status = status
        self.items = items
    }
}
