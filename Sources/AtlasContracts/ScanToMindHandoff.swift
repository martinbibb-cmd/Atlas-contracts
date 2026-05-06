// ScanToMindHandoff.swift
//
// ScanToMindHandoffV1 — canonical typed payload used when Atlas Scan completes
// capture and opens Atlas Mind with the visit loaded.
//
// This file defines the handoff shape and a pure validation helper.
// It does NOT define API routes, storage, simulator, recommendation, portal,
// or PDF behaviour.

import Foundation

// MARK: - ScanToMindHandoffReasonV1

/// Why the handoff from Scan to Mind is occurring.
///
/// - `completeCapture`:  engineer has finished capturing and is handing off
///                      a fully complete session
/// - `saveProgress`:    engineer is saving partial progress mid-capture
/// - `reviewInMind`:    engineer wants to review the session in Mind without
///                      completing capture
public enum ScanToMindHandoffReasonV1: String, Codable, Sendable, Equatable {
    case completeCapture = "complete_capture"
    case saveProgress    = "save_progress"
    case reviewInMind    = "review_in_mind"
}

// MARK: - ScanToMindHandoffMetaV1

/// Metadata describing the context of a scan-to-mind handoff.
public struct ScanToMindHandoffMetaV1: Codable, Sendable, Equatable {
    /// ISO-8601 timestamp of when the handoff payload was created.
    public let createdAt: String
    /// The app that produced this handoff — always "scan_ios".
    public let sourceApp: String
    /// The app intended to consume this handoff — always "mind_pwa".
    public let targetApp: String
    /// Why the handoff is occurring.
    public let handoffReason: ScanToMindHandoffReasonV1
    /// Schema version of this meta block — always "1.0".
    public let schemaVersion: String

    public init(
        createdAt: String,
        sourceApp: String = "scan_ios",
        targetApp: String = "mind_pwa",
        handoffReason: ScanToMindHandoffReasonV1,
        schemaVersion: String = "1.0"
    ) {
        self.createdAt = createdAt
        self.sourceApp = sourceApp
        self.targetApp = targetApp
        self.handoffReason = handoffReason
        self.schemaVersion = schemaVersion
    }
}

// MARK: - ScanToMindHandoffWarningV1

/// A warning produced during or after capture.
public struct ScanToMindHandoffWarningV1: Codable, Sendable, Equatable {
    /// Machine-readable warning code.
    public let code: String
    /// Human-readable warning message.
    public let message: String
    /// Severity of the warning.
    public let severity: Severity

    public enum Severity: String, Codable, Sendable, Equatable {
        case info
        case warning
        case blocking
    }

    public init(code: String, message: String, severity: Severity) {
        self.code = code
        self.message = message
        self.severity = severity
    }
}

// MARK: - ScanToMindHandoffV1

/// ScanToMindHandoffV1 — the canonical payload passed from Atlas Scan to Atlas
/// Mind when a visit session is handed off.
///
/// Contains the visit identity, readiness flags, capture evidence, and optional
/// warnings produced during capture.  No engine outputs, recommendation scores,
/// proposal design state, or derived values belong here.
///
/// The optional `handoffId` is a stable UUID for this specific handoff record,
/// distinct from `visit.visitId`.  When present it allows the iOS app to fetch
/// an existing session from the Mind D1 API using either the `handoffId` or
/// `visit.visitId` — supporting the bi-directional recall flow
/// (`atlasscan://recall?visitId=...`).
public struct ScanToMindHandoffV1: Codable, Sendable, Equatable {
    /// Contract version discriminant — always "1.0".
    public let version: String
    /// Stable UUID for this handoff record (optional).
    ///
    /// Assigned by Mind when the handoff is persisted.  The Scan app can use
    /// this as the primary key when recalling a session (`atlasscan://recall`),
    /// falling back to `visit.visitId` if absent.
    public let handoffId: String?
    /// Metadata describing the handoff context.
    public let meta: ScanToMindHandoffMetaV1
    /// The visit identity record produced by Atlas Scan.
    public let visit: AtlasVisitV1
    /// Readiness flags at the time of handoff.
    public let readiness: AtlasVisitReadinessV1
    /// The full capture evidence payload.
    public let capture: SessionCaptureV2
    /// Optional warnings produced during or after capture.
    public let warnings: [ScanToMindHandoffWarningV1]?

    public init(
        version: String = "1.0",
        handoffId: String? = nil,
        meta: ScanToMindHandoffMetaV1,
        visit: AtlasVisitV1,
        readiness: AtlasVisitReadinessV1,
        capture: SessionCaptureV2,
        warnings: [ScanToMindHandoffWarningV1]? = nil
    ) {
        self.version = version
        self.handoffId = handoffId
        self.meta = meta
        self.visit = visit
        self.readiness = readiness
        self.capture = capture
        self.warnings = warnings
    }
}

// MARK: - Validation result

/// The result of validating a ScanToMindHandoffV1 payload.
public struct ScanToMindHandoffValidationResult: Sendable, Equatable {
    /// `true` only when `errors` is empty.
    public let ok: Bool
    /// Fatal validation failures.
    public let errors: [String]
    /// Non-fatal notices (e.g. one-sided brandId).
    public let warnings: [String]

    public init(ok: Bool, errors: [String], warnings: [String]) {
        self.ok = ok
        self.errors = errors
        self.warnings = warnings
    }
}

// MARK: - Validation helper

/// Readiness flag names required to be `true` for a `complete_capture` handoff.
private let requiredCompleteCaptureFlags: [(String, (AtlasVisitReadinessV1) -> Bool)] = [
    ("hasRooms",           { $0.hasRooms }),
    ("hasPhotos",          { $0.hasPhotos }),
    ("hasHeatingSystem",   { $0.hasHeatingSystem }),
    ("hasHotWaterSystem",  { $0.hasHotWaterSystem }),
    ("hasKeyObjectBoiler", { $0.hasKeyObjectBoiler }),
    ("hasKeyObjectFlue",   { $0.hasKeyObjectFlue }),
    ("hasAnyNotes",        { $0.hasAnyNotes }),
]

/// Validate a ScanToMindHandoffV1 payload.
///
/// Validation rules:
///   1.  handoff.version must be "1.0"
///   2.  meta.schemaVersion must be "1.0"
///   3.  meta.sourceApp must be "scan_ios"
///   4.  meta.targetApp must be "mind_pwa"
///   5.  visit.visitId must match capture.visitId
///   6.  readiness must match visit.readiness by value
///   7.  capture.version must be "2.0"
///   8.  If handoffReason is completeCapture:
///         - visit.status should be complete or readyToComplete
///         - all required readiness flags must be true (blocking errors)
///   9.  If brandId exists on both visit and capture, they must match
///   10. If brandId exists on only one side, produce a warning (not an error)
public func validateScanToMindHandoffV1(_ handoff: ScanToMindHandoffV1) -> ScanToMindHandoffValidationResult {
    var errors: [String] = []
    var warnings: [String] = []

    // Rule 1 — handoff version
    if handoff.version != "1.0" {
        errors.append("handoff.version must be '1.0', got '\(handoff.version)'")
    }

    // Rule 2 — meta.schemaVersion
    if handoff.meta.schemaVersion != "1.0" {
        errors.append("meta.schemaVersion must be '1.0', got '\(handoff.meta.schemaVersion)'")
    }

    // Rule 3 — meta.sourceApp
    if handoff.meta.sourceApp != "scan_ios" {
        errors.append("meta.sourceApp must be 'scan_ios', got '\(handoff.meta.sourceApp)'")
    }

    // Rule 4 — meta.targetApp
    if handoff.meta.targetApp != "mind_pwa" {
        errors.append("meta.targetApp must be 'mind_pwa', got '\(handoff.meta.targetApp)'")
    }

    // Rule 5 — visitId consistency
    if handoff.visit.visitId != handoff.capture.visitId {
        errors.append("visit.visitId ('\(handoff.visit.visitId)') does not match capture.visitId ('\(handoff.capture.visitId)')")
    }

    // Rule 6 — readiness must match visit.readiness by value
    if handoff.readiness != handoff.visit.readiness {
        errors.append("readiness does not match visit.readiness")
    }

    // Rule 7 — capture version
    if handoff.capture.version != "2.0" {
        errors.append("capture.version must be '2.0', got '\(handoff.capture.version)'")
    }

    // Rule 8 — complete_capture constraints
    if handoff.meta.handoffReason == .completeCapture {
        let status = handoff.visit.status
        if status != .complete && status != .readyToComplete {
            errors.append("complete_capture requires visit.status 'complete' or 'ready_to_complete', got '\(status.rawValue)'")
        }

        for (flagName, flagValue) in requiredCompleteCaptureFlags {
            if !flagValue(handoff.readiness) {
                errors.append("complete_capture requires readiness.\(flagName) to be true (blocking)")
            }
        }
    }

    // Rules 9 & 10 — brandId consistency
    let visitBrandId = handoff.visit.brandId
    let captureBrandId = handoff.capture.brandId

    if let vb = visitBrandId, let cb = captureBrandId {
        // Rule 9 — both present, must match
        if vb != cb {
            errors.append("visit.brandId ('\(vb)') does not match capture.brandId ('\(cb)')")
        }
    } else if visitBrandId != nil || captureBrandId != nil {
        // Rule 10 — only one side has brandId
        let side = visitBrandId != nil ? "visit" : "capture"
        warnings.append("brandId is present on \(side) but absent on the other side")
    }

    return ScanToMindHandoffValidationResult(ok: errors.isEmpty, errors: errors, warnings: warnings)
}
