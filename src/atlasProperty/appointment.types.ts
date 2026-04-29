/**
 * appointment.types.ts
 *
 * AtlasAppointmentV1 — the shared appointment contract between
 * Atlas Recommendation and Atlas Scan iOS.
 *
 * An appointment represents a scheduled property survey visit.  It is created
 * by Atlas Recommendation (or a back-end scheduler) and consumed by Atlas Scan
 * iOS to identify which property is being visited and to cross-reference the
 * resulting SessionCaptureV1 payload.
 *
 * Design principles:
 *   - The `appointmentId` is the authoritative cross-system key.  Every
 *     SessionCaptureV1 exported by Atlas Scan must carry this identifier in
 *     its `visitId` field so the capture can be matched back to the
 *     appointment that triggered the visit.
 *   - All consumer apps (Atlas Recommendation, Atlas Scan iOS, Atlas Mind,
 *     customer portal) should reference appointments by `appointmentId`.
 *   - `visitReference` is the human-readable job / visit number used for
 *     display purposes only.
 *
 * Version history:
 *   1.0 — initial introduction
 */

// ─── Appointment status ───────────────────────────────────────────────────────

/**
 * Lifecycle status of a survey appointment.
 *
 * scheduled    — appointment booked; engineer not yet on site
 * confirmed    — appointment confirmed with the customer
 * in_progress  — engineer is actively on site
 * completed    — visit finished; capture has been submitted
 * cancelled    — appointment cancelled before the visit took place
 */
export type AtlasAppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

// ─── AtlasAppointmentV1 ───────────────────────────────────────────────────────

/**
 * AtlasAppointmentV1 — the shared appointment contract.
 *
 * Created by Atlas Recommendation (or a scheduling back-end) and consumed by
 * Atlas Scan iOS.  The `appointmentId` field is the cross-system key that
 * must appear as the `visitId` in every `SessionCaptureV1` exported by
 * Atlas Scan.
 *
 * Both Atlas Recommendation and Atlas Scan iOS must reference this contract
 * so that captured survey data can be matched back to the appointment that
 * triggered the visit.
 */
export interface AtlasAppointmentV1 {
  /**
   * Contract discriminant — always 'atlas.appointment.v1'.
   * Allows consumers to distinguish this type at runtime.
   */
  schemaVersion: 'atlas.appointment.v1';

  /**
   * Unique identifier for this appointment (UUID string).
   *
   * This is the authoritative cross-system key.  Atlas Scan iOS must include
   * this value as the `visitId` in the `SessionCaptureV1` exported for
   * this appointment.
   */
  appointmentId: string;

  /**
   * Identifier of the property this appointment is for.
   * Should match `AtlasPropertyV1.propertyId` in the recommendation system.
   */
  propertyId: string;

  /**
   * Human-readable visit / job reference string (e.g. "JOB-2025-0601").
   *
   * Used for display and for cross-referencing with external job management
   * systems.  Not a primary key — use `appointmentId` for programmatic
   * lookups.
   */
  visitReference?: string;

  /**
   * ISO-8601 timestamp of when the appointment is scheduled to start.
   * May be absent when the exact time has not yet been confirmed.
   */
  scheduledAt?: string;

  /**
   * ISO-8601 timestamp of when this appointment record was created.
   */
  createdAt: string;

  /**
   * ISO-8601 timestamp of the last update to this record.
   */
  updatedAt: string;

  /**
   * Current lifecycle status of this appointment.
   */
  status: AtlasAppointmentStatus;

  /**
   * Identifier of the engineer assigned to this appointment.
   * Absent until an engineer has been assigned.
   */
  engineerId?: string;

  /**
   * Display name of the assigned engineer.
   * Absent until an engineer has been assigned.
   */
  engineerName?: string;
}

/**
 * A raw unknown input — used at the validation boundary before the payload
 * has been confirmed to match AtlasAppointmentV1.
 */
export type UnknownAtlasAppointment = Record<string, unknown>;
