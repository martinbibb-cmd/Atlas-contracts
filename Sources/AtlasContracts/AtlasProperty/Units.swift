// Units.swift
//
// Typed unit wrappers for Atlas numeric quantities.
//
// Using distinct value types for physical units prevents the common bug of
// mixing up Watts and Kilowatts (or other unit mismatches) when data crosses
// system boundaries.  Both types are thin wrappers around `Double` and are
// fully `Codable`, so they serialise as plain JSON numbers — no schema changes
// required on existing payloads that adopt them.
//
// Usage:
//   let peakLoss = Watts(4500)
//   let peakLossKw = peakLoss.asKilowatts   // 4.5 kW
//   let backToWatts = peakLossKw.asWatts     // 4500 W
//
// IMPORTANT: This file defines only the shared contract boundary.

import Foundation

// MARK: - Watts

/// A numeric value explicitly tagged as Watts (W).
///
/// Use this type wherever the contract stores a power value in Watts so the
/// compiler rejects accidental mixing with `Kilowatts` values.
public struct Watts: Codable, Sendable, Equatable, Hashable, CustomStringConvertible {
    /// The underlying numeric value in Watts.
    public let value: Double

    public init(_ value: Double) {
        self.value = value
    }

    /// Converts this Watts value to the equivalent Kilowatts value.
    public var asKilowatts: Kilowatts {
        Kilowatts(value / 1_000)
    }

    public var description: String { "\(value) W" }

    // MARK: Codable — encode and decode as a plain JSON number

    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        value = try container.decode(Double.self)
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(value)
    }
}

// MARK: - Kilowatts

/// A numeric value explicitly tagged as Kilowatts (kW).
///
/// Use this type wherever the contract stores a power value in Kilowatts so
/// the compiler rejects accidental mixing with `Watts` values.
public struct Kilowatts: Codable, Sendable, Equatable, Hashable, CustomStringConvertible {
    /// The underlying numeric value in Kilowatts.
    public let value: Double

    public init(_ value: Double) {
        self.value = value
    }

    /// Converts this Kilowatts value to the equivalent Watts value.
    public var asWatts: Watts {
        Watts(value * 1_000)
    }

    public var description: String { "\(value) kW" }

    // MARK: Codable — encode and decode as a plain JSON number

    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        value = try container.decode(Double.self)
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(value)
    }
}
