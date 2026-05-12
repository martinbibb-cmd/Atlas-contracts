// AtlasWorkspaceV1.swift
//
// AtlasWorkspaceV1 — shared workspace contract.
//
// Represents an Atlas workspace — the organizational unit that groups users,
// visits, and properties under a single tenant.  Both the iOS apps and the
// Mind recommendation engine consume this type to scope data access.
//
// Timestamps are ISO-8601 strings (UTC, e.g. "2025-06-01T09:00:00Z").
//
// IMPORTANT: This file defines only the shared contract boundary.

import Foundation

// MARK: - AtlasWorkspaceV1

/// A single Atlas workspace (tenant organizational unit).
///
/// `workspaceId` is the stable cross-app identifier.  `slug` is a
/// URL-safe, human-readable handle used in routes and exports (e.g. `"acme-heat"`).
public struct AtlasWorkspaceV1: Codable, Sendable, Equatable {

    /// Stable workspace identifier (UUID string).
    public let workspaceId: String

    /// URL-safe slug for the workspace (e.g. `"acme-heat"`).
    public let slug: String

    /// Human-readable workspace name displayed in the UI.
    public let displayName: String

    /// Identifier for the tenant brand configuration, if applicable.
    public let tenantBrandId: String?

    /// ISO-8601 timestamp of when this workspace was created.
    public let createdAt: String

    public init(
        workspaceId: String,
        slug: String,
        displayName: String,
        tenantBrandId: String? = nil,
        createdAt: String
    ) {
        self.workspaceId = workspaceId
        self.slug = slug
        self.displayName = displayName
        self.tenantBrandId = tenantBrandId
        self.createdAt = createdAt
    }
}
