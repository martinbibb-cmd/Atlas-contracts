// FieldValue.swift
//
// Provenance-aware field wrapper for AtlasPropertyV1.
//
// Any field whose origin matters — measured dimension, customer-stated
// preference, transcribed voice note, derived calculation — should be
// wrapped in FieldValue<T> so consumers always know:
//
//   - what was captured or inferred (value)
//   - where that value came from (source)
//   - how confident we are (confidence)
//   - when and by whom it was observed (observedAt, observedBy)
//
// IMPORTANT: This file defines only the shared contract boundary.
// App-layer concerns (UI state, validation messages, edit history)
// must not appear here.

import Foundation

// MARK: - ProvenanceSource

/// Origin of a field value.
///
/// - `measured`:        taken from a sensor or instrument reading
/// - `scanned`:         extracted from a RoomPlan / LiDAR scan bundle
/// - `observed`:        recorded by the engineer through visual inspection
/// - `engineerEntered`: manually typed or selected by the engineer in-app
/// - `customerStated`:  provided verbally or via self-service by the occupant
/// - `transcribed`:     extracted from a voice-note transcript
/// - `derived`:         calculated from other captured fields
/// - `imported`:        ingested from an external dataset (e.g. EPC register)
/// - `defaulted`:       assumed from a known default (e.g. U-value table)
/// - `unknown`:         origin not recorded
public enum ProvenanceSource: String, Codable, Sendable, Equatable {
    case measured
    case scanned
    case observed
    case engineerEntered = "engineer_entered"
    case customerStated  = "customer_stated"
    case transcribed
    case derived
    case imported
    case defaulted
    case unknown
}

// MARK: - ConfidenceBand

/// Banded confidence rating for a field value.
///
/// - `high`:    directly measured or independently verified
/// - `medium`:  observed or stated, single source of truth
/// - `low`:     estimated, inferred, or derived with significant uncertainty
/// - `unknown`: confidence not assessed
public enum ConfidenceBand: String, Codable, Sendable, Equatable {
    case high
    case medium
    case low
    case unknown
}

// MARK: - FieldValue

/// A provenance-aware wrapper for a single field value.
///
/// Use this type for any field where the origin of the data matters to
/// downstream consumers (scan, recommendation engine, portal, reports).
///
/// - `T` must be `Codable` and `Sendable`.
public struct FieldValue<T: Codable & Sendable>: Codable, Sendable {

    /// The captured or derived value, or `nil` if not yet known.
    public let value: T?

    /// Where the value came from.
    public let source: ProvenanceSource

    /// How confident we are in this value.
    public let confidence: ConfidenceBand

    /// ISO-8601 timestamp of when the value was observed / measured.
    public let observedAt: String?

    /// Identifier of the engineer or system that produced this value.
    public let observedBy: String?

    /// Optional free-text annotation about this specific field.
    public let notes: String?

    public init(
        value: T?,
        source: ProvenanceSource,
        confidence: ConfidenceBand,
        observedAt: String? = nil,
        observedBy: String? = nil,
        notes: String? = nil
    ) {
        self.value = value
        self.source = source
        self.confidence = confidence
        self.observedAt = observedAt
        self.observedBy = observedBy
        self.notes = notes
    }
}

// MARK: - Equatable conformance

extension FieldValue: Equatable where T: Equatable {}
