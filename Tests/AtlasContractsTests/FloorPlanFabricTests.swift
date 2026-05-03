// FloorPlanFabricTests.swift
//
// Tests for the FloorPlanFabricCaptureV1 floor-plan perimeter and material
// capture contracts.
//
// Coverage:
//   1.  Room perimeter can be represented
//   2.  External, internal, and party walls are distinct boundary kinds
//   3.  Opening attaches to boundary via boundaryId
//   4.  Unknown materials are valid
//   5.  LiDAR boundary can be pending
//   6.  Manual material can be confirmed
//   7.  Rejected boundary remains representable
//   8.  SessionCaptureV2 accepts floorPlanFabric
//   9.  All FloorPlanBoundaryKindV1 values round-trip
//   10. All FloorPlanOpeningKindV1 values round-trip
//   11. All FabricMaterialV1 values round-trip
//   12. FloorPlanFabricCaptureV1 version discriminant is always "1.0"
//   13. FloorPlanPointV1 round-trips with and without z
//   14. Opening without boundaryId round-trips (e.g. rooflight)

import XCTest
@testable import AtlasContracts

final class FloorPlanFabricTests: XCTestCase {

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

    private func makePoint(x: Double = 0, y: Double = 0) -> FloorPlanPointV1 {
        FloorPlanPointV1(x: x, y: y, coordinateSpace: .roomPlan)
    }

    private func makeBoundary(
        id: String = "boundary-001",
        kind: FloorPlanBoundaryKindV1 = .externalWall,
        reviewStatus: ReviewStatusV1 = .pending,
        provenance: CaptureProvenanceV1 = .scan,
        material: FabricMaterialV1? = nil
    ) -> FloorPlanBoundaryV1 {
        FloorPlanBoundaryV1(
            id: id,
            roomId: "room-001",
            kind: kind,
            start: makePoint(x: 0, y: 0),
            end: makePoint(x: 4000, y: 0),
            material: material,
            reviewStatus: reviewStatus,
            provenance: provenance
        )
    }

    private func makeOpening(
        id: String = "opening-001",
        kind: FloorPlanOpeningKindV1 = .window,
        boundaryId: String? = nil,
        reviewStatus: ReviewStatusV1 = .pending,
        material: FabricMaterialV1? = nil
    ) -> FloorPlanOpeningV1 {
        FloorPlanOpeningV1(
            id: id,
            roomId: "room-001",
            boundaryId: boundaryId,
            kind: kind,
            position: makePoint(x: 2000, y: 0),
            material: material,
            reviewStatus: reviewStatus,
            provenance: .scan
        )
    }

    private func makeRoomFabric(
        boundaries: [FloorPlanBoundaryV1] = [],
        openings: [FloorPlanOpeningV1] = []
    ) -> FloorPlanRoomFabricV1 {
        FloorPlanRoomFabricV1(
            roomId: "room-001",
            boundaries: boundaries,
            openings: openings,
            reviewStatus: .pending,
            provenance: .scan
        )
    }

    private func makeFabricCapture(
        rooms: [FloorPlanRoomFabricV1] = []
    ) -> FloorPlanFabricCaptureV1 {
        FloorPlanFabricCaptureV1(
            visitId: "visit-001",
            rooms: rooms,
            createdAt: "2025-01-01T09:00:00Z",
            updatedAt: "2025-01-01T09:00:00Z"
        )
    }

    // ─── 1. Room perimeter can be represented ──────────────────────────────────

    func test_01_roomPerimeterIsRepresentable() throws {
        let room = FloorPlanRoomFabricV1(
            roomId: "room-001",
            floorAreaM2: 20.5,
            ceilingHeightMm: 2400,
            perimeterMm: 18000,
            boundaries: [
                makeBoundary(id: "b-north"),
                makeBoundary(id: "b-east"),
                makeBoundary(id: "b-south"),
                makeBoundary(id: "b-west", kind: .internalWall),
            ],
            openings: [],
            reviewStatus: .pending,
            provenance: .scan
        )

        let decoded = try roundTrip(room)
        XCTAssertEqual(decoded.roomId, "room-001")
        XCTAssertEqual(decoded.floorAreaM2, 20.5)
        XCTAssertEqual(decoded.ceilingHeightMm, 2400)
        XCTAssertEqual(decoded.perimeterMm, 18000)
        XCTAssertEqual(decoded.boundaries.count, 4)
    }

    func test_01b_roomPerimeterAggregatesAreOptional() throws {
        let room = makeRoomFabric()
        let decoded = try roundTrip(room)
        XCTAssertNil(decoded.floorAreaM2)
        XCTAssertNil(decoded.ceilingHeightMm)
        XCTAssertNil(decoded.perimeterMm)
    }

    // ─── 2. Wall kinds are distinct ────────────────────────────────────────────

    func test_02_wallKindsAreDistinct() throws {
        let external = makeBoundary(id: "b-ext", kind: .externalWall)
        let internal_ = makeBoundary(id: "b-int", kind: .internalWall)
        let party     = makeBoundary(id: "b-pty", kind: .partyWall)

        let decodedExternal = try roundTrip(external)
        let decodedInternal = try roundTrip(internal_)
        let decodedParty    = try roundTrip(party)

        XCTAssertEqual(decodedExternal.kind, .externalWall)
        XCTAssertEqual(decodedInternal.kind, .internalWall)
        XCTAssertEqual(decodedParty.kind,    .partyWall)

        XCTAssertNotEqual(decodedExternal.kind, decodedInternal.kind)
        XCTAssertNotEqual(decodedInternal.kind, decodedParty.kind)
        XCTAssertNotEqual(decodedExternal.kind, decodedParty.kind)
    }

    // ─── 3. Opening attaches to boundary ──────────────────────────────────────

    func test_03_openingAttachesToBoundary() throws {
        let boundary = makeBoundary(id: "boundary-north")
        let opening = FloorPlanOpeningV1(
            id: "window-001",
            roomId: "room-001",
            boundaryId: boundary.id,
            kind: .window,
            position: makePoint(x: 2000, y: 0),
            widthMm: 1200,
            heightMm: 1050,
            reviewStatus: .pending,
            provenance: .scan
        )

        let decoded = try roundTrip(opening)
        XCTAssertEqual(decoded.boundaryId, boundary.id)
        XCTAssertEqual(decoded.widthMm, 1200)
        XCTAssertEqual(decoded.heightMm, 1050)
    }

    // ─── 4. Unknown materials are valid ───────────────────────────────────────

    func test_04_unknownMaterialIsValid() throws {
        let boundary = makeBoundary(material: .unknown)
        let decoded = try roundTrip(boundary)
        XCTAssertEqual(decoded.material, .unknown)
    }

    func test_04b_materialIsOptional() throws {
        let boundary = makeBoundary()
        let decoded = try roundTrip(boundary)
        XCTAssertNil(decoded.material)
    }

    // ─── 5. LiDAR boundary is pending ─────────────────────────────────────────

    func test_05_lidarBoundaryIsPending() throws {
        let boundary = makeBoundary(reviewStatus: .pending, provenance: .scan)
        let decoded = try roundTrip(boundary)
        XCTAssertEqual(decoded.reviewStatus, .pending)
        XCTAssertEqual(decoded.provenance, .scan)
    }

    // ─── 6. Manual material can be confirmed ──────────────────────────────────

    func test_06_manualMaterialCanBeConfirmed() throws {
        let boundary = makeBoundary(
            reviewStatus: .confirmed,
            provenance: .manual,
            material: .cavityWall
        )
        let decoded = try roundTrip(boundary)
        XCTAssertEqual(decoded.reviewStatus, .confirmed)
        XCTAssertEqual(decoded.provenance, .manual)
        XCTAssertEqual(decoded.material, .cavityWall)
    }

    // ─── 7. Rejected boundary remains representable ───────────────────────────

    func test_07_rejectedBoundaryIsRepresentable() throws {
        let boundary = makeBoundary(reviewStatus: .rejected)
        let decoded = try roundTrip(boundary)
        XCTAssertEqual(decoded.reviewStatus, .rejected)

        let room = makeRoomFabric(boundaries: [boundary])
        let decodedRoom = try roundTrip(room)
        XCTAssertEqual(decodedRoom.boundaries.first?.reviewStatus, .rejected)
    }

    func test_07b_rejectedOpeningIsRepresentable() throws {
        let opening = makeOpening(reviewStatus: .rejected)
        let decoded = try roundTrip(opening)
        XCTAssertEqual(decoded.reviewStatus, .rejected)

        let room = makeRoomFabric(openings: [opening])
        let decodedRoom = try roundTrip(room)
        XCTAssertEqual(decodedRoom.openings.first?.reviewStatus, .rejected)
    }

    // ─── 8. SessionCaptureV2 accepts floorPlanFabric ──────────────────────────

    func test_08_sessionCaptureV2AcceptsFloorPlanFabric() throws {
        let fabric = makeFabricCapture(rooms: [makeRoomFabric()])
        let capture = SessionCaptureV2(
            visitId: "visit-001",
            floorPlanFabric: fabric,
            createdAt: "2025-01-01T09:00:00Z",
            updatedAt: "2025-01-01T09:00:00Z"
        )

        let decoded = try roundTrip(capture)
        XCTAssertNotNil(decoded.floorPlanFabric)
        XCTAssertEqual(decoded.floorPlanFabric?.version, "1.0")
        XCTAssertEqual(decoded.floorPlanFabric?.visitId, "visit-001")
        XCTAssertEqual(decoded.floorPlanFabric?.rooms.count, 1)
    }

    func test_08b_sessionCaptureV2IsValidWithoutFloorPlanFabric() throws {
        let capture = SessionCaptureV2(
            visitId: "visit-001",
            createdAt: "2025-01-01T09:00:00Z",
            updatedAt: "2025-01-01T09:00:00Z"
        )

        let decoded = try roundTrip(capture)
        XCTAssertNil(decoded.floorPlanFabric)
    }

    // ─── 9. All FloorPlanBoundaryKindV1 values round-trip ─────────────────────

    func test_09_allBoundaryKindsRoundTrip() throws {
        let kinds: [FloorPlanBoundaryKindV1] = [
            .externalWall, .internalWall, .partyWall,
            .floorEdge, .ceilingEdge, .unknown
        ]
        for kind in kinds {
            let encoded = try encoder.encode(kind)
            let decoded = try decoder.decode(FloorPlanBoundaryKindV1.self, from: encoded)
            XCTAssertEqual(decoded, kind)
        }
    }

    // ─── 10. All FloorPlanOpeningKindV1 values round-trip ─────────────────────

    func test_10_allOpeningKindsRoundTrip() throws {
        let kinds: [FloorPlanOpeningKindV1] = [
            .door, .window, .patioDoor, .rooflight, .openArch, .unknown
        ]
        for kind in kinds {
            let encoded = try encoder.encode(kind)
            let decoded = try decoder.decode(FloorPlanOpeningKindV1.self, from: encoded)
            XCTAssertEqual(decoded, kind)
        }
    }

    // ─── 11. All FabricMaterialV1 values round-trip ───────────────────────────

    func test_11_allFabricMaterialsRoundTrip() throws {
        let materials: [FabricMaterialV1] = [
            .solidBrick, .cavityWall, .insulatedCavity, .timberFrame, .stone,
            .singleGlazing, .doubleGlazing, .tripleGlazing,
            .insulatedDoor, .uninsulatedDoor,
            .suspendedTimberFloor, .solidFloor, .insulatedFloor,
            .pitchedRoof, .flatRoof, .insulatedRoof,
            .unknown
        ]
        for material in materials {
            let encoded = try encoder.encode(material)
            let decoded = try decoder.decode(FabricMaterialV1.self, from: encoded)
            XCTAssertEqual(decoded, material)
        }
    }

    // ─── 12. Version discriminant is always "1.0" ─────────────────────────────

    func test_12_versionDiscriminant() throws {
        let capture = makeFabricCapture()
        XCTAssertEqual(capture.version, "1.0")

        let decoded = try roundTrip(capture)
        XCTAssertEqual(decoded.version, "1.0")
    }

    // ─── 13. FloorPlanPointV1 round-trips ─────────────────────────────────────

    func test_13_pointRoundTripsWithoutZ() throws {
        let pt = FloorPlanPointV1(x: 1.5, y: 2.5, coordinateSpace: .roomPlan)
        let decoded = try roundTrip(pt)
        XCTAssertEqual(decoded.x, 1.5)
        XCTAssertEqual(decoded.y, 2.5)
        XCTAssertNil(decoded.z)
        XCTAssertEqual(decoded.coordinateSpace, .roomPlan)
    }

    func test_13b_pointRoundTripsWithZ() throws {
        let pt = FloorPlanPointV1(x: 1, y: 2, z: 3, coordinateSpace: .world)
        let decoded = try roundTrip(pt)
        XCTAssertEqual(decoded.z, 3)
        XCTAssertEqual(decoded.coordinateSpace, .world)
    }

    func test_13c_allCoordinateSpacesRoundTrip() throws {
        let spaces: [CoordinateSpaceV1] = [.roomPlan, .floorPlan, .world]
        for space in spaces {
            let pt = FloorPlanPointV1(x: 0, y: 0, coordinateSpace: space)
            let decoded = try roundTrip(pt)
            XCTAssertEqual(decoded.coordinateSpace, space)
        }
    }

    // ─── 14. Opening without boundaryId (e.g. rooflight) ─────────────────────

    func test_14_rooflightOpeningHasNoBoundaryId() throws {
        let opening = makeOpening(kind: .rooflight, boundaryId: nil)
        let decoded = try roundTrip(opening)
        XCTAssertEqual(decoded.kind, .rooflight)
        XCTAssertNil(decoded.boundaryId)
    }
}
