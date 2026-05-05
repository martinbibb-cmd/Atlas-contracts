// ApplianceDefinitionV1.swift
//
// HardwareRegistryV1 — shared appliance definition contract.
//
// Establishes a single source of truth for the physical dimensions and
// clearance rules of heat-generating appliances.  Both the iOS AR
// "Ghost Box" (SCNBox generation) and the Mind recommendation engine
// consume these definitions.
//
// Dimension convention:
//   widthMm  — left-to-right when facing the appliance front.
//   depthMm  — front-to-back (protrusion from the wall).
//   heightMm — bottom-to-top (floor to top of casing).
//
// All linear values are in millimetres (mm) to match manufacturer data
// sheets.  Divide by 1000.0 to obtain metres for SceneKit node sizing.
//
// IMPORTANT: This file defines only the shared contract boundary.

import Foundation

// MARK: - Schema version

/// Schema version discriminator for HardwareRegistryV1.
public let hardwareRegistryV1SchemaVersion = "1.0"

// MARK: - ApplianceCategory

/// Broad category for a heat-generating appliance.
public enum ApplianceCategory: String, Codable, Sendable, Equatable {
    /// Gas / oil / LPG wall-hung or floor-standing boiler.
    case boiler
    /// Air-source or ground-source heat pump (external unit).
    case heatPump    = "heat_pump"
    /// Unvented or vented hot-water cylinder.
    case cylinder
    /// Any appliance not covered by the categories above.
    case other
}

// MARK: - ApplianceDimensionsV1

/// Physical outer envelope dimensions of an appliance in millimetres.
///
/// Divide each value by `1000.0` to convert to metres for `SCNBox` sizing.
public struct ApplianceDimensionsV1: Codable, Sendable, Equatable {
    /// Width in millimetres (left-to-right).
    public let widthMm: Double
    /// Depth in millimetres (front-to-back).
    public let depthMm: Double
    /// Height in millimetres (bottom-to-top).
    public let heightMm: Double

    public init(widthMm: Double, depthMm: Double, heightMm: Double) {
        self.widthMm = widthMm
        self.depthMm = depthMm
        self.heightMm = heightMm
    }

    /// Width in metres (convenience for SceneKit).
    public var widthM: Double { widthMm / 1000.0 }
    /// Depth in metres (convenience for SceneKit).
    public var depthM: Double { depthMm / 1000.0 }
    /// Height in metres (convenience for SceneKit).
    public var heightM: Double { heightMm / 1000.0 }
}

// MARK: - ApplianceClearanceRulesV1

/// Minimum service / access clearances around an appliance in millimetres.
///
/// These offsets inflate the ghost box beyond the appliance envelope to
/// show engineers where obstructions are not permitted.  Values are sourced
/// from manufacturer installation guides and/or Gas Safe regulations.
///
/// Use `0` where a manufacturer specifies no minimum clearance for a face.
public struct ApplianceClearanceRulesV1: Codable, Sendable, Equatable {
    /// Minimum clearance in front of the appliance (access / servicing) in mm.
    public let frontMm: Double
    /// Minimum clearance on each side of the appliance in mm.
    public let sideMm: Double
    /// Minimum clearance above the top of the appliance in mm.
    public let topMm: Double
    /// Minimum clearance below the bottom of the appliance in mm.
    public let bottomMm: Double

    public init(frontMm: Double, sideMm: Double, topMm: Double, bottomMm: Double) {
        self.frontMm = frontMm
        self.sideMm = sideMm
        self.topMm = topMm
        self.bottomMm = bottomMm
    }

    /// Front clearance in metres (convenience for SceneKit).
    public var frontM: Double { frontMm / 1000.0 }
    /// Side clearance in metres (convenience for SceneKit).
    public var sideM: Double { sideMm / 1000.0 }
    /// Top clearance in metres (convenience for SceneKit).
    public var topM: Double { topMm / 1000.0 }
    /// Bottom clearance in metres (convenience for SceneKit).
    public var bottomM: Double { bottomMm / 1000.0 }
}

// MARK: - ApplianceDefinitionV1

/// A single appliance model definition in the hardware registry.
///
/// `modelId` is the stable cross-repo identifier used in
/// `AtlasAnchor.objectType` lookups and in `VisitHandoffPackV1` patch
/// payloads.  It is a slug-style string (e.g. `"worcester_4000_30kw"`).
///
/// `schemaVersion` is always `"1.0"` for `ApplianceDefinitionV1` entries.
public struct ApplianceDefinitionV1: Codable, Sendable, Equatable {
    /// Schema version discriminator — always `"1.0"`.
    public let schemaVersion: String
    /// Stable machine-readable identifier (slug, e.g. `"worcester_4000_30kw"`).
    public let modelId: String
    /// Manufacturer / brand name (e.g. `"Worcester Bosch"`).
    public let brand: String
    /// Human-readable model name (e.g. `"Greenstar 4000 30kW"`).
    public let modelName: String
    /// Broad appliance category.
    public let category: ApplianceCategory
    /// Outer physical envelope in millimetres.
    public let dimensions: ApplianceDimensionsV1
    /// Minimum service clearances around the appliance in millimetres.
    public let clearanceRules: ApplianceClearanceRulesV1
    /// Nominal heat output in kilowatts, if applicable.
    public let outputKw: Double?
    /// Free-text notes (e.g. data-sheet reference, installation constraints).
    public let notes: String?

    public init(
        modelId: String,
        brand: String,
        modelName: String,
        category: ApplianceCategory,
        dimensions: ApplianceDimensionsV1,
        clearanceRules: ApplianceClearanceRulesV1,
        outputKw: Double? = nil,
        notes: String? = nil
    ) {
        self.schemaVersion = hardwareRegistryV1SchemaVersion
        self.modelId = modelId
        self.brand = brand
        self.modelName = modelName
        self.category = category
        self.dimensions = dimensions
        self.clearanceRules = clearanceRules
        self.outputKw = outputKw
        self.notes = notes
    }

    // MARK: Clearance-inflated ghost box dimensions

    /// Total width of the clearance ghost box in millimetres
    /// (appliance width + side clearances on both sides).
    public var ghostBoxWidthMm: Double {
        dimensions.widthMm + clearanceRules.sideMm * 2
    }

    /// Total depth of the clearance ghost box in millimetres
    /// (appliance depth + front clearance).
    ///
    /// - Note: A rear clearance is not modelled at this schema level because
    ///   wall-hung appliances are flush-mounted and rear access is not
    ///   required for servicing.  Override via a Mind hardware patch if needed.
    public var ghostBoxDepthMm: Double {
        dimensions.depthMm + clearanceRules.frontMm
    }

    /// Total height of the clearance ghost box in millimetres
    /// (appliance height + top + bottom clearances).
    public var ghostBoxHeightMm: Double {
        dimensions.heightMm + clearanceRules.topMm + clearanceRules.bottomMm
    }
}

// MARK: - MasterRegistryV1

/// The top-level hardware registry contract.
///
/// A `MasterRegistryV1` is stored as `MasterRegistry.json` in the
/// `fixtures/` directory of the Atlas-contracts repo and serves as the
/// baseline set of manufacturer definitions consumed offline by the iOS app.
///
/// Mind app overrides are transmitted via the `hardwarePatch` field of
/// `VisitHandoffPackV1` and are never written back to this file.
public struct MasterRegistryV1: Codable, Sendable, Equatable {
    /// Schema version discriminator — always `"1.0"`.
    public let schemaVersion: String
    /// ISO-8601 timestamp of the last update to this registry file.
    public let updatedAt: String
    /// Ordered list of appliance definitions.
    public let appliances: [ApplianceDefinitionV1]

    public init(updatedAt: String, appliances: [ApplianceDefinitionV1]) {
        self.schemaVersion = hardwareRegistryV1SchemaVersion
        self.updatedAt = updatedAt
        self.appliances = appliances
    }

    /// Returns the definition for the given `modelId`, or `nil` if not found.
    public func definition(for modelId: String) -> ApplianceDefinitionV1? {
        appliances.first { $0.modelId == modelId }
    }
}

// MARK: - MasterRegistryLoader

/// Loads and decodes the bundled `MasterRegistry.json` from a Swift `Bundle`.
///
/// Usage (from the iOS app target):
/// ```swift
/// let registry = try MasterRegistryLoader.load(from: .module)
/// let boiler = registry.definition(for: "worcester_greenstar_4000_30kw")
/// ```
public enum MasterRegistryLoader {

    /// The expected file name for the bundled master registry.
    public static let fileName = "MasterRegistry"
    /// The expected file extension for the bundled master registry.
    public static let fileExtension = "json"

    /// Errors that can be thrown by ``load(from:)``.
    public enum LoadError: Error, CustomStringConvertible {
        case fileNotFound(bundle: Bundle)
        case decodingFailed(Error)

        public var description: String {
            switch self {
            case .fileNotFound(let bundle):
                return "MasterRegistry.json not found in bundle: \(bundle)"
            case .decodingFailed(let error):
                return "Failed to decode MasterRegistry.json: \(error)"
            }
        }
    }

    /// Loads and decodes `MasterRegistry.json` from the given bundle.
    ///
    /// - Parameter bundle: The bundle to search (defaults to `.main`).
    /// - Returns: A decoded `MasterRegistryV1`.
    /// - Throws: `LoadError` if the file is missing or cannot be decoded.
    public static func load(from bundle: Bundle = .main) throws -> MasterRegistryV1 {
        guard let url = bundle.url(
            forResource: fileName,
            withExtension: fileExtension
        ) else {
            throw LoadError.fileNotFound(bundle: bundle)
        }

        let data = try Data(contentsOf: url)
        do {
            let decoder = JSONDecoder()
            return try decoder.decode(MasterRegistryV1.self, from: data)
        } catch {
            throw LoadError.decodingFailed(error)
        }
    }
}
