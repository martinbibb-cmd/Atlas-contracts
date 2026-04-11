// AtlasPropertyV1Tests.swift
//
// Tests for the AtlasPropertyV1 contract and its sub-models.
//
// Coverage:
//   1.  Minimal valid AtlasPropertyV1 round-trips through JSON encoding/decoding
//   2.  Version field encodes as "1.0"
//   3.  AtlasPropertyStatus raw values match JSON contract
//   4.  AtlasSourceApp raw values match JSON contract
//   5.  FieldValue<T> round-trips with all optional fields
//   6.  FieldValue<T> encodes null value correctly
//   7.  ProvenanceSource raw values match JSON contract
//   8.  ConfidenceBand raw values match JSON contract
//   9.  BuildingModelV1 empty arrays round-trip
//  10.  PropertyRoomV1 round-trips correctly
//  11.  EmitterV1 round-trips correctly
//  12.  EvidenceModelV1 empty arrays round-trip
//  13.  PhotoEvidenceV1 with link round-trips correctly
//  14.  VoiceNoteEvidenceV1 round-trips correctly
//  15.  QAFlagV1 round-trips correctly
//  16.  TimelineEventV1 round-trips correctly
//  17.  CurrentSystemModelV1 family round-trips
//  18.  HouseholdModelV1 composition round-trips
//  19.  DerivedModelV1 round-trips with heat-loss results
//  20.  RecommendationWorkspaceV1 round-trips with items
//  21.  Full property with all sub-models round-trips without data loss

import XCTest
@testable import AtlasContracts

final class AtlasPropertyV1Tests: XCTestCase {

    // MARK: - Helpers

    private let encoder: JSONEncoder = {
        let e = JSONEncoder()
        e.outputFormatting = .sortedKeys
        return e
    }()

    private let decoder = JSONDecoder()

    private func roundTrip<T: Codable & Equatable>(_ value: T) throws -> T {
        let data = try encoder.encode(value)
        return try decoder.decode(T.self, from: data)
    }

    private func makeHousehold() -> HouseholdModelV1 {
        HouseholdModelV1(
            composition: HouseholdCompositionV1(
                adultCount: FieldValue(value: 2, source: .customerStated, confidence: .medium),
                childCount0to4: FieldValue(value: 0, source: .customerStated, confidence: .medium),
                childCount5to10: FieldValue(value: 0, source: .customerStated, confidence: .medium),
                childCount11to17: FieldValue(value: 0, source: .customerStated, confidence: .medium),
                youngAdultCount18to25AtHome: FieldValue(value: 0, source: .customerStated, confidence: .medium)
            )
        )
    }

    private func makeMinimalProperty() -> AtlasPropertyV1 {
        AtlasPropertyV1(
            propertyId: "test-prop-001",
            createdAt: "2025-01-01T09:00:00Z",
            updatedAt: "2025-01-01T09:00:00Z",
            status: .draft,
            sourceApps: [.atlasScan],
            property: PropertyIdentityV1(),
            capture: CaptureContextV1(sessionId: "test-session-001"),
            building: BuildingModelV1(),
            household: makeHousehold(),
            currentSystem: CurrentSystemModelV1(
                family: FieldValue(value: .combi, source: .engineerEntered, confidence: .high)
            ),
            evidence: EvidenceModelV1()
        )
    }

    // MARK: - 1. Minimal round-trip

    func testMinimalPropertyRoundTrips() throws {
        let original = makeMinimalProperty()
        let decoded = try roundTrip(original)
        XCTAssertEqual(decoded, original)
    }

    // MARK: - 2. Version field

    func testVersionEncodedAs1_0() throws {
        let data = try encoder.encode(makeMinimalProperty())
        let json = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        XCTAssertEqual(json["version"] as? String, "1.0")
    }

    // MARK: - 3. AtlasPropertyStatus raw values

    func testPropertyStatusRawValues() {
        XCTAssertEqual(AtlasPropertyStatus.draft.rawValue, "draft")
        XCTAssertEqual(AtlasPropertyStatus.surveyInProgress.rawValue, "survey_in_progress")
        XCTAssertEqual(AtlasPropertyStatus.readyForSimulation.rawValue, "ready_for_simulation")
        XCTAssertEqual(AtlasPropertyStatus.simulationReady.rawValue, "simulation_ready")
        XCTAssertEqual(AtlasPropertyStatus.reportReady.rawValue, "report_ready")
        XCTAssertEqual(AtlasPropertyStatus.archived.rawValue, "archived")
    }

    // MARK: - 4. AtlasSourceApp raw values

    func testSourceAppRawValues() {
        XCTAssertEqual(AtlasSourceApp.atlasScan.rawValue, "atlas_scan")
        XCTAssertEqual(AtlasSourceApp.atlasMind.rawValue, "atlas_mind")
        XCTAssertEqual(AtlasSourceApp.atlasPortal.rawValue, "atlas_portal")
        XCTAssertEqual(AtlasSourceApp.atlasBackend.rawValue, "atlas_backend")
    }

    // MARK: - 5. FieldValue round-trip with all optional fields

    func testFieldValueWithAllOptionalFieldsRoundTrips() throws {
        let fv = FieldValue<Double>(
            value: 42.5,
            source: .measured,
            confidence: .high,
            observedAt: "2025-06-01T10:00:00Z",
            observedBy: "eng-007",
            notes: "Calibrated reading"
        )
        let rt = try roundTrip(fv)
        XCTAssertEqual(rt, fv)
        XCTAssertEqual(rt.observedBy, "eng-007")
        XCTAssertEqual(rt.notes, "Calibrated reading")
    }

    // MARK: - 6. FieldValue null value

    func testFieldValueNullValueRoundTrips() throws {
        let fv = FieldValue<Int>(value: nil, source: .unknown, confidence: .unknown)
        let rt = try roundTrip(fv)
        XCTAssertNil(rt.value)
        XCTAssertEqual(rt.source, .unknown)
    }

    // MARK: - 7. ProvenanceSource raw values

    func testProvenanceSourceRawValues() {
        XCTAssertEqual(ProvenanceSource.engineerEntered.rawValue, "engineer_entered")
        XCTAssertEqual(ProvenanceSource.customerStated.rawValue, "customer_stated")
        XCTAssertEqual(ProvenanceSource.measured.rawValue, "measured")
        XCTAssertEqual(ProvenanceSource.scanned.rawValue, "scanned")
        XCTAssertEqual(ProvenanceSource.derived.rawValue, "derived")
        XCTAssertEqual(ProvenanceSource.imported.rawValue, "imported")
    }

    // MARK: - 8. ConfidenceBand raw values

    func testConfidenceBandRawValues() {
        XCTAssertEqual(ConfidenceBand.high.rawValue, "high")
        XCTAssertEqual(ConfidenceBand.medium.rawValue, "medium")
        XCTAssertEqual(ConfidenceBand.low.rawValue, "low")
        XCTAssertEqual(ConfidenceBand.unknown.rawValue, "unknown")
    }

    // MARK: - 9. BuildingModelV1 empty arrays

    func testBuildingModelEmptyArraysRoundTrip() throws {
        let building = BuildingModelV1()
        let rt = try roundTrip(building)
        XCTAssertTrue(rt.floors.isEmpty)
        XCTAssertTrue(rt.rooms.isEmpty)
        XCTAssertTrue(rt.zones.isEmpty)
        XCTAssertTrue(rt.emitters.isEmpty)
        XCTAssertNil(rt.services)
        XCTAssertNil(rt.pipeRoutes)
    }

    // MARK: - 10. PropertyRoomV1 round-trip

    func testPropertyRoomRoundTrips() throws {
        let room = PropertyRoomV1(
            roomId: "room-kitchen",
            floorId: "floor-gnd",
            label: "Kitchen",
            areaM2: FieldValue(value: 18.5, source: .scanned, confidence: .high),
            heated: true,
            scanRoomRef: "scan-room-abc"
        )
        let rt = try roundTrip(room)
        XCTAssertEqual(rt.roomId, "room-kitchen")
        XCTAssertEqual(rt.areaM2?.value, 18.5)
        XCTAssertEqual(rt.areaM2?.source, .scanned)
        XCTAssertEqual(rt.heated, true)
        XCTAssertEqual(rt.scanRoomRef, "scan-room-abc")
    }

    // MARK: - 11. EmitterV1 round-trip

    func testEmitterRoundTrips() throws {
        let emitter = EmitterV1(
            emitterId: "emitter-01",
            roomId: "room-kitchen",
            type: .panelRadiator,
            ratedOutputW: FieldValue(value: 1200.0, source: .engineerEntered, confidence: .medium),
            trvFitted: FieldValue(value: true, source: .observed, confidence: .high)
        )
        let rt = try roundTrip(emitter)
        XCTAssertEqual(rt.type, .panelRadiator)
        XCTAssertEqual(rt.ratedOutputW?.value, 1200.0)
        XCTAssertEqual(rt.trvFitted?.value, true)
    }

    // MARK: - 12. EvidenceModelV1 empty arrays

    func testEvidenceModelEmptyArraysRoundTrip() throws {
        let evidence = EvidenceModelV1()
        let rt = try roundTrip(evidence)
        XCTAssertTrue(rt.photos.isEmpty)
        XCTAssertTrue(rt.voiceNotes.isEmpty)
        XCTAssertTrue(rt.textNotes.isEmpty)
        XCTAssertTrue(rt.qaFlags.isEmpty)
        XCTAssertTrue(rt.events.isEmpty)
    }

    // MARK: - 13. PhotoEvidenceV1 with link

    func testPhotoEvidenceWithLinkRoundTrips() throws {
        let photo = PhotoEvidenceV1(
            photoId: "photo-001",
            capturedAt: "2025-03-01T09:15:00Z",
            tag: .boiler,
            link: EvidenceLinkV1(roomId: "room-kitchen", componentId: "comp-boiler"),
            caption: "Front panel"
        )
        let rt = try roundTrip(photo)
        XCTAssertEqual(rt.photoId, "photo-001")
        XCTAssertEqual(rt.tag, .boiler)
        XCTAssertEqual(rt.link?.roomId, "room-kitchen")
        XCTAssertEqual(rt.link?.componentId, "comp-boiler")
        XCTAssertEqual(rt.caption, "Front panel")
    }

    // MARK: - 14. VoiceNoteEvidenceV1 round-trip

    func testVoiceNoteEvidenceRoundTrips() throws {
        let note = VoiceNoteEvidenceV1(
            voiceNoteId: "voice-001",
            capturedAt: "2025-03-01T09:20:00Z",
            durationSeconds: 12.5,
            transcript: "Boiler is 7 years old.",
            kind: .observation,
            link: EvidenceLinkV1(componentId: "comp-boiler")
        )
        let rt = try roundTrip(note)
        XCTAssertEqual(rt.durationSeconds, 12.5)
        XCTAssertEqual(rt.kind, .observation)
        XCTAssertEqual(rt.transcript, "Boiler is 7 years old.")
        XCTAssertEqual(rt.link?.componentId, "comp-boiler")
    }

    // MARK: - 15. QAFlagV1 round-trip

    func testQAFlagRoundTrips() throws {
        let flag = QAFlagV1(
            flagId: "flag-001",
            code: "INHIBITOR_NOT_PRESENT",
            message: "No inhibitor detected.",
            severity: .warning,
            entityType: .property,
            resolved: false
        )
        let rt = try roundTrip(flag)
        XCTAssertEqual(rt.code, "INHIBITOR_NOT_PRESENT")
        XCTAssertEqual(rt.severity, .warning)
        XCTAssertEqual(rt.entityType, .property)
        XCTAssertEqual(rt.resolved, false)
    }

    // MARK: - 16. TimelineEventV1 round-trip

    func testTimelineEventRoundTrips() throws {
        let event = TimelineEventV1(
            eventId: "evt-001",
            occurredAt: "2025-03-01T09:00:00Z",
            type: .sessionStarted
        )
        let rt = try roundTrip(event)
        XCTAssertEqual(rt.type, .sessionStarted)
        XCTAssertEqual(rt.eventId, "evt-001")
    }

    // MARK: - 17. CurrentSystemModelV1 family

    func testCurrentSystemFamilyRoundTrips() throws {
        let system = CurrentSystemModelV1(
            family: FieldValue(value: .combi, source: .engineerEntered, confidence: .high),
            dhwType: FieldValue(value: .combi, source: .observed, confidence: .high)
        )
        let rt = try roundTrip(system)
        XCTAssertEqual(rt.family.value, .combi)
        XCTAssertEqual(rt.dhwType?.value, .combi)
    }

    // MARK: - 18. HouseholdModelV1 composition

    func testHouseholdCompositionRoundTrips() throws {
        let household = makeHousehold()
        let rt = try roundTrip(household)
        XCTAssertEqual(rt.composition.adultCount.value, 2)
        XCTAssertEqual(rt.composition.adultCount.source, .customerStated)
    }

    // MARK: - 19. DerivedModelV1 with heat-loss results

    func testDerivedModelRoundTrips() throws {
        let derived = DerivedModelV1(
            spatial: DerivedSpatialV1(totalFloorAreaM2: 135.0, heatedAreaM2: 110.0, storeyCount: 2),
            heatLoss: DerivedHeatLossV1(
                peakWatts: FieldValue(value: 9500.0, source: .derived, confidence: .medium),
                roomResults: [
                    RoomHeatLossResultV1(roomId: "room-kitchen", fabricLossW: 800.0, totalLossW: 1000.0)
                ]
            )
        )
        let rt = try roundTrip(derived)
        XCTAssertEqual(rt.spatial?.totalFloorAreaM2, 135.0)
        XCTAssertEqual(rt.heatLoss?.peakWatts?.value, 9500.0)
        XCTAssertEqual(rt.heatLoss?.roomResults?.first?.roomId, "room-kitchen")
        XCTAssertEqual(rt.heatLoss?.roomResults?.first?.totalLossW, 1000.0)
    }

    // MARK: - 20. RecommendationWorkspaceV1 with items

    func testRecommendationWorkspaceRoundTrips() throws {
        let workspace = RecommendationWorkspaceV1(
            engineRef: "engine-workspace-xyz",
            lastRunAt: "2025-05-01T12:00:00Z",
            status: .draft,
            items: [
                RecommendationItemSummaryV1(
                    itemId: "rec-001",
                    category: .airSourceHeatPump,
                    label: "Air Source Heat Pump",
                    rank: 1,
                    estimatedCostGbp: 12500.0,
                    estimatedBillSavingGbp: 650.0,
                    status: .draft
                )
            ]
        )
        let rt = try roundTrip(workspace)
        XCTAssertEqual(rt.status, .draft)
        XCTAssertEqual(rt.engineRef, "engine-workspace-xyz")
        XCTAssertEqual(rt.items.count, 1)
        XCTAssertEqual(rt.items.first?.category, .airSourceHeatPump)
        XCTAssertEqual(rt.items.first?.estimatedCostGbp, 12500.0)
    }

    // MARK: - 21. Full property round-trip

    func testFullPropertyRoundTrips() throws {
        let building = BuildingModelV1(
            floors: [FloorV1(floorId: "floor-gnd", index: 0, label: "Ground Floor")],
            rooms: [
                PropertyRoomV1(
                    roomId: "room-kitchen",
                    floorId: "floor-gnd",
                    label: "Kitchen",
                    areaM2: FieldValue(value: 18.5, source: .scanned, confidence: .high),
                    heated: true
                )
            ],
            zones: [ThermalZoneV1(zoneId: "zone-gnd", label: "Ground Zone", roomIds: ["room-kitchen"])],
            boundaries: [],
            openings: [],
            emitters: [
                EmitterV1(
                    emitterId: "emitter-01",
                    roomId: "room-kitchen",
                    type: .panelRadiator,
                    ratedOutputW: FieldValue(value: 1200.0, source: .engineerEntered, confidence: .medium)
                )
            ],
            systemComponents: [
                SystemComponentV1(
                    componentId: "comp-boiler",
                    category: .boiler,
                    label: "Worcester Bosch 30i",
                    installYear: FieldValue(value: 2018, source: .customerStated, confidence: .medium)
                )
            ]
        )

        let evidence = EvidenceModelV1(
            photos: [
                PhotoEvidenceV1(photoId: "photo-001", capturedAt: "2025-03-01T09:15:00Z", tag: .boiler)
            ],
            voiceNotes: [],
            textNotes: [],
            qaFlags: [],
            events: [
                TimelineEventV1(eventId: "evt-001", occurredAt: "2025-03-01T09:00:00Z", type: .sessionStarted)
            ]
        )

        let full = AtlasPropertyV1(
            propertyId: "prop-full-001",
            createdAt: "2025-03-01T08:00:00Z",
            updatedAt: "2025-03-01T11:30:00Z",
            status: .surveyInProgress,
            sourceApps: [.atlasScan, .atlasMind],
            property: PropertyIdentityV1(
                address1: "14 Elm Road",
                town: "Manchester",
                postcode: "M1 1AA",
                countryCode: .gb,
                propertyType: FieldValue(value: .semiDetached, source: .imported, confidence: .medium)
            ),
            capture: CaptureContextV1(
                sessionId: "session-full-001",
                startedAt: "2025-03-01T09:00:00Z",
                operator: CaptureOperatorV1(engineerId: "eng-042", engineerName: "Bob Jones"),
                device: CaptureDeviceV1(app: .atlasScan, appVersion: "2.0.1")
            ),
            building: building,
            household: makeHousehold(),
            currentSystem: CurrentSystemModelV1(
                family: FieldValue(value: .combi, source: .engineerEntered, confidence: .high)
            ),
            evidence: evidence,
            derived: DerivedModelV1(
                spatial: DerivedSpatialV1(totalFloorAreaM2: 135.0)
            )
        )

        let rt = try roundTrip(full)
        XCTAssertEqual(rt, full)
        XCTAssertEqual(rt.propertyId, "prop-full-001")
        XCTAssertEqual(rt.status, .surveyInProgress)
        XCTAssertEqual(rt.sourceApps, [.atlasScan, .atlasMind])
        XCTAssertEqual(rt.property.postcode, "M1 1AA")
        XCTAssertEqual(rt.property.propertyType?.value, .semiDetached)
        XCTAssertEqual(rt.capture.operator?.engineerName, "Bob Jones")
        XCTAssertEqual(rt.building.rooms.first?.label, "Kitchen")
        XCTAssertEqual(rt.building.emitters.first?.type, .panelRadiator)
        XCTAssertEqual(rt.evidence.photos.first?.tag, .boiler)
        XCTAssertEqual(rt.evidence.events.first?.type, .sessionStarted)
        XCTAssertEqual(rt.derived?.spatial?.totalFloorAreaM2, 135.0)
        XCTAssertNil(rt.recommendations)
    }
}
