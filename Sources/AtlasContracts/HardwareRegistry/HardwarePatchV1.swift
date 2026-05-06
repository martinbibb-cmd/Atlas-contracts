// HardwarePatchV1.swift
//
// HardwarePatchV1 — a visit-scoped appliance override dispatched from
// Atlas Mind to Atlas Scan via VisitHandoffPackV1.
//
// A patch carries the same physical data as an ApplianceDefinitionV1 but is
// scoped to a single visit.  It takes precedence over the baseline registry
// entry (if any) for the duration of that visit, enabling field engineers to
// use site-specific dimensions without modifying the shared registry.
//
// `modelId` is the cross-repo foreign key.  For `override` patches it
// matches an existing registry entry; for `custom` patches it is a unique
// slug scoped to the visit (e.g. "custom_unknown_boiler").
//
// IMPORTANT: This file defines only the shared contract boundary.

import Foundation

// MARK: - Schema version

/// Schema version discriminator for HardwarePatchV1.
public let hardwarePatchV1SchemaVersion = "1.0"

// MARK: - HardwarePatchSourceV1

/// How a HardwarePatchV1 was created.
///
/// - `custom`   — engineer entered entirely custom dimensions not found in the
///                baseline registry.
/// - `override` — engineer adjusted dimensions of a known registry entry to
///                reflect site-specific measurements.
public enum HardwarePatchSourceV1: String, Codable, Sendable, Equatable {
    case custom
    case override
}

// MARK: - HardwarePatchV1

/// A visit-scoped appliance specification authored by an engineer in Atlas Mind.
///
/// Stored in the visit's `working_payload_json` and delivered to Atlas Scan
/// inside `VisitHandoffPackV1.hardwarePatches`.  The Scan app resolves model
/// lookups by checking this list before falling back to `MasterRegistryV1`.
///
/// `schemaVersion` is always `"1.0"` for `HardwarePatchV1` entries.
public struct HardwarePatchV1: Codable, Sendable, Equatable {
    /// Schema version discriminator — always `"1.0"`.
    public let schemaVersion: String
    /// Stable cross-repo identifier for the appliance.
    ///
    /// For `override` patches this should match an existing `modelId` in the
    /// baseline registry.  For `custom` patches it must be unique within the
    /// visit (e.g. `"custom_unknown_boiler"`).
    public let modelId: String
    /// Manufacturer / brand name.
    public let brand: String
    /// Human-readable model name.
    public let modelName: String
    /// Broad appliance category.
    public let category: ApplianceCategory
    /// Physical outer envelope dimensions in millimetres.
    public let dimensions: ApplianceDimensionsV1
    /// Minimum service clearances in millimetres.
    public let clearanceRules: ApplianceClearanceRulesV1
    /// Nominal heat output in kilowatts, if applicable.
    public let outputKw: Double?
    /// How this patch was created.
    public let source: HardwarePatchSourceV1
    /// Free-text notes (e.g. site measurement context, date of field check).
    public let notes: String?

    public init(
        modelId: String,
        brand: String,
        modelName: String,
        category: ApplianceCategory,
        dimensions: ApplianceDimensionsV1,
        clearanceRules: ApplianceClearanceRulesV1,
        outputKw: Double? = nil,
        source: HardwarePatchSourceV1,
        notes: String? = nil
    ) {
        self.schemaVersion = hardwarePatchV1SchemaVersion
        self.modelId = modelId
        self.brand = brand
        self.modelName = modelName
        self.category = category
        self.dimensions = dimensions
        self.clearanceRules = clearanceRules
        self.outputKw = outputKw
        self.source = source
        self.notes = notes
    }
}
