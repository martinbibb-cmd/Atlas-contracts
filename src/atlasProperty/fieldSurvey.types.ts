/**
 * fieldSurvey.types.ts
 *
 * Minimal field survey payload for the single-device Atlas field workflow.
 *
 * These types represent the minimum canonical data needed to run a real visit:
 *   one surveyor · one device · one continuous visit · capture → planning → complete
 *
 * What this file is:
 *   - The smallest stable payload that lets Scan save a real job cleanly
 *   - Basic rooms, photos, key heating objects, notes, heating/hot-water presence
 *
 * What this file is NOT:
 *   - Advanced routing or ladder/access geometry
 *   - Engineer outputs or recommendation outputs
 *   - Tenant/GDPR fields
 *   - A full spatial model
 */

// ─── Room (lite) ─────────────────────────────────────────────────────────────

/**
 * Lightweight room descriptor for field capture.
 *
 * Intentionally minimal — no spatial geometry, no thermal data.
 * Sufficient to group photos, notes, and key objects by room.
 */
export interface AtlasRoomLiteV1 {
  /** Unique identifier for this room (UUID string). */
  id: string;

  /** Human-readable room label (e.g. 'Kitchen', 'Bedroom 1'). */
  label: string;

  /** Broad functional classification of the room. */
  roomType?:
    | 'living_room'
    | 'kitchen'
    | 'bedroom'
    | 'bathroom'
    | 'hallway'
    | 'landing'
    | 'utility'
    | 'loft'
    | 'garage'
    | 'other';

  /** Human-readable floor label (e.g. 'Ground Floor', 'First Floor'). */
  floorLabel?: string;
}

// ─── Photo evidence (lite) ───────────────────────────────────────────────────

/**
 * Minimal photo evidence captured during a field visit.
 *
 * uri can be a local device path, a remote URL, or later a connector-backed
 * reference.  Storage routing is intentionally out of scope for this type.
 */
export interface AtlasPhotoEvidenceV1 {
  /** Unique identifier for this photo (UUID string). */
  id: string;

  /**
   * URI of the photo asset.
   * May be a local path, remote URL, or connector reference.
   */
  uri: string;

  /** ISO-8601 timestamp of when the photo was captured. */
  capturedAt?: string;

  /** ID of the room this photo is associated with (AtlasRoomLiteV1.id). */
  roomId?: string;

  /** Optional caption entered by the surveyor. */
  caption?: string;

  /** Semantic tags describing what the photo shows. */
  tags?: string[];
}

// ─── Key object ──────────────────────────────────────────────────────────────

/**
 * Classification of a key physical object recorded during a field visit.
 *
 * Covers the heating, hot-water, and utility objects most relevant to
 * readiness assessment and basic downstream planning.
 */
export type AtlasKeyObjectType =
  | 'boiler'
  | 'flue'
  | 'cylinder'
  | 'radiator'
  | 'hot_water_tank'
  | 'consumer_unit'
  | 'meter'
  | 'other';

/**
 * A key physical object recorded during a field visit.
 *
 * Sufficient to support completion readiness checks and basic planning.
 * No spatial coordinates in this version — add those in the spatial model PR.
 */
export interface AtlasKeyObjectV1 {
  /** Unique identifier for this object (UUID string). */
  id: string;

  /** Classification of the physical object. */
  type: AtlasKeyObjectType;

  /** Human-readable label (e.g. 'Main boiler', 'Upstairs radiator'). */
  label?: string;

  /** ID of the room this object is located in (AtlasRoomLiteV1.id). */
  roomId?: string;

  /** Free-text notes about this object. */
  notes?: string;
}

// ─── Visit notes ─────────────────────────────────────────────────────────────

/**
 * Minimal note bundle captured during a field visit.
 *
 * Preserves raw capture without assuming a full transcription pipeline.
 *
 *   rawTranscript — full unprocessed voice/dictation output
 *   summary       — optional cleaned-up version
 *   textNotes     — manual typed notes as a fallback
 */
export interface AtlasVisitNotesV1 {
  /** Raw transcript from voice or dictation capture, unprocessed. */
  rawTranscript?: string;

  /** Optional human- or AI-generated summary of the notes. */
  summary?: string;

  /** Manual typed notes entered by the surveyor. */
  textNotes?: string[];
}

// ─── System presence ─────────────────────────────────────────────────────────

/**
 * Snapshot of heating and hot-water system presence as observed on site.
 *
 * Captures "what have we got" rather than "what do we recommend".
 * Used to drive completion readiness flags and basic downstream consumption.
 */
export interface AtlasSystemPresenceV1 {
  /** Whether a heating system was observed on site. */
  heatingSystemPresent?: boolean;

  /** Whether a hot water system was observed on site. */
  hotWaterSystemPresent?: boolean;

  /** Broad classification of the heating system type. */
  heatingSystemType?:
    | 'combi'
    | 'system_boiler'
    | 'regular_boiler'
    | 'heat_pump'
    | 'direct_electric'
    | 'unknown'
    | 'other';

  /** Broad classification of the hot water system type. */
  hotWaterSystemType?:
    | 'combi'
    | 'cylinder'
    | 'direct_electric'
    | 'heat_pump'
    | 'unknown'
    | 'other';
}

// ─── Field survey container ───────────────────────────────────────────────────

/**
 * Minimal field survey data container.
 *
 * Groups all field-captured data under a single optional field on
 * AtlasPropertyV1, keeping the root contract tidy and avoiding scattering
 * new top-level arrays everywhere.
 */
export interface AtlasFieldSurveyV1 {
  /** Lightweight room descriptors captured during the visit. */
  rooms?: AtlasRoomLiteV1[];

  /** Photos captured during the visit. */
  photos?: AtlasPhotoEvidenceV1[];

  /** Key physical objects observed during the visit. */
  keyObjects?: AtlasKeyObjectV1[];

  /** Notes and transcript bundle from the visit. */
  notes?: AtlasVisitNotesV1;

  /** Heating and hot-water system presence snapshot. */
  systemPresence?: AtlasSystemPresenceV1;
}
