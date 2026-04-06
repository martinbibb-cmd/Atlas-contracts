// ScanImportManifest.swift
//
// A lightweight manifest that summarises a validated scan bundle for the
// Atlas importer.  This provides a convenient entry point for consuming apps
// to extract key metadata without inspecting the full bundle tree.

import Foundation

/// A lightweight summary of a validated scan bundle, intended for the Atlas
/// importer to decide how to process the bundle.
public struct ScanImportManifest: Sendable, Equatable {
    /// The contract version of the source bundle.
    public let version: String
    /// The unique identifier of the source bundle.
    public let bundleId: String
    /// Number of rooms in the bundle.
    public let roomCount: Int
    /// Number of anchors in the bundle.
    public let anchorCount: Int
    /// Number of QA flags raised by the scan client.
    public let qaFlagCount: Int
    /// The device model that produced the scan.
    public let deviceModel: String
    /// The scanner app name and version.
    public let scannerApp: String
    /// ISO-8601 timestamp of when the scan was captured.
    public let capturedAt: String

    /// Creates a manifest from a validated scan bundle.
    public init(from bundle: ScanBundle) {
        self.version = bundle.version
        self.bundleId = bundle.bundleId
        self.roomCount = bundle.rooms.count
        self.anchorCount = bundle.anchors.count
        self.qaFlagCount = bundle.qaFlags.count
        self.deviceModel = bundle.meta.deviceModel
        self.scannerApp = bundle.meta.scannerApp
        self.capturedAt = bundle.meta.capturedAt
    }
}
