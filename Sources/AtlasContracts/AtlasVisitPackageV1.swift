// AtlasVisitPackageV1.swift
//
// Contract types and manifest validation for AtlasVisitPackageV1 — the
// portable handoff format for a completed Atlas property visit.
//
// An AtlasVisitPackageV1 is a folder (or archive) with the `.atlasvisit`
// extension that contains all artefacts produced during a single visit:
//
//   Required contents:
//     workspace.json            — VisitWorkspaceV1 descriptor
//     session_capture_v2.json   — SessionCaptureV2 scan payload
//     review_decisions.json     — ReviewDecisionsV1 review outcomes
//     /photos/                  — directory of captured photo files
//     /floorplans/              — directory of floor-plan image files
//
// The manifest file (`manifest.json` at the package root) acts as the
// entry point and declares the format, schema version, and canonical paths
// to all required contents.

import Foundation

// MARK: - Constants

/// Package format identifier for AtlasVisitPackageV1.
public let atlasVisitPackageV1Format = "AtlasVisitPackageV1"

/// File extension for an Atlas visit package.
public let atlasVisitPackageV1Extension = ".atlasvisit"

/// Schema version for the AtlasVisitPackageManifestV1 manifest file.
public let atlasVisitPackageManifestV1SchemaVersion = "1.0"

/// Default file name for the VisitWorkspaceV1 descriptor.
public let atlasVisitPackageV1WorkspaceFile = "workspace.json"

/// Default file name for the SessionCaptureV2 payload.
public let atlasVisitPackageV1SessionCaptureFile = "session_capture_v2.json"

/// Default file name for the ReviewDecisionsV1 payload.
public let atlasVisitPackageV1ReviewDecisionsFile = "review_decisions.json"

/// Default directory name for captured photos.
public let atlasVisitPackageV1PhotosDir = "photos"

/// Default directory name for floor-plan images.
public let atlasVisitPackageV1FloorplansDir = "floorplans"

// MARK: - AtlasVisitPackageManifestV1

/// Entry-point manifest for an AtlasVisitPackageV1 visit package.
///
/// Stored as `manifest.json` at the root of a `.atlasvisit` package.
/// Declares the package format, schema version, and canonical relative paths
/// to all required contents.
public struct AtlasVisitPackageManifestV1: Codable, Sendable, Equatable {

    /// Package format identifier — always "AtlasVisitPackageV1".
    public let format: String

    /// Manifest schema version — always "1.0".
    public let schemaVersion: String

    /// ISO-8601 timestamp of when the package was created.
    public let createdAt: String

    /// Reference to the property visit this package belongs to.
    /// Must match the visitReference in workspace.json and session_capture_v2.json.
    public let visitReference: String

    /// Unique identifier for the capture session (UUID string).
    public let sessionId: String

    /// Relative path to the VisitWorkspaceV1 descriptor (e.g. "workspace.json").
    public let workspaceFile: String

    /// Relative path to the SessionCaptureV2 file (e.g. "session_capture_v2.json").
    public let sessionCaptureFile: String

    /// Relative path to the ReviewDecisionsV1 file (e.g. "review_decisions.json").
    public let reviewDecisionsFile: String

    /// Relative path to the photos directory (e.g. "photos").
    public let photosDir: String

    /// Relative path to the floor-plans directory (e.g. "floorplans").
    public let floorplansDir: String

    public init(
        format: String,
        schemaVersion: String,
        createdAt: String,
        visitReference: String,
        sessionId: String,
        workspaceFile: String,
        sessionCaptureFile: String,
        reviewDecisionsFile: String,
        photosDir: String,
        floorplansDir: String
    ) {
        self.format = format
        self.schemaVersion = schemaVersion
        self.createdAt = createdAt
        self.visitReference = visitReference
        self.sessionId = sessionId
        self.workspaceFile = workspaceFile
        self.sessionCaptureFile = sessionCaptureFile
        self.reviewDecisionsFile = reviewDecisionsFile
        self.photosDir = photosDir
        self.floorplansDir = floorplansDir
    }
}

// MARK: - Validation result

/// The result of validating an AtlasVisitPackageManifestV1.
public enum AtlasVisitPackageManifestValidationResult: Sendable {
    /// The manifest passed all structural checks.
    case success(AtlasVisitPackageManifestV1)
    /// The manifest failed validation with a human-readable error message.
    case failure(String)

    /// Returns `true` when validation succeeded.
    public var isValid: Bool {
        if case .success = self { return true }
        return false
    }

    /// Returns the validated manifest, or `nil` if validation failed.
    public var manifest: AtlasVisitPackageManifestV1? {
        if case .success(let m) = self { return m }
        return nil
    }

    /// Returns the error message, or `nil` if validation succeeded.
    public var error: String? {
        if case .failure(let e) = self { return e }
        return nil
    }
}

// MARK: - Validator

/// Validates raw JSON `Data` as an `AtlasVisitPackageManifestV1`.
///
/// Returns `.success(manifest)` when the manifest passes all structural
/// checks, or `.failure(error)` with a human-readable description of the
/// first failure found.
///
/// Checks performed in order:
///   1. Input must be valid JSON representing a non-null object.
///   2. `format` must be `"AtlasVisitPackageV1"`.
///   3. `schemaVersion` must be `"1.0"`.
///   4. `visitReference` and `sessionId` must be non-empty strings.
///   5. `createdAt` must resemble an ISO-8601 timestamp.
///   6. `workspaceFile`, `sessionCaptureFile`, `reviewDecisionsFile` must be
///      non-empty strings.
///   7. `photosDir` and `floorplansDir` must be non-empty strings.
public func validateAtlasVisitPackageManifest(_ data: Data) -> AtlasVisitPackageManifestValidationResult {
    // Step 1: Parse as generic JSON to inspect required fields before decoding.
    let jsonObject: Any
    do {
        jsonObject = try JSONSerialization.jsonObject(with: data, options: [])
    } catch {
        return .failure("Manifest must be valid JSON: \(error.localizedDescription)")
    }

    guard let dict = jsonObject as? [String: Any] else {
        return .failure("Manifest must be a non-null JSON object")
    }

    // Step 2: format check.
    guard let format = dict["format"] as? String, format == atlasVisitPackageV1Format else {
        return .failure("format must be '\(atlasVisitPackageV1Format)'")
    }

    // Step 3: schemaVersion check.
    guard let schemaVersion = dict["schemaVersion"] as? String,
          schemaVersion == atlasVisitPackageManifestV1SchemaVersion else {
        return .failure("schemaVersion must be '\(atlasVisitPackageManifestV1SchemaVersion)'")
    }

    // Step 4: visitReference and sessionId.
    guard let visitReference = dict["visitReference"] as? String, !visitReference.isEmpty else {
        return .failure("visitReference must be a non-empty string")
    }

    guard let sessionId = dict["sessionId"] as? String, !sessionId.isEmpty else {
        return .failure("sessionId must be a non-empty string")
    }

    // Step 5: createdAt must resemble ISO-8601.
    guard let createdAt = dict["createdAt"] as? String,
          createdAt.range(of: #"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}"#,
                         options: .regularExpression) != nil else {
        return .failure("createdAt must be an ISO-8601 timestamp")
    }

    // Step 6: required file paths.
    guard let workspaceFile = dict["workspaceFile"] as? String, !workspaceFile.isEmpty else {
        return .failure("workspaceFile must be a non-empty string")
    }

    guard let sessionCaptureFile = dict["sessionCaptureFile"] as? String,
          !sessionCaptureFile.isEmpty else {
        return .failure("sessionCaptureFile must be a non-empty string")
    }

    guard let reviewDecisionsFile = dict["reviewDecisionsFile"] as? String,
          !reviewDecisionsFile.isEmpty else {
        return .failure("reviewDecisionsFile must be a non-empty string")
    }

    // Step 7: required directory paths.
    guard let photosDir = dict["photosDir"] as? String, !photosDir.isEmpty else {
        return .failure("photosDir must be a non-empty string")
    }

    guard let floorplansDir = dict["floorplansDir"] as? String, !floorplansDir.isEmpty else {
        return .failure("floorplansDir must be a non-empty string")
    }

    let manifest = AtlasVisitPackageManifestV1(
        format: format,
        schemaVersion: schemaVersion,
        createdAt: createdAt,
        visitReference: visitReference,
        sessionId: sessionId,
        workspaceFile: workspaceFile,
        sessionCaptureFile: sessionCaptureFile,
        reviewDecisionsFile: reviewDecisionsFile,
        photosDir: photosDir,
        floorplansDir: floorplansDir
    )
    return .success(manifest)
}

/// Convenience overload that accepts a JSON string.
public func validateAtlasVisitPackageManifest(_ jsonString: String) -> AtlasVisitPackageManifestValidationResult {
    guard let data = jsonString.data(using: .utf8) else {
        return .failure("Input string is not valid UTF-8")
    }
    return validateAtlasVisitPackageManifest(data)
}
