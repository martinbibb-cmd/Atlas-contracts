// Appointment.swift
//
// AtlasAppointmentV1 — the shared appointment contract between
// Atlas Recommendation and Atlas Scan iOS.
//
// An appointment represents a scheduled property survey visit.  It is created
// by Atlas Recommendation (or a back-end scheduler) and consumed by Atlas Scan
// iOS to identify which property is being visited and to cross-reference the
// resulting session capture payload.
//
// Design principles:
//   - `appointmentId` is the authoritative cross-system key.  Every session
//     capture exported by Atlas Scan must carry this identifier in its
//     `appointmentId` field so the capture can be matched back to the
//     appointment that triggered the visit.
//   - `visitReference` is the human-readable job / visit number for display
//     and external system cross-referencing only.
//
// IMPORTANT: This file defines only the shared contract boundary.
// App-layer concerns (appointment list UI, scheduling, calendar integration)
// must not appear here.

import Foundation

// MARK: - Appointment status

/// Lifecycle status of a survey appointment.
///
/// - `scheduled`:   appointment booked; engineer not yet on site
/// - `confirmed`:   appointment confirmed with the customer
/// - `inProgress`:  engineer is actively on site
/// - `completed`:   visit finished; capture has been submitted
/// - `cancelled`:   appointment cancelled before the visit took place
public enum AppointmentStatusV1: String, Codable, Sendable, Equatable {
    case scheduled
    case confirmed
    case inProgress  = "in_progress"
    case completed
    case cancelled
}

// MARK: - AppointmentV1

/// AppointmentV1 — the shared appointment contract.
///
/// Created by Atlas Recommendation (or a scheduling back-end) and consumed by
/// Atlas Scan iOS.  The ``appointmentId`` field is the cross-system key that
/// must appear in every ``SessionCaptureV1/appointmentId`` payload produced
/// by Atlas Scan for this appointment.
///
/// Both Atlas Recommendation and Atlas Scan iOS must reference this contract
/// so that captured survey data can be matched back to the appointment that
/// triggered the visit.
public struct AppointmentV1: Codable, Sendable, Equatable {

    /// Unique identifier for this appointment (UUID string).
    ///
    /// This is the authoritative cross-system key.  Atlas Scan iOS must include
    /// this value in the `appointmentId` field of the session capture when
    /// exporting a capture for this appointment.
    public let appointmentId: String

    /// Identifier of the property this appointment is for.
    /// Should match the recommendation system's property record identifier.
    public let propertyId: String

    /// Human-readable visit / job reference string (e.g. "JOB-2025-0601").
    ///
    /// Used for display and for cross-referencing with external job management
    /// systems.  Not a primary key — use `appointmentId` for programmatic
    /// lookups.
    public let visitReference: String?

    /// ISO-8601 timestamp of when the appointment is scheduled to start.
    /// May be absent when the exact time has not yet been confirmed.
    public let scheduledAt: String?

    /// ISO-8601 timestamp of when this appointment record was created.
    public let createdAt: String

    /// ISO-8601 timestamp of the last update to this record.
    public let updatedAt: String

    /// Current lifecycle status of this appointment.
    public let status: AppointmentStatusV1

    /// Identifier of the engineer assigned to this appointment.
    /// Absent until an engineer has been assigned.
    public let engineerId: String?

    /// Display name of the assigned engineer.
    /// Absent until an engineer has been assigned.
    public let engineerName: String?

    public init(
        appointmentId: String,
        propertyId: String,
        visitReference: String? = nil,
        scheduledAt: String? = nil,
        createdAt: String,
        updatedAt: String,
        status: AppointmentStatusV1,
        engineerId: String? = nil,
        engineerName: String? = nil
    ) {
        self.appointmentId = appointmentId
        self.propertyId = propertyId
        self.visitReference = visitReference
        self.scheduledAt = scheduledAt
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.status = status
        self.engineerId = engineerId
        self.engineerName = engineerName
    }
}
