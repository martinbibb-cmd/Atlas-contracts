// HazardObservationsTests.swift
//
// Tests for the HazardObservation contracts.
//
// Coverage:
//   1.  A hazard observation can be represented (encode/decode round-trip)
//   2.  asbestos_suspected category exists and round-trips
//   3.  blocking severity exists and round-trips
//   4.  Hazards can link to photos (photoIds)
//   5.  Hazards can link to object pins (objectPinIds)
//   6.  pending / confirmed / rejected review states are representable
//   7.  SessionCaptureV2 accepts hazardObservations
//   8.  customer_vulnerability exists but does not require sensitive detail
//   9.  All HazardObservationCategoryV1 values round-trip correctly
//   10. All HazardObservationSeverityV1 values round-trip correctly
//   11. HazardObservationCaptureV1 version discriminant is "1.0"
//   12. Optional fields are nil when absent from JSON

import XCTest
@testable import AtlasContracts

final class HazardObservationsTests: XCTestCase {

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

    private func makeObservation(
        id: String = "hazard-001",
        category: HazardObservationCategoryV1 = .electrical,
        severity: HazardObservationSeverityV1 = .medium,
        title: String = "Exposed wiring near boiler",
        reviewStatus: ReviewStatusV1 = .pending,
        provenance: CaptureProvenanceV1 = .manual
    ) -> HazardObservationV1 {
        HazardObservationV1(
            id: id,
            visitId: "visit-001",
            category: category,
            severity: severity,
            title: title,
            reviewStatus: reviewStatus,
            provenance: provenance,
            observedAt: "2025-01-01T10:00:00Z"
        )
    }

    private func makeCapture(
        observations: [HazardObservationV1] = []
    ) -> HazardObservationCaptureV1 {
        HazardObservationCaptureV1(
            visitId: "visit-001",
            observations: observations,
            createdAt: "2025-01-01T09:00:00Z",
            updatedAt: "2025-01-01T09:00:00Z"
        )
    }

    // ─── 1. Basic representation ───────────────────────────────────────────────

    func test_01_hazardObservationRoundTrip() throws {
        let obs = makeObservation()
        let decoded = try roundTrip(obs)

        XCTAssertEqual(decoded.id, "hazard-001")
        XCTAssertEqual(decoded.visitId, "visit-001")
        XCTAssertEqual(decoded.category, .electrical)
        XCTAssertEqual(decoded.severity, .medium)
        XCTAssertEqual(decoded.title, "Exposed wiring near boiler")
        XCTAssertEqual(decoded.reviewStatus, .pending)
        XCTAssertEqual(decoded.provenance, .manual)
        XCTAssertEqual(decoded.observedAt, "2025-01-01T10:00:00Z")
    }

    // ─── 2. asbestos_suspected category ───────────────────────────────────────

    func test_02_asbestosSuspectedCategoryRoundTrips() throws {
        let obs = makeObservation(category: .asbestosSuspected, severity: .high)
        let decoded = try roundTrip(obs)

        XCTAssertEqual(decoded.category, .asbestosSuspected)

        // Verify wire format
        let json = try encoder.encode(obs)
        let dict = try JSONSerialization.jsonObject(with: json) as? [String: Any]
        XCTAssertEqual(dict?["category"] as? String, "asbestos_suspected")
    }

    // ─── 3. blocking severity ─────────────────────────────────────────────────

    func test_03_blockingSeverityRoundTrips() throws {
        let obs = makeObservation(severity: .blocking)
        let decoded = try roundTrip(obs)

        XCTAssertEqual(decoded.severity, .blocking)

        // Verify wire format
        let json = try encoder.encode(obs)
        let dict = try JSONSerialization.jsonObject(with: json) as? [String: Any]
        XCTAssertEqual(dict?["severity"] as? String, "blocking")
    }

    // ─── 4. photoIds ──────────────────────────────────────────────────────────

    func test_04_hazardLinksToPhotos() throws {
        let obs = HazardObservationV1(
            id: "hazard-photo",
            visitId: "visit-001",
            category: .structural,
            severity: .high,
            title: "Crack in loadbearing wall",
            photoIds: ["photo-001", "photo-002"],
            reviewStatus: .pending,
            provenance: .manual,
            observedAt: "2025-01-01T10:00:00Z"
        )

        let decoded = try roundTrip(obs)
        XCTAssertEqual(decoded.photoIds?.count, 2)
        XCTAssertEqual(decoded.photoIds?[0], "photo-001")
        XCTAssertEqual(decoded.photoIds?[1], "photo-002")
    }

    func test_04b_photoIdsNilWhenAbsent() throws {
        let obs = makeObservation()
        let decoded = try roundTrip(obs)
        XCTAssertNil(decoded.photoIds)
    }

    // ─── 5. objectPinIds ──────────────────────────────────────────────────────

    func test_05_hazardLinksToObjectPins() throws {
        let obs = HazardObservationV1(
            id: "hazard-pin",
            visitId: "visit-001",
            category: .gas,
            severity: .high,
            title: "Suspected gas odour near meter",
            objectPinIds: ["pin-001"],
            reviewStatus: .pending,
            provenance: .manual,
            observedAt: "2025-01-01T10:00:00Z"
        )

        let decoded = try roundTrip(obs)
        XCTAssertEqual(decoded.objectPinIds?.count, 1)
        XCTAssertEqual(decoded.objectPinIds?[0], "pin-001")
    }

    func test_05b_objectPinIdsNilWhenAbsent() throws {
        let obs = makeObservation()
        let decoded = try roundTrip(obs)
        XCTAssertNil(decoded.objectPinIds)
    }

    // ─── 6. Review states ─────────────────────────────────────────────────────

    func test_06_reviewStatusVariants() throws {
        let statuses: [ReviewStatusV1] = [.pending, .confirmed, .rejected]

        for status in statuses {
            let obs = makeObservation(reviewStatus: status)
            let decoded = try roundTrip(obs)
            XCTAssertEqual(decoded.reviewStatus, status)
        }
    }

    // ─── 7. SessionCaptureV2 accepts hazardObservations ───────────────────────

    func test_07a_sessionCaptureV2HazardObservationsNilByDefault() throws {
        let capture = SessionCaptureV2(
            visitId: "visit-001",
            createdAt: "2025-01-01T09:00:00Z",
            updatedAt: "2025-01-01T09:00:00Z"
        )

        let decoded = try roundTrip(capture)
        XCTAssertNil(decoded.hazardObservations)
    }

    func test_07b_sessionCaptureV2AcceptsHazardObservations() throws {
        let hazardCapture = makeCapture(observations: [makeObservation()])

        let capture = SessionCaptureV2(
            visitId: "visit-001",
            hazardObservations: hazardCapture,
            createdAt: "2025-01-01T09:00:00Z",
            updatedAt: "2025-01-01T09:00:00Z"
        )

        let decoded = try roundTrip(capture)
        XCTAssertNotNil(decoded.hazardObservations)
        XCTAssertEqual(decoded.hazardObservations?.version, "1.0")
        XCTAssertEqual(decoded.hazardObservations?.observations.count, 1)
    }

    func test_07c_sessionCaptureV2EmptyHazardObservations() throws {
        let hazardCapture = makeCapture()

        let capture = SessionCaptureV2(
            visitId: "visit-001",
            hazardObservations: hazardCapture,
            createdAt: "2025-01-01T09:00:00Z",
            updatedAt: "2025-01-01T09:00:00Z"
        )

        let decoded = try roundTrip(capture)
        XCTAssertEqual(decoded.hazardObservations?.observations.count, 0)
    }

    // ─── 8. customer_vulnerability — no sensitive detail required ─────────────

    func test_08_customerVulnerabilityRequiresNoSensitiveDetail() throws {
        let obs = HazardObservationV1(
            id: "hazard-vuln",
            visitId: "visit-001",
            category: .customerVulnerability,
            severity: .info,
            title: "Possible vulnerability indicator noted",
            // No description, no actionRequired
            reviewStatus: .pending,
            provenance: .manual,
            observedAt: "2025-01-01T10:00:00Z"
        )

        let decoded = try roundTrip(obs)
        XCTAssertEqual(decoded.category, .customerVulnerability)
        XCTAssertNil(decoded.description)
        XCTAssertNil(decoded.actionRequired)

        // Verify wire format uses snake_case
        let json = try encoder.encode(obs)
        let dict = try JSONSerialization.jsonObject(with: json) as? [String: Any]
        XCTAssertEqual(dict?["category"] as? String, "customer_vulnerability")
    }

    // ─── 9. All HazardObservationCategoryV1 values ────────────────────────────

    func test_09_allCategoryValuesRoundTrip() throws {
        let categories: [HazardObservationCategoryV1] = [
            .access,
            .asbestosSuspected,
            .electrical,
            .gas,
            .water,
            .workingAtHeight,
            .confinedSpace,
            .manualHandling,
            .combustionAir,
            .flue,
            .structural,
            .tripSlip,
            .customerVulnerability,
            .petsOrChildren,
            .other,
        ]

        for category in categories {
            let encoded = try encoder.encode(category)
            let decoded = try decoder.decode(HazardObservationCategoryV1.self, from: encoded)
            XCTAssertEqual(decoded, category)
        }
    }

    // ─── 10. All HazardObservationSeverityV1 values ───────────────────────────

    func test_10_allSeverityValuesRoundTrip() throws {
        let severities: [HazardObservationSeverityV1] = [
            .info, .low, .medium, .high, .blocking,
        ]

        for severity in severities {
            let encoded = try encoder.encode(severity)
            let decoded = try decoder.decode(HazardObservationSeverityV1.self, from: encoded)
            XCTAssertEqual(decoded, severity)
        }
    }

    // ─── 11. HazardObservationCaptureV1 version discriminant ──────────────────

    func test_11_captureVersionDiscriminant() throws {
        let capture = makeCapture()
        XCTAssertEqual(capture.version, "1.0")

        let decoded = try roundTrip(capture)
        XCTAssertEqual(decoded.version, "1.0")

        // Verify wire format
        let json = try encoder.encode(capture)
        let dict = try JSONSerialization.jsonObject(with: json) as? [String: Any]
        XCTAssertEqual(dict?["version"] as? String, "1.0")
    }

    // ─── 12. Optional fields are nil when absent ──────────────────────────────

    func test_12_optionalFieldsNilWhenAbsent() throws {
        let obs = makeObservation()
        let decoded = try roundTrip(obs)

        XCTAssertNil(decoded.roomId)
        XCTAssertNil(decoded.description)
        XCTAssertNil(decoded.photoIds)
        XCTAssertNil(decoded.objectPinIds)
        XCTAssertNil(decoded.actionRequired)
        XCTAssertNil(decoded.notes)
    }

    func test_12b_optionalFieldsRoundTripWhenPresent() throws {
        let obs = HazardObservationV1(
            id: "hazard-full",
            visitId: "visit-001",
            roomId: "room-001",
            category: .electrical,
            severity: .high,
            title: "Exposed wiring",
            description: "Wiring runs exposed along back wall",
            photoIds: ["photo-001"],
            objectPinIds: ["pin-001"],
            actionRequired: "Contact electrician before installation",
            reviewStatus: .confirmed,
            provenance: .manual,
            observedAt: "2025-01-01T10:00:00Z",
            notes: "Customer was not aware of this issue"
        )

        let decoded = try roundTrip(obs)
        XCTAssertEqual(decoded.roomId, "room-001")
        XCTAssertEqual(decoded.description, "Wiring runs exposed along back wall")
        XCTAssertEqual(decoded.photoIds, ["photo-001"])
        XCTAssertEqual(decoded.objectPinIds, ["pin-001"])
        XCTAssertEqual(decoded.actionRequired, "Contact electrician before installation")
        XCTAssertEqual(decoded.notes, "Customer was not aware of this issue")
    }
}
