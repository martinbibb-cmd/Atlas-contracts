// AtlasWorkspaceMembershipV1.swift
//
// AtlasWorkspaceMembershipV1 — shared workspace membership contract.
//
// Represents the relationship between an Atlas user and a workspace,
// including the role that governs their access level within that workspace.
//
// IMPORTANT: This file defines only the shared contract boundary.

import Foundation

// MARK: - AtlasWorkspaceRoleV1

/// The access role a member holds within an Atlas workspace.
public enum AtlasWorkspaceRoleV1: String, Codable, Sendable, Equatable {
    /// Full administrative ownership; may manage billing and delete the workspace.
    case owner
    /// Administrative access; may manage members and workspace settings.
    case admin
    /// Field surveyor; may create and capture visit data.
    case surveyor
    /// Design reviewer; may review survey outputs and raise recommendations.
    case reviewer
    /// Installation engineer; may access installation packages and mark jobs complete.
    case installer
    /// Read-only access to workspace data.
    case viewer
}

// MARK: - AtlasWorkspaceMembershipV1

/// A single user–workspace membership record.
///
/// Consumers should evaluate `role` to determine what actions a user is
/// permitted to perform within the workspace identified by `workspaceId`.
public struct AtlasWorkspaceMembershipV1: Codable, Sendable, Equatable {

    /// The workspace this membership belongs to (UUID string).
    public let workspaceId: String

    /// The Atlas user who holds this membership (UUID string).
    public let atlasUserId: String

    /// The role this user holds within the workspace.
    public let role: AtlasWorkspaceRoleV1

    public init(
        workspaceId: String,
        atlasUserId: String,
        role: AtlasWorkspaceRoleV1
    ) {
        self.workspaceId = workspaceId
        self.atlasUserId = atlasUserId
        self.role = role
    }
}
