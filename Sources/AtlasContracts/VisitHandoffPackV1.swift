// VisitHandoffPackV1.swift
//
// VisitHandoffPackV1 — the payload dispatched from Atlas Mind to Atlas Scan
// at the start of a visit (Mind → Scan direction).
//
// Delivered as a percent-encoded JSON payload on the /receive-scan deep-link
// route so that Atlas Scan can pre-load the visit context before the engineer
// begins capture.
//
// The optional hardwarePatches field carries visit-scoped appliance overrides.
// The Scan app resolves model lookups by checking this list before falling
// back to the baseline MasterRegistryV1.
//
// IMPORTANT: This file defines only the shared contract boundary.

import Foundation

// MARK: - Schema version

/// Schema version discriminator for VisitHandoffPackV1.
public let visitHandoffPackV1SchemaVersion = "1.0"

// MARK: - VisitHandoffPackV1

/// VisitHandoffPackV1 — the payload dispatched from Atlas Mind to Atlas Scan
/// at the start of a visit.
///
/// Delivered as a percent-encoded JSON payload on the `/receive-scan`
/// deep-link route.  `hardwarePatches`, when present, contains visit-scoped
/// appliance specifications that take precedence over the baseline registry.
public struct VisitHandoffPackV1: Codable, Sendable, Equatable {
    /// Contract schema version — always `"1.0"`.
    public let schemaVersion: String
    /// ISO-8601 timestamp of when this pack was created.
    public let createdAt: String
    /// The app that produced this pack — always `"mind_pwa"`.
    public let sourceApp: String
    /// The app intended to consume this pack — always `"scan_ios"`.
    public let targetApp: String
    /// The visit identity this pack belongs to.
    public let visit: AtlasVisitV1
    /// Optional list of visit-scoped hardware patches.
    ///
    /// When provided, the Scan app uses these specifications in preference to
    /// the baseline registry for the duration of this visit.
    public let hardwarePatches: [HardwarePatchV1]?

    public init(
        createdAt: String,
        sourceApp: String = "mind_pwa",
        targetApp: String = "scan_ios",
        visit: AtlasVisitV1,
        hardwarePatches: [HardwarePatchV1]? = nil
    ) {
        self.schemaVersion = visitHandoffPackV1SchemaVersion
        self.createdAt = createdAt
        self.sourceApp = sourceApp
        self.targetApp = targetApp
        self.visit = visit
        self.hardwarePatches = hardwarePatches
    }
}
