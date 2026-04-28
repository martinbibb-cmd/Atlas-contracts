/**
 * index.ts
 *
 * Public surface of the @atlas/contracts atlasProperty module.
 *
 * Re-exports all AtlasPropertyV1 types needed by consumers.
 */

// ─── Field value / provenance ─────────────────────────────────────────────────

export type { FieldValue, ProvenanceSource, ConfidenceBand } from './fieldValue';

// ─── Unit wrappers ────────────────────────────────────────────────────────────

export type { Watts, Kilowatts } from './units';
export { toWatts, toKilowatts, wattsToKilowatts, kilowattsToWatts } from './units';

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
  WhyNotReasonV1,
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

// ─── Visit lifecycle ──────────────────────────────────────────────────────────

export type {
  AtlasVisitStatus,
  AtlasVisitCompletion,
  AtlasVisitReadiness,
} from './visitLifecycle.types';

export { ATLAS_VISIT_STATUS_TRANSITIONS } from './visitLifecycle.types';

// ─── Field survey ─────────────────────────────────────────────────────────────

export type {
  AtlasRoomLiteV1,
  AtlasPhotoEvidenceV1,
  AtlasKeyObjectType,
  AtlasKeyObjectV1,
  AtlasVisitNotesV1,
  AtlasSystemPresenceV1,
  AtlasFieldSurveyV1,
} from './fieldSurvey.types';

export { deriveVisitReadinessFromFieldSurvey } from './fieldSurvey.helpers';

// ─── Planning overlay ─────────────────────────────────────────────────────────

export type {
  AtlasEmitterType,
  AtlasProposedEmitterV1,
  AtlasRoomPlanNoteV1,
  AtlasRouteMarkupV1,
  AtlasAccessNoteV1,
  AtlasPlanningOverlayV1,
  AtlasPlanningReadiness,
} from './planningOverlay.types';

export { derivePlanningReadiness } from './planningOverlay.types';
