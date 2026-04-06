// Versions.swift
//
// Supported scan bundle contract versions and version-check helpers.
//
// Bump the minor version for backwards-compatible additions.
// Bump the major version for breaking changes — old importers must reject
// bundles whose major version they do not recognise.

import Foundation

// MARK: - Supported versions

/// The complete set of scan bundle versions that this package can validate.
/// Any bundle whose `version` field is not in this array will be rejected with
/// a distinct `rejectedUnsupportedVersion` result so callers can surface a
/// useful error to the user.
public let supportedScanBundleVersions: [String] = ["1.0"]

// MARK: - Version helpers

/// Returns `true` when `version` is one of `supportedScanBundleVersions`.
public func isSupportedVersion(_ version: String) -> Bool {
    supportedScanBundleVersions.contains(version)
}

/// Returns `true` when the version string is a non-empty string that is not in
/// `supportedScanBundleVersions`.
///
/// Useful so an importer can distinguish between a structurally invalid bundle
/// and one that simply comes from a newer (unsupported) contract version.
public func isUnsupportedVersion(_ version: String) -> Bool {
    !version.isEmpty && !isSupportedVersion(version)
}
