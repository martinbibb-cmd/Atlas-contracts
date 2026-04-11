/**
 * building.types.ts
 *
 * BuildingModelV1 — the physical truth layer of an AtlasPropertyV1.
 *
 * Hierarchy:
 *   BuildingModelV1
 *     └─ floors[]          — storey metadata
 *     └─ rooms[]           — spatial truth (labelled floor polygons)
 *     └─ zones[]           — thermal / heat-loss zones (may span rooms)
 *     └─ boundaries[]      — envelope elements (external walls, roof, ground floor)
 *     └─ openings[]        — doors, windows, and rooflights
 *     └─ emitters[]        — central-heating emitters (radiators, UFH loops)
 *     └─ systemComponents[]— physical plant (boiler, cylinder, manifold, meter, flue)
 *     └─ pipeRoutes[]      — optional pipe-routing data
 *     └─ services?         — utility / services model
 *
 * Design rules:
 *   - rooms are spatial truth; zones are thermal truth
 *   - emitters are CH emitters only; other plant lives in systemComponents
 *   - all IDs are string (UUID recommended)
 */

import type { FieldValue } from './fieldValue';

// ─── Floor ────────────────────────────────────────────────────────────────────

/**
 * A single storey of the building.
 *
 * `index` follows the UK convention: 0 = ground floor, 1 = first floor,
 * -1 = basement.
 */
export interface FloorV1 {
  /** Unique identifier for this floor (UUID string). */
  floorId: string;
  /** Storey index: 0 = ground, 1 = first, -1 = basement, etc. */
  index: number;
  /** Human-readable label (e.g. "Ground Floor", "Loft"). */
  label: string;
  /** Floor-to-ceiling height in metres, if known. */
  heightM?: FieldValue<number>;
}

// ─── Room ─────────────────────────────────────────────────────────────────────

/**
 * Spatial room within the building.
 *
 * A room is the canonical spatial unit: it has a floor polygon and ceiling
 * height and lives on a specific floor.  Thermal analysis may aggregate rooms
 * into zones; CH design attaches emitters to rooms.
 */
export interface RoomV1 {
  /** Unique identifier for this room (UUID string). */
  roomId: string;
  /** ID of the floor this room sits on. */
  floorId: string;
  /** Human-readable label (e.g. "Kitchen", "Master Bedroom"). */
  label: string;
  /** Calculated floor area in m². */
  areaM2?: FieldValue<number>;
  /** Ceiling height in metres. */
  heightM?: FieldValue<number>;
  /** Whether this room is in the heated envelope. */
  heated?: boolean;
  /**
   * Optional reference to the scan bundle room ID this room was
   * derived from (links back to ScanBundleV1 / ScanRoom.id).
   */
  scanRoomRef?: string;
}

// ─── Thermal zone ─────────────────────────────────────────────────────────────

/**
 * A thermal zone used for heat-loss and SAP calculation.
 *
 * A zone may span multiple rooms (e.g. open-plan kitchen/diner) or represent
 * a single room.  It is the unit of calculation in the heat-loss model.
 */
export interface ThermalZoneV1 {
  /** Unique identifier for this zone (UUID string). */
  zoneId: string;
  /** Human-readable zone label. */
  label: string;
  /** Room IDs that make up this zone. */
  roomIds: string[];
  /** Design indoor temperature in °C. */
  designTempC?: FieldValue<number>;
  /** Whether this zone is part of the heated envelope. */
  heated?: boolean;
}

// ─── Boundary element ─────────────────────────────────────────────────────────

/**
 * A building envelope element (external wall, roof plane, ground floor slab,
 * party wall, etc.) that contributes to heat loss.
 */
export interface BoundaryV1 {
  /** Unique identifier (UUID string). */
  boundaryId: string;
  /** Element type. */
  type:
    | 'external_wall'
    | 'roof'
    | 'ground_floor'
    | 'party_wall'
    | 'internal_wall'
    | 'ceiling'
    | 'unknown';
  /** Room IDs on the inside of this boundary element. */
  roomIds: string[];
  /** Gross area in m² (before subtracting openings). */
  grossAreaM2?: FieldValue<number>;
  /** Construction description (e.g. "Solid brick, 230mm"). */
  construction?: FieldValue<string>;
  /** U-value in W/m²K. */
  uValueWm2K?: FieldValue<number>;
  /** Whether cavity fill has been confirmed. */
  cavityFilled?: FieldValue<boolean>;
}

// ─── Opening ──────────────────────────────────────────────────────────────────

/**
 * An opening (door, window, or rooflight) in a boundary element.
 */
export interface OpeningV1 {
  /** Unique identifier (UUID string). */
  openingId: string;
  /** ID of the boundary element this opening sits in. */
  boundaryId: string;
  /** Opening type. */
  type: 'window' | 'door' | 'rooflight' | 'unknown';
  /** Width in metres. */
  widthM?: FieldValue<number>;
  /** Height in metres. */
  heightM?: FieldValue<number>;
  /** Area in m² (may be directly measured rather than derived from w × h). */
  areaM2?: FieldValue<number>;
  /** U-value of the glazing / door in W/m²K. */
  uValueWm2K?: FieldValue<number>;
  /** Glazing description (e.g. "Double, low-E, argon-filled"). */
  glazingDescription?: FieldValue<string>;
  /**
   * Optional reference to the scan bundle opening ID
   * (links back to ScanOpening.id).
   */
  scanOpeningRef?: string;
}

// ─── Emitter ──────────────────────────────────────────────────────────────────

/**
 * A central-heating emitter (radiator, towel rail, or underfloor-heating loop).
 */
export interface EmitterV1 {
  /** Unique identifier (UUID string). */
  emitterId: string;
  /** Room this emitter serves. */
  roomId: string;
  /** Emitter type. */
  type:
    | 'panel_radiator'
    | 'column_radiator'
    | 'towel_rail'
    | 'ufh_loop'
    | 'fan_coil'
    | 'unknown';
  /** Manufacturer/model description. */
  description?: FieldValue<string>;
  /** Rated output in watts at standard test conditions (ΔT50). */
  ratedOutputW?: FieldValue<number>;
  /**
   * Actual output in watts adjusted for the design flow/return temperatures.
   * Populated by the heat-loss calculation.
   */
  correctedOutputW?: FieldValue<number>;
  /** Whether a thermostatic radiator valve (TRV) is fitted. */
  trvFitted?: FieldValue<boolean>;
}

// ─── System component ─────────────────────────────────────────────────────────

/**
 * A named physical plant item (boiler, cylinder, manifold, meter, flue, etc.).
 *
 * Complements CurrentSystemModelV1 with location-specific data so that the
 * same boiler can be spatially placed in the building model.
 */
export interface SystemComponentV1 {
  /** Unique identifier (UUID string). */
  componentId: string;
  /** Broad category of this component. */
  category:
    | 'boiler'
    | 'heat_pump'
    | 'cylinder'
    | 'manifold'
    | 'pump'
    | 'meter'
    | 'flue'
    | 'controls'
    | 'other';
  /** Human-readable label (e.g. "Worcester Bosch 30i"). */
  label?: string;
  /** Room ID where this component is located, if spatially placed. */
  roomId?: string;
  /** Manufacturer name. */
  manufacturer?: FieldValue<string>;
  /** Model number or name. */
  model?: FieldValue<string>;
  /** Installation year (4-digit year). */
  installYear?: FieldValue<number>;
  /** Operational condition rating. */
  condition?: FieldValue<'good' | 'fair' | 'poor' | 'unknown'>;
  /** Free-text notes about this component. */
  notes?: string;
}

// ─── Pipe route ───────────────────────────────────────────────────────────────

/**
 * A pipe or duct route traced during the survey.
 *
 * Optional; populated when the engineer traces distribution routes to support
 * hydraulic calculations and the pre-install view.
 */
export interface PipeRouteV1 {
  /** Unique identifier (UUID string). */
  routeId: string;
  /** Pipe medium. */
  medium: 'heating_flow' | 'heating_return' | 'dhw_hot' | 'dhw_cold' | 'unknown';
  /** Outer diameter in millimetres. */
  diameterMm?: FieldValue<number>;
  /** Pipe material. */
  material?: FieldValue<'copper' | 'plastic' | 'steel' | 'unknown'>;
  /** Room IDs through which this route passes. */
  roomIds?: string[];
  /** Approximate total length in metres. */
  lengthM?: FieldValue<number>;
  /** Whether the pipe is insulated. */
  insulated?: FieldValue<boolean>;
}

// ─── Services ─────────────────────────────────────────────────────────────────

/**
 * Utility and services model for the property.
 */
export interface ServicesModelV1 {
  /** Gas supply details. */
  gas?: {
    /** Whether a gas supply is present. */
    present: FieldValue<boolean>;
    /** Whether the meter is accessible. */
    meterAccessible?: FieldValue<boolean>;
    /** Meter location description. */
    meterLocation?: FieldValue<string>;
  };
  /** Electricity supply details. */
  electricity?: {
    /** Single or three-phase supply. */
    phase?: FieldValue<'single' | 'three' | 'unknown'>;
    /** Fuse / main fuse amperage. */
    mainFuseAmps?: FieldValue<number>;
    /** Whether the consumer unit has spare ways for new circuits. */
    consumerUnitSpareWays?: FieldValue<boolean>;
  };
  /** Water supply details. */
  water?: {
    /** Whether the property has mains-pressure water supply. */
    mainsPressure?: FieldValue<boolean>;
    /** Stop-cock location description. */
    stopCockLocation?: FieldValue<string>;
  };
}

// ─── BuildingModelV1 ─────────────────────────────────────────────────────────

/**
 * The physical truth layer of an AtlasPropertyV1.
 *
 * Contains the spatial, thermal, and plant layout of the building as captured
 * during the survey.  This is the model that both scan capture and the
 * recommendation engine can read and extend without coupling to each other's
 * internal representations.
 */
export interface BuildingModelV1 {
  /** Storeys of the building. */
  floors: FloorV1[];
  /** Spatial rooms. */
  rooms: RoomV1[];
  /** Thermal zones (may aggregate multiple rooms). */
  zones: ThermalZoneV1[];
  /** Envelope boundary elements. */
  boundaries: BoundaryV1[];
  /** Openings (windows, doors, rooflights) in boundary elements. */
  openings: OpeningV1[];
  /** Central-heating emitters. */
  emitters: EmitterV1[];
  /** Physical plant components (boiler, cylinder, manifold, etc.). */
  systemComponents: SystemComponentV1[];
  /** Optional pipe route traces. */
  pipeRoutes?: PipeRouteV1[];
  /** Optional utility services model. */
  services?: ServicesModelV1;
}
