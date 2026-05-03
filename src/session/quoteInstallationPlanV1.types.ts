/**
 * quoteInstallationPlanV1.types.ts
 *
 * QuoteInstallationPlanV1 — shared contract types for the Atlas Quote Planner.
 *
 * Describes install locations, current/proposed systems, route drawings, flue
 * routes, equivalent-length calculations, job classification, and generated
 * quote-scope items.
 *
 * Design principles:
 *   - Pure contracts only: no UI, engine, or recommendation logic.
 *   - All enums are string-literal unions, not TypeScript enums.
 *   - Optional fields may be omitted for partial draft plans.
 *   - Exports are consumed by Atlas-recommendation and Atlas-scans-ios.
 */

// ─── Evidence provenance ──────────────────────────────────────────────────────

/**
 * How a location, route, or measurement was established.
 */
export type QuoteEvidenceProvenanceV1 =
  | 'confirmed_from_scan'
  | 'drawn_on_plan'
  | 'imported_from_recommendation'
  | 'manual'
  | 'inferred'
  | 'assumed';

// ─── Location confidence ──────────────────────────────────────────────────────

/**
 * Confidence level attached to a location, route segment, or scope item.
 */
export type QuoteLocationConfidenceV1 =
  | 'confirmed'
  | 'measured'
  | 'estimated'
  | 'needs_verification'
  | 'assumed';

// ─── Coordinates ──────────────────────────────────────────────────────────────

/**
 * Multi-space coordinate representation.
 *
 * At most one space need be present; consumers should use whichever space
 * is available.  x/y are treated as the horizontal plane; z is vertical.
 */
export interface QuoteLocationCoordinatesV1 {
  /** Position within a floor-plan image, in pixels or metres. */
  floorPlan?: { x: number; y: number; unit: 'px' | 'm' };
  /** Position relative to a captured room origin. */
  roomPlan?: { roomId: string; x: number; y: number; z?: number; unit: 'm' };
  /** Absolute world-space position (e.g. from LiDAR). */
  world?: { x: number; y: number; z: number; unit: 'm' };
}

// ─── Appliance model reference ────────────────────────────────────────────────

/**
 * Lightweight reference to an appliance model.
 *
 * All fields are optional so that partial references can be stored while
 * the engineer is still populating data.
 */
export interface QuoteApplianceModelRefV1 {
  manufacturer?: string;
  brand?: string;
  range?: string;
  model?: string;
  /** Rated output in kilowatts. */
  outputKw?: number;
  /** How the reference was obtained. */
  source?: 'manual' | 'recommendation' | 'imported' | 'unknown';
}

// ─── System selection ─────────────────────────────────────────────────────────

/**
 * The type of heating/hot-water system.
 */
export type QuoteSystemTypeV1 =
  | 'combi'
  | 'system_boiler'
  | 'regular_open_vent'
  | 'storage_combi'
  | 'thermal_store'
  | 'heat_pump'
  | 'warm_air'
  | 'unknown';

/**
 * A current or proposed system selection, linking system type to physical
 * locations within the install plan.
 */
export interface QuoteSystemSelectionV1 {
  systemType: QuoteSystemTypeV1;
  /** References a QuoteInstallLocationV1.id for the heat source position. */
  heatSourceLocationId?: string;
  /** References a QuoteInstallLocationV1.id for the cylinder position. */
  cylinderLocationId?: string;
  /** References a QuoteInstallLocationV1.id for the thermal store position. */
  storeLocationId?: string;
  modelRef?: QuoteApplianceModelRefV1;
  notes?: string;
}

// ─── Job classification ───────────────────────────────────────────────────────

/**
 * Nature of the system change relative to what is currently installed.
 */
export type QuoteSystemChangeV1 =
  | 'like_for_like'
  | 'conversion'
  | 'stored_hot_water_upgrade'
  | 'low_carbon_conversion'
  | 'unknown';

/**
 * Whether the primary appliance is moving, and how far.
 */
export type QuoteLocationChangeV1 =
  | 'same_location'
  | 'nearby_move'
  | 'new_location'
  | 'unknown';

/**
 * Estimated installation complexity.
 */
export type QuoteComplexityBandV1 = 'low' | 'medium' | 'high' | 'needs_review';

/**
 * Job classification derived from system change, location change, and
 * route complexity.
 */
export interface QuoteJobClassificationV1 {
  systemChange: QuoteSystemChangeV1;
  locationChange: QuoteLocationChangeV1;
  complexityBand: QuoteComplexityBandV1;
  /** How this classification was produced. */
  derivedFrom: 'manual' | 'atlas_rule' | 'imported';
  /** Human-readable reasons explaining the complexity band. */
  reasons?: string[];
}

// ─── Install locations ────────────────────────────────────────────────────────

/**
 * Semantic role of a plotted location.
 */
export type QuoteInstallLocationKindV1 =
  | 'existing_boiler'
  | 'proposed_boiler'
  | 'existing_cylinder'
  | 'proposed_cylinder'
  | 'thermal_store'
  | 'heat_pump_outdoor_unit'
  | 'gas_meter'
  | 'stop_tap'
  | 'consumer_unit'
  | 'existing_flue_terminal'
  | 'proposed_flue_terminal'
  | 'internal_waste'
  | 'soil_stack'
  | 'gully'
  | 'soakaway_candidate'
  | 'airing_cupboard'
  | 'loft_hatch'
  | 'route_waypoint'
  | 'other';

/**
 * A single plotted location on the install plan.
 */
export interface QuoteInstallLocationV1 {
  /** Unique identifier (UUID string). */
  id: string;
  kind: QuoteInstallLocationKindV1;
  /** Human-readable label (e.g. "Kitchen boiler"). */
  label: string;
  roomId?: string;
  floorId?: string;
  coordinates?: QuoteLocationCoordinatesV1;
  provenance: QuoteEvidenceProvenanceV1;
  confidence: QuoteLocationConfidenceV1;
  /** Photo asset IDs linked to this location. */
  linkedPhotoIds?: string[];
  /** Object-pin IDs from the scan session linked to this location. */
  linkedObjectPinIds?: string[];
  notes?: string;
}

// ─── Route points ─────────────────────────────────────────────────────────────

/**
 * A single point on a drawn pipe/cable route.
 */
export interface QuoteRoutePointV1 {
  id?: string;
  coordinates: QuoteLocationCoordinatesV1;
  /** Semantic role of this point in the route. */
  kind?: 'start' | 'waypoint' | 'bend' | 'penetration' | 'end';
  /** Angle at a bend point, in degrees. */
  bendAngleDeg?: number;
  roomId?: string;
  notes?: string;
}

// ─── Route calculations ───────────────────────────────────────────────────────

/**
 * Derived length and complexity metrics for a route.
 */
export interface QuoteRouteCalculatedV1 {
  physicalLengthM?: number;
  bendCount?: number;
  wallPenetrations?: number;
  floorPenetrations?: number;
  /** Room IDs that the route passes through. */
  roomsCrossed?: string[];
  complexityBand?: QuoteComplexityBandV1;
  /** ISO-8601 timestamp of when this calculation was last run. */
  calculatedAt?: string;
  calculationMode?: 'measured' | 'estimated' | 'manual_override';
}

// ─── Install routes ───────────────────────────────────────────────────────────

/**
 * Type of pipe or cable run.
 */
export type QuoteRouteTypeV1 =
  | 'gas'
  | 'heating_flow'
  | 'heating_return'
  | 'hot_water'
  | 'cold_main'
  | 'condensate'
  | 'discharge'
  | 'controls'
  | 'electrical_supply'
  | 'other';

/**
 * Lifecycle status of a route.
 */
export type QuoteRouteStatusV1 =
  | 'existing'
  | 'proposed'
  | 'reused_existing'
  | 'redundant'
  | 'assumed';

/**
 * How the route will be physically installed.
 */
export type QuoteInstallMethodV1 =
  | 'surface'
  | 'boxed'
  | 'concealed'
  | 'underfloor'
  | 'loft'
  | 'external'
  | 'clipped'
  | 'unknown';

/**
 * A drawn pipe or cable route between two locations.
 */
export interface QuoteInstallRouteV1 {
  /** Unique identifier (UUID string). */
  id: string;
  routeType: QuoteRouteTypeV1;
  status: QuoteRouteStatusV1;
  /** References a QuoteInstallLocationV1.id at the start of this route. */
  startLocationId?: string;
  /** References a QuoteInstallLocationV1.id at the end of this route. */
  endLocationId?: string;
  /** Ordered list of points describing the drawn path. */
  points: QuoteRoutePointV1[];
  /** Internal pipe diameter in millimetres. */
  diameterMm?: number;
  installMethod?: QuoteInstallMethodV1;
  insulationRequired?: boolean;
  provenance: QuoteEvidenceProvenanceV1;
  confidence: QuoteLocationConfidenceV1;
  calculated?: QuoteRouteCalculatedV1;
  notes?: string;
}

// ─── Flue segments ────────────────────────────────────────────────────────────

/**
 * Type of individual flue segment.
 */
export type QuoteFlueSegmentKindV1 =
  | 'straight'
  | 'elbow_90'
  | 'elbow_45'
  | 'offset'
  | 'plume_kit'
  | 'terminal'
  | 'adaptor'
  | 'roof_flashing'
  | 'other';

/**
 * One physical or equivalent-length segment of a flue assembly.
 */
export interface QuoteFlueSegmentV1 {
  /** Unique identifier within the parent flue route. */
  id: string;
  kind: QuoteFlueSegmentKindV1;
  /** Actual measured or drawn length in metres. */
  physicalLengthM?: number;
  /** Equivalent length contribution in metres (used in allowance calculation). */
  equivalentLengthM?: number;
  /** Number of these segments in the assembly. */
  quantity?: number;
  notes?: string;
}

// ─── Flue calculation ─────────────────────────────────────────────────────────

/**
 * Outcome of the flue equivalent-length calculation.
 */
export type QuoteFlueCalculationResultV1 =
  | 'within_allowance'
  | 'exceeds_allowance'
  | 'needs_model_specific_check'
  | 'not_calculated';

/**
 * Equivalent-length calculation for a complete flue route assembly.
 */
export interface QuoteFlueCalculationV1 {
  physicalLengthM?: number;
  equivalentLengthM?: number;
  /** Maximum equivalent length permitted for this appliance/model. */
  maxEquivalentLengthM?: number;
  /** Remaining allowance after this assembly. */
  remainingAllowanceM?: number;
  result: QuoteFlueCalculationResultV1;
  calculationMode:
    | 'generic_estimate'
    | 'manufacturer_specific'
    | 'manual_override';
  /** Assumptions made during the calculation (e.g. default elbow penalties). */
  assumptions?: string[];
}

// ─── Flue routes ──────────────────────────────────────────────────────────────

/**
 * Configuration family of the flue run.
 */
export type QuoteFlueFamilyV1 =
  | 'horizontal_rear'
  | 'horizontal_side'
  | 'vertical'
  | 'vertical_with_offsets'
  | 'plume_management'
  | 'unknown';

/**
 * A complete flue route assembly, from boiler to terminal.
 */
export interface QuoteFlueRouteV1 {
  /** Unique identifier (UUID string). */
  id: string;
  /** References a QuoteInstallLocationV1.id for the appliance position. */
  boilerLocationId?: string;
  /** References a QuoteInstallLocationV1.id for the flue terminal position. */
  terminalLocationId?: string;
  flueFamily: QuoteFlueFamilyV1;
  applianceModelRef?: QuoteApplianceModelRefV1;
  segments: QuoteFlueSegmentV1[];
  calculation: QuoteFlueCalculationV1;
  /** Source of the equivalent-length rules applied. */
  ruleSource:
    | 'generic_estimate'
    | 'manufacturer_model_specific'
    | 'manual_override'
    | 'unknown';
  provenance: QuoteEvidenceProvenanceV1;
  confidence: QuoteLocationConfidenceV1;
  notes?: string;
}

// ─── Generated scope items ────────────────────────────────────────────────────

/**
 * Work category of a generated scope item.
 */
export type QuoteScopeCategoryV1 =
  | 'remove_existing'
  | 'fit_new'
  | 'route_pipework'
  | 'route_flue'
  | 'condensate'
  | 'gas'
  | 'hot_water'
  | 'heating'
  | 'electrical'
  | 'make_good'
  | 'commissioning'
  | 'verification'
  | 'other';

/**
 * How a scope item was produced.
 */
export type QuoteScopeItemSourceV1 =
  | 'manual'
  | 'generated_from_route'
  | 'generated_from_location'
  | 'generated_from_job_classification';

/**
 * A single line item in the generated install scope.
 */
export interface QuoteGeneratedScopeItemV1 {
  /** Unique identifier (UUID string). */
  id: string;
  category: QuoteScopeCategoryV1;
  /** Short human-readable label (e.g. "Supply and fit combi boiler"). */
  label: string;
  description?: string;
  source: QuoteScopeItemSourceV1;
  /** QuoteInstallLocationV1.id values that contributed to this item. */
  relatedLocationIds?: string[];
  /** QuoteInstallRouteV1.id values that contributed to this item. */
  relatedRouteIds?: string[];
  confidence: QuoteLocationConfidenceV1;
  /** Whether this item is included by default in the quote scope. */
  includedByDefault: boolean;
  needsVerification?: boolean;
}

// ─── Confidence summary ───────────────────────────────────────────────────────

/**
 * Aggregate counts of location/route confidence levels across the plan.
 *
 * Used by consumers to surface an overall completeness indicator.
 */
export interface QuotePlanConfidenceSummaryV1 {
  confirmedCount: number;
  measuredCount: number;
  estimatedCount: number;
  needsVerificationCount: number;
  assumedCount: number;
}

// ─── Scan planner evidence ────────────────────────────────────────────────────

/**
 * Candidate install-planner evidence captured by Atlas Scan.
 *
 * Atlas Scan may provide candidate install locations (e.g. boiler, gas meter,
 * flue terminal, internal waste, gully, soakaway candidate, cylinder location)
 * and associated route or flue evidence observed during the survey visit.
 *
 * This is capture evidence only — Atlas Mind must review and confirm these
 * candidates before they become canonical QuoteInstallationPlanV1 truth.
 * Scan is not responsible for recommendation or quote decisions.
 *
 * Candidate routes and flue routes may be measured, drawn, inferred, or
 * assumed; consumers should check the `provenance` and `confidence` fields
 * on each item accordingly.
 */
export interface QuotePlannerEvidenceCaptureV1 {
  /**
   * Candidate install locations observed by Scan.
   *
   * May include any QuoteInstallLocationKindV1 (e.g. existing_boiler,
   * gas_meter, proposed_flue_terminal, internal_waste, gully,
   * soakaway_candidate, proposed_cylinder).  All locations are candidates
   * until confirmed by Atlas Mind.
   */
  candidateLocations?: QuoteInstallLocationV1[];
  /**
   * Candidate pipe or cable routes observed or drawn by Scan.
   *
   * Routes may be measured, drawn on plan, inferred from scan geometry,
   * or assumed.  Check `provenance` and `confidence` on each route.
   */
  candidateRoutes?: QuoteInstallRouteV1[];
  /**
   * Candidate flue route assemblies observed or drawn by Scan.
   *
   * Flue routes may be measured, drawn, inferred, or assumed.  Check
   * `provenance` and `confidence` on each route.
   */
  candidateFlueRoutes?: QuoteFlueRouteV1[];
  /** Optional free-text notes from the engineer about install planner evidence. */
  notes?: string;
}

// ─── Root contract ────────────────────────────────────────────────────────────

/**
 * QuoteInstallationPlanV1 — top-level contract for a quote installation plan.
 *
 * Carries all location, route, flue, and scope data required to describe a
 * proposed heating system installation.  Intended as a pure data contract
 * with no derived or computed state.
 */
export interface QuoteInstallationPlanV1 {
  /** Unique identifier (UUID string). */
  id: string;
  /** Source scan session this plan was derived from. */
  sourceSessionId?: string;
  /** Source recommendation this plan was derived from. */
  sourceRecommendationId?: string;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
  /** ISO-8601 last-updated timestamp. */
  updatedAt: string;
  currentSystem: QuoteSystemSelectionV1;
  proposedSystem: QuoteSystemSelectionV1;
  jobClassification: QuoteJobClassificationV1;
  locations: QuoteInstallLocationV1[];
  routes: QuoteInstallRouteV1[];
  flueRoutes: QuoteFlueRouteV1[];
  generatedScope: QuoteGeneratedScopeItemV1[];
  confidenceSummary?: QuotePlanConfidenceSummaryV1;
  notes?: string;
}
