/**
 * derived.types.ts
 *
 * DerivedModelV1 — calculated outputs produced from the captured survey data.
 *
 * Design rule: derived values must never be mixed into capture truth.
 * Anything in DerivedModelV1 is produced from BuildingModelV1,
 * HouseholdModelV1, and CurrentSystemModelV1 by the calculation engine,
 * not captured directly by the engineer.
 *
 * The `engineInputSnapshot` field allows the recommendation engine to record
 * the exact inputs it used for a calculation run, enabling diff-based
 * recalculation and audit.
 */

import type { FieldValue } from './fieldValue';

// ─── Room heat-loss result ────────────────────────────────────────────────────

/**
 * Heat-loss result for a single room.
 */
export interface RoomHeatLossResultV1 {
  /** ID of the room (RoomV1.roomId). */
  roomId: string;
  /** Fabric heat loss in watts. */
  fabricLossW?: number;
  /** Ventilation heat loss in watts. */
  ventilationLossW?: number;
  /** Total peak heat loss in watts. */
  totalLossW?: number;
  /** Required emitter output in watts after applying the ΔTMCS correction. */
  requiredEmitterOutputW?: number;
}

// ─── Zone heat-loss result ────────────────────────────────────────────────────

/**
 * Heat-loss result for a thermal zone.
 */
export interface ZoneHeatLossResultV1 {
  /** ID of the zone (ThermalZoneV1.zoneId). */
  zoneId: string;
  /** Total peak heat loss in watts. */
  totalLossW?: number;
  /** Required flow temperature in °C for the MCS heat-loss methodology. */
  requiredFlowTempC?: number;
}

// ─── DerivedModelV1 ──────────────────────────────────────────────────────────

/**
 * Calculated outputs derived from the captured survey data.
 *
 * All numeric results are FieldValue<number> to carry confidence and
 * provenance (e.g. 'derived' or 'measured').
 *
 * `engineInputSnapshot` is a free record that the recommendation engine
 * populates with the exact key-value inputs used for a calculation run.
 * Downstream consumers should treat it as opaque.
 */
export interface DerivedModelV1 {
  /** Spatial aggregates derived from the building model. */
  spatial?: {
    /** Total treated floor area in m² (sum of all heated rooms). */
    totalFloorAreaM2?: number;
    /** Heated floor area in m² (rooms within the heated envelope). */
    heatedAreaM2?: number;
    /** Number of storeys above ground. */
    storeyCount?: number;
  };

  /** Heat-loss calculation outputs. */
  heatLoss?: {
    /** Peak whole-building heat loss in watts. */
    peakWatts?: FieldValue<number>;
    /** Per-room heat-loss breakdown. */
    roomResults?: RoomHeatLossResultV1[];
    /** Per-zone heat-loss breakdown. */
    zoneResults?: ZoneHeatLossResultV1[];
  };

  /** Hydraulic survey measurements. */
  hydraulics?: {
    /** Mains cold-water flow rate in litres per minute. */
    mainsFlowLpm?: FieldValue<number>;
    /** Dynamic mains pressure in bar. */
    dynamicPressureBar?: FieldValue<number>;
  };

  /**
   * Snapshot of the inputs consumed by the recommendation engine on its
   * last calculation run.  Enables diff-based recalculation and audit.
   * Keys and value types are engine-defined and should be treated as opaque
   * by other consumers.
   */
  engineInputSnapshot?: Record<string, unknown>;
}
