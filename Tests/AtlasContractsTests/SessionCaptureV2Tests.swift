// SessionCaptureV2Tests.swift
//
// Tests for the SessionCaptureV2 capture-evidence contract.
//
// Coverage:
//   1.  encode/decode empty capture (all arrays empty)
//   2.  encode/decode photo (includeInCustomerReport, cameraMode)
//   3.  encode/decode object pin (objectType, anchorConfidence, location)
//   4.  encode/decode pipe route (routeType, status, points)
//   5.  encode/decode point cloud asset (format, includeInCustomerReport)
//   6.  version discriminant is always "2.0"
//   7.  ReviewStatusV1 round-trips all values
//   8.  CaptureProvenanceV1 round-trips all values
//   9.  encode/decode transcript (source variants)
//   10. encode/decode room (provenance, reviewStatus, linkedRoomIds)

import XCTest
@testable import AtlasContracts

final class SessionCaptureV2Tests: XCTestCase {

    private let encoder: JSONEncoder = {
        let e = JSONEncoder()
        e.outputFormatting = [.sortedKeys]
        return e
    }()

    private let decoder = JSONDecoder()

    // ─── Helpers ───────────────────────────────────────────────────────────────

    private func roundTrip<T: Codable & Equatable>(_ value: T) throws -> T {
        let data = try encoder.encode(value)
        return try decoder.decode(T.self, from: data)
    }

    private func makeEmptyCapture() -> SessionCaptureV2 {
        SessionCaptureV2(
            visitId: "visit-001",
            createdAt: "2025-01-01T09:00:00Z",
            updatedAt: "2025-01-01T09:00:00Z"
        )
    }

    // ─── 1. Empty capture ──────────────────────────────────────────────────────

    func test_01_encodeDecodeEmptyCapture() throws {
        let original = makeEmptyCapture()
        let decoded = try roundTrip(original)

        XCTAssertEqual(decoded.version, "2.0")
        XCTAssertEqual(decoded.visitId, "visit-001")
        XCTAssertTrue(decoded.rooms.isEmpty)
        XCTAssertTrue(decoded.photos.isEmpty)
        XCTAssertTrue(decoded.transcripts.isEmpty)
        XCTAssertTrue(decoded.objectPins.isEmpty)
        XCTAssertTrue(decoded.pipeRoutes.isEmpty)
        XCTAssertTrue(decoded.pointCloudAssets.isEmpty)
        XCTAssertNil(decoded.visitNumber)
        XCTAssertNil(decoded.brandId)
    }

    // ─── 2. Photo ──────────────────────────────────────────────────────────────

    func test_02_encodeDecodePhoto() throws {
        let photo = CapturePhotoV1(
            id: "photo-001",
            roomId: "room-001",
            provenance: .photo,
            reviewStatus: .confirmed,
            capturedAt: "2025-01-01T09:05:00Z",
            uri: "file:///photos/boiler.jpg",
            label: "Boiler front",
            objectId: "pin-001",
            includeInCustomerReport: false,
            cameraMode: .standard
        )

        let decoded = try roundTrip(photo)
        XCTAssertEqual(decoded.id, "photo-001")
        XCTAssertEqual(decoded.roomId, "room-001")
        XCTAssertEqual(decoded.provenance, .photo)
        XCTAssertEqual(decoded.reviewStatus, .confirmed)
        XCTAssertEqual(decoded.uri, "file:///photos/boiler.jpg")
        XCTAssertEqual(decoded.label, "Boiler front")
        XCTAssertEqual(decoded.objectId, "pin-001")
        XCTAssertFalse(decoded.includeInCustomerReport)
        XCTAssertEqual(decoded.cameraMode, .standard)

        // Verify kind discriminant is encoded
        let json = try encoder.encode(photo)
        let dict = try JSONSerialization.jsonObject(with: json) as? [String: Any]
        XCTAssertEqual(dict?["kind"] as? String, "photo")
    }

    func test_02b_photoIncludeInCustomerReportTrue() throws {
        let photo = CapturePhotoV1(
            id: "photo-overview",
            provenance: .photo,
            reviewStatus: .confirmed,
            capturedAt: "2025-01-01T09:06:00Z",
            uri: "file:///photos/overview.jpg",
            includeInCustomerReport: true
        )

        let decoded = try roundTrip(photo)
        XCTAssertTrue(decoded.includeInCustomerReport)
        XCTAssertNil(decoded.objectId)
        XCTAssertNil(decoded.cameraMode)
    }

    // ─── 3. Object pin ─────────────────────────────────────────────────────────

    func test_03_encodeDecodeObjectPin() throws {
        let location = CapturePoint3DV1(x: 1.2, y: 3.4, z: 0.8, coordinateSpace: .roomPlan)
        let pin = CaptureObjectPinV1(
            id: "pin-001",
            roomId: "room-001",
            provenance: .manual,
            reviewStatus: .confirmed,
            capturedAt: "2025-01-01T09:10:00Z",
            objectType: .boiler,
            label: "Worcester 30i",
            location: location,
            anchorConfidence: .worldLocked
        )

        let decoded = try roundTrip(pin)
        XCTAssertEqual(decoded.id, "pin-001")
        XCTAssertEqual(decoded.objectType, .boiler)
        XCTAssertEqual(decoded.label, "Worcester 30i")
        XCTAssertEqual(decoded.reviewStatus, .confirmed)
        XCTAssertEqual(decoded.provenance, .manual)
        XCTAssertEqual(decoded.location.x, 1.2)
        XCTAssertEqual(decoded.location.y, 3.4)
        XCTAssertEqual(decoded.location.z, 0.8)
        XCTAssertEqual(decoded.location.coordinateSpace, .roomPlan)
        XCTAssertEqual(decoded.anchorConfidence, .worldLocked)

        // Verify kind discriminant
        let json = try encoder.encode(pin)
        let dict = try JSONSerialization.jsonObject(with: json) as? [String: Any]
        XCTAssertEqual(dict?["kind"] as? String, "object_pin")
    }

    func test_03b_objectPinPendingScanned() throws {
        let pin = CaptureObjectPinV1(
            id: "pin-scanned",
            provenance: .scan,
            reviewStatus: .pending,
            capturedAt: "2025-01-01T09:11:00Z",
            objectType: .radiator,
            location: CapturePoint3DV1(x: 0, y: 0, coordinateSpace: .floorPlan),
            anchorConfidence: .raycastEstimated
        )

        let decoded = try roundTrip(pin)
        XCTAssertEqual(decoded.reviewStatus, .pending)
        XCTAssertEqual(decoded.provenance, .scan)
        XCTAssertEqual(decoded.anchorConfidence, .raycastEstimated)
    }

    // ─── 4. Pipe route ─────────────────────────────────────────────────────────

    func test_04_encodeDecodePipeRoute() throws {
        let points = [
            CapturePoint3DV1(x: 0, y: 0, coordinateSpace: .roomPlan),
            CapturePoint3DV1(x: 1, y: 0, coordinateSpace: .roomPlan),
            CapturePoint3DV1(x: 1, y: 1, coordinateSpace: .roomPlan),
        ]

        let route = CapturePipeRouteV1(
            id: "route-001",
            roomId: "room-001",
            provenance: .manual,
            reviewStatus: .confirmed,
            capturedAt: "2025-01-01T09:15:00Z",
            routeType: .heatingFlow,
            status: .existing,
            points: points
        )

        let decoded = try roundTrip(route)
        XCTAssertEqual(decoded.id, "route-001")
        XCTAssertEqual(decoded.routeType, .heatingFlow)
        XCTAssertEqual(decoded.status, .existing)
        XCTAssertEqual(decoded.points.count, 3)
        XCTAssertEqual(decoded.points[1].x, 1)

        // Verify kind discriminant
        let json = try encoder.encode(route)
        let dict = try JSONSerialization.jsonObject(with: json) as? [String: Any]
        XCTAssertEqual(dict?["kind"] as? String, "pipe_route")
    }

    func test_04b_pipeRouteStatusVariants() throws {
        let statuses: [PipeRouteStatus] = [.existing, .proposed, .assumed]

        for status in statuses {
            let route = CapturePipeRouteV1(
                id: "route-\(status.rawValue)",
                provenance: .manual,
                reviewStatus: .confirmed,
                capturedAt: "2025-01-01T09:16:00Z",
                routeType: .gas,
                status: status,
                points: [CapturePoint3DV1(x: 0, y: 0, coordinateSpace: .roomPlan)]
            )

            let decoded = try roundTrip(route)
            XCTAssertEqual(decoded.status, status)
        }
    }

    // ─── 5. Point cloud asset ──────────────────────────────────────────────────

    func test_05_encodeDecodePointCloudAsset() throws {
        let asset = CapturePointCloudAssetV1(
            id: "pca-001",
            roomId: "room-001",
            provenance: .scan,
            reviewStatus: .confirmed,
            capturedAt: "2025-01-01T09:20:00Z",
            uri: "file:///scans/kitchen.usdz",
            format: .usdz,
            label: "Kitchen scan",
            includeInCustomerReport: false
        )

        let decoded = try roundTrip(asset)
        XCTAssertEqual(decoded.id, "pca-001")
        XCTAssertEqual(decoded.format, .usdz)
        XCTAssertEqual(decoded.label, "Kitchen scan")
        XCTAssertFalse(decoded.includeInCustomerReport)

        // Verify kind discriminant
        let json = try encoder.encode(asset)
        let dict = try JSONSerialization.jsonObject(with: json) as? [String: Any]
        XCTAssertEqual(dict?["kind"] as? String, "point_cloud_asset")
    }

    func test_05b_pointCloudFormatVariants() throws {
        let formats: [PointCloudFormat] = [.usdz, .ply, .las, .e57, .imageDepth, .other]

        for format in formats {
            let asset = CapturePointCloudAssetV1(
                id: "pca-\(format.rawValue)",
                provenance: .scan,
                reviewStatus: .pending,
                capturedAt: "2025-01-01T09:21:00Z",
                uri: "file:///scans/scan.\(format.rawValue)",
                format: format,
                includeInCustomerReport: false
            )

            let decoded = try roundTrip(asset)
            XCTAssertEqual(decoded.format, format)
        }
    }

    // ─── 6. Version discriminant ───────────────────────────────────────────────

    func test_06_versionDiscriminant() throws {
        let capture = makeEmptyCapture()
        XCTAssertEqual(capture.version, "2.0")

        let decoded = try roundTrip(capture)
        XCTAssertEqual(decoded.version, "2.0")
    }

    // ─── 7. ReviewStatusV1 round-trips ────────────────────────────────────────

    func test_07_reviewStatusRoundTrips() throws {
        let statuses: [ReviewStatusV1] = [.pending, .confirmed, .rejected]

        for status in statuses {
            let encoded = try encoder.encode(status)
            let decoded = try decoder.decode(ReviewStatusV1.self, from: encoded)
            XCTAssertEqual(decoded, status)
        }
    }

    // ─── 8. CaptureProvenanceV1 round-trips ───────────────────────────────────

    func test_08_captureProvenanceRoundTrips() throws {
        let provenances: [CaptureProvenanceV1] = [
            .manual, .scan, .photo, .transcript, .inferred, .imported
        ]

        for provenance in provenances {
            let encoded = try encoder.encode(provenance)
            let decoded = try decoder.decode(CaptureProvenanceV1.self, from: encoded)
            XCTAssertEqual(decoded, provenance)
        }
    }

    // ─── 9. Transcript ─────────────────────────────────────────────────────────

    func test_09_encodeDecodeTranscript() throws {
        let sources: [TranscriptSource] = [.voiceNote, .dictation, .manualNote]

        for source in sources {
            let transcript = CaptureTranscriptV1(
                id: "t-\(source.rawValue)",
                provenance: .transcript,
                reviewStatus: .confirmed,
                capturedAt: "2025-01-01T09:25:00Z",
                text: "Engineer note text.",
                source: source
            )

            let decoded = try roundTrip(transcript)
            XCTAssertEqual(decoded.source, source)
            XCTAssertEqual(decoded.text, "Engineer note text.")

            // Verify kind discriminant
            let json = try encoder.encode(transcript)
            let dict = try JSONSerialization.jsonObject(with: json) as? [String: Any]
            XCTAssertEqual(dict?["kind"] as? String, "transcript")
        }
    }

    // ─── 10. Room ──────────────────────────────────────────────────────────────

    func test_10_encodeDecodeRoom() throws {
        let room = CaptureRoomV1(
            id: "room-001",
            name: "Kitchen",
            floorIndex: 0,
            linkedRoomIds: ["room-002"],
            reviewStatus: .confirmed,
            provenance: .scan
        )

        let decoded = try roundTrip(room)
        XCTAssertEqual(decoded.id, "room-001")
        XCTAssertEqual(decoded.name, "Kitchen")
        XCTAssertEqual(decoded.floorIndex, 0)
        XCTAssertEqual(decoded.linkedRoomIds, ["room-002"])
        XCTAssertEqual(decoded.reviewStatus, .confirmed)
        XCTAssertEqual(decoded.provenance, .scan)
    }

    func test_10b_roomOptionalFields() throws {
        let room = CaptureRoomV1(
            id: "room-002",
            reviewStatus: .pending,
            provenance: .manual
        )

        let decoded = try roundTrip(room)
        XCTAssertNil(decoded.name)
        XCTAssertNil(decoded.floorIndex)
        XCTAssertNil(decoded.linkedRoomIds)
    }

    // ─── Full capture round-trip ───────────────────────────────────────────────

    func test_fullCaptureRoundTrip() throws {
        let capture = SessionCaptureV2(
            visitId: "visit-full",
            visitNumber: "VN-0042",
            brandId: "brand-abc",
            rooms: [
                CaptureRoomV1(id: "room-001", name: "Boiler Room", reviewStatus: .confirmed, provenance: .scan)
            ],
            photos: [
                CapturePhotoV1(
                    id: "photo-001",
                    provenance: .photo,
                    reviewStatus: .confirmed,
                    capturedAt: "2025-01-01T09:05:00Z",
                    uri: "file:///photos/boiler.jpg",
                    includeInCustomerReport: false
                )
            ],
            transcripts: [
                CaptureTranscriptV1(
                    id: "t-001",
                    provenance: .transcript,
                    reviewStatus: .confirmed,
                    capturedAt: "2025-01-01T09:06:00Z",
                    text: "Boiler looks fine.",
                    source: .voiceNote
                )
            ],
            objectPins: [
                CaptureObjectPinV1(
                    id: "pin-001",
                    provenance: .manual,
                    reviewStatus: .confirmed,
                    capturedAt: "2025-01-01T09:07:00Z",
                    objectType: .boiler,
                    location: CapturePoint3DV1(x: 1, y: 2, coordinateSpace: .roomPlan),
                    anchorConfidence: .worldLocked
                )
            ],
            pipeRoutes: [],
            pointCloudAssets: [],
            createdAt: "2025-01-01T09:00:00Z",
            updatedAt: "2025-01-01T09:30:00Z"
        )

        let decoded = try roundTrip(capture)
        XCTAssertEqual(decoded.visitId, "visit-full")
        XCTAssertEqual(decoded.visitNumber, "VN-0042")
        XCTAssertEqual(decoded.brandId, "brand-abc")
        XCTAssertEqual(decoded.rooms.count, 1)
        XCTAssertEqual(decoded.photos.count, 1)
        XCTAssertEqual(decoded.transcripts.count, 1)
        XCTAssertEqual(decoded.objectPins.count, 1)
        XCTAssertEqual(decoded.version, "2.0")
    }
}
