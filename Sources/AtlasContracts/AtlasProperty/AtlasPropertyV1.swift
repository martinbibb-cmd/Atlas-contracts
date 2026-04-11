// AtlasPropertyV1.swift
//
// AtlasPropertyV1 — the canonical cross-app property root contract.
//
// This is the shared top-level model that Atlas Scan (capture output),
// Atlas Mind (input and persistence), customer portal (state), and the
// engineer pre-install view all target.
//
// What this contract IS:
//   - The single versioned root for cross-app property truth
//   - A composition of focused sub-models (identity, capture, building,
//     household, current system, evidence, derived, recommendations)
//   - Provenance-aware for all fields whose origin matters
//
// What this contract is NOT:
//   - A replacement for ScanBundleV1 (raw scan geometry stays there)
//   - A replacement for VisitCapture (portable visit artefact stays there)
//   - A replacement for SessionCaptureV1 (session capture stays there)
//   - A recommendation-engine contract (engine details stay in Atlas Recommendation)
//
// IMPORTANT: This file defines only the shared contract boundary.
// App-layer concerns must not appear here.

import Foundation

// MARK: - AtlasSourceApp

/// An Atlas application that contributed to this property record.
public enum AtlasSourceApp: String, Codable, Sendable, Equatable {
    case atlasScan    = "atlas_scan"
    case atlasMind    = "atlas_mind"
    case atlasPortal  = "atlas_portal"
    case atlasBackend = "atlas_backend"
}

// MARK: - AtlasPropertyStatus

/// Lifecycle status of an AtlasPropertyV1 record.
public enum AtlasPropertyStatus: String, Codable, Sendable, Equatable {
    case draft
    case surveyInProgress    = "survey_in_progress"
    case readyForSimulation  = "ready_for_simulation"
    case simulationReady     = "simulation_ready"
    case reportReady         = "report_ready"
    case archived
}

// MARK: - AtlasPropertyV1

/// The canonical cross-app property root contract.
///
/// All cross-app consumers — Atlas Scan, Atlas Mind, customer portal,
/// pre-install view — should target this type as their shared truth.
public struct AtlasPropertyV1: Codable, Sendable, Equatable {

    // MARK: Root fields

    /// Contract version. Must be "1.0" for this version of the struct.
    public let version: String

    /// Unique identifier for this property record (UUID string).
    public let propertyId: String

    /// Identifier of the visit session that last wrote to this record.
    public let visitId: String?

    /// ISO-8601 timestamp of when this record was first created.
    public let createdAt: String

    /// ISO-8601 timestamp of the last write to any section.
    public let updatedAt: String

    /// Lifecycle status of this property record.
    public let status: AtlasPropertyStatus

    /// Monotonically increasing schema revision counter.
    public let schemaRevision: Int?

    /// Which Atlas applications have contributed data to this record.
    public let sourceApps: [AtlasSourceApp]

    // MARK: Sub-models

    /// Address and classification metadata.
    public let property: PropertyIdentityV1

    /// Session-level capture metadata.
    public let capture: CaptureContextV1

    /// Physical building model (spatial, thermal, plant).
    public let building: BuildingModelV1

    /// Household occupant composition, behaviour, and preferences.
    public let household: HouseholdModelV1

    /// Existing heating and hot-water system as surveyed.
    public let currentSystem: CurrentSystemModelV1

    /// First-class evidence layer (photos, voice notes, QA flags, timeline).
    public let evidence: EvidenceModelV1

    /// Calculated outputs derived from captured data.
    public let derived: DerivedModelV1?

    /// Lightweight recommendation workspace.
    public let recommendations: RecommendationWorkspaceV1?

    // MARK: Init

    public init(
        version: String = "1.0",
        propertyId: String,
        visitId: String? = nil,
        createdAt: String,
        updatedAt: String,
        status: AtlasPropertyStatus,
        schemaRevision: Int? = nil,
        sourceApps: [AtlasSourceApp],
        property: PropertyIdentityV1,
        capture: CaptureContextV1,
        building: BuildingModelV1,
        household: HouseholdModelV1,
        currentSystem: CurrentSystemModelV1,
        evidence: EvidenceModelV1,
        derived: DerivedModelV1? = nil,
        recommendations: RecommendationWorkspaceV1? = nil
    ) {
        self.version = version
        self.propertyId = propertyId
        self.visitId = visitId
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.status = status
        self.schemaRevision = schemaRevision
        self.sourceApps = sourceApps
        self.property = property
        self.capture = capture
        self.building = building
        self.household = household
        self.currentSystem = currentSystem
        self.evidence = evidence
        self.derived = derived
        self.recommendations = recommendations
    }
}
