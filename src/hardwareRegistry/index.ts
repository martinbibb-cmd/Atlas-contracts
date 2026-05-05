/**
 * index.ts
 *
 * Public surface of the @atlas/contracts hardwareRegistry module.
 *
 * Exports all types, constants, and validators for HardwareRegistryV1 —
 * the shared appliance definition contract consumed by Atlas Scan (iOS AR)
 * and Atlas Mind (recommendation engine).
 */

// ─── Types and constants ──────────────────────────────────────────────────────

export type {
  HardwareRegistryV1SchemaVersion,
  ApplianceCategory,
  ApplianceDimensionsV1,
  ApplianceClearanceRulesV1,
  ApplianceDefinitionV1,
  MasterRegistryV1,
  UnknownMasterRegistryV1,
} from './applianceDefinitionV1.types';

export { HARDWARE_REGISTRY_V1_SCHEMA_VERSION } from './applianceDefinitionV1.types';

// ─── Validators ───────────────────────────────────────────────────────────────

export { validateApplianceDefinitionV1, validateMasterRegistryV1 } from './applianceDefinitionV1.schema';
export type {
  ApplianceDefinitionV1ValidationResult,
  ApplianceDefinitionV1ValidationSuccess,
  ApplianceDefinitionV1ValidationFailure,
  MasterRegistryV1ValidationResult,
  MasterRegistryV1ValidationSuccess,
  MasterRegistryV1ValidationFailure,
} from './applianceDefinitionV1.schema';
