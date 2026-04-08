// VoiceNote.swift
//
// Portable voice-note contract shared between Atlas, engineer portal,
// and customer portal.
//
// These types represent captured voice observations that are attached to a
// scan session and may reference individual rooms or detected objects.
//
// IMPORTANT: This file defines only the shared contract boundary.
// App-layer concerns (playback state, waveform data, recorder state,
// view model fields) must not appear here.

import Foundation

// MARK: - VoiceNoteKind

/// Semantic category of a voice note.
public enum VoiceNoteKind: String, Codable, Sendable, Equatable {
    /// A general field observation.
    case observation
    /// A captured customer preference or request.
    case customerPreference
    /// An installation constraint noted during capture.
    case installConstraint
    /// A risk item flagged during capture.
    case risk
    /// A follow-up action to be taken after the visit.
    case followUp
    /// Uncategorised note.
    case other
}

// MARK: - TranscriptStatus

/// Status of an automatic speech-to-text transcript for a voice note.
public enum TranscriptStatus: String, Codable, Sendable, Equatable {
    /// No transcript has been requested.
    case notRequested
    /// Transcript has been requested and is being processed.
    case pending
    /// Transcript is available.
    case complete
    /// Transcription attempt failed.
    case failed
}

// MARK: - VoiceNoteSyncState

/// Upload / remote synchronisation state of a voice note asset.
public enum VoiceNoteSyncState: String, Codable, Sendable, Equatable {
    /// Audio exists only on the local device; not yet queued for upload.
    case localOnly
    /// Queued for upload but not yet transferred.
    case queued
    /// Successfully uploaded to remote storage.
    case uploaded
    /// Upload attempt failed; retry may be possible.
    case failed
}

// MARK: - VoiceNote

/// A portable voice note attached to a scan session.
///
/// A ``VoiceNote`` may be linked to an individual room (``linkedRoomID``)
/// or a detected object (``linkedObjectID``), or it may stand as a
/// session-level note when both link fields are `nil`.
///
/// Backward-compatibility note: all optional fields decode safely when
/// absent from the payload, and the ``transcriptStatus`` and ``syncState``
/// fields have stable defaults so older payloads remain decodable.
public struct VoiceNote: Codable, Sendable, Equatable {
    /// Unique identifier for this voice note.
    public let id: UUID
    /// ISO-8601 timestamp of when the note was recorded.
    public let createdAt: String
    /// Duration of the audio recording in seconds.
    public let duration: TimeInterval
    /// Local audio filename (for on-device transport / debugging; may be absent in remote payloads).
    public let localFilename: String?
    /// Remote asset identifier once the audio has been uploaded.
    public let remoteAssetID: String?
    /// ID of the room this note is linked to, if any.
    public let linkedRoomID: UUID?
    /// ID of the detected object this note is linked to, if any.
    public let linkedObjectID: UUID?
    /// Semantic category of this note.
    public let kind: VoiceNoteKind
    /// Optional free-text caption supplied by the operator.
    public let caption: String?
    /// Transcript text, once available.
    public let transcript: String?
    /// Current status of the speech-to-text transcript.
    public let transcriptStatus: TranscriptStatus
    /// Current upload / remote sync state.
    public let syncState: VoiceNoteSyncState

    public init(
        id: UUID,
        createdAt: String,
        duration: TimeInterval,
        localFilename: String? = nil,
        remoteAssetID: String? = nil,
        linkedRoomID: UUID? = nil,
        linkedObjectID: UUID? = nil,
        kind: VoiceNoteKind,
        caption: String? = nil,
        transcript: String? = nil,
        transcriptStatus: TranscriptStatus = .notRequested,
        syncState: VoiceNoteSyncState = .localOnly
    ) {
        self.id = id
        self.createdAt = createdAt
        self.duration = duration
        self.localFilename = localFilename
        self.remoteAssetID = remoteAssetID
        self.linkedRoomID = linkedRoomID
        self.linkedObjectID = linkedObjectID
        self.kind = kind
        self.caption = caption
        self.transcript = transcript
        self.transcriptStatus = transcriptStatus
        self.syncState = syncState
    }

    // MARK: Backward-compatible decoding

    private enum CodingKeys: String, CodingKey {
        case id, createdAt, duration, localFilename, remoteAssetID
        case linkedRoomID, linkedObjectID, kind, caption, transcript
        case transcriptStatus, syncState
    }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(UUID.self, forKey: .id)
        createdAt = try c.decode(String.self, forKey: .createdAt)
        duration = try c.decode(TimeInterval.self, forKey: .duration)
        localFilename = try c.decodeIfPresent(String.self, forKey: .localFilename)
        remoteAssetID = try c.decodeIfPresent(String.self, forKey: .remoteAssetID)
        linkedRoomID = try c.decodeIfPresent(UUID.self, forKey: .linkedRoomID)
        linkedObjectID = try c.decodeIfPresent(UUID.self, forKey: .linkedObjectID)
        kind = try c.decode(VoiceNoteKind.self, forKey: .kind)
        caption = try c.decodeIfPresent(String.self, forKey: .caption)
        transcript = try c.decodeIfPresent(String.self, forKey: .transcript)
        transcriptStatus = try c.decodeIfPresent(TranscriptStatus.self, forKey: .transcriptStatus) ?? .notRequested
        syncState = try c.decodeIfPresent(VoiceNoteSyncState.self, forKey: .syncState) ?? .localOnly
    }
}
