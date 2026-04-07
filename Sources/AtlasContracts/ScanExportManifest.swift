// ScanExportManifest.swift
//
// Manifest written into an AtlasScanPackageV1 export archive.
// This is a separate type from ScanImportManifest – it describes the
// export package produced by the Atlas app rather than summarising an
// incoming scan bundle.

import Foundation

/// Manifest embedded in an Atlas export package (AtlasScanPackageV1).
///
/// Use ``ScanImportManifest`` when you need a lightweight summary of a
/// *validated* incoming scan bundle.  Use this type when you are building
/// or consuming an *export* archive produced by the Atlas app.
public struct ScanExportManifest: Codable, Sendable, Equatable {

    /// A summary of the scan data included in the export package.
    public struct ImportSummary: Codable, Sendable, Equatable {
        /// Total number of rooms in the job.
        public let roomCount: Int
        /// Number of rooms that have been reviewed.
        public let reviewedRoomCount: Int
        /// Number of rooms with captured geometry.
        public let scannedRoomCount: Int
        /// Total number of tagged objects across all rooms.
        public let totalObjects: Int
        /// Total number of evidence photos included.
        public let totalPhotos: Int
        /// Whether any blocking validation issues were found.
        public let hasBlockingIssues: Bool
        /// Non-blocking validation warnings, if any.
        public let validationWarnings: [String]

        public init(
            roomCount: Int,
            reviewedRoomCount: Int,
            scannedRoomCount: Int,
            totalObjects: Int,
            totalPhotos: Int,
            hasBlockingIssues: Bool,
            validationWarnings: [String]
        ) {
            self.roomCount = roomCount
            self.reviewedRoomCount = reviewedRoomCount
            self.scannedRoomCount = scannedRoomCount
            self.totalObjects = totalObjects
            self.totalPhotos = totalPhotos
            self.hasBlockingIssues = hasBlockingIssues
            self.validationWarnings = validationWarnings
        }
    }

    /// The package format identifier (e.g. `"AtlasScanPackageV1"`).
    public let format: String
    /// The job reference string.
    public let jobReference: String
    /// The property address for the job.
    public let propertyAddress: String
    /// ISO-8601 timestamp of when the export was generated.
    public let generatedAt: String
    /// Summary of the scan data included in the package.
    public let importSummary: ImportSummary
    /// Whether evidence files are included in the package.
    public let evidenceIncluded: Bool
    /// Number of evidence files included in the package.
    public let evidenceFileCount: Int
    /// List of content file paths included in the package.
    public let contents: [String]

    public init(
        format: String,
        jobReference: String,
        propertyAddress: String,
        generatedAt: String,
        importSummary: ImportSummary,
        evidenceIncluded: Bool,
        evidenceFileCount: Int,
        contents: [String]
    ) {
        self.format = format
        self.jobReference = jobReference
        self.propertyAddress = propertyAddress
        self.generatedAt = generatedAt
        self.importSummary = importSummary
        self.evidenceIncluded = evidenceIncluded
        self.evidenceFileCount = evidenceFileCount
        self.contents = contents
    }
}
