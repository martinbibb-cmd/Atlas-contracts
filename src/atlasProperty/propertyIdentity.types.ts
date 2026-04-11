/**
 * propertyIdentity.types.ts
 *
 * PropertyIdentityV1 — address and classification metadata for the physical property.
 *
 * All fields are optional at capture time; provenance-aware fields use FieldValue<T>
 * so consumers know whether a value was confirmed by an engineer, stated by the
 * customer, or imported from an external dataset such as the EPC register.
 */

import type { FieldValue, ProvenanceSource } from './fieldValue';

// ─── PropertyIdentityV1 ───────────────────────────────────────────────────────

/**
 * Address and classification metadata for a physical property.
 *
 * All address fields are optional: partial addresses are allowed at capture
 * time and can be enriched later via UPRN lookup or portal entry.
 */
export interface PropertyIdentityV1 {
  /** Internal Atlas reference for this property (e.g. a job or quote ID). */
  reference?: string;

  /**
   * Unique Property Reference Number (UK).
   * Canonical identifier for cross-referencing with EPC register and
   * Ordnance Survey AddressBase.
   */
  uprn?: string;

  /** First line of the postal address. */
  address1?: string;

  /** Second line of the postal address (flat number, building name, etc.). */
  address2?: string;

  /** Town or city. */
  town?: string;

  /** UK postcode in canonical format (e.g. "SW1A 1AA"). */
  postcode?: string;

  /**
   * ISO 3166-1 alpha-2 country code.
   * Currently restricted to 'GB'; extend the union for future markets.
   */
  countryCode?: 'GB';

  /**
   * Geographic coordinates for the property.
   * `source` records whether the coordinates were GPS-captured, looked up,
   * or inferred from the postcode centroid.
   */
  geo?: {
    lat?: number;
    lng?: number;
    source: ProvenanceSource;
  };

  /**
   * Tenure / occupancy type.
   * Provenance-aware: could be stated by the customer, imported from a
   * database, or confirmed by the engineer.
   */
  occupancyType?: FieldValue<
    'owner_occupied' | 'private_rented' | 'social_housing' | 'unknown'
  >;

  /**
   * SAP / RdSAP property type.
   * Provenance-aware: used to select default U-value tables and heat-loss
   * calculation pathways.
   */
  propertyType?: FieldValue<
    | 'detached'
    | 'semi_detached'
    | 'terraced'
    | 'flat'
    | 'bungalow'
    | 'maisonette'
    | 'unknown'
  >;

  /**
   * Construction era / age band (free string to remain flexible; SAP age-band
   * letters such as "pre_1919", "1950_to_1966", etc. are recommended values).
   * Provenance-aware: may be imported from EPC data or confirmed on-site.
   */
  buildEra?: FieldValue<string>;
}
