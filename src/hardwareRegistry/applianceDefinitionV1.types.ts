/**
 * applianceDefinitionV1.types.ts
 *
 * HardwareRegistryV1 — shared appliance definition contract.
 *
 * Establishes a single source of truth for the physical dimensions and
 * clearance rules of heat-generating appliances (boilers, heat pumps, etc.).
 * Both the iOS AR "Ghost Box" and the Mind recommendation engine consume
 * these definitions.
 *
 * Design principles:
 *   - All linear dimensions are in millimetres (mm) to match manufacturer
 *     data sheets and avoid floating-point rounding in comparisons.
 *   - `clearanceRules` describe the minimum service / access clearances
 *     required around the appliance, not the appliance envelope itself.
 *   - A `MasterRegistryV1` wraps an array of definitions and carries its
 *     own `schemaVersion` so consumers can gate on format changes.
 *   - Unknown extra fields are tolerated at the validation boundary so
 *     older consumers can handle newer payloads gracefully.
 */

// ─── Schema version ───────────────────────────────────────────────────────────

/** Schema version discriminator for HardwareRegistryV1. */
export const HARDWARE_REGISTRY_V1_SCHEMA_VERSION = '1.0' as const;
export type HardwareRegistryV1SchemaVersion = typeof HARDWARE_REGISTRY_V1_SCHEMA_VERSION;

// ─── Appliance category ───────────────────────────────────────────────────────

/**
 * Broad category for a heat-generating appliance.
 *
 * - `boiler`     — gas / oil / LPG wall-hung or floor-standing boiler.
 * - `heat_pump`  — air-source or ground-source heat pump (external unit).
 * - `cylinder`   — unvented or vented hot-water cylinder.
 * - `other`      — any appliance not covered by the categories above.
 */
export type ApplianceCategory = 'boiler' | 'heat_pump' | 'cylinder' | 'other';

// ─── Physical dimensions ──────────────────────────────────────────────────────

/**
 * Physical outer envelope dimensions of an appliance in millimetres.
 *
 * All three axes are required so the AR ghost box can be rendered as a
 * correctly-sized `SCNBox` without additional lookups.
 *
 * Convention (matches manufacturer data sheets):
 *   `widthMm`  — left-to-right when facing the appliance front.
 *   `depthMm`  — front-to-back (protrusion from the wall).
 *   `heightMm` — floor-to-top (or top-of-casing for wall-hung units).
 */
export interface ApplianceDimensionsV1 {
  /** Width in millimetres (left-to-right). */
  widthMm: number;
  /** Depth in millimetres (front-to-back). */
  depthMm: number;
  /** Height in millimetres (bottom-to-top). */
  heightMm: number;
}

// ─── Clearance rules ──────────────────────────────────────────────────────────

/**
 * Minimum service / access clearances for an appliance in millimetres.
 *
 * These are the offsets that inflate the ghost box beyond the appliance
 * envelope to show engineers where obstructions are not permitted.
 * Values are sourced from manufacturer installation guides and/or
 * Gas Safe / building regulations.
 *
 * All fields are required; use `0` where a manufacturer specifies no
 * minimum clearance for a given face.
 */
export interface ApplianceClearanceRulesV1 {
  /** Minimum clearance in front of the appliance (access / servicing) in mm. */
  frontMm: number;
  /** Minimum clearance on each side of the appliance in mm. */
  sideMm: number;
  /** Minimum clearance above the top of the appliance in mm. */
  topMm: number;
  /** Minimum clearance below the bottom of the appliance in mm. */
  bottomMm: number;
}

// ─── Appliance definition ─────────────────────────────────────────────────────

/**
 * A single appliance model definition in the hardware registry.
 *
 * `modelId` is the stable cross-repo identifier used in
 * `AtlasAnchor.objectType` lookups and in `VisitHandoffPackV1` patch
 * payloads.  It should be a slug-style string (e.g.
 * `"worcester_4000_30kw"`).
 *
 * `schemaVersion` is always `"1.0"` for ApplianceDefinitionV1 entries.
 */
export interface ApplianceDefinitionV1 {
  /** Schema version discriminator — always `"1.0"`. */
  schemaVersion: HardwareRegistryV1SchemaVersion;
  /** Stable machine-readable identifier (slug, e.g. `"worcester_4000_30kw"`). */
  modelId: string;
  /** Manufacturer / brand name (e.g. `"Worcester Bosch"`). */
  brand: string;
  /** Human-readable model name (e.g. `"Greenstar 4000 30kW"`). */
  modelName: string;
  /** Broad appliance category. */
  category: ApplianceCategory;
  /** Outer physical envelope in millimetres. */
  dimensions: ApplianceDimensionsV1;
  /** Minimum service clearances around the appliance in millimetres. */
  clearanceRules: ApplianceClearanceRulesV1;
  /**
   * Nominal heat output in kilowatts, if applicable.
   * Used by the sizing logic to cross-reference with heat-loss calculations.
   */
  outputKw?: number;
  /**
   * Free-text notes about this entry — e.g. installation constraints,
   * data-sheet reference, or date of last verification.
   */
  notes?: string;
}

// ─── Master registry ──────────────────────────────────────────────────────────

/**
 * The top-level hardware registry contract.
 *
 * A `MasterRegistryV1` is stored as `MasterRegistry.json` in the
 * `fixtures/` directory of this repo and serves as the baseline set of
 * manufacturer definitions consumed by both Atlas Scan (iOS) and Atlas
 * Mind (recommendation engine).
 *
 * The static file is the offline baseline; Mind app overrides are
 * transmitted via the `hardwarePatch` field of `VisitHandoffPackV1` and
 * are never written back to this file.
 */
export interface MasterRegistryV1 {
  /** Schema version discriminator — always `"1.0"`. */
  schemaVersion: HardwareRegistryV1SchemaVersion;
  /** ISO-8601 timestamp of the last update to this registry file. */
  updatedAt: string;
  /** Ordered list of appliance definitions. */
  appliances: ApplianceDefinitionV1[];
}

/**
 * A raw unknown input — used at the validation boundary before the payload
 * has been confirmed to match `MasterRegistryV1`.
 */
export type UnknownMasterRegistryV1 = Record<string, unknown>;
