// AtlasAuthProviderV1.swift
//
// AtlasAuthProviderV1 — shared authentication provider contract.
//
// Identifies the third-party identity provider used to authenticate
// an Atlas user.  All cross-app consumers (Atlas Scan, Atlas Mind,
// customer portal) reference this enum when recording or inspecting
// how a session was established.
//
// IMPORTANT: This file defines only the shared contract boundary.

import Foundation

// MARK: - AtlasAuthProviderV1

/// The identity provider used to authenticate an Atlas user.
public enum AtlasAuthProviderV1: String, Codable, Sendable, Equatable {
    /// Google Sign-In.
    case google
    /// Sign in with Apple.
    case apple
    /// Microsoft / Azure AD sign-in.
    case microsoft
    /// Developer mock provider — for local testing only; must never appear in production sessions.
    case devMock = "dev_mock"
}
