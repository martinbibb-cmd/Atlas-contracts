// ScanToMindHandoffTests.swift
//
// Tests for ScanToMindHandoffV1 and validateScanToMindHandoffV1.
//
// Coverage:
//   1. encode/decode valid handoff
//   2. validation succeeds for valid complete handoff
//   3. validation fails for visitId mismatch
//   4. validation fails for incomplete complete_capture readiness
//   5. validation warns for one-sided brandId

import XCTest
@testable import AtlasContracts

final class ScanToMindHandoffTests: XCTestCase {

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

    private var fullReadiness: AtlasVisitReadinessV1 {
        AtlasVisitReadinessV1(
            hasRooms: true,
            hasPhotos: true,
            hasHeatingSystem: true,
            hasHotWaterSystem: true,
            hasKeyObjectBoiler: true,
            hasKeyObjectFlue: true,
            hasAnyNotes: true
        )
    }

    private func makeVisit(
        visitId: String = "visit-001",
        status: AtlasVisitStatusV1 = .complete,
        readiness: AtlasVisitReadinessV1? = nil,
        brandId: String? = nil
    ) -> AtlasVisitV1 {
        AtlasVisitV1(
            visitId: visitId,
            brandId: brandId,
            sourceApp: .scanIos,
            status: status,
            readiness: readiness ?? fullReadiness,
            createdAt: "2025-01-01T09:00:00Z",
            updatedAt: "2025-01-01T09:00:00Z"
        )
    }

    private func makeCapture(
        visitId: String = "visit-001",
        brandId: String? = nil
    ) -> SessionCaptureV2 {
        SessionCaptureV2(
            visitId: visitId,
            brandId: brandId,
            createdAt: "2025-01-01T09:00:00Z",
            updatedAt: "2025-01-01T09:00:00Z"
        )
    }

    private func makeHandoff(
        visit: AtlasVisitV1? = nil,
        readiness: AtlasVisitReadinessV1? = nil,
        capture: SessionCaptureV2? = nil,
        handoffReason: ScanToMindHandoffReasonV1 = .completeCapture
    ) -> ScanToMindHandoffV1 {
        let v = visit ?? makeVisit()
        let r = readiness ?? fullReadiness
        let c = capture ?? makeCapture()
        return ScanToMindHandoffV1(
            meta: ScanToMindHandoffMetaV1(
                createdAt: "2025-01-01T09:01:00Z",
                handoffReason: handoffReason
            ),
            visit: v,
            readiness: r,
            capture: c
        )
    }

    // ─── 1. encode/decode valid handoff ────────────────────────────────────────

    func test_01_encodeDecodeValidHandoff() throws {
        let original = makeHandoff()
        let decoded = try roundTrip(original)

        XCTAssertEqual(decoded.version, "1.0")
        XCTAssertEqual(decoded.meta.sourceApp, "scan_ios")
        XCTAssertEqual(decoded.meta.targetApp, "mind_pwa")
        XCTAssertEqual(decoded.meta.schemaVersion, "1.0")
        XCTAssertEqual(decoded.meta.handoffReason, .completeCapture)
        XCTAssertEqual(decoded.visit.visitId, "visit-001")
        XCTAssertEqual(decoded.capture.visitId, "visit-001")
        XCTAssertEqual(decoded.readiness, fullReadiness)
        XCTAssertNil(decoded.warnings)
        XCTAssertEqual(decoded, original)
    }

    // ─── 2. validation succeeds for valid complete handoff ─────────────────────

    func test_02_validationSucceedsForValidCompleteHandoff() {
        let handoff = makeHandoff()
        let result = validateScanToMindHandoffV1(handoff)

        XCTAssertTrue(result.ok)
        XCTAssertTrue(result.errors.isEmpty)
        XCTAssertTrue(result.warnings.isEmpty)
    }

    // ─── 3. validation fails for visitId mismatch ──────────────────────────────

    func test_03_validationFailsForVisitIdMismatch() {
        let handoff = makeHandoff(capture: makeCapture(visitId: "visit-999"))
        let result = validateScanToMindHandoffV1(handoff)

        XCTAssertFalse(result.ok)
        XCTAssertTrue(result.errors.contains(where: { $0.contains("visitId") }))
    }

    // ─── 4. validation fails for incomplete complete_capture readiness ─────────

    func test_04_validationFailsForIncompleteCompleteCaptureReadiness() {
        let partialReadiness = AtlasVisitReadinessV1(
            hasRooms: true,
            hasPhotos: false,
            hasHeatingSystem: false,
            hasHotWaterSystem: false,
            hasKeyObjectBoiler: false,
            hasKeyObjectFlue: false,
            hasAnyNotes: false
        )
        let handoff = makeHandoff(
            visit: makeVisit(readiness: partialReadiness),
            readiness: partialReadiness
        )
        let result = validateScanToMindHandoffV1(handoff)

        XCTAssertFalse(result.ok)
        XCTAssertTrue(result.errors.contains(where: { $0.contains("hasPhotos") }))
        XCTAssertTrue(result.errors.contains(where: { $0.contains("hasHeatingSystem") }))
        XCTAssertTrue(result.errors.contains(where: { $0.contains("hasHotWaterSystem") }))
        XCTAssertTrue(result.errors.contains(where: { $0.contains("hasKeyObjectBoiler") }))
        XCTAssertTrue(result.errors.contains(where: { $0.contains("hasKeyObjectFlue") }))
        XCTAssertTrue(result.errors.contains(where: { $0.contains("hasAnyNotes") }))
    }

    // ─── 5. validation warns for one-sided brandId ────────────────────────────

    func test_05a_validationWarnsWhenBrandIdOnVisitOnly() {
        let handoff = makeHandoff(
            visit: makeVisit(brandId: "brand-abc"),
            capture: makeCapture()
        )
        let result = validateScanToMindHandoffV1(handoff)

        XCTAssertTrue(result.ok)
        XCTAssertTrue(result.errors.isEmpty)
        XCTAssertTrue(result.warnings.contains(where: { $0.contains("brandId") }))
    }

    func test_05b_validationWarnsWhenBrandIdOnCaptureOnly() {
        let handoff = makeHandoff(
            visit: makeVisit(),
            capture: makeCapture(brandId: "brand-abc")
        )
        let result = validateScanToMindHandoffV1(handoff)

        XCTAssertTrue(result.ok)
        XCTAssertTrue(result.errors.isEmpty)
        XCTAssertTrue(result.warnings.contains(where: { $0.contains("brandId") }))
    }

    func test_05c_matchingBrandIdProducesNoWarningOrError() {
        let handoff = makeHandoff(
            visit: makeVisit(brandId: "brand-abc"),
            capture: makeCapture(brandId: "brand-abc")
        )
        let result = validateScanToMindHandoffV1(handoff)

        XCTAssertTrue(result.ok)
        XCTAssertTrue(result.errors.isEmpty)
        XCTAssertTrue(result.warnings.isEmpty)
    }
}
