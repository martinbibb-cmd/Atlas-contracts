// ScanImportManifest.swift
//
// A lightweight manifest that summarises a validated scan bundle for the
// Atlas importer.  This provides a convenient entry point for consuming apps
// to extract key metadata without inspecting the full bundle tree.

import Foundation

/// A lightweight summary of a validated scan bundle, intended for the Atlas
/// importer to decide how to process the bundle.
public struct ScanImportManifest: Sendable, Equatable {

    /// A distilled, importer-facing summary of the manifest's key fields.
    public struct ImportSummary: Sendable, Equatable {
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

        public init(
            version: String,
            bundleId: String,
            roomCount: Int,
            anchorCount: Int,
            qaFlagCount: Int,
            deviceModel: String,
            scannerApp: String,
            capturedAt: String
        ) {
            self.version = version
            self.bundleId = bundleId
            self.roomCount = roomCount
            self.anchorCount = anchorCount
            self.qaFlagCount = qaFlagCount
            self.deviceModel = deviceModel
            self.scannerApp = scannerApp
            self.capturedAt = capturedAt
        }
    }

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

    /// A distilled summary of the manifest, suitable for passing to the Atlas importer.
    public var importSummary: ImportSummary {
        ImportSummary(
            version: version,
            bundleId: bundleId,
            roomCount: roomCount,
            anchorCount: anchorCount,
            qaFlagCount: qaFlagCount,
            deviceModel: deviceModel,
            scannerApp: scannerApp,
            capturedAt: capturedAt
        )
    }

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
