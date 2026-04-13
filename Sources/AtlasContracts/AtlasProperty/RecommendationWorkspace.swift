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

// MARK: - WhyNotReasonV1

/// A structured reason explaining why a system or measure was not recommended,
/// or was given a cautionary status.
///
/// Linking each reason to an `educationalExplainerRef` lets the UI surface a
/// deep link into the Educational Explainer library (e.g. "Pipe Capacity" for
/// a hydraulic failure), giving customers and engineers actionable context.
public struct WhyNotReasonV1: Codable, Sendable, Equatable {
    /// Machine-readable reason code
    /// (e.g. `"hydraulic_capacity_insufficient"`, `"flue_clearance_violation"`).
    public let code: String
    /// Human-readable plain-English explanation of the reason.
    public let explanation: String
    /// Reference ID for the Educational Explainer article that provides deeper
    /// context.  Absent if no explainer is available for this code.
    public let educationalExplainerRef: String?

    public init(code: String, explanation: String, educationalExplainerRef: String? = nil) {
        self.code = code
        self.explanation = explanation
        self.educationalExplainerRef = educationalExplainerRef
    }
}

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
    /// Structured reasons why this measure was rejected or flagged with caution.
    ///
    /// Populated when `status` is `.rejected` or the measure carries a
    /// cautionary flag.  Each entry links the reason code to a plain-English
    /// explanation and, optionally, to an Educational Explainer article.
    /// `nil` for accepted or draft items.
    public let whyNotReasons: [WhyNotReasonV1]?

    public init(
        itemId: String,
        category: RecommendationCategory,
        label: String,
        rank: Int? = nil,
        estimatedCostGbp: Double? = nil,
        estimatedCarbonSavingKgCo2e: Double? = nil,
        estimatedBillSavingGbp: Double? = nil,
        status: RecommendationItemStatus,
        whyNotReasons: [WhyNotReasonV1]? = nil
    ) {
        self.itemId = itemId
        self.category = category
        self.label = label
        self.rank = rank
        self.estimatedCostGbp = estimatedCostGbp
        self.estimatedCarbonSavingKgCo2e = estimatedCarbonSavingKgCo2e
        self.estimatedBillSavingGbp = estimatedBillSavingGbp
        self.status = status
        self.whyNotReasons = whyNotReasons
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
