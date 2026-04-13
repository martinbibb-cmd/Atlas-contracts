// ScanImportConflict.swift
//
// Types representing field-level conflicts detected when a LiDAR scan bundle
// is imported into a property record that already has manually-entered data.
//
// When the importer finds a discrepancy between a stored value and the
// corresponding scan-derived value (e.g. manual room area = 12 m² vs
// scan area = 14.2 m²), it produces a ScanImportConflictItemV1 for each
// differing field.  The Conflict Resolution UI presents these items as
// side-by-side choices rather than silently overwriting the existing value.
//
// IMPORTANT: This file defines only the shared contract boundary.

import Foundation

// MARK: - ScanImportConflictKind

/// The kind of value discrepancy detected during scan import.
public enum ScanImportConflictKind: String, Codable, Sendable, Equatable {
    /// Floor area differs between manual entry and scan.
    case areaMismatch    = "area_mismatch"
    /// Ceiling height differs between manual entry and scan.
    case heightMismatch  = "height_mismatch"
    /// An opening (door/window) count or dimension differs.
    case openingMismatch = "opening_mismatch"
    /// Any other field-level discrepancy.
    case other
}

// MARK: - ScanImportConflictFieldV1

/// The two competing values for a single conflicting field.
public struct ScanImportConflictFieldV1: Codable, Sendable, Equatable {
    /// Dot-notation path to the conflicting field
    /// (e.g. `"building.rooms[2].areaM2"`).
    public let fieldPath: String
    /// The value already stored in the property record, encoded as a JSON value.
    public let manualValue: JSONValue
    /// The value detected by the LiDAR scan, encoded as a JSON value.
    public let scanValue: JSONValue
    /// Optional SI unit label (e.g. `"m²"`, `"m"`).
    public let unit: String?

    public init(
        fieldPath: String,
        manualValue: JSONValue,
        scanValue: JSONValue,
        unit: String? = nil
    ) {
        self.fieldPath = fieldPath
        self.manualValue = manualValue
        self.scanValue = scanValue
        self.unit = unit
    }
}

// MARK: - JSONValue

/// A lightweight JSON value type used to carry heterogeneous manual/scan values
/// in `ScanImportConflictFieldV1` without losing type information.
///
/// This is a minimal closed-world representation suitable for the conflict
/// contract boundary.  Consumer apps may decode or re-encode as needed.
public enum JSONValue: Codable, Sendable, Equatable {
    case string(String)
    case double(Double)
    case int(Int)
    case bool(Bool)
    case null

    public init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if c.decodeNil() {
            self = .null
        } else if let b = try? c.decode(Bool.self) {
            self = .bool(b)
        } else if let i = try? c.decode(Int.self) {
            self = .int(i)
        } else if let d = try? c.decode(Double.self) {
            self = .double(d)
        } else if let s = try? c.decode(String.self) {
            self = .string(s)
        } else {
            throw DecodingError.typeMismatch(
                JSONValue.self,
                DecodingError.Context(
                    codingPath: decoder.codingPath,
                    debugDescription: "Unsupported JSON value type"
                )
            )
        }
    }

    public func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        switch self {
        case .string(let s): try c.encode(s)
        case .double(let d): try c.encode(d)
        case .int(let i):    try c.encode(i)
        case .bool(let b):   try c.encode(b)
        case .null:          try c.encodeNil()
        }
    }
}

// MARK: - ScanImportConflictItemV1

/// A single detected conflict between manual data and an incoming scan.
public struct ScanImportConflictItemV1: Codable, Sendable, Equatable {
    /// Unique identifier for this conflict item (UUID string).
    public let conflictId: String
    /// Category of the discrepancy.
    public let kind: ScanImportConflictKind
    /// The room affected, if the conflict is room-scoped.
    public let roomId: String?
    /// The specific field that differs and its two competing values.
    public let field: ScanImportConflictFieldV1
    /// ISO-8601 timestamp of when the conflict was detected.
    public let detectedAt: String

    public init(
        conflictId: String,
        kind: ScanImportConflictKind,
        roomId: String? = nil,
        field: ScanImportConflictFieldV1,
        detectedAt: String
    ) {
        self.conflictId = conflictId
        self.kind = kind
        self.roomId = roomId
        self.field = field
        self.detectedAt = detectedAt
    }
}

// MARK: - ScanImportConflictSetV1

/// The full set of conflicts produced by a single scan import operation.
///
/// A non-empty `conflicts` array indicates that the Conflict Resolution UI
/// must be presented before the scan data is applied to the property record.
public struct ScanImportConflictSetV1: Codable, Sendable, Equatable {
    /// ID of the incoming `ScanBundleV1` that triggered these conflicts.
    public let bundleId: String
    /// ID of the `AtlasPropertyV1` being updated.
    public let propertyId: String
    /// Ordered list of detected conflicts.  Empty implies no conflicts.
    public let conflicts: [ScanImportConflictItemV1]
    /// ISO-8601 timestamp of when this conflict set was produced.
    public let generatedAt: String

    public init(
        bundleId: String,
        propertyId: String,
        conflicts: [ScanImportConflictItemV1] = [],
        generatedAt: String
    ) {
        self.bundleId = bundleId
        self.propertyId = propertyId
        self.conflicts = conflicts
        self.generatedAt = generatedAt
    }
}
