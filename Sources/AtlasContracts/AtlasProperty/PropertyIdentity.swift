// PropertyIdentity.swift
//
// PropertyIdentityV1 — address and classification metadata for a physical property.
//
// All fields are optional at capture time; provenance-aware fields use
// FieldValue<T> so consumers know whether a value was confirmed by an
// engineer, stated by the customer, or imported from an external dataset.
//
// IMPORTANT: This file defines only the shared contract boundary.

import Foundation

// MARK: - Geo coordinate

/// Geographic coordinates for a property with provenance.
public struct PropertyGeoV1: Codable, Sendable, Equatable {
    /// Latitude in decimal degrees (WGS-84).
    public let lat: Double?
    /// Longitude in decimal degrees (WGS-84).
    public let lng: Double?
    /// How these coordinates were obtained.
    public let source: ProvenanceSource

    public init(lat: Double? = nil, lng: Double? = nil, source: ProvenanceSource) {
        self.lat = lat
        self.lng = lng
        self.source = source
    }
}

// MARK: - Country code

/// ISO 3166-1 alpha-2 country code.
/// Currently restricted to GB; extend for future markets.
public enum CountryCode: String, Codable, Sendable, Equatable {
    case gb = "GB"
}

// MARK: - Occupancy type

/// Tenure / occupancy classification.
public enum OccupancyType: String, Codable, Sendable, Equatable {
    case ownerOccupied   = "owner_occupied"
    case privateRented   = "private_rented"
    case socialHousing   = "social_housing"
    case unknown
}

// MARK: - Property type

/// SAP / RdSAP dwelling type classification.
public enum PropertyType: String, Codable, Sendable, Equatable {
    case detached
    case semiDetached = "semi_detached"
    case terraced
    case flat
    case bungalow
    case maisonette
    case unknown
}

// MARK: - PropertyIdentityV1

/// Address and classification metadata for a physical property.
///
/// All address fields are optional: partial addresses are allowed at capture
/// time and can be enriched later via UPRN lookup or portal entry.
public struct PropertyIdentityV1: Codable, Sendable, Equatable {

    /// Internal Atlas reference for this property (e.g. a job or quote ID).
    public let reference: String?

    /// Unique Property Reference Number (UK).
    public let uprn: String?

    /// First line of the postal address.
    public let address1: String?

    /// Second line of the postal address (flat number, building name, etc.).
    public let address2: String?

    /// Town or city.
    public let town: String?

    /// UK postcode in canonical format (e.g. "SW1A 1AA").
    public let postcode: String?

    /// ISO 3166-1 alpha-2 country code.
    public let countryCode: CountryCode?

    /// Geographic coordinates for the property.
    public let geo: PropertyGeoV1?

    /// Tenure / occupancy type (provenance-aware).
    public let occupancyType: FieldValue<OccupancyType>?

    /// SAP / RdSAP property type (provenance-aware).
    public let propertyType: FieldValue<PropertyType>?

    /// Construction era / age band (provenance-aware; SAP age-band codes recommended).
    public let buildEra: FieldValue<String>?

    public init(
        reference: String? = nil,
        uprn: String? = nil,
        address1: String? = nil,
        address2: String? = nil,
        town: String? = nil,
        postcode: String? = nil,
        countryCode: CountryCode? = nil,
        geo: PropertyGeoV1? = nil,
        occupancyType: FieldValue<OccupancyType>? = nil,
        propertyType: FieldValue<PropertyType>? = nil,
        buildEra: FieldValue<String>? = nil
    ) {
        self.reference = reference
        self.uprn = uprn
        self.address1 = address1
        self.address2 = address2
        self.town = town
        self.postcode = postcode
        self.countryCode = countryCode
        self.geo = geo
        self.occupancyType = occupancyType
        self.propertyType = propertyType
        self.buildEra = buildEra
    }
}
