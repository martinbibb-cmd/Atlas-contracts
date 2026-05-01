// AtlasVisit.swift
//
// Shared visit identity layer used by Atlas Scan and Atlas Mind.
//
// Defines:
//   - AtlasAppSourceV1       — which app originated the visit
//   - AtlasVisitStatusV1     — visit lifecycle status
//   - AtlasVisitReadinessV1  — readiness flags for a visit
//   - BrandReferenceV1       — lightweight brand reference
//   - AtlasVisitV1           — top-level visit identity contract

import Foundation

// MARK: - Source app

/// The app that originated the visit.
public enum AtlasAppSourceV1: String, Codable, Sendable, Equatable {
    case scanIos  = "scan_ios"
    case mindPwa  = "mind_pwa"
    case `import` = "import"
}

// MARK: - Visit status

/// Lifecycle status of a visit.
public enum AtlasVisitStatusV1: String, Codable, Sendable, Equatable {
    case draft
    case capturing
    case planning
    case readyToComplete = "ready_to_complete"
    case complete
    case synced
    case archived
}

// MARK: - Readiness

/// Readiness flags indicating what has been captured for a visit.
public struct AtlasVisitReadinessV1: Codable, Sendable, Equatable {
    public let hasRooms: Bool
    public let hasPhotos: Bool
    public let hasHeatingSystem: Bool
    public let hasHotWaterSystem: Bool
    public let hasKeyObjectBoiler: Bool
    public let hasKeyObjectFlue: Bool
    public let hasAnyNotes: Bool

    public init(
        hasRooms: Bool = false,
        hasPhotos: Bool = false,
        hasHeatingSystem: Bool = false,
        hasHotWaterSystem: Bool = false,
        hasKeyObjectBoiler: Bool = false,
        hasKeyObjectFlue: Bool = false,
        hasAnyNotes: Bool = false
    ) {
        self.hasRooms = hasRooms
        self.hasPhotos = hasPhotos
        self.hasHeatingSystem = hasHeatingSystem
        self.hasHotWaterSystem = hasHotWaterSystem
        self.hasKeyObjectBoiler = hasKeyObjectBoiler
        self.hasKeyObjectFlue = hasKeyObjectFlue
        self.hasAnyNotes = hasAnyNotes
    }

    /// A readiness value with all flags set to false.
    public static let empty = AtlasVisitReadinessV1()
}

// MARK: - Brand reference

/// A lightweight reference to a brand.
public struct BrandReferenceV1: Codable, Sendable, Equatable {
    public let brandId: String

    public init(brandId: String) {
        self.brandId = brandId
    }
}

// MARK: - Visit

/// AtlasVisitV1 — the top-level visit identity contract shared across Atlas apps.
public struct AtlasVisitV1: Codable, Sendable, Equatable {
    /// Contract version — always `"1.0"`.
    public let version: String
    /// Unique identifier for this visit (UUID string).
    public let visitId: String
    /// Optional human-readable visit number.
    public let visitNumber: String?
    /// Optional brand identifier.
    public let brandId: String?
    /// The app that originated the visit.
    public let sourceApp: AtlasAppSourceV1
    /// Lifecycle status of the visit.
    public let status: AtlasVisitStatusV1
    /// Readiness flags for the visit.
    public let readiness: AtlasVisitReadinessV1
    /// ISO-8601 timestamp of visit creation.
    public let createdAt: String
    /// ISO-8601 timestamp of last update.
    public let updatedAt: String
    /// ISO-8601 timestamp of visit completion (absent if not yet complete).
    public let completedAt: String?
    /// Optional external reference identifier.
    public let externalRef: String?

    public init(
        version: String = "1.0",
        visitId: String,
        visitNumber: String? = nil,
        brandId: String? = nil,
        sourceApp: AtlasAppSourceV1,
        status: AtlasVisitStatusV1,
        readiness: AtlasVisitReadinessV1 = .empty,
        createdAt: String,
        updatedAt: String,
        completedAt: String? = nil,
        externalRef: String? = nil
    ) {
        self.version = version
        self.visitId = visitId
        self.visitNumber = visitNumber
        self.brandId = brandId
        self.sourceApp = sourceApp
        self.status = status
        self.readiness = readiness
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.completedAt = completedAt
        self.externalRef = externalRef
    }
}
