// AtlasAuthSessionV1.swift
//
// AtlasAuthSessionV1 — shared authentication session contract.
//
// Represents an authenticated Atlas session binding a user to a workspace.
// All cross-app consumers (Atlas Scan, Atlas Mind, customer portal) use this
// type to carry the identity context required for scoped data access.
//
// Timestamps are ISO-8601 strings (UTC, e.g. "2025-06-01T09:00:00Z").
// `expiresAt` is absent for sessions with no server-imposed expiry.
//
// IMPORTANT: This file defines only the shared contract boundary.

import Foundation

// MARK: - AtlasAuthSessionV1

/// An authenticated Atlas session for a user within a workspace.
///
/// Consumers should check `expiresAt` (when present) against the current
/// time before treating a session as valid.
public struct AtlasAuthSessionV1: Codable, Sendable, Equatable {

    /// The authenticated Atlas user (UUID string).
    public let atlasUserId: String

    /// The workspace this session is scoped to (UUID string).
    public let workspaceId: String

    /// The identity provider used to establish this session.
    public let provider: AtlasAuthProviderV1

    /// ISO-8601 timestamp of when this session was created.
    public let signedInAt: String

    /// ISO-8601 timestamp of when this session expires, if applicable.
    public let expiresAt: String?

    public init(
        atlasUserId: String,
        workspaceId: String,
        provider: AtlasAuthProviderV1,
        signedInAt: String,
        expiresAt: String? = nil
    ) {
        self.atlasUserId = atlasUserId
        self.workspaceId = workspaceId
        self.provider = provider
        self.signedInAt = signedInAt
        self.expiresAt = expiresAt
    }
}
