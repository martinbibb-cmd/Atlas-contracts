# atlas-contracts

Shared scan-bundle contract definitions for Atlas and future Atlas scan clients.

## Purpose

This package defines the **external boundary** between any native scan client (starting with an iOS RoomPlan companion app) and the Atlas web application.

It is intentionally small and boring. It exists so both sides of the boundary can agree on a single, versioned, tested definition of what a scan bundle looks like — without any application logic leaking in either direction.

## What lives here

| Path | Contents |
|------|----------|
| `src/scan/types.ts` | All scan entity types (`ScanBundleV1`, `ScanRoom`, `ScanWall`, etc.) |
| `src/scan/versions.ts` | `SUPPORTED_SCAN_BUNDLE_VERSIONS` constant + version-check helpers |
| `src/scan/validation.ts` | Runtime validation with type-safe assertion boundary |
| `src/scan/index.ts` | Barrel re-export of the public surface |
| `fixtures/` | Six canonical test fixtures (valid, invalid, unsupported) |
| `tests/` | Vitest tests for the validation boundary |

## What does NOT live here

- Atlas importer logic (`scanImporter.ts`, `scanMapper.ts`, `scanNormaliser.ts`)
- Atlas floor-plan / editor model types
- Canonical Atlas entity types
- Recommendation engine logic
- RoomPlan-specific integration code
- Any application UI

**Atlas remains the sole owner of canonical truth and importer/mapping behaviour.**

## Usage

```ts
import { validateScanBundle, SUPPORTED_SCAN_BUNDLE_VERSIONS } from '@atlas/contracts';

const result = validateScanBundle(rawJson);
if (!result.ok) {
  console.error('Invalid scan bundle:', result.errors);
  return;
}
// result.bundle is typed as ScanBundleV1 — no sloppy cast
const bundle = result.bundle;
```

## Contract ownership rules

1. **This package owns the wire format.** Changes to any type here are a contract change and must go through a versioned bump.
2. **Atlas owns interpretation.** How a bundle is mapped into the floor-plan model is Atlas's business, not this package's.
3. **Scan clients own capture.** The iOS app (or any future client) produces bundles; it does not dictate how Atlas uses them.

## Versioning policy

- The `version` field in every bundle is a contract version string (e.g. `"1.0"`).
- **Minor bumps** (`1.0` → `1.1`): backwards-compatible additions. Old importers may ignore new optional fields.
- **Major bumps** (`1.x` → `2.0`): breaking changes. Importers that do not recognise the major version **must** reject the bundle with `rejected_unsupported_version`.
- Add new versions to `SUPPORTED_SCAN_BUNDLE_VERSIONS` in `src/scan/versions.ts` and add corresponding validation logic in `src/scan/validation.ts`.

## Fixtures

| File | Purpose |
|------|---------|
| `valid-single-room.json` | One high-confidence room — baseline happy path |
| `valid-multi-room.json` | Three rooms across two floors — multi-floor mapping |
| `low-confidence.json` | Valid bundle with low-confidence room and a QA flag |
| `partial-missing-openings.json` | Valid bundle with an internal wall that has no openings |
| `invalid-schema.json` | Structurally broken — wrong field types, should be rejected |
| `unsupported-version.json` | Version `"99.0"` — should be rejected as unsupported |

## Development

```sh
npm install
npm run build   # TypeScript compilation
npm test        # Vitest test run
```

