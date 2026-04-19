/**
 * atlasSpatialModel.types.ts
 *
 * AtlasSpatialModelV1 — the editable semantic model used by Atlas Mind.
 *
 * Design principles:
 *   - This is the canonical editable truth: not the scene graph, not the
 *     engine output.
 *   - All geometry is primitive (points, polylines, polygons, boxes).  No
 *     USDZ nodes, RealityKit anchors, SceneKit geometry, Three.js objects,
 *     or arbitrary mesh blobs.
 *   - Every entity has status (existing/proposed/removed) and certainty
 *     (measured/observed/inferred/assumed) so that pipe runs and other
 *     partially-known features can be recorded honestly.
 *   - Evidence markers link entities to raw capture artefacts.
 *   - Provenance entries form an immutable audit trail.
 */

import type { AtlasGeometry, LocalCoordinateSystem } from './atlasGeometry.types';
import type { AtlasEvidenceMarkerV1 } from './atlasEvidence.types';
import type { AtlasProvenanceEntryV1 } from './atlasProvenance.types';
import type { AtlasAnchor, AtlasVerticalRelation, AtlasInferredRoute } from './atlasSpatialAlignment.types';

// ─── Entity base ──────────────────────────────────────────────────────────────

/**
 * Base fields shared by every editable spatial entity.
 *
 * `status`    — whether this entity exists, is proposed, or has been removed
 * `certainty` — how confident the model is in this entity's data
 */
export interface AtlasEntityBaseV1 {
  /** Unique identifier (UUID string). */
  id: string;
  /** Discriminant kind for the entity (e.g. 'room', 'emitter'). */
  kind: string;
  /** Optional human-readable label. */
  label?: string;
  /** Geometry describing the entity's spatial extent or position. */
  geometry: AtlasGeometry;
  /**
   * Semantic role of this entity within the building.
   * Free-text; constrained by conventions per entity type
   * (e.g. 'kitchen', 'panel_radiator', 'heating_flow').
   */
  semanticRole: string;
  /** Lifecycle status of this entity. */
  status: 'existing' | 'proposed' | 'removed';
  /** Confidence in the accuracy of this entity's data. */
  certainty: 'measured' | 'observed' | 'inferred' | 'assumed';
  /** IDs of AtlasEvidenceMarkerV1 entries that support this entity. */
  evidenceIds: string[];
  /** ID of the capture session this entity was derived from, if any. */
  sourceSessionId?: string;
  /** ISO-8601 timestamp of when this entity was created. */
  createdAt: string;
  /** ISO-8601 timestamp of when this entity was last updated. */
  updatedAt: string;
}

// ─── Level ────────────────────────────────────────────────────────────────────

/**
 * A storey of the building.
 *
 * `index` follows the UK convention: 0 = ground floor, 1 = first floor,
 * -1 = basement.
 */
export interface AtlasLevelV1 extends AtlasEntityBaseV1 {
  kind: 'level';
  /** Storey index: 0 = ground, 1 = first, -1 = basement. */
  index: number;
  /** Floor-to-ceiling height in metres (if known). */
  heightM?: number;
}

// ─── Room ─────────────────────────────────────────────────────────────────────

/**
 * A room in the building.
 *
 * The room is the canonical spatial unit: it has a floor polygon and ceiling
 * height, lives on a specific level, and is the primary anchor for emitters
 * and other services entities.
 */
export interface AtlasRoomV1 extends AtlasEntityBaseV1 {
  kind: 'room';
  /** ID of the level this room is on. */
  levelId: string;
  /** Calculated floor area in m² (derived from geometry; not stored here). */
  /** Whether this room is within the heated envelope. */
  heated?: boolean;
}

// ─── Boundary ─────────────────────────────────────────────────────────────────

/**
 * A building envelope element (external wall, roof, ground floor, etc.).
 */
export interface AtlasBoundaryV1 extends AtlasEntityBaseV1 {
  kind: 'boundary';
  /** Broad classification of the boundary element. */
  type:
    | 'external_wall'
    | 'roof'
    | 'ground_floor'
    | 'party_wall'
    | 'internal_wall'
    | 'ceiling'
    | 'unknown';
  /** IDs of rooms on the inside of this boundary element. */
  roomIds: string[];
  /** U-value in W/m²K (if known). */
  uValueWm2K?: number;
  /** Construction description (e.g. "Solid brick, 230 mm"). */
  construction?: string;
  /** Whether cavity fill has been confirmed. */
  cavityFilled?: boolean;
}

// ─── Opening ──────────────────────────────────────────────────────────────────

/**
 * An opening (door, window, or rooflight) in a boundary element.
 */
export interface AtlasOpeningV1 extends AtlasEntityBaseV1 {
  kind: 'opening';
  /** Opening type. */
  type: 'window' | 'door' | 'rooflight' | 'unknown';
  /** ID of the boundary element this opening sits in. */
  boundaryId: string;
  /** Width in metres (if known). */
  widthM?: number;
  /** Height in metres (if known). */
  heightM?: number;
  /** U-value in W/m²K (if known). */
  uValueWm2K?: number;
  /** Glazing description (e.g. "Double, low-E, argon-filled"). */
  glazingDescription?: string;
}

// ─── Thermal zone ─────────────────────────────────────────────────────────────

/**
 * A thermal zone used for heat-loss calculation.
 *
 * A zone may span multiple rooms.  It is the unit of calculation in the
 * heat-loss engine.  Zones are semantic groupings — not geometry in their
 * own right.
 */
export interface AtlasThermalZoneV1 extends AtlasEntityBaseV1 {
  kind: 'thermal_zone';
  /** IDs of rooms that make up this zone. */
  roomIds: string[];
  /** Design indoor temperature in °C (if known). */
  designTempC?: number;
  /** Whether this zone is part of the heated envelope. */
  heated?: boolean;
}

// ─── Emitter ──────────────────────────────────────────────────────────────────

/**
 * A central-heating emitter (radiator, towel rail, underfloor-heating loop).
 */
export interface AtlasEmitterV1 extends AtlasEntityBaseV1 {
  kind: 'emitter';
  /** Emitter type. */
  type:
    | 'panel_radiator'
    | 'column_radiator'
    | 'towel_rail'
    | 'ufh_loop'
    | 'fan_coil'
    | 'unknown';
  /** ID of the room this emitter is in. */
  roomId: string;
  /** Manufacturer / model description (if known). */
  description?: string;
  /** Rated output in watts at standard test conditions (ΔT50). */
  ratedOutputW?: number;
  /** Whether a thermostatic radiator valve (TRV) is fitted. */
  trvFitted?: boolean;
}

// ─── Heat source ──────────────────────────────────────────────────────────────

/**
 * A heat-generating plant item placed in the building.
 */
export interface AtlasHeatSourcePlacementV1 extends AtlasEntityBaseV1 {
  kind: 'heat_source';
  /** Category of heat source. */
  type: 'boiler' | 'heat_pump' | 'district_heat' | 'electric' | 'other';
  /** Room ID where this heat source is located. */
  roomId?: string;
  /** Manufacturer name (if known). */
  manufacturer?: string;
  /** Model name or number (if known). */
  model?: string;
  /** Installation year (if known). */
  installYear?: number;
  /** Operational condition rating. */
  condition?: 'good' | 'fair' | 'poor' | 'unknown';
}

// ─── Hot water store ──────────────────────────────────────────────────────────

/**
 * A hot-water storage vessel (cylinder, thermal store, etc.).
 */
export interface AtlasStorePlacementV1 extends AtlasEntityBaseV1 {
  kind: 'hot_water_store';
  /** Store type. */
  type: 'vented_cylinder' | 'unvented_cylinder' | 'thermal_store' | 'combi_store' | 'other';
  /** Room ID where this vessel is located. */
  roomId?: string;
  /** Manufacturer name (if known). */
  manufacturer?: string;
  /** Model name or number (if known). */
  model?: string;
  /** Nominal capacity in litres (if known). */
  capacityL?: number;
}

// ─── Pipe run ─────────────────────────────────────────────────────────────────

/**
 * AtlasPipeRunV1 — a traced or inferred pipe route.
 *
 * `routeStyle` distinguishes honest observations from estimates:
 *   'solid'  — the pipe is visible and its route has been measured/observed
 *   'dashed' — the route is inferred (hidden in floor/wall/ceiling) or proposed
 *
 * This allows Mind to show a "dashed" inferred route without claiming it as
 * measured fact.
 */
export interface AtlasPipeRunV1 extends AtlasEntityBaseV1 {
  kind: 'pipe_run';
  /** Medium carried by this pipe. */
  medium:
    | 'heating_flow'
    | 'heating_return'
    | 'dhw'
    | 'cold_main'
    | 'gas'
    | 'condensate'
    | 'unknown';
  /** Nominal outside diameter in millimetres. */
  nominalDiameterMm?: 10 | 12 | 15 | 22 | 28 | 35;
  /**
   * Whether the route is visually confirmed (solid) or inferred/proposed (dashed).
   *
   * 'solid'  — visible / measured route
   * 'dashed' — inferred hidden route or proposed new route
   */
  routeStyle: 'solid' | 'dashed';
  /** Whether the pipe is insulated. */
  insulated?: boolean;
}

// ─── Controls ─────────────────────────────────────────────────────────────────

/**
 * A heating or hot-water control placed in the building.
 */
export interface AtlasControlPlacementV1 extends AtlasEntityBaseV1 {
  kind: 'control';
  /** Control type. */
  type:
    | 'room_thermostat'
    | 'programmer'
    | 'smart_controller'
    | 'weather_comp'
    | 'zone_valve'
    | 'trv'
    | 'other';
  /** Room ID where this control is located. */
  roomId?: string;
  /** Manufacturer / model description (if known). */
  description?: string;
}

// ─── Generic asset ────────────────────────────────────────────────────────────

/**
 * A generic building asset not covered by the specific entity types above.
 */
export interface AtlasAssetPlacementV1 extends AtlasEntityBaseV1 {
  kind: 'asset';
  /** Free-text category for the asset (e.g. "loft_hatch", "consumer_unit"). */
  assetType: string;
  /** Room ID where this asset is located. */
  roomId?: string;
  /** Optional notes. */
  notes?: string;
}

// ─── Spatial entity union ─────────────────────────────────────────────────────

/**
 * Discriminated union of all spatial entity types.
 *
 * Used in patch operations to refer to any entity generically.
 */
export type AtlasSpatialEntityV1 =
  | AtlasLevelV1
  | AtlasRoomV1
  | AtlasBoundaryV1
  | AtlasOpeningV1
  | AtlasThermalZoneV1
  | AtlasEmitterV1
  | AtlasHeatSourcePlacementV1
  | AtlasStorePlacementV1
  | AtlasPipeRunV1
  | AtlasControlPlacementV1
  | AtlasAssetPlacementV1;

// ─── AtlasSpatialModelV1 ─────────────────────────────────────────────────────

/**
 * AtlasSpatialModelV1 — the editable semantic spatial model for a property.
 *
 * This is the canonical editable truth used by Atlas Mind.  It is:
 *   - NOT the scene graph (no USDZ, RealityKit, Three.js)
 *   - NOT the engine output (no heat-loss results, no recommendation scores)
 *   - NOT the capture payload (SessionCaptureV2 is the raw capture)
 *
 * The model is versioned via an integer `revision` field.  Each patch
 * increments the revision.  The `provenance` array records every creation
 * and modification event for full auditability.
 */
export interface AtlasSpatialModelV1 {
  /** Contract discriminant — always 'atlas.spatial.v1'. */
  schemaVersion: 'atlas.spatial.v1';
  /** Unique identifier for this model (UUID string). */
  modelId: string;
  /** ID of the property this model describes. */
  propertyId: string;
  /** ID of the capture session this model was initially derived from. */
  sourceSessionId?: string;
  /** The coordinate system for all geometry in this model. */
  coordinateSystem: LocalCoordinateSystem;
  /** Building storeys. */
  levels: AtlasLevelV1[];
  /** Spatial rooms. */
  rooms: AtlasRoomV1[];
  /** Envelope boundary elements. */
  boundaries: AtlasBoundaryV1[];
  /** Openings (windows, doors, rooflights). */
  openings: AtlasOpeningV1[];
  /** Thermal zones for heat-loss calculation. */
  thermalZones: AtlasThermalZoneV1[];
  /** Central-heating emitters. */
  emitters: AtlasEmitterV1[];
  /** Heat-generating plant items. */
  heatSources: AtlasHeatSourcePlacementV1[];
  /** Hot-water storage vessels. */
  hotWaterStores: AtlasStorePlacementV1[];
  /** Traced or inferred pipe routes. */
  pipeRuns: AtlasPipeRunV1[];
  /** Heating / hot-water controls. */
  controls: AtlasControlPlacementV1[];
  /** Generic building assets. */
  assets: AtlasAssetPlacementV1[];
  /** Spatial evidence markers linking entities to capture artefacts. */
  evidenceMarkers: AtlasEvidenceMarkerV1[];
  /** Immutable audit trail of model creation and modifications. */
  provenance: AtlasProvenanceEntryV1[];
  /**
   * Named, positioned anchor objects for Spatial Alignment.
   *
   * Anchors record absolute world positions for key building objects (boiler,
   * cylinder, consumer unit, etc.) to support alignment view calculations.
   * Optional — models created before this feature was added will omit this
   * field and remain fully valid.
   */
  anchors?: AtlasAnchor[];
  /**
   * Approximate geographic origin of the building for optional georeferencing.
   *
   * Both `lat` and `lng` are optional; the object itself is optional.  Used
   * only when GPS alignment is available during capture.
   */
  buildingOrigin?: {
    lat?: number;
    lng?: number;
  };
  /**
   * Pre-computed vertical relationships between anchors.
   *
   * Populated by the Spatial Alignment Engine after anchors are placed.
   * Optional — absent when no anchors have been placed yet.
   */
  verticalRelations?: AtlasVerticalRelation[];
  /**
   * Inferred routing paths (pipes, cables, flues) derived from anchor positions.
   *
   * All entries have `confidence: 'inferred'` and must carry a `reason` string.
   * Optional — absent when no routing has been inferred yet.
   */
  inferredRoutes?: AtlasInferredRoute[];
  /** Monotonically increasing revision counter. Starts at 1. */
  revision: number;
  /** ISO-8601 timestamp of when this model was first created. */
  createdAt: string;
  /** ISO-8601 timestamp of the most recent modification. */
  updatedAt: string;
}
