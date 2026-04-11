/**
 * currentSystem.types.ts
 *
 * CurrentSystemModelV1 — the existing heating and hot-water system as surveyed.
 *
 * Gives Atlas Mind a proper place to receive "what system is there now" without
 * reusing UI-specific survey state from Atlas Scan.  All diagnostic fields are
 * provenance-aware FieldValue<T> wrappers.
 */

import type { FieldValue } from './fieldValue';

// ─── Heat source ─────────────────────────────────────────────────────────────

/**
 * Primary heat source details.
 */
export interface HeatSourceV1 {
  /** Fuel type. */
  fuel?: FieldValue<
    | 'natural_gas'
    | 'lpg'
    | 'oil'
    | 'electricity'
    | 'biomass'
    | 'solid_fuel'
    | 'district_heat'
    | 'unknown'
  >;
  /** Rated heat output in kW. */
  ratedOutputKw?: FieldValue<number>;
  /** Seasonal efficiency (SEDBUK / ErP percentage). */
  efficiencyPercent?: FieldValue<number>;
  /** Flue type. */
  flueType?: FieldValue<'balanced' | 'open_flue' | 'condensing' | 'unknown'>;
  /** Whether a flue gas heat recovery device is fitted. */
  flueGasHeatRecovery?: FieldValue<boolean>;
  /** Manufacturer name. */
  manufacturer?: FieldValue<string>;
  /** Model name or number. */
  model?: FieldValue<string>;
  /** Year of installation. */
  installYear?: FieldValue<number>;
}

// ─── Cylinder ─────────────────────────────────────────────────────────────────

/**
 * Hot-water cylinder details (for system, regular, and heat-pump systems).
 */
export interface CylinderV1 {
  /** Cylinder volume in litres. */
  volumeLitres?: FieldValue<number>;
  /** Whether the cylinder is insulated. */
  insulated?: FieldValue<boolean>;
  /** Insulation type (e.g. "factory foam", "jacket"). */
  insulationType?: FieldValue<string>;
  /** Whether an immersion heater is fitted. */
  immersionFitted?: FieldValue<boolean>;
  /** Whether a solar thermal coil is present. */
  solarCoilPresent?: FieldValue<boolean>;
  /** Cylinder location (room ID or description). */
  location?: FieldValue<string>;
}

// ─── Controls ─────────────────────────────────────────────────────────────────

/**
 * Heating and hot-water controls.
 */
export interface ControlsV1 {
  /** Programmer / timer type. */
  programmerType?: FieldValue<
    'basic_timer' | 'programmable' | 'smart' | 'none' | 'unknown'
  >;
  /** Room thermostat type. */
  roomThermostatType?: FieldValue<
    'mechanical' | 'digital' | 'smart' | 'none' | 'unknown'
  >;
  /** Whether a cylinder thermostat is fitted. */
  cylinderThermostat?: FieldValue<boolean>;
  /** Number of heating zones with independent time/temperature control. */
  zoneCount?: FieldValue<number>;
  /** Whether thermostatic radiator valves are fitted (at least partially). */
  trvsPresent?: FieldValue<boolean>;
  /** Smart-meter integration or data-sharing capability. */
  smartMeterIntegration?: FieldValue<boolean>;
}

// ─── Distribution ─────────────────────────────────────────────────────────────

/**
 * Heat distribution circuit details.
 */
export interface DistributionV1 {
  /** Primary pipe material. */
  pipeMaterial?: FieldValue<'copper' | 'plastic' | 'steel' | 'mixed' | 'unknown'>;
  /** Dominant pipe size in millimetres (outer diameter). */
  dominantPipeDiameterMm?: FieldValue<number>;
  /** Design (or measured) flow temperature in °C. */
  flowTempC?: FieldValue<number>;
  /** Design (or measured) return temperature in °C. */
  returnTempC?: FieldValue<number>;
  /** Whether the system has been balanced. */
  balanced?: FieldValue<boolean>;
  /** System volume in litres (used for inhibitor dosing). */
  systemVolumeLitres?: FieldValue<number>;
}

// ─── Condition ────────────────────────────────────────────────────────────────

/**
 * Overall condition assessment of the existing heating system.
 */
export interface ConditionModelV1 {
  /** Overall condition rating. */
  overall?: FieldValue<'good' | 'fair' | 'poor' | 'critical' | 'unknown'>;
  /** Whether the system currently heats adequately. */
  heatingAdequate?: FieldValue<boolean>;
  /** Whether the system has known faults. */
  knownFaults?: FieldValue<boolean>;
  /** Free-text condition observations. */
  notes?: string;
}

// ─── Water quality ────────────────────────────────────────────────────────────

/**
 * System water quality data captured during the survey.
 * Used to assess inhibitor dosing requirements and filter specification.
 */
export interface WaterQualityModelV1 {
  /** Magnetic filter presence. */
  magneticFilterPresent?: FieldValue<boolean>;
  /** Inhibitor presence and type. */
  inhibitorPresent?: FieldValue<boolean>;
  inhibitorType?: FieldValue<string>;
  /** pH of the system water (if tested). */
  ph?: FieldValue<number>;
  /** Total dissolved solids in ppm (if tested). */
  tdsPpm?: FieldValue<number>;
  /** Visual assessment of the system water. */
  visualAssessment?: FieldValue<'clean' | 'slightly_dirty' | 'very_dirty' | 'unknown'>;
}

// ─── Install constraint ───────────────────────────────────────────────────────

/**
 * An engineer-observed or customer-stated constraint that affects the
 * installation of a new or replacement heating system.
 */
export interface InstallConstraintV1 {
  /** Machine-readable constraint code. */
  code: string;
  /** Human-readable description of the constraint. */
  description: string;
  /**
   * Severity of the constraint on the installation.
   *
   * blocking   — prevents the proposed solution without a workaround
   * significant — requires a design change or additional cost
   * minor       — noted but unlikely to affect the main scope
   */
  severity: 'blocking' | 'significant' | 'minor';
}

// ─── CurrentSystemModelV1 ────────────────────────────────────────────────────

/**
 * The existing heating and hot-water system as surveyed.
 *
 * System family is the single most important field: it determines the
 * default calculation pathway, sizing rules, and retrofit options surfaced
 * by the recommendation engine.
 */
export interface CurrentSystemModelV1 {
  /**
   * High-level system family classification.
   * Provenance-aware: may be stated by the customer, confirmed by the engineer
   * on-site, or imported from an EPC record.
   */
  family: FieldValue<
    | 'combi'
    | 'system'
    | 'regular'
    | 'heat_pump'
    | 'hybrid'
    | 'unknown'
  >;
  /**
   * Domestic hot-water provision type.
   * Relevant for system, regular, and heat-pump families.
   */
  dhwType?: FieldValue<
    | 'combi'
    | 'vented_cylinder'
    | 'unvented_cylinder'
    | 'thermal_store'
    | 'mixergy'
    | 'unknown'
  >;
  /** Primary heat source. */
  heatSource?: HeatSourceV1;
  /** Hot-water cylinder (when present). */
  cylinder?: CylinderV1;
  /** Heating and DHW controls. */
  controls?: ControlsV1;
  /** Heat distribution circuit. */
  distribution?: DistributionV1;
  /** Overall system condition assessment. */
  condition?: ConditionModelV1;
  /** System water quality data. */
  waterQuality?: WaterQualityModelV1;
  /** Installation constraints observed or stated during the survey. */
  constraints?: InstallConstraintV1[];
}
