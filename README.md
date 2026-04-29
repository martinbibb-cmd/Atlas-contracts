# atlas-contracts

Shared scan-bundle contract definitions for Atlas and future Atlas scan clients.

## Purpose

This package defines the **external boundary** between any native scan client (starting with an iOS RoomPlan companion app) and the Atlas web application.

It is intentionally small and boring. It exists so both sides of the boundary can agree on a single, versioned, tested definition of what a scan bundle looks like — without any application logic leaking in either direction.

## Canonical handoff contract: SessionCaptureV2

**`SessionCaptureV2` is the canonical scan-to-Mind handoff contract.**  It is the
single top-level payload produced by Atlas Scan iOS and consumed by Atlas Mind.

Import it from the package root or from `@atlas/contracts/scan`:

```ts
import { validateSessionCaptureV2, SESSION_CAPTURE_V2_SCHEMA_VERSION } from '@atlas/contracts';
import type { SessionCaptureV2 } from '@atlas/contracts';

const result = validateSessionCaptureV2(rawJson);
if (!result.ok) {
  console.error('Invalid SessionCaptureV2:', result.error);
  return;
}
// result.session is typed as SessionCaptureV2 — no sloppy cast
const session = result.session;
```

### Raw audio

**Raw audio must never be exported in a SessionCaptureV2 payload.**  Only
transcript text travels across the handoff boundary.  The validator rejects any
`voiceNote` that carries `audioUri`, `audioRef`, or `audioData` fields.

### What is NOT a production handoff contract

`ScanBundleV1` and `ScanJob` are not production handoff contracts.  Do not use
them for the Atlas Scan → Atlas Mind boundary.  Use only `SessionCaptureV2`.

### Required top-level fields

| Field | Description |
|-------|-------------|
| `schemaVersion` | Always `'atlas.scan.session.v2'` |
| `sessionId` | Unique capture session identifier (UUID) |
| `visitReference` | Cross-system reference to the scheduled visit in Atlas Mind |
| `capturedAt` | ISO-8601 timestamp of when capture started |
| `exportedAt` | ISO-8601 timestamp of when Atlas Scan exported this payload |
| `deviceModel` | Device model identifier (e.g. `"iPhone 15 Pro"`) |
| `roomScans` | Rooms captured during the session |
| `photos` | Photos taken as evidence |
| `voiceNotes` | Voice notes (transcript text only — no audio) |
| `objectPins` | Object pins placed by the engineer |
| `floorPlanSnapshots` | Floor-plan snapshots generated from the scan geometry |
| `qaFlags` | QA flags raised during the session |

### Canonical fixture

`fixtures/session_capture_v2_example.json` is the cross-repo canonical fixture.
It is produced by the Atlas Scan iOS exporter and validates against
`validateSessionCaptureV2()` in this package.  Import and validate it in any
consumer to confirm you are reading the same contract shape.

---

## Contract boundary

| Type | Role |
|------|------|
| `SessionCaptureV2` | **Canonical scan handoff.** The only supported contract between Atlas Scan and Atlas Mind. |
| `SessionCaptureV1` | Previous handoff contract — retained for reference and migration. |
| `ScanBundleV1` | **Not a production handoff contract.** Raw scan-geometry payload for internal use only. |
| `ScanJob` | **Not a production handoff contract.** Internal job type only. |

## What lives here

| Path | Contents |
|------|----------|
| `src/atlasScan/sessionCaptureV2.types.ts` | `SessionCaptureV2` and all sub-types |
| `src/atlasScan/sessionCaptureV2.schema.ts` | `validateSessionCaptureV2()` runtime validator |
| `src/atlasScan/sessionCaptureV1.types.ts` | `SessionCaptureV1` and all sub-types (legacy) |
| `src/atlasScan/sessionCaptureV1.schema.ts` | `validateSessionCaptureV1()` runtime validator (legacy) |
| `src/scan/types.ts` | Spatial primitives and install markup types |
| `src/scan/validation.ts` | Runtime validation for scan/install types |
| `src/scan/index.ts` | Barrel re-export of the scan public surface |
| `Sources/AtlasContracts/` | Swift mirror of the contract types (SwiftPM package) |
| `fixtures/session_capture_v2_example.json` | Canonical cross-repo SessionCaptureV2 fixture |
| `tests/` | Vitest tests for all validation boundaries |

## What does NOT live here

- Atlas importer logic (`scanImporter.ts`, `scanMapper.ts`, `scanNormaliser.ts`)
- Atlas floor-plan / editor model types
- Canonical Atlas entity types
- Recommendation engine logic
- RoomPlan-specific integration code
- App-layer playback state, recorder state, or view-model fields
- Any application UI

**Atlas remains the sole owner of canonical truth and importer/mapping behaviour.**

## Development

```sh
npm install
npm run build   # TypeScript compilation
npm test        # Vitest test run
swift test      # Swift XCTest suite
```

