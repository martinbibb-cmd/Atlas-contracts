/**
 * hardwarePatchV1.types.ts
 *
 * HardwarePatchV1 — a custom appliance override transmitted from Atlas Mind
 * to Atlas Scan at the start of a visit via VisitHandoffPackV1.
 *
 * A patch carries the same physical data as an ApplianceDefinitionV1 but is
 * scoped to a single visit.  It takes precedence over the baseline registry
 * entry (if any) for the duration of that visit, enabling field engineers to
 * use site-specific dimensions without modifying the shared registry.
 *
 * Design principles:
 *   - All linear dimensions are in millimetres (mm).
 *   - `modelId` is the cross-repo foreign key that links the patch to a
 *     registry entry.  If the modelId matches a baseline entry the patch
 *     overrides it; if not, the patch is treated as a fully custom appliance.
 *   - `source` distinguishes engineer-authored custom entries from patches
 *     that override a known baseline model.
 */

import type {
  ApplianceCategory,
  ApplianceDimensionsV1,
  ApplianceClearanceRulesV1,
} from './applianceDefinitionV1.types';
import { HARDWARE_REGISTRY_V1_SCHEMA_VERSION } from './applianceDefinitionV1.types';

// ─── Schema version ───────────────────────────────────────────────────────────

export const HARDWARE_PATCH_V1_SCHEMA_VERSION = '1.0' as const;
export type HardwarePatchV1SchemaVersion = typeof HARDWARE_PATCH_V1_SCHEMA_VERSION;

// ─── Patch source ─────────────────────────────────────────────────────────────

/**
 * How this patch was created.
 *
 * - `custom`   — engineer entered entirely custom dimensions not found in the
 *                baseline registry (e.g. an uncommon or legacy model).
 * - `override` — engineer has adjusted the dimensions of a known baseline
 *                registry entry to reflect site-specific measurements.
 */
export type HardwarePatchSourceV1 = 'custom' | 'override';

// ─── HardwarePatchV1 ──────────────────────────────────────────────────────────

/**
 * A visit-scoped appliance specification authored by an engineer in Atlas Mind.
 *
 * Stored in the visit's `working_payload_json` and transmitted to Atlas Scan
 * inside `VisitHandoffPackV1.hardwarePatches`.  The Scan app resolves model
 * lookups by checking this list before falling back to the baseline registry.
 *
 * `schemaVersion` is always `"1.0"` for `HardwarePatchV1` entries.
 */
export interface HardwarePatchV1 {
  /** Schema version discriminator — always `"1.0"`. */
  schemaVersion: typeof HARDWARE_REGISTRY_V1_SCHEMA_VERSION;
  /**
   * Stable cross-repo identifier for the appliance.
   *
   * For `override` patches this should match an existing `modelId` in the
   * baseline registry.  For `custom` patches it must be unique within the
   * visit and should follow slug conventions (e.g. `"custom_unknown_boiler"`).
   */
  modelId: string;
  /** Manufacturer / brand name. */
  brand: string;
  /** Human-readable model name. */
  modelName: string;
  /** Broad appliance category. */
  category: ApplianceCategory;
  /** Physical outer envelope dimensions in millimetres. */
  dimensions: ApplianceDimensionsV1;
  /** Minimum service clearances in millimetres. */
  clearanceRules: ApplianceClearanceRulesV1;
  /** Nominal heat output in kilowatts, if applicable. */
  outputKw?: number;
  /** How this patch was created. */
  source: HardwarePatchSourceV1;
  /** Free-text notes (e.g. site measurement context, date of field check). */
  notes?: string;
}
