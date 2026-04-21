/**
 * planningOverlay.types.ts
 *
 * AtlasPlanningOverlayV1 — the minimal planning layer for field review and
 * proposal markup.
 *
 * Design principles:
 *   - Capture stays capture.  Planning is an explicit overlay, separate from
 *     fieldSurvey / BuildingModelV1.
 *   - Types are intentionally lightweight: descriptive markup, not geometry.
 *   - No full coordinate system, no graph engine, no recommendation output.
 *
 * What this covers:
 *   - Proposed emitters (radiators, towel rails, UFH zones, etc.)
 *   - Room-level planning notes
 *   - Simple connection route markup (descriptive, not geometric)
 *   - Access constraints for install planning
 *   - Free-text surveyor spec notes
 *
 * Version history:
 *   1.0 — initial introduction
 */

import type { AtlasPropertyV1 } from './atlasProperty.types';

// ─── Emitter type ─────────────────────────────────────────────────────────────

/**
 * Type of a proposed or replacement emitter.
 *
 * Used in AtlasProposedEmitterV1 to describe what kind of heat emitter
 * the surveyor is specifying for a room.
 */
export type AtlasEmitterType =
  | 'radiator'
  | 'vertical_radiator'
  | 'towel_rail'
  | 'ufh_zone'
  | 'other';

// ─── Proposed emitter ─────────────────────────────────────────────────────────

/**
 * A proposed or replacement emitter specified during planning.
 *
 * Attaches a proposed emitter to a room, with an optional link to the
 * existing emitter it would replace.  This is a planning intent record —
 * not a captured measurement.
 */
export interface AtlasProposedEmitterV1 {
  /** Unique identifier (UUID string). */
  id: string;
  /** ID of the room this emitter is proposed for. */
  roomId: string;
  /** Type of emitter being proposed. */
  type: AtlasEmitterType;
  /** Optional human-readable label (e.g. "Main radiator", "En-suite towel rail"). */
  label?: string;
  /** Optional surveyor notes. */
  notes?: string;
  /** Whether this proposed emitter replaces an existing one in the room. */
  replacesExisting?: boolean;
}

// ─── Room plan note ───────────────────────────────────────────────────────────

/**
 * A planning intent note attached to a room.
 *
 * Lets surveyors record what changes or considerations apply to a specific
 * room during the planning phase.
 */
export interface AtlasRoomPlanNoteV1 {
  /** Unique identifier (UUID string). */
  id: string;
  /** ID of the room this note applies to. */
  roomId: string;
  /** The planning note text. */
  note: string;
  /**
   * Optional semantic category for the note.
   *
   * emitter   — relates to heat emitter changes
   * pipework  — relates to pipe routing or distribution
   * access    — relates to physical access constraints
   * controls  — relates to heating controls
   * general   — general planning note
   */
  category?: 'emitter' | 'pipework' | 'access' | 'controls' | 'general';
}

// ─── Route markup ─────────────────────────────────────────────────────────────

/**
 * A descriptive route markup connecting two objects or passing through a room.
 *
 * This is intentionally lightweight — it records descriptive routing intent
 * (e.g. "run flow pipe from boiler to kitchen radiator"), not geometry.
 * The route type indicates the service medium being routed.
 */
export interface AtlasRouteMarkupV1 {
  /** Unique identifier (UUID string). */
  id: string;
  /** ID of the object or anchor at the start of the route, if known. */
  fromObjectId?: string;
  /** ID of the object or anchor at the end of the route, if known. */
  toObjectId?: string;
  /** ID of the room the route passes through or is associated with, if known. */
  roomId?: string;
  /** Human-readable description of this route. */
  description: string;
  /**
   * Type of service being routed.
   *
   * pipe_flow  — heating flow pipe
   * pipe_return — heating return pipe
   * condensate  — condensate drain
   * cable       — electrical cable
   * flue        — flue or exhaust
   * other       — any other route type
   */
  routeType?: 'pipe_flow' | 'pipe_return' | 'condensate' | 'cable' | 'flue' | 'other';
}

// ─── Access note ──────────────────────────────────────────────────────────────

/**
 * An access constraint note for practical install planning.
 *
 * Records physical access considerations that will affect the installation,
 * such as ladder requirements, clearance constraints, obstructions, or
 * loft access details.
 */
export interface AtlasAccessNoteV1 {
  /** Unique identifier (UUID string). */
  id: string;
  /** ID of the room this note applies to, if room-specific. */
  roomId?: string;
  /** ID of the related object or component, if object-specific. */
  relatedObjectId?: string;
  /** The access note text. */
  note: string;
  /**
   * Optional semantic category for the access constraint.
   *
   * ladder       — a ladder or specialist access equipment is required
   * clearance    — a minimum clearance distance must be maintained
   * obstruction  — an obstruction affects access or routing
   * loft_access  — relates to loft or roof-space access
   * general      — general access note
   */
  category?: 'ladder' | 'clearance' | 'obstruction' | 'loft_access' | 'general';
}

// ─── Planning overlay container ───────────────────────────────────────────────

/**
 * AtlasPlanningOverlayV1 — the top-level container for all planning-layer data.
 *
 * This overlay sits alongside fieldSurvey / BuildingModelV1 on AtlasPropertyV1.
 * It must not mutate captured data — it is an explicit, separate layer.
 *
 * All arrays are optional; an absent array means no entries of that type have
 * been added yet.
 */
export interface AtlasPlanningOverlayV1 {
  /** Proposed or replacement emitters. */
  proposedEmitters?: AtlasProposedEmitterV1[];
  /** Descriptive route markups (pipe, cable, flue routes). */
  routeMarkups?: AtlasRouteMarkupV1[];
  /** Access constraint notes. */
  accessNotes?: AtlasAccessNoteV1[];
  /** Room-level planning intent notes. */
  roomPlans?: AtlasRoomPlanNoteV1[];
  /** Free-text surveyor specification notes. */
  specNotes?: string[];
}

// ─── Planning readiness ───────────────────────────────────────────────────────

/**
 * A lightweight summary of whether meaningful planning data has been entered.
 *
 * Consumed by UI layers to decide whether to show planning-complete indicators
 * or prompt the user to add planning data.
 *
 * Derived from AtlasPlanningOverlayV1 — never stored directly.
 */
export interface AtlasPlanningReadiness {
  /** True if at least one proposed emitter has been added. */
  hasProposedEmitters: boolean;
  /** True if at least one route markup has been added. */
  hasAnyRoutes: boolean;
  /** True if at least one access note has been added. */
  hasAnyAccessNotes: boolean;
  /** True if at least one room plan note has been added. */
  hasAnyRoomPlans: boolean;
  /** True if at least one spec note has been added. */
  hasAnySpecNotes: boolean;
}

// ─── derivePlanningReadiness ──────────────────────────────────────────────────

/**
 * Derives a planning readiness summary from the planning overlay on a property.
 *
 * Returns all-false when the overlay is absent or empty.  This is a pure
 * helper — it does not write to the property.
 *
 * @param property - any object that carries a `planningOverlay` field.
 * @returns AtlasPlanningReadiness
 */
export function derivePlanningReadiness(
  property: Pick<AtlasPropertyV1, 'planningOverlay'>,
): AtlasPlanningReadiness {
  const overlay = property.planningOverlay;
  return {
    hasProposedEmitters: (overlay?.proposedEmitters?.length ?? 0) > 0,
    hasAnyRoutes: (overlay?.routeMarkups?.length ?? 0) > 0,
    hasAnyAccessNotes: (overlay?.accessNotes?.length ?? 0) > 0,
    hasAnyRoomPlans: (overlay?.roomPlans?.length ?? 0) > 0,
    hasAnySpecNotes: (overlay?.specNotes?.length ?? 0) > 0,
  };
}
