// AtlasVisitIdentityV1.swift
//
// AtlasVisitIdentityV1 — shared visit identity contract.
//
// Provides the minimal identifying information about an Atlas visit that
// is needed by authentication and workspace-scoping layers.  Full visit
// geometry and capture data live in the wider visit contracts
// (e.g. AtlasVisit, VisitCapture).
//
// IMPORTANT: This file defines only the shared contract boundary.

import Foundation

// MARK: - AtlasVisitIdentityStatusV1

/// Lifecycle status of an Atlas visit identity record.
public enum AtlasVisitIdentityStatusV1: String, Codable, Sendable, Equatable {
    /// Visit has been created but no survey has started.
    case draft
    /// Active surveying is in progress.
    case surveying
    /// Survey is complete and awaiting engineer or design review.
    case reviewRequired  = "review_required"
    /// Survey review is done; visit is queued for Mind processing.
    case readyForMind    = "ready_for_mind"
    /// All processing is complete.
    case completed
    /// Visit has been archived and is no longer active.
    case archived
}

// MARK: - AtlasVisitIdentityV1

/// Minimal identity record for an Atlas visit.
///
/// Used by auth and workspace-scoping layers that need to reference a
/// visit without loading the full visit payload.
public struct AtlasVisitIdentityV1: Codable, Sendable, Equatable {

    /// Stable visit identifier (UUID string).
    public let visitId: String

    /// The workspace this visit belongs to (UUID string).
    public let workspaceId: String

    /// Customer-facing job number or reference code.
    public let jobNumber: String?

    /// Name of the customer or site contact for this visit.
    public let customerName: String?

    /// Brief human-readable address summary (e.g. `"42 Example St, London"`).
    public let addressSummary: String?

    /// Current lifecycle status of the visit.
    public let status: AtlasVisitIdentityStatusV1

    public init(
        visitId: String,
        workspaceId: String,
        jobNumber: String? = nil,
        customerName: String? = nil,
        addressSummary: String? = nil,
        status: AtlasVisitIdentityStatusV1
    ) {
        self.visitId = visitId
        self.workspaceId = workspaceId
        self.jobNumber = jobNumber
        self.customerName = customerName
        self.addressSummary = addressSummary
        self.status = status
    }
}
