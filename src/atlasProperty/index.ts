/**
 * index.ts
 *
 * Public surface of the @atlas/contracts atlasProperty module.
 *
 * Re-exports all AtlasPropertyV1 types needed by consumers.
 */

// ─── Field value / provenance ─────────────────────────────────────────────────

export type { FieldValue, ProvenanceSource, ConfidenceBand } from './fieldValue';

// ─── Property identity ────────────────────────────────────────────────────────

export type { PropertyIdentityV1 } from './propertyIdentity.types';

// ─── Capture context ──────────────────────────────────────────────────────────

export type { CaptureContextV1 } from './captureContext.types';

// ─── Building model ───────────────────────────────────────────────────────────

export type {
  FloorV1,
  RoomV1,
  ThermalZoneV1,
  BoundaryV1,
  OpeningV1,
  EmitterV1,
  SystemComponentV1,
  PipeRouteV1,
  ServicesModelV1,
  BuildingModelV1,
} from './building.types';

// ─── Household model ──────────────────────────────────────────────────────────

export type {
  HotWaterUsageModelV1,
  HeatingPatternModelV1,
  PreferencesModelV1,
  CustomerConstraintV1,
  HouseholdModelV1,
} from './household.types';

// ─── Current system model ─────────────────────────────────────────────────────

export type {
  HeatSourceV1,
  CylinderV1,
  ControlsV1,
  DistributionV1,
  ConditionModelV1,
  WaterQualityModelV1,
  InstallConstraintV1,
  CurrentSystemModelV1,
} from './currentSystem.types';

// ─── Evidence model ───────────────────────────────────────────────────────────

export type {
  EvidenceLinkV1,
  PhotoEvidenceV1,
  VoiceNoteEvidenceV1,
  TextNoteEvidenceV1,
  QAFlagV1,
  TimelineEventV1,
  Vec3,
  SpatialEvidence3D,
  ExternalClearanceSceneV1,
  EvidenceModelV1,
} from './evidence.types';

// ─── Derived model ────────────────────────────────────────────────────────────

export type {
  RoomHeatLossResultV1,
  ZoneHeatLossResultV1,
  DerivedModelV1,
} from './derived.types';

// ─── Recommendations workspace ────────────────────────────────────────────────

export type {
  RecommendationItemSummaryV1,
  RecommendationWorkspaceV1,
} from './recommendations.types';

// ─── Root contract ────────────────────────────────────────────────────────────

export type {
  AtlasSourceApp,
  AtlasPropertyStatus,
  AtlasPropertyV1,
  UnknownAtlasProperty,
} from './atlasProperty.types';
