// HazardObservations.swift
//
// Shared contracts for site hazard observations captured by Atlas Scan and
// surfaced in Atlas Mind engineer handoff.
//
// Design principles:
//   - Evidence capture only — not a formal risk assessment.
//   - Suspected asbestos must be asbestos_suspected; never confirmed here
//     without specialist evidence.
//   - Customer-facing outputs must not include hazard detail by default.
//   - Engineer handoff may show all confirmed/pending hazards.
//   - Blocking severity can prevent handoff completion later, but that logic
//     is not implemented here.

import Foundation

// MARK: - HazardObservationCategoryV1

/// Category of a hazard observation.
///
/// - `access`:                 access or egress difficulty
/// - `asbestosSuspected`:      suspected asbestos-containing material;
///                             never confirmed here without specialist evidence
/// - `electrical`:             electrical hazard
/// - `gas`:                    gas leak, odour, or supply concern
/// - `water`:                  water leak, flooding, or moisture
/// - `workingAtHeight`:        risk from working at height
/// - `confinedSpace`:          confined-space entry risk
/// - `manualHandling`:         manual-handling hazard (heavy or awkward loads)
/// - `combustionAir`:          inadequate combustion air supply
/// - `flue`:                   flue integrity or termination concern
/// - `structural`:             structural integrity concern
/// - `tripSlip`:               trip or slip hazard
/// - `customerVulnerability`:  indication of customer vulnerability; no
///                             sensitive detail required
/// - `petsOrChildren`:         pets or children on site
/// - `other`:                  any other site hazard
public enum HazardObservationCategoryV1: String, Codable, Sendable, Equatable {
    case access
    case asbestosSuspected    = "asbestos_suspected"
    case electrical
    case gas
    case water
    case workingAtHeight      = "working_at_height"
    case confinedSpace        = "confined_space"
    case manualHandling       = "manual_handling"
    case combustionAir        = "combustion_air"
    case flue
    case structural
    case tripSlip             = "trip_slip"
    case customerVulnerability = "customer_vulnerability"
    case petsOrChildren       = "pets_or_children"
    case other
}

// MARK: - HazardObservationSeverityV1

/// Severity of a hazard observation.
///
/// - `info`:     informational note; no immediate action required
/// - `low`:      low risk; monitor or note for handoff
/// - `medium`:   moderate risk; action recommended before or during work
/// - `high`:     high risk; action required before work proceeds
/// - `blocking`: prevents work completion or handoff until resolved
public enum HazardObservationSeverityV1: String, Codable, Sendable, Equatable {
    case info
    case low
    case medium
    case high
    case blocking
}

// MARK: - HazardObservationV1

/// A single hazard observation captured during a site visit.
///
/// This represents captured evidence only.  It is not a formal risk assessment
/// and carries no scoring, recommendation logic, or customer-output rendering.
public struct HazardObservationV1: Codable, Sendable, Equatable {
    /// Unique identifier (UUID string).
    public let id: String
    /// Cross-system visit identifier.
    public let visitId: String
    /// Optional room in which the hazard was observed.
    public let roomId: String?
    /// Type of hazard.
    public let category: HazardObservationCategoryV1
    /// Severity level of the hazard.
    public let severity: HazardObservationSeverityV1
    /// Short human-readable description.
    public let title: String
    /// Optional extended free-text description.
    public let description: String?
    /// Optional IDs of CapturePhotoV1 records documenting this hazard.
    public let photoIds: [String]?
    /// Optional IDs of CaptureObjectPinV1 records associated with this hazard.
    public let objectPinIds: [String]?
    /// Optional free-text action required before/during work.
    public let actionRequired: String?
    /// QA review status of this observation.
    public let reviewStatus: ReviewStatusV1
    /// How this observation was captured.
    public let provenance: CaptureProvenanceV1
    /// ISO-8601 timestamp of when the hazard was observed.
    public let observedAt: String
    /// Optional free-text notes.
    public let notes: String?

    public init(
        id: String,
        visitId: String,
        roomId: String? = nil,
        category: HazardObservationCategoryV1,
        severity: HazardObservationSeverityV1,
        title: String,
        description: String? = nil,
        photoIds: [String]? = nil,
        objectPinIds: [String]? = nil,
        actionRequired: String? = nil,
        reviewStatus: ReviewStatusV1,
        provenance: CaptureProvenanceV1,
        observedAt: String,
        notes: String? = nil
    ) {
        self.id = id
        self.visitId = visitId
        self.roomId = roomId
        self.category = category
        self.severity = severity
        self.title = title
        self.description = description
        self.photoIds = photoIds
        self.objectPinIds = objectPinIds
        self.actionRequired = actionRequired
        self.reviewStatus = reviewStatus
        self.provenance = provenance
        self.observedAt = observedAt
        self.notes = notes
    }
}

// MARK: - HazardObservationCaptureV1

/// The full set of hazard observations captured for a single visit.
///
/// version      — contract discriminant; always "1.0"
/// visitId      — cross-system visit identifier
/// observations — ordered list of hazard observations (empty ⟹ no hazards)
/// createdAt    — ISO-8601 timestamp of when this capture was first created
/// updatedAt    — ISO-8601 timestamp of the last update to this capture
public struct HazardObservationCaptureV1: Codable, Sendable, Equatable {
    /// Contract discriminant — always "1.0".
    public let version: String
    /// Cross-system visit identifier.
    public let visitId: String
    /// Ordered list of hazard observations.
    public let observations: [HazardObservationV1]
    /// ISO-8601 timestamp of when this capture was first created.
    public let createdAt: String
    /// ISO-8601 timestamp of the last update to this capture.
    public let updatedAt: String

    public init(
        visitId: String,
        observations: [HazardObservationV1] = [],
        createdAt: String,
        updatedAt: String
    ) {
        self.version = "1.0"
        self.visitId = visitId
        self.observations = observations
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}
