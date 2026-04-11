// CaptureContext.swift
//
// CaptureContextV1 — session-level metadata for a property capture visit.
//
// Records who captured the property, with which app and device, and the
// walkthrough state.  Sits above the raw scan geometry (ScanBundleV1) and
// the structured survey data without duplicating them.
//
// IMPORTANT: This file defines only the shared contract boundary.
// App-layer concerns (navigation state, upload queues, recorder state)
// must not appear here.

import Foundation

// MARK: - CaptureApp

/// Atlas application that performed the capture.
public enum CaptureApp: String, Codable, Sendable, Equatable {
    case atlasScan = "atlas_scan"
    case atlasMind = "atlas_mind"
}

// MARK: - CaptureOperatorV1

/// The engineer who conducted the visit.
public struct CaptureOperatorV1: Codable, Sendable, Equatable {
    /// Atlas engineer / user identifier.
    public let engineerId: String?
    /// Display name of the engineer.
    public let engineerName: String?

    public init(engineerId: String? = nil, engineerName: String? = nil) {
        self.engineerId = engineerId
        self.engineerName = engineerName
    }
}

// MARK: - CaptureDeviceV1

/// Device and application context for the capture session.
public struct CaptureDeviceV1: Codable, Sendable, Equatable {
    /// Which Atlas app performed the capture.
    public let app: CaptureApp
    /// Semantic version string of the app (e.g. "2.1.0").
    public let appVersion: String?
    /// Hardware model string (e.g. "iPhone 15 Pro").
    public let deviceModel: String?

    public init(app: CaptureApp, appVersion: String? = nil, deviceModel: String? = nil) {
        self.app = app
        self.appVersion = appVersion
        self.deviceModel = deviceModel
    }
}

// MARK: - WalkthroughStateV1

/// Structured walkthrough state for the capture session.
public struct WalkthroughStateV1: Codable, Sendable, Equatable {
    /// Whether a structured walkthrough was started.
    public let started: Bool?
    /// Whether the walkthrough was fully completed.
    public let completed: Bool?
    /// Any walkthrough notes recorded by the engineer.
    public let notes: String?

    public init(started: Bool? = nil, completed: Bool? = nil, notes: String? = nil) {
        self.started = started
        self.completed = completed
        self.notes = notes
    }
}

// MARK: - CaptureContextV1

/// Session-level metadata for a property capture visit.
///
/// Reflects the whole-property session model in Atlas Scan iOS where a
/// session is the root, workflow state is tracked separately from content,
/// and operator + device provenance are first-class.
public struct CaptureContextV1: Codable, Sendable, Equatable {

    /// Unique identifier for this capture session (UUID string).
    public let sessionId: String

    /// ISO-8601 timestamp of when the session was started.
    public let startedAt: String?

    /// ISO-8601 timestamp of when the session was completed (if complete).
    public let completedAt: String?

    /// The engineer who conducted the visit.
    public let `operator`: CaptureOperatorV1?

    /// Device and app context for the capture session.
    public let device: CaptureDeviceV1?

    /// Structured walkthrough state.
    public let walkthrough: WalkthroughStateV1?

    public init(
        sessionId: String,
        startedAt: String? = nil,
        completedAt: String? = nil,
        operator operatorValue: CaptureOperatorV1? = nil,
        device: CaptureDeviceV1? = nil,
        walkthrough: WalkthroughStateV1? = nil
    ) {
        self.sessionId = sessionId
        self.startedAt = startedAt
        self.completedAt = completedAt
        self.operator = operatorValue
        self.device = device
        self.walkthrough = walkthrough
    }

    // MARK: CodingKeys
    // Swift reserves `operator` as a keyword; use CodingKeys to map
    // the JSON field name "operator" to the Swift stored property.

    private enum CodingKeys: String, CodingKey {
        case sessionId, startedAt, completedAt
        case `operator` = "operator"
        case device, walkthrough
    }
}
