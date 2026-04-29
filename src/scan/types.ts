/**
 * types.ts
 *
 * Shared spatial primitives and install markup models used by the Atlas scan
 * and install planning contracts.
 *
 * Canonical scan handoff: SessionCaptureV1
 *   The canonical contract between Atlas Scan and Atlas Mind is defined in
 *   src/atlasScan/sessionCaptureV1.types.ts.  No new code should reference
 *   ScanBundleV1 or the old SessionCaptureV1 as first-class contracts.
 */

// ─── Coordinate conventions ───────────────────────────────────────────────────

/**
 * Coordinate convention used in scan coordinate space.
 *
 * 'metric_m' — SI metres, right-handed coordinate system, Y-up.
 */
export type ScanCoordinateConvention = 'metric_m';

// ─── Spatial primitives ───────────────────────────────────────────────────────

/**
 * A 2-D point in scan coordinate space (metric metres).
 */
export interface ScanPoint2D {
  x: number;
  y: number;
}

/**
 * A 3-D point in scan coordinate space.
 *
 * x, y — horizontal plane.
 * z    — vertical (elevation) in metres.
 */
export interface ScanPoint3D extends ScanPoint2D {
  z: number;
}

// ─── Scan import conflict types ───────────────────────────────────────────────
//
// When a scan session is imported into a property record that already has
// manually-entered field values, discrepancies may arise (e.g. the engineer
// measured a room as 12 m² but the scan reads 14.2 m²).
//
// These types represent the structured output of the conflict-detection step
// in the scan import pipeline.

/**
 * The kind of value discrepancy detected during scan import.
 *
 * area_mismatch    — floor area differs between manual entry and scan
 * height_mismatch  — ceiling height differs
 * opening_mismatch — an opening (door/window) count or dimension differs
 * other            — any other field-level discrepancy
 */
export type ScanImportConflictKind =
  | 'area_mismatch'
  | 'height_mismatch'
  | 'opening_mismatch'
  | 'other';

/**
 * The two competing values for a single conflicting field.
 *
 * fieldPath   — dot-notation path to the conflicting field
 * manualValue — the value already stored in the property record
 * scanValue   — the value detected by the scan
 * unit        — optional SI unit label (e.g. 'm²', 'm')
 */
export interface ScanImportConflictFieldV1 {
  fieldPath: string;
  manualValue: unknown;
  scanValue: unknown;
  unit?: string;
}

/**
 * A single detected conflict between manual data and an incoming scan session.
 *
 * conflictId  — unique identifier (UUID string)
 * kind        — category of the discrepancy
 * roomId      — the room affected, if room-scoped
 * field       — the specific field that differs
 * detectedAt  — ISO-8601 timestamp of detection
 */
export interface ScanImportConflictItemV1 {
  conflictId: string;
  kind: ScanImportConflictKind;
  roomId?: string;
  field: ScanImportConflictFieldV1;
  detectedAt: string;
}

/**
 * The full set of conflicts produced by a single scan import operation.
 *
 * sessionId   — ID of the incoming SessionCaptureV1 that triggered conflicts
 * propertyId  — ID of the AtlasPropertyV1 being updated
 * conflicts   — ordered list of detected conflicts (empty ⟹ no conflicts)
 * generatedAt — ISO-8601 timestamp of when this conflict set was produced
 */
export interface ScanImportConflictSetV1 {
  sessionId: string;
  propertyId: string;
  conflicts: ScanImportConflictItemV1[];
  generatedAt: string;
}

// ─── Install markup models ────────────────────────────────────────────────────
//
// Canonical models for structured install markup produced by the scan app and
// consumed by the recommendation engine.

/**
 * Type of an install object placed on a floor plan or wall photo.
 */
export type InstallObjectType =
  | 'boiler'
  | 'cylinder'
  | 'radiator'
  | 'thermostat'
  | 'flue'
  | 'pump'
  | 'valve'
  | 'consumer_unit'
  | 'other';

/**
 * Source of an install object placement.
 *
 * scan     — derived from LiDAR / RoomPlan geometry
 * manual   — placed manually by the engineer via gesture
 * inferred — inferred by the engine from surrounding context
 */
export type InstallObjectSource = 'scan' | 'manual' | 'inferred';

/**
 * A 3-D size in metres.
 */
export interface InstallDimensions {
  /** Width (horizontal extent) in metres. */
  widthM: number;
  /** Depth (horizontal extent, front-to-back) in metres. */
  depthM: number;
  /** Height (vertical extent) in metres. */
  heightM: number;
}

/**
 * Orientation of an install object expressed as a rotation in degrees about
 * the vertical (Z) axis.
 */
export interface InstallOrientation {
  /** Rotation about the Z axis in degrees (0–360). */
  yawDeg: number;
}

/**
 * InstallObjectModelV1 — a single install object placed on a floor plan or
 * wall photo.
 *
 * id          — unique identifier (UUID string)
 * type        — category of system component
 * position    — centre position in scan coordinate space (metric_m)
 * dimensions  — approximate bounding dimensions in metres
 * orientation — rotational orientation about the vertical axis
 * source      — how the placement was derived
 */
export interface InstallObjectModelV1 {
  id: string;
  type: InstallObjectType;
  position: ScanPoint3D;
  dimensions: InstallDimensions;
  orientation: InstallOrientation;
  source: InstallObjectSource;
}

/**
 * Kind of an install route.
 */
export type InstallRouteKind =
  | 'flow'
  | 'return'
  | 'gas'
  | 'cold'
  | 'hot'
  | 'flue'
  | 'other';

/**
 * How a pipe run is mounted / concealed.
 */
export type InstallMounting = 'surface' | 'boxed' | 'buried' | 'other';

/**
 * Confidence level of a route path.
 *
 * measured  — path derived from scan geometry (highest confidence)
 * drawn     — path drawn manually by the engineer
 * estimated — path inferred or approximated
 */
export type InstallRouteConfidence = 'measured' | 'drawn' | 'estimated';

/**
 * A single waypoint on an install route path.
 */
export interface InstallPathPoint extends ScanPoint3D {
  /** Optional elevation above floor level in metres (supplements z). */
  elevationOffsetM?: number;
}

/**
 * InstallRouteModelV1 — a routed pipe or cable run between two or more points.
 *
 * id         — unique identifier (UUID string)
 * kind       — service type carried by this route
 * diameterMm — nominal pipe / conduit diameter in millimetres
 * path       — ordered sequence of waypoints
 * mounting   — how the route is mounted or concealed
 * confidence — how the path geometry was derived
 */
export interface InstallRouteModelV1 {
  id: string;
  kind: InstallRouteKind;
  diameterMm: number;
  path: InstallPathPoint[];
  mounting: InstallMounting;
  confidence: InstallRouteConfidence;
}

/**
 * A spatial annotation attached to an install layer.
 *
 * id       — unique identifier (UUID string)
 * text     — free-text annotation content
 * position — optional spatial anchor in scan coordinate space
 */
export interface InstallAnnotation {
  id: string;
  text: string;
  position?: ScanPoint3D;
}

/**
 * InstallLayerModelV1 — a layered view of install routes separating existing
 * system pipework from proposed new routes.
 *
 * existing — routes already installed in the property
 * proposed — routes planned as part of the new installation
 * notes    — spatial annotations (constraints, measurements, labels)
 */
export interface InstallLayerModelV1 {
  existing: InstallRouteModelV1[];
  proposed: InstallRouteModelV1[];
  notes: InstallAnnotation[];
}
