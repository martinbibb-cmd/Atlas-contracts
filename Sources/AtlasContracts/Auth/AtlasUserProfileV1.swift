// AtlasUserProfileV1.swift
//
// AtlasUserProfileV1 — shared user profile contract.
//
// Represents a single Atlas-platform user as created and maintained by
// the Atlas backend authentication layer.  Cross-app consumers (Atlas Scan,
// Atlas Mind, customer portal) use this type to identify the human operator
// behind a session without needing to hold provider-specific tokens.
//
// Timestamps are ISO-8601 strings (UTC, e.g. "2025-06-01T09:00:00Z").
//
// IMPORTANT: This file defines only the shared contract boundary.

import Foundation

// MARK: - AtlasUserProfileV1

/// The canonical Atlas user profile.
///
/// `atlasUserId` is the Atlas-internal UUID that uniquely identifies a user
/// across all providers.  `providerSubjectId` is the opaque subject identifier
/// issued by the `authProvider` and must not be shared with other apps.
public struct AtlasUserProfileV1: Codable, Sendable, Equatable {

    /// Stable Atlas-internal user identifier (UUID string).
    public let atlasUserId: String

    /// The identity provider used to authenticate this user.
    public let authProvider: AtlasAuthProviderV1

    /// Opaque subject identifier issued by the identity provider (e.g. Google `sub`).
    public let providerSubjectId: String

    /// Email address associated with the provider account.
    public let email: String

    /// Human-readable display name (from the provider profile).
    public let displayName: String

    /// URL of the user's profile photo, if supplied by the provider.
    public let photoURL: String?

    /// ISO-8601 timestamp of when this Atlas user record was first created.
    public let createdAt: String

    /// ISO-8601 timestamp of the most recent sign-in.
    public let lastSignedInAt: String

    public init(
        atlasUserId: String,
        authProvider: AtlasAuthProviderV1,
        providerSubjectId: String,
        email: String,
        displayName: String,
        photoURL: String? = nil,
        createdAt: String,
        lastSignedInAt: String
    ) {
        self.atlasUserId = atlasUserId
        self.authProvider = authProvider
        self.providerSubjectId = providerSubjectId
        self.email = email
        self.displayName = displayName
        self.photoURL = photoURL
        self.createdAt = createdAt
        self.lastSignedInAt = lastSignedInAt
    }
}
