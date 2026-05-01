// AtlasVisitTests.swift
//
// Tests for AtlasVisitV1 and related types.
//
// Coverage:
//   1. AtlasVisitReadinessV1.empty has all flags false.
//   2. AtlasVisitV1 encodes and decodes with optional brandId absent.
//   3. AtlasVisitV1 encodes and decodes with brandId present.

import XCTest
@testable import AtlasContracts

final class AtlasVisitTests: XCTestCase {

    private let encoder: JSONEncoder = {
        let e = JSONEncoder()
        e.outputFormatting = .sortedKeys
        return e
    }()

    private let decoder = JSONDecoder()

    // MARK: - 1. Empty readiness

    func testEmptyReadinessHasAllFlagsFalse() {
        let readiness = AtlasVisitReadinessV1.empty
        XCTAssertFalse(readiness.hasRooms)
        XCTAssertFalse(readiness.hasPhotos)
        XCTAssertFalse(readiness.hasHeatingSystem)
        XCTAssertFalse(readiness.hasHotWaterSystem)
        XCTAssertFalse(readiness.hasKeyObjectBoiler)
        XCTAssertFalse(readiness.hasKeyObjectFlue)
        XCTAssertFalse(readiness.hasAnyNotes)
    }

    // MARK: - 2. Round-trip without brandId

    func testVisitRoundTripWithoutBrandId() throws {
        let original = AtlasVisitV1(
            visitId: "visit-001",
            sourceApp: .scanIos,
            status: .draft,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z"
        )

        let data = try encoder.encode(original)
        let decoded = try decoder.decode(AtlasVisitV1.self, from: data)

        XCTAssertEqual(decoded, original)
        XCTAssertEqual(decoded.version, "1.0")
        XCTAssertEqual(decoded.visitId, "visit-001")
        XCTAssertEqual(decoded.sourceApp, .scanIos)
        XCTAssertEqual(decoded.status, .draft)
        XCTAssertNil(decoded.brandId)
        XCTAssertNil(decoded.visitNumber)

        // Confirm brandId key is absent from the JSON
        let json = try XCTUnwrap(String(data: data, encoding: .utf8))
        XCTAssertFalse(json.contains("brandId"))
    }

    // MARK: - 3. Round-trip with brandId present

    func testVisitRoundTripWithBrandId() throws {
        let original = AtlasVisitV1(
            visitId: "visit-002",
            brandId: "brand-abc",
            sourceApp: .mindPwa,
            status: .complete,
            createdAt: "2024-06-01T10:00:00Z",
            updatedAt: "2024-06-01T12:00:00Z",
            completedAt: "2024-06-01T12:00:00Z"
        )

        let data = try encoder.encode(original)
        let decoded = try decoder.decode(AtlasVisitV1.self, from: data)

        XCTAssertEqual(decoded, original)
        XCTAssertEqual(decoded.brandId, "brand-abc")
        XCTAssertEqual(decoded.sourceApp, .mindPwa)
        XCTAssertEqual(decoded.status, .complete)
        XCTAssertEqual(decoded.completedAt, "2024-06-01T12:00:00Z")
    }
}
