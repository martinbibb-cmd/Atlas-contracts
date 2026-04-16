/**
 * atlasGeometry.types.ts
 *
 * Primitive geometry types for Atlas spatial contracts.
 *
 * Design rules:
 *   - Only primitive structural types (points, polylines, polygons, boxes).
 *   - No USDZ nodes, RealityKit anchors, SceneKit geometry, Three.js objects,
 *     or arbitrary mesh blobs.
 *   - All coordinates are in local metric metres unless noted.
 *   - The coordinate system is defined by the parent model's `coordinateSystem`.
 */

// ─── Coordinate system ────────────────────────────────────────────────────────

/**
 * The local coordinate system for a spatial model.
 *
 * All geometry coordinates are expressed in this system.
 * `metric_m_yup` — metric metres, right-handed, Y-up (default for
 *   RoomPlan-style capture).
 */
export type CoordinateSystemKind = 'metric_m_yup';

export interface LocalCoordinateSystem {
  kind: CoordinateSystemKind;
  /** Optional description of the origin (e.g. "south-west corner of ground floor"). */
  originDescription?: string;
}

// ─── Point types ──────────────────────────────────────────────────────────────

/** A 2-D point in local coordinate space (horizontal plane). */
export interface Point2D {
  x: number;
  y: number;
}

/** A 3-D point in local coordinate space. */
export interface Point3D {
  x: number;
  y: number;
  z: number;
}

// ─── Polyline types ───────────────────────────────────────────────────────────

/** An ordered sequence of 2-D points forming a polyline. */
export interface Polyline2D {
  kind: 'polyline2d';
  points: Point2D[];
}

/** An ordered sequence of 3-D points forming a polyline. */
export interface Polyline3D {
  kind: 'polyline3d';
  points: Point3D[];
}

// ─── Polygon types ────────────────────────────────────────────────────────────

/**
 * A closed 2-D polygon.
 *
 * The last point is implicitly connected back to the first.
 * Winding order: counter-clockwise when viewed from above.
 */
export interface Polygon2D {
  kind: 'polygon2d';
  points: Point2D[];
}

// ─── Box types ────────────────────────────────────────────────────────────────

/**
 * An axis-aligned 3-D bounding box.
 *
 * `min` is the corner with the smallest x, y, z values.
 * `max` is the corner with the largest x, y, z values.
 */
export interface Box3D {
  kind: 'box3d';
  min: Point3D;
  max: Point3D;
}

/**
 * An oriented 3-D bounding box.
 *
 * `center` is the box centre in local space.
 * `halfExtents` is the half-size along each local axis.
 * `rotation` is a unit quaternion (x, y, z, w) rotating from world to local.
 */
export interface OrientedBox3D {
  kind: 'oriented_box3d';
  center: Point3D;
  halfExtents: Point3D;
  rotation: { x: number; y: number; z: number; w: number };
}

// ─── Room footprint ───────────────────────────────────────────────────────────

/**
 * A room described as a 2-D floor polygon plus a ceiling height.
 *
 * This is the preferred geometry for rooms: it captures the floor plan and
 * height without requiring a full volumetric mesh.
 */
export interface RoomFootprintWithHeight {
  kind: 'room_footprint';
  floorPolygon: Polygon2D;
  /** Ceiling height in metres above the floor plane. */
  ceilingHeightM: number;
  /** Elevation of the floor above the model origin in metres. */
  floorElevationM?: number;
}

// ─── Atlas geometry union ─────────────────────────────────────────────────────

/**
 * Discriminated union of all canonical Atlas geometry types.
 *
 * Use this as the `geometry` field on spatial entities.
 */
export type AtlasGeometry =
  | Polyline2D
  | Polyline3D
  | Polygon2D
  | Box3D
  | OrientedBox3D
  | RoomFootprintWithHeight;
