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

    // MARK: - ScanBundleV1 backward-compatible decode (no voiceNotes field)

    func testScanBundleDecodesWithoutVoiceNotesField() throws {
        let data = validSingleRoomJSON.data(using: .utf8)!
        let bundle = try JSONDecoder().decode(ScanBundleV1.self, from: data)
        XCTAssertEqual(bundle.voiceNotes, [])
    }

    // MARK: - ScanBundleV1 round-trip with embedded voice notes

    func testScanBundleRoundTripWithVoiceNotes() throws {
        let data = validSingleRoomWithVoiceNotesJSON.data(using: .utf8)!
        let bundle = try JSONDecoder().decode(ScanBundleV1.self, from: data)
        XCTAssertEqual(bundle.voiceNotes.count, 2)

        let first = try XCTUnwrap(bundle.voiceNotes.first)
        XCTAssertEqual(first.kind, .observation)
        XCTAssertEqual(first.transcriptStatus, .complete)
        XCTAssertEqual(first.syncState, .uploaded)
        XCTAssertEqual(first.transcript, "Check the radiator in the corner")

        let second = bundle.voiceNotes[1]
        XCTAssertEqual(second.kind, .customerPreference)
        XCTAssertEqual(second.transcriptStatus, .notRequested)
        XCTAssertEqual(second.syncState, .localOnly)

        // Encode and decode again to verify full round-trip.
        let reEncoded = try JSONEncoder().encode(bundle)
        let decoded = try JSONDecoder().decode(ScanBundleV1.self, from: reEncoded)
        XCTAssertEqual(bundle, decoded)
    }

    func testScanBundleValidationAcceptsBundleWithVoiceNotes() {
        let result = validateScanBundle(validSingleRoomWithVoiceNotesJSON)
        XCTAssertTrue(result.isValid)
        XCTAssertEqual(result.bundle?.voiceNotes.count, 2)
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
