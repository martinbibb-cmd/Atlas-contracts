// AtlasContractsTests.swift
//
// Tests for the AtlasContracts Swift module.

import XCTest
@testable import AtlasContracts

final class AtlasContractsTests: XCTestCase {

    // MARK: - Version helpers

    func testSupportedVersionContains1_0() {
        XCTAssertTrue(supportedScanBundleVersions.contains("1.0"))
    }

    func testIsSupportedVersionReturnsTrueFor1_0() {
        XCTAssertTrue(isSupportedVersion("1.0"))
    }

    func testIsSupportedVersionReturnsFalseForFutureVersion() {
        XCTAssertFalse(isSupportedVersion("99.0"))
    }

    func testIsUnsupportedVersionReturnsTrueForFutureVersion() {
        XCTAssertTrue(isUnsupportedVersion("99.0"))
    }

    func testIsUnsupportedVersionReturnsFalseFor1_0() {
        XCTAssertFalse(isUnsupportedVersion("1.0"))
    }

    func testIsUnsupportedVersionReturnsFalseForEmptyString() {
        XCTAssertFalse(isUnsupportedVersion(""))
    }

    // MARK: - Validation — valid bundle

    func testValidSingleRoomBundleAccepted() throws {
        let json = validSingleRoomJSON
        let data = json.data(using: .utf8)!
        let result = validateScanBundle(data)
        XCTAssertTrue(result.isValid)
        let bundle = try XCTUnwrap(result.bundle)
        XCTAssertEqual(bundle.version, "1.0")
        XCTAssertEqual(bundle.bundleId, "fixture-single-room-001")
        XCTAssertEqual(bundle.rooms.count, 1)
        XCTAssertEqual(bundle.rooms.first?.id, "room-living-01")
    }

    // MARK: - Validation — invalid inputs

    func testNullInputRejected() {
        let data = "null".data(using: .utf8)!
        let result = validateScanBundle(data)
        XCTAssertFalse(result.isValid)
        XCTAssertFalse(result.errors.isEmpty)
    }

    func testArrayInputRejected() {
        let data = "[]".data(using: .utf8)!
        let result = validateScanBundle(data)
        XCTAssertFalse(result.isValid)
    }

    func testMissingVersionRejected() {
        let json = """
        {"bundleId": "x", "rooms": [], "anchors": [], "qaFlags": [], "meta": {}}
        """
        let result = validateScanBundle(json)
        XCTAssertFalse(result.isValid)
        XCTAssertTrue(result.errors.first?.contains("version") ?? false)
    }

    func testUnsupportedVersionRejected() {
        let json = """
        {"version": "99.0", "bundleId": "x", "rooms": [], "anchors": [], "qaFlags": [], "meta": {}}
        """
        let result = validateScanBundle(json)
        XCTAssertFalse(result.isValid)
        XCTAssertTrue(result.errors.first?.contains("99.0") ?? false)
        XCTAssertTrue(result.errors.first?.contains("1.0") ?? false)
    }

    func testInvalidJSONRejected() {
        let data = "not json at all".data(using: .utf8)!
        let result = validateScanBundle(data)
        XCTAssertFalse(result.isValid)
    }

    // MARK: - Validation — string convenience

    func testValidateWithStringInput() {
        let result = validateScanBundle(validSingleRoomJSON)
        XCTAssertTrue(result.isValid)
    }

    // MARK: - ScanImportManifest

    func testManifestFromValidBundle() throws {
        let data = validSingleRoomJSON.data(using: .utf8)!
        let result = validateScanBundle(data)
        let bundle = try XCTUnwrap(result.bundle)
        let manifest = ScanImportManifest(from: bundle)
        XCTAssertEqual(manifest.schemaVersion, "1.0")
        XCTAssertEqual(manifest.version, "1.0")
        XCTAssertEqual(manifest.bundleId, "fixture-single-room-001")
        XCTAssertEqual(manifest.roomCount, 1)
        XCTAssertEqual(manifest.anchorCount, 0)
        XCTAssertEqual(manifest.qaFlagCount, 0)
        XCTAssertEqual(manifest.deviceModel, "iPhone 15 Pro")
        XCTAssertEqual(manifest.scannerApp, "AtlasScan 1.0.0")
    }

    func testImportSummaryIsAccessibleAsMember() throws {
        let data = validSingleRoomJSON.data(using: .utf8)!
        let result = validateScanBundle(data)
        let bundle = try XCTUnwrap(result.bundle)
        let manifest = ScanImportManifest(from: bundle)
        // Verify ScanImportManifest.ImportSummary is a reachable public type.
        let summary: ScanImportManifest.ImportSummary = manifest.importSummary
        XCTAssertEqual(summary.version, manifest.version)
        XCTAssertEqual(summary.bundleId, manifest.bundleId)
        XCTAssertEqual(summary.roomCount, manifest.roomCount)
        XCTAssertEqual(summary.anchorCount, manifest.anchorCount)
        XCTAssertEqual(summary.qaFlagCount, manifest.qaFlagCount)
        XCTAssertEqual(summary.deviceModel, manifest.deviceModel)
        XCTAssertEqual(summary.scannerApp, manifest.scannerApp)
        XCTAssertEqual(summary.capturedAt, manifest.capturedAt)
    }

    func testImportSummaryDirectInit() {
        // Verify ScanImportManifest.ImportSummary has a public memberwise init.
        let summary = ScanImportManifest.ImportSummary(
            version: "1.0",
            bundleId: "test-bundle",
            roomCount: 2,
            anchorCount: 1,
            qaFlagCount: 0,
            deviceModel: "iPhone 15 Pro",
            scannerApp: "AtlasScan 1.0.0",
            capturedAt: "2025-06-01T10:00:00Z"
        )
        XCTAssertEqual(summary.version, "1.0")
        XCTAssertEqual(summary.bundleId, "test-bundle")
        XCTAssertEqual(summary.roomCount, 2)
        XCTAssertEqual(summary.anchorCount, 1)
        XCTAssertEqual(summary.qaFlagCount, 0)
    }

    // MARK: - Codable round-trip

    func testScanBundleRoundTrip() throws {
        let data = validSingleRoomJSON.data(using: .utf8)!
        let bundle = try JSONDecoder().decode(ScanBundleV1.self, from: data)
        let reEncoded = try JSONEncoder().encode(bundle)
        let decoded = try JSONDecoder().decode(ScanBundleV1.self, from: reEncoded)
        XCTAssertEqual(bundle, decoded)
    }

    func testScanImportManifestRoundTrip() throws {
        let data = validSingleRoomJSON.data(using: .utf8)!
        let result = validateScanBundle(data)
        let bundle = try XCTUnwrap(result.bundle)
        let manifest = ScanImportManifest(from: bundle)
        let encoded = try JSONEncoder().encode(manifest)
        let decoded = try JSONDecoder().decode(ScanImportManifest.self, from: encoded)
        XCTAssertEqual(manifest, decoded)
        XCTAssertEqual(decoded.schemaVersion, "1.0")
    }

    // MARK: - VoiceNote Codable round-trip

    func testVoiceNoteRoundTrip() throws {
        let note = VoiceNote(
            id: UUID(uuidString: "00000000-0000-0000-0000-000000000001")!,
            createdAt: "2025-06-01T10:00:00Z",
            duration: 12.5,
            localFilename: "note-001.m4a",
            remoteAssetID: "asset-remote-001",
            linkedRoomID: UUID(uuidString: "00000000-0000-0000-0000-000000000002")!,
            linkedObjectID: nil,
            kind: .observation,
            caption: "Check the radiator",
            transcript: "Check the radiator in the corner",
            transcriptStatus: .complete,
            syncState: .uploaded
        )
        let encoded = try JSONEncoder().encode(note)
        let decoded = try JSONDecoder().decode(VoiceNote.self, from: encoded)
        XCTAssertEqual(note, decoded)
    }

    func testVoiceNoteDefaultsInInit() {
        let note = VoiceNote(
            id: UUID(),
            createdAt: "2025-06-01T10:00:00Z",
            duration: 5.0,
            kind: .other
        )
        XCTAssertNil(note.localFilename)
        XCTAssertNil(note.remoteAssetID)
        XCTAssertNil(note.linkedRoomID)
        XCTAssertNil(note.linkedObjectID)
        XCTAssertNil(note.caption)
        XCTAssertNil(note.transcript)
        XCTAssertEqual(note.transcriptStatus, .notRequested)
        XCTAssertEqual(note.syncState, .localOnly)
    }

    // MARK: - VoiceNote backward-compatible decode (missing optional fields)

    func testVoiceNoteDecodesWithMinimalPayload() throws {
        let json = """
        {
          "id": "00000000-0000-0000-0000-000000000003",
          "createdAt": "2025-06-01T09:00:00Z",
          "duration": 7.2,
          "kind": "risk"
        }
        """
        let note = try JSONDecoder().decode(VoiceNote.self, from: json.data(using: .utf8)!)
        XCTAssertEqual(note.kind, .risk)
        XCTAssertNil(note.localFilename)
        XCTAssertNil(note.remoteAssetID)
        XCTAssertNil(note.linkedRoomID)
        XCTAssertNil(note.linkedObjectID)
        XCTAssertNil(note.caption)
        XCTAssertNil(note.transcript)
        XCTAssertEqual(note.transcriptStatus, .notRequested)
        XCTAssertEqual(note.syncState, .localOnly)
    }

    // MARK: - VoiceNoteKind enum serialisation

    func testVoiceNoteKindRawValues() {
        XCTAssertEqual(VoiceNoteKind.observation.rawValue, "observation")
        XCTAssertEqual(VoiceNoteKind.customerPreference.rawValue, "customerPreference")
        XCTAssertEqual(VoiceNoteKind.installConstraint.rawValue, "installConstraint")
        XCTAssertEqual(VoiceNoteKind.risk.rawValue, "risk")
        XCTAssertEqual(VoiceNoteKind.followUp.rawValue, "followUp")
        XCTAssertEqual(VoiceNoteKind.other.rawValue, "other")
    }

    func testTranscriptStatusRawValues() {
        XCTAssertEqual(TranscriptStatus.notRequested.rawValue, "notRequested")
        XCTAssertEqual(TranscriptStatus.pending.rawValue, "pending")
        XCTAssertEqual(TranscriptStatus.complete.rawValue, "complete")
        XCTAssertEqual(TranscriptStatus.failed.rawValue, "failed")
    }

    func testVoiceNoteSyncStateRawValues() {
        XCTAssertEqual(VoiceNoteSyncState.localOnly.rawValue, "localOnly")
        XCTAssertEqual(VoiceNoteSyncState.queued.rawValue, "queued")
        XCTAssertEqual(VoiceNoteSyncState.uploaded.rawValue, "uploaded")
        XCTAssertEqual(VoiceNoteSyncState.failed.rawValue, "failed")
    }

    // MARK: - VisitCapture round-trip with voice notes

    func testVisitCaptureRoundTrip() throws {
        let data = validVisitCaptureJSON.data(using: .utf8)!
        let capture = try JSONDecoder().decode(VisitCapture.self, from: data)
        XCTAssertEqual(capture.voiceNotes.count, 2)
        XCTAssertEqual(capture.scanBundle.bundleId, "fixture-visit-capture-001")

        let first = try XCTUnwrap(capture.voiceNotes.first)
        XCTAssertEqual(first.kind, .observation)
        XCTAssertEqual(first.transcriptStatus, .complete)
        XCTAssertEqual(first.syncState, .uploaded)
        XCTAssertEqual(first.transcript, "Check the radiator in the corner")

        let second = capture.voiceNotes[1]
        XCTAssertEqual(second.kind, .customerPreference)
        XCTAssertEqual(second.transcriptStatus, .notRequested)
        XCTAssertEqual(second.syncState, .localOnly)

        // Encode and decode again to verify full round-trip.
        let reEncoded = try JSONEncoder().encode(capture)
        let decoded = try JSONDecoder().decode(VisitCapture.self, from: reEncoded)
        XCTAssertEqual(capture, decoded)
    }

    func testVisitCaptureDecodesWithoutVoiceNotesField() throws {
        // A VisitCapture payload with no voiceNotes key must decode to an empty array.
        let json = """
        {
          "scanBundle": {
            "version": "1.0",
            "bundleId": "test-no-voice-001",
            "rooms": [],
            "anchors": [],
            "qaFlags": [],
            "meta": {
              "capturedAt": "2025-06-01T10:00:00Z",
              "deviceModel": "iPhone 15 Pro",
              "scannerApp": "AtlasScan 1.0.0",
              "coordinateConvention": "metric_m"
            }
          }
        }
        """
        let capture = try JSONDecoder().decode(VisitCapture.self, from: json.data(using: .utf8)!)
        XCTAssertEqual(capture.voiceNotes, [])
        XCTAssertEqual(capture.scanBundle.bundleId, "test-no-voice-001")
    }

    func testVisitCaptureScanBundleIsValidatable() throws {
        // The scanBundle embedded in a VisitCapture must be independently
        // validatable via validateScanBundle.
        let data = validVisitCaptureJSON.data(using: .utf8)!
        let capture = try JSONDecoder().decode(VisitCapture.self, from: data)
        let bundleData = try JSONEncoder().encode(capture.scanBundle)
        let result = validateScanBundle(bundleData)
        XCTAssertTrue(result.isValid)
    }

    // MARK: - ScanBundleV1 ignores unknown top-level keys (regression guard)

    func testScanBundleDecodesLegacyPayloadIgnoringUnknownKeys() throws {
        // Confirm ScanBundleV1 decodes a payload that has extra unknown keys
        // (e.g. a legacy payload that placed voiceNotes directly on the bundle).
        let data = validSingleRoomWithVoiceNotesJSON.data(using: .utf8)!
        let bundle = try JSONDecoder().decode(ScanBundleV1.self, from: data)
        XCTAssertEqual(bundle.bundleId, "fixture-voice-notes-001")
        XCTAssertEqual(bundle.rooms.count, 1)
    }

    // MARK: - SessionCaptureV1 — Codable round-trip

    func testSessionCaptureRoundTrip() throws {
        let data = validSessionCaptureJSON.data(using: .utf8)!
        let session = try JSONDecoder().decode(SessionCaptureV1.self, from: data)
        let reEncoded = try JSONEncoder().encode(session)
        let decoded = try JSONDecoder().decode(SessionCaptureV1.self, from: reEncoded)
        XCTAssertEqual(session, decoded)
    }

    func testSessionCaptureDecodesCorrectly() throws {
        let data = validSessionCaptureJSON.data(using: .utf8)!
        let session = try JSONDecoder().decode(SessionCaptureV1.self, from: data)
        XCTAssertEqual(session.version, "1.0")
        XCTAssertEqual(session.sessionId, "session-fixture-001")
        XCTAssertEqual(session.appointmentId, "appt-fixture-swift-001")
        XCTAssertEqual(session.status, .ready)
        XCTAssertEqual(session.completedAt, "2025-06-01T09:45:00Z")
        XCTAssertEqual(session.rooms.count, 2)
        XCTAssertEqual(session.objects.count, 2)
        XCTAssertEqual(session.photos.count, 3)
        XCTAssertEqual(session.audio.mode, "continuous")
        XCTAssertEqual(session.audio.segments.count, 2)
        XCTAssertEqual(session.notes.count, 2)
        XCTAssertEqual(session.events.count, 10)
    }

    func testSessionCapturePropertyDecodes() throws {
        let data = validSessionCaptureJSON.data(using: .utf8)!
        let session = try JSONDecoder().decode(SessionCaptureV1.self, from: data)
        let property = try XCTUnwrap(session.property)
        XCTAssertEqual(property.address, "14 Elm Street")
        XCTAssertEqual(property.postcode, "SW1A 1AA")
    }

    func testSessionCaptureDeviceDecodes() throws {
        let data = validSessionCaptureJSON.data(using: .utf8)!
        let session = try JSONDecoder().decode(SessionCaptureV1.self, from: data)
        let device = try XCTUnwrap(session.device)
        XCTAssertEqual(device.model, "iPhone 15 Pro")
        XCTAssertEqual(device.os, "iOS 17.4")
        XCTAssertEqual(device.appVersion, "1.0.0")
    }

    func testSessionCaptureRoomDecodes() throws {
        let data = validSessionCaptureJSON.data(using: .utf8)!
        let session = try JSONDecoder().decode(SessionCaptureV1.self, from: data)
        let boilerRoom = try XCTUnwrap(session.rooms.first { $0.roomId == "room-boilerroom-01" })
        XCTAssertEqual(boilerRoom.label, "Boiler Room")
        XCTAssertEqual(boilerRoom.status, .complete)
        let geometry = try XCTUnwrap(boilerRoom.geometry)
        XCTAssertEqual(geometry.meshRef, "mesh-boilerroom-01")
        XCTAssertEqual(geometry.bounds, [0.0, 0.0, 2.5, 3.0])
    }

    func testSessionCaptureObjectDecodes() throws {
        let data = validSessionCaptureJSON.data(using: .utf8)!
        let session = try JSONDecoder().decode(SessionCaptureV1.self, from: data)
        let boiler = try XCTUnwrap(session.objects.first { $0.objectId == "obj-boiler-01" })
        XCTAssertEqual(boiler.type, .boiler)
        XCTAssertEqual(boiler.status, .confirmed)
        XCTAssertEqual(boiler.roomId, "room-boilerroom-01")
        XCTAssertEqual(boiler.photoIds, ["photo-boiler-01", "photo-boiler-dataplate-01"])
        XCTAssertEqual(boiler.noteMarkerIds, ["marker-001"])
        let anchor = try XCTUnwrap(boiler.anchor)
        XCTAssertEqual(anchor.position, [1.2, 0.5, 0.8])
        XCTAssertEqual(anchor.confidence, 0.95)
        let metadata = try XCTUnwrap(boiler.metadata)
        XCTAssertEqual(metadata.subtype, "combi")
    }

    func testSessionCapturePhotoDecodes() throws {
        let data = validSessionCaptureJSON.data(using: .utf8)!
        let session = try JSONDecoder().decode(SessionCaptureV1.self, from: data)
        let dataplatePhoto = try XCTUnwrap(
            session.photos.first { $0.photoId == "photo-boiler-dataplate-01" }
        )
        XCTAssertEqual(dataplatePhoto.scope, .object)
        XCTAssertEqual(dataplatePhoto.objectId, "obj-boiler-01")
        XCTAssertEqual(dataplatePhoto.tags, ["data_plate"])
    }

    func testSessionCaptureAudioTranscriptionDecodes() throws {
        let data = validSessionCaptureJSON.data(using: .utf8)!
        let session = try JSONDecoder().decode(SessionCaptureV1.self, from: data)
        let transcription = try XCTUnwrap(session.audio.transcription)
        XCTAssertEqual(transcription.status, .complete)
        XCTAssertNotNil(transcription.text)
    }

    func testSessionCaptureNoteMarkerDecodes() throws {
        let data = validSessionCaptureJSON.data(using: .utf8)!
        let session = try JSONDecoder().decode(SessionCaptureV1.self, from: data)
        let marker = try XCTUnwrap(session.notes.first { $0.markerId == "marker-001" })
        XCTAssertEqual(marker.category, .observation)
        XCTAssertEqual(marker.objectId, "obj-boiler-01")
        XCTAssertEqual(marker.text, "Check flue clearance")
    }

    func testSessionCaptureEventDecodes() throws {
        let data = validSessionCaptureJSON.data(using: .utf8)!
        let session = try JSONDecoder().decode(SessionCaptureV1.self, from: data)
        let firstEvent = try XCTUnwrap(session.events.first)
        XCTAssertEqual(firstEvent.eventId, "evt-001")
        XCTAssertEqual(firstEvent.type, .roomAssigned)
        XCTAssertEqual(firstEvent.roomId, "room-boilerroom-01")
    }

    // MARK: - SessionCaptureV1 — default init

    func testSessionCaptureDefaultInit() {
        let session = SessionCaptureV1(
            sessionId: "test-session",
            appointmentId: "appt-test-001",
            startedAt: "2025-06-01T09:00:00Z",
            updatedAt: "2025-06-01T09:00:00Z",
            status: .active
        )
        XCTAssertEqual(session.version, "1.0")
        XCTAssertEqual(session.sessionId, "test-session")
        XCTAssertEqual(session.appointmentId, "appt-test-001")
        XCTAssertEqual(session.status, .active)
        XCTAssertNil(session.completedAt)
        XCTAssertNil(session.property)
        XCTAssertNil(session.device)
        XCTAssertTrue(session.rooms.isEmpty)
        XCTAssertTrue(session.objects.isEmpty)
        XCTAssertTrue(session.photos.isEmpty)
        XCTAssertTrue(session.notes.isEmpty)
        XCTAssertTrue(session.events.isEmpty)
        XCTAssertEqual(session.audio.mode, "continuous")
        XCTAssertTrue(session.audio.segments.isEmpty)
    }

    // MARK: - SessionCaptureV1 — enum raw values

    func testSessionStatusV1RawValues() {
        XCTAssertEqual(SessionStatusV1.active.rawValue, "active")
        XCTAssertEqual(SessionStatusV1.review.rawValue, "review")
        XCTAssertEqual(SessionStatusV1.ready.rawValue, "ready")
        XCTAssertEqual(SessionStatusV1.synced.rawValue, "synced")
    }

    func testCapturedObjectTypeRawValues() {
        XCTAssertEqual(CapturedObjectType.radiator.rawValue, "radiator")
        XCTAssertEqual(CapturedObjectType.boiler.rawValue, "boiler")
        XCTAssertEqual(CapturedObjectType.cylinder.rawValue, "cylinder")
        XCTAssertEqual(CapturedObjectType.thermostat.rawValue, "thermostat")
        XCTAssertEqual(CapturedObjectType.flue.rawValue, "flue")
        XCTAssertEqual(CapturedObjectType.pipe.rawValue, "pipe")
        XCTAssertEqual(CapturedObjectType.consumerUnit.rawValue, "consumer_unit")
        XCTAssertEqual(CapturedObjectType.other.rawValue, "other")
    }

    func testSessionEventTypeRawValues() {
        XCTAssertEqual(SessionEventType.roomAssigned.rawValue, "room_assigned")
        XCTAssertEqual(SessionEventType.objectAdded.rawValue, "object_added")
        XCTAssertEqual(SessionEventType.photoTaken.rawValue, "photo_taken")
        XCTAssertEqual(SessionEventType.noteMarkerAdded.rawValue, "note_marker_added")
        XCTAssertEqual(SessionEventType.roomFinished.rawValue, "room_finished")
    }

    func testNoteMarkerCategoryRawValues() {
        XCTAssertEqual(NoteMarkerCategory.constraint.rawValue, "constraint")
        XCTAssertEqual(NoteMarkerCategory.observation.rawValue, "observation")
        XCTAssertEqual(NoteMarkerCategory.preference.rawValue, "preference")
        XCTAssertEqual(NoteMarkerCategory.risk.rawValue, "risk")
        XCTAssertEqual(NoteMarkerCategory.followUp.rawValue, "follow_up")
    }

    func testPhotoScopeRawValues() {
        XCTAssertEqual(PhotoScope.session.rawValue, "session")
        XCTAssertEqual(PhotoScope.room.rawValue, "room")
        XCTAssertEqual(PhotoScope.object.rawValue, "object")
    }

    func testAudioTranscriptionStatusRawValues() {
        XCTAssertEqual(AudioTranscriptionStatus.pending.rawValue, "pending")
        XCTAssertEqual(AudioTranscriptionStatus.processing.rawValue, "processing")
        XCTAssertEqual(AudioTranscriptionStatus.complete.rawValue, "complete")
    }

    // MARK: - InstallMarkup — Codable round-trip

    func testInstallObjectModelV1RoundTrip() throws {
        let obj = InstallObjectModelV1(
            id: "obj-001",
            type: .boiler,
            position: ScanPoint3D(x: 1.0, y: 2.0, z: 0.0),
            dimensions: InstallDimensions(widthM: 0.5, depthM: 0.4, heightM: 0.7),
            orientation: InstallOrientation(yawDeg: 90),
            source: .scan
        )
        let encoded = try JSONEncoder().encode(obj)
        let decoded = try JSONDecoder().decode(InstallObjectModelV1.self, from: encoded)
        XCTAssertEqual(obj, decoded)
        XCTAssertEqual(decoded.type, .boiler)
        XCTAssertEqual(decoded.source, .scan)
        XCTAssertEqual(decoded.position.x, 1.0)
        XCTAssertEqual(decoded.dimensions.widthM, 0.5)
        XCTAssertEqual(decoded.orientation.yawDeg, 90)
    }

    func testInstallRouteModelV1RoundTrip() throws {
        let route = InstallRouteModelV1(
            id: "route-001",
            kind: .flow,
            diameterMm: 22,
            path: [
                InstallPathPoint(x: 0.0, y: 0.0, z: 0.0),
                InstallPathPoint(x: 1.0, y: 0.0, z: 0.0, elevationOffsetM: 2.4),
            ],
            mounting: .surface,
            confidence: .measured
        )
        let encoded = try JSONEncoder().encode(route)
        let decoded = try JSONDecoder().decode(InstallRouteModelV1.self, from: encoded)
        XCTAssertEqual(route, decoded)
        XCTAssertEqual(decoded.kind, .flow)
        XCTAssertEqual(decoded.diameterMm, 22)
        XCTAssertEqual(decoded.path.count, 2)
        XCTAssertEqual(decoded.path[1].elevationOffsetM, 2.4)
        XCTAssertNil(decoded.path[0].elevationOffsetM)
        XCTAssertEqual(decoded.mounting, .surface)
        XCTAssertEqual(decoded.confidence, .measured)
    }

    func testInstallLayerModelV1RoundTrip() throws {
        let layer = InstallLayerModelV1(
            existing: [
                InstallRouteModelV1(
                    id: "route-existing-001",
                    kind: .return,
                    diameterMm: 15,
                    path: [InstallPathPoint(x: 0, y: 0, z: 0)],
                    mounting: .boxed,
                    confidence: .measured
                ),
            ],
            proposed: [
                InstallRouteModelV1(
                    id: "route-proposed-001",
                    kind: .gas,
                    diameterMm: 22,
                    path: [InstallPathPoint(x: 0, y: 0, z: 0), InstallPathPoint(x: 2, y: 0, z: 0)],
                    mounting: .surface,
                    confidence: .drawn
                ),
            ],
            notes: [
                InstallAnnotation(id: "note-001", text: "Low ceiling clearance"),
                InstallAnnotation(
                    id: "note-002",
                    text: "Existing route reusable",
                    position: ScanPoint3D(x: 1.5, y: 0.5, z: 0.0)
                ),
            ]
        )
        let encoded = try JSONEncoder().encode(layer)
        let decoded = try JSONDecoder().decode(InstallLayerModelV1.self, from: encoded)
        XCTAssertEqual(layer, decoded)
        XCTAssertEqual(decoded.existing.count, 1)
        XCTAssertEqual(decoded.proposed.count, 1)
        XCTAssertEqual(decoded.notes.count, 2)
        XCTAssertNil(decoded.notes[0].position)
        XCTAssertNotNil(decoded.notes[1].position)
    }

    func testInstallLayerModelV1EmptyRoundTrip() throws {
        let layer = InstallLayerModelV1(existing: [], proposed: [], notes: [])
        let encoded = try JSONEncoder().encode(layer)
        let decoded = try JSONDecoder().decode(InstallLayerModelV1.self, from: encoded)
        XCTAssertEqual(layer, decoded)
        XCTAssertTrue(decoded.existing.isEmpty)
        XCTAssertTrue(decoded.proposed.isEmpty)
        XCTAssertTrue(decoded.notes.isEmpty)
    }

    // MARK: - InstallMarkup — enum raw values

    func testInstallObjectTypeRawValues() {
        XCTAssertEqual(InstallObjectType.boiler.rawValue, "boiler")
        XCTAssertEqual(InstallObjectType.cylinder.rawValue, "cylinder")
        XCTAssertEqual(InstallObjectType.radiator.rawValue, "radiator")
        XCTAssertEqual(InstallObjectType.thermostat.rawValue, "thermostat")
        XCTAssertEqual(InstallObjectType.flue.rawValue, "flue")
        XCTAssertEqual(InstallObjectType.pump.rawValue, "pump")
        XCTAssertEqual(InstallObjectType.valve.rawValue, "valve")
        XCTAssertEqual(InstallObjectType.consumerUnit.rawValue, "consumer_unit")
        XCTAssertEqual(InstallObjectType.other.rawValue, "other")
    }

    func testInstallObjectSourceRawValues() {
        XCTAssertEqual(InstallObjectSource.scan.rawValue, "scan")
        XCTAssertEqual(InstallObjectSource.manual.rawValue, "manual")
        XCTAssertEqual(InstallObjectSource.inferred.rawValue, "inferred")
    }

    func testInstallRouteKindRawValues() {
        XCTAssertEqual(InstallRouteKind.flow.rawValue, "flow")
        XCTAssertEqual(InstallRouteKind.return.rawValue, "return")
        XCTAssertEqual(InstallRouteKind.gas.rawValue, "gas")
        XCTAssertEqual(InstallRouteKind.cold.rawValue, "cold")
        XCTAssertEqual(InstallRouteKind.hot.rawValue, "hot")
        XCTAssertEqual(InstallRouteKind.flue.rawValue, "flue")
        XCTAssertEqual(InstallRouteKind.other.rawValue, "other")
    }

    func testInstallMountingRawValues() {
        XCTAssertEqual(InstallMounting.surface.rawValue, "surface")
        XCTAssertEqual(InstallMounting.boxed.rawValue, "boxed")
        XCTAssertEqual(InstallMounting.buried.rawValue, "buried")
        XCTAssertEqual(InstallMounting.other.rawValue, "other")
    }

    func testInstallRouteConfidenceRawValues() {
        XCTAssertEqual(InstallRouteConfidence.measured.rawValue, "measured")
        XCTAssertEqual(InstallRouteConfidence.drawn.rawValue, "drawn")
        XCTAssertEqual(InstallRouteConfidence.estimated.rawValue, "estimated")
    }

    // MARK: - InstallMarkup — JSON decode from raw JSON

    func testInstallObjectDecodesFromJSON() throws {
        let json = """
        {
          "id": "obj-boiler-01",
          "type": "boiler",
          "position": { "x": 1.2, "y": 0.5, "z": 0.0 },
          "dimensions": { "widthM": 0.6, "depthM": 0.4, "heightM": 0.8 },
          "orientation": { "yawDeg": 180 },
          "source": "manual"
        }
        """
        let obj = try JSONDecoder().decode(InstallObjectModelV1.self, from: json.data(using: .utf8)!)
        XCTAssertEqual(obj.id, "obj-boiler-01")
        XCTAssertEqual(obj.type, .boiler)
        XCTAssertEqual(obj.source, .manual)
        XCTAssertEqual(obj.position.x, 1.2)
        XCTAssertEqual(obj.dimensions.heightM, 0.8)
        XCTAssertEqual(obj.orientation.yawDeg, 180)
    }

    func testInstallRouteDecodesFromJSON() throws {
        let json = """
        {
          "id": "route-flow-01",
          "kind": "flow",
          "diameterMm": 22,
          "path": [
            { "x": 0.0, "y": 0.0, "z": 0.0 },
            { "x": 3.0, "y": 0.0, "z": 0.0, "elevationOffsetM": 2.1 }
          ],
          "mounting": "boxed",
          "confidence": "drawn"
        }
        """
        let route = try JSONDecoder().decode(InstallRouteModelV1.self, from: json.data(using: .utf8)!)
        XCTAssertEqual(route.id, "route-flow-01")
        XCTAssertEqual(route.kind, .flow)
        XCTAssertEqual(route.diameterMm, 22)
        XCTAssertEqual(route.path.count, 2)
        XCTAssertNil(route.path[0].elevationOffsetM)
        XCTAssertEqual(route.path[1].elevationOffsetM, 2.1)
        XCTAssertEqual(route.mounting, .boxed)
        XCTAssertEqual(route.confidence, .drawn)
    }
}

// MARK: - Fixtures

private let validSingleRoomJSON = """
{
  "version": "1.0",
  "bundleId": "fixture-single-room-001",
  "rooms": [
    {
      "id": "room-living-01",
      "label": "Living Room",
      "floorIndex": 0,
      "polygon": [
        { "x": 0.0, "y": 0.0 },
        { "x": 4.5, "y": 0.0 },
        { "x": 4.5, "y": 3.8 },
        { "x": 0.0, "y": 3.8 }
      ],
      "areaM2": 17.1,
      "heightM": 2.4,
      "walls": [
        {
          "id": "wall-north-01",
          "start": { "x": 0.0, "y": 0.0, "z": 0.0 },
          "end": { "x": 4.5, "y": 0.0, "z": 0.0 },
          "heightM": 2.4,
          "thicknessMm": 280,
          "kind": "external",
          "openings": [
            {
              "id": "opening-window-01",
              "widthM": 1.2,
              "heightM": 1.1,
              "offsetM": 1.6,
              "type": "window",
              "confidence": "high"
            }
          ],
          "confidence": "high"
        }
      ],
      "detectedObjects": [
        {
          "id": "obj-sofa-01",
          "category": "furniture",
          "label": "sofa",
          "boundingBox": { "minX": 0.5, "minY": 0.5, "maxX": 2.5, "maxY": 1.2, "minZ": 0.0, "maxZ": 0.8 },
          "confidence": "high"
        }
      ],
      "confidence": "high"
    }
  ],
  "anchors": [],
  "qaFlags": [],
  "meta": {
    "capturedAt": "2025-06-01T10:00:00Z",
    "deviceModel": "iPhone 15 Pro",
    "scannerApp": "AtlasScan 1.0.0",
    "coordinateConvention": "metric_m",
    "propertyRef": "visit-fixture-001",
    "operatorNotes": "Clear scan, good lighting"
  }
}
"""

private let validSingleRoomWithVoiceNotesJSON = """
{
  "version": "1.0",
  "bundleId": "fixture-voice-notes-001",
  "rooms": [
    {
      "id": "room-living-01",
      "label": "Living Room",
      "floorIndex": 0,
      "polygon": [
        { "x": 0.0, "y": 0.0 },
        { "x": 4.5, "y": 0.0 },
        { "x": 4.5, "y": 3.8 },
        { "x": 0.0, "y": 3.8 }
      ],
      "areaM2": 17.1,
      "heightM": 2.4,
      "walls": [],
      "detectedObjects": [],
      "confidence": "high"
    }
  ],
  "anchors": [],
  "qaFlags": [],
  "meta": {
    "capturedAt": "2025-06-01T10:00:00Z",
    "deviceModel": "iPhone 15 Pro",
    "scannerApp": "AtlasScan 1.0.0",
    "coordinateConvention": "metric_m"
  },
  "voiceNotes": [
    {
      "id": "00000000-0000-0000-0000-000000000010",
      "createdAt": "2025-06-01T10:05:00Z",
      "duration": 12.5,
      "localFilename": "note-001.m4a",
      "remoteAssetID": "asset-remote-001",
      "linkedRoomID": "00000000-0000-0000-0000-000000000020",
      "kind": "observation",
      "caption": "Check the radiator",
      "transcript": "Check the radiator in the corner",
      "transcriptStatus": "complete",
      "syncState": "uploaded"
    },
    {
      "id": "00000000-0000-0000-0000-000000000011",
      "createdAt": "2025-06-01T10:08:00Z",
      "duration": 6.0,
      "kind": "customerPreference"
    }
  ]
}
"""

/// A VisitCapture payload with two voice notes — used by VisitCapture tests.
private let validVisitCaptureJSON = """
{
  "scanBundle": {
    "version": "1.0",
    "bundleId": "fixture-visit-capture-001",
    "rooms": [
      {
        "id": "room-living-01",
        "label": "Living Room",
        "floorIndex": 0,
        "polygon": [
          { "x": 0.0, "y": 0.0 },
          { "x": 4.5, "y": 0.0 },
          { "x": 4.5, "y": 3.8 },
          { "x": 0.0, "y": 3.8 }
        ],
        "areaM2": 17.1,
        "heightM": 2.4,
        "walls": [],
        "detectedObjects": [],
        "confidence": "high"
      }
    ],
    "anchors": [],
    "qaFlags": [],
    "meta": {
      "capturedAt": "2025-06-01T10:00:00Z",
      "deviceModel": "iPhone 15 Pro",
      "scannerApp": "AtlasScan 1.0.0",
      "coordinateConvention": "metric_m"
    }
  },
  "voiceNotes": [
    {
      "id": "00000000-0000-0000-0000-000000000010",
      "createdAt": "2025-06-01T10:05:00Z",
      "duration": 12.5,
      "localFilename": "note-001.m4a",
      "remoteAssetID": "asset-remote-001",
      "linkedRoomID": "00000000-0000-0000-0000-000000000020",
      "kind": "observation",
      "caption": "Check the radiator",
      "transcript": "Check the radiator in the corner",
      "transcriptStatus": "complete",
      "syncState": "uploaded"
    },
    {
      "id": "00000000-0000-0000-0000-000000000011",
      "createdAt": "2025-06-01T10:08:00Z",
      "duration": 6.0,
      "kind": "customerPreference"
    }
  ]
}
"""

/// A full SessionCaptureV1 fixture with two rooms, two objects, three photos,
/// two audio segments, two note markers, and ten events.
private let validSessionCaptureJSON = """
{
  "version": "1.0",
  "sessionId": "session-fixture-001",
  "appointmentId": "appt-fixture-swift-001",
  "startedAt": "2025-06-01T09:00:00Z",
  "updatedAt": "2025-06-01T09:45:00Z",
  "completedAt": "2025-06-01T09:45:00Z",
  "status": "ready",
  "property": {
    "address": "14 Elm Street",
    "postcode": "SW1A 1AA"
  },
  "rooms": [
    {
      "roomId": "room-kitchen-01",
      "label": "Kitchen",
      "status": "complete"
    },
    {
      "roomId": "room-boilerroom-01",
      "label": "Boiler Room",
      "status": "complete",
      "geometry": {
        "meshRef": "mesh-boilerroom-01",
        "bounds": [0.0, 0.0, 2.5, 3.0]
      }
    }
  ],
  "objects": [
    {
      "objectId": "obj-boiler-01",
      "type": "boiler",
      "roomId": "room-boilerroom-01",
      "anchor": {
        "position": [1.2, 0.5, 0.8],
        "normal": [0.0, 1.0, 0.0],
        "confidence": 0.95
      },
      "status": "confirmed",
      "metadata": {
        "subtype": "combi",
        "notes": "Worcester Bosch 28i, installed 2019"
      },
      "photoIds": ["photo-boiler-01", "photo-boiler-dataplate-01"],
      "noteMarkerIds": ["marker-001"]
    },
    {
      "objectId": "obj-radiator-01",
      "type": "radiator",
      "roomId": "room-kitchen-01",
      "status": "placed",
      "photoIds": [],
      "noteMarkerIds": []
    }
  ],
  "photos": [
    {
      "photoId": "photo-boiler-01",
      "uri": "file:///captures/session-001/photos/boiler-front.jpg",
      "createdAt": "2025-06-01T09:15:00Z",
      "scope": "object",
      "objectId": "obj-boiler-01",
      "tags": ["condition"]
    },
    {
      "photoId": "photo-boiler-dataplate-01",
      "uri": "file:///captures/session-001/photos/boiler-dataplate.jpg",
      "createdAt": "2025-06-01T09:16:00Z",
      "scope": "object",
      "objectId": "obj-boiler-01",
      "tags": ["data_plate"]
    },
    {
      "photoId": "photo-kitchen-overview-01",
      "uri": "file:///captures/session-001/photos/kitchen-overview.jpg",
      "createdAt": "2025-06-01T09:30:00Z",
      "scope": "room",
      "roomId": "room-kitchen-01"
    }
  ],
  "audio": {
    "mode": "continuous",
    "segments": [
      {
        "segmentId": "seg-001",
        "uri": "file:///captures/session-001/audio/seg-001.m4a",
        "startedAt": "2025-06-01T09:00:05Z",
        "endedAt": "2025-06-01T09:20:00Z"
      },
      {
        "segmentId": "seg-002",
        "uri": "file:///captures/session-001/audio/seg-002.m4a",
        "startedAt": "2025-06-01T09:20:10Z",
        "endedAt": "2025-06-01T09:44:55Z"
      }
    ],
    "transcription": {
      "status": "complete",
      "text": "Starting in the boiler room."
    }
  },
  "notes": [
    {
      "markerId": "marker-001",
      "createdAt": "2025-06-01T09:15:30Z",
      "objectId": "obj-boiler-01",
      "category": "observation",
      "text": "Check flue clearance"
    },
    {
      "markerId": "marker-002",
      "createdAt": "2025-06-01T09:32:00Z",
      "roomId": "room-kitchen-01",
      "category": "constraint",
      "text": "Limited access behind units"
    }
  ],
  "events": [
    {
      "eventId": "evt-001",
      "type": "room_assigned",
      "timestamp": "2025-06-01T09:01:00Z",
      "roomId": "room-boilerroom-01"
    },
    {
      "eventId": "evt-002",
      "type": "object_added",
      "timestamp": "2025-06-01T09:10:00Z",
      "objectId": "obj-boiler-01",
      "roomId": "room-boilerroom-01"
    },
    {
      "eventId": "evt-003",
      "type": "photo_taken",
      "timestamp": "2025-06-01T09:15:00Z",
      "objectId": "obj-boiler-01"
    },
    {
      "eventId": "evt-004",
      "type": "note_marker_added",
      "timestamp": "2025-06-01T09:15:30Z",
      "objectId": "obj-boiler-01"
    },
    {
      "eventId": "evt-005",
      "type": "room_finished",
      "timestamp": "2025-06-01T09:20:00Z",
      "roomId": "room-boilerroom-01"
    },
    {
      "eventId": "evt-006",
      "type": "room_assigned",
      "timestamp": "2025-06-01T09:21:00Z",
      "roomId": "room-kitchen-01"
    },
    {
      "eventId": "evt-007",
      "type": "object_added",
      "timestamp": "2025-06-01T09:25:00Z",
      "objectId": "obj-radiator-01",
      "roomId": "room-kitchen-01"
    },
    {
      "eventId": "evt-008",
      "type": "photo_taken",
      "timestamp": "2025-06-01T09:30:00Z",
      "roomId": "room-kitchen-01"
    },
    {
      "eventId": "evt-009",
      "type": "note_marker_added",
      "timestamp": "2025-06-01T09:32:00Z",
      "roomId": "room-kitchen-01"
    },
    {
      "eventId": "evt-010",
      "type": "room_finished",
      "timestamp": "2025-06-01T09:44:00Z",
      "roomId": "room-kitchen-01"
    }
  ],
  "device": {
    "model": "iPhone 15 Pro",
    "os": "iOS 17.4",
    "appVersion": "1.0.0"
  }
}
"""
