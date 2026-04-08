// VisitCapture.swift
//
// Portable top-level artifact for a complete property visit session.
//
// A VisitCapture bundles the raw scan geometry (ScanBundleV1) together with
// all other artefacts captured during the same visit: voice notes, and in
// future photos, tagged objects, and session-level metadata.
//
// Design rationale
// ─────────────────
// ScanBundleV1 is intentionally kept as the narrow raw-scan-geometry contract
// (rooms, walls, anchors, QA flags, scan metadata).  Session-level artefacts
// such as voice notes do not belong on that type; they belong here.
//
// IMPORTANT: This file defines only the shared contract boundary.
// App-layer concerns (upload orchestration, playback state, recorder state,
// view model fields) must not appear here.

import Foundation

// MARK: - VisitCapture

/// The portable top-level artifact for a complete property visit session.
///
/// A ``VisitCapture`` wraps the raw scan-geometry bundle (``ScanBundleV1``)
/// and augments it with session-level artefacts such as ``voiceNotes``.
/// Future artefact types (photos, tagged objects, issues, session metadata)
/// will also be added here, not to ``ScanBundleV1``.
///
/// Backward-compatibility note: ``voiceNotes`` decodes safely when absent from
/// the payload (defaults to `[]`), so older payloads that contain only a bare
/// ``ScanBundleV1`` can be wrapped without loss.
public struct VisitCapture: Codable, Sendable, Equatable {

    /// The raw scan-geometry bundle captured during this visit.
    public let scanBundle: ScanBundleV1

    /// Voice notes recorded during the visit session.
    /// Defaults to `[]` when absent from the payload.
    public let voiceNotes: [VoiceNote]

    public init(
        scanBundle: ScanBundleV1,
        voiceNotes: [VoiceNote] = []
    ) {
        self.scanBundle = scanBundle
        self.voiceNotes = voiceNotes
    }

    // MARK: Backward-compatible decoding

    private enum CodingKeys: String, CodingKey {
        case scanBundle, voiceNotes
    }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        scanBundle = try c.decode(ScanBundleV1.self, forKey: .scanBundle)
        voiceNotes = try c.decodeIfPresent([VoiceNote].self, forKey: .voiceNotes) ?? []
    }
}
