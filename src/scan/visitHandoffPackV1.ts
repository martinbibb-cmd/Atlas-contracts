/**
 * visitHandoffPackV1.ts
 *
 * VisitHandoffPackV1 — the payload dispatched from Atlas Mind to Atlas Scan
 * at the start of a visit.
 *
 * This is the reverse direction of ScanToMindHandoffV1: Mind → Scan.
 * It carries the visit identity, optional hardware patches (custom or
 * overridden appliance specifications), and any context that the Scan app
 * needs before capture begins.
 *
 * This file defines the handoff shape only.  It does not define API routes,
 * storage, simulator, recommendation, portal, or PDF behaviour.
 */

import type { AtlasVisitV1 } from './visit';
import type { HardwarePatchV1 } from '../hardwareRegistry/hardwarePatchV1.types';

// ─── Schema version ───────────────────────────────────────────────────────────

export const VISIT_HANDOFF_PACK_V1_SCHEMA_VERSION = '1.0' as const;
export type VisitHandoffPackV1SchemaVersion =
  typeof VISIT_HANDOFF_PACK_V1_SCHEMA_VERSION;

// ─── VisitHandoffPackV1 ───────────────────────────────────────────────────────

/**
 * VisitHandoffPackV1 — the payload dispatched from Atlas Mind to Atlas Scan
 * at the start of a visit.
 *
 * Delivered as a percent-encoded JSON payload on the `/receive-scan` deep-link
 * route so that Atlas Scan can pre-load the visit context before the engineer
 * begins capture.
 *
 * `hardwarePatches`, when present, is an ordered list of visit-scoped appliance
 * specifications.  The Scan app resolves model lookups by checking this list
 * before falling back to the baseline `MasterRegistryV1`.  This allows the
 * Mind app to supply site-specific dimensions (e.g. a custom or legacy boiler)
 * without modifying the shared registry.
 */
export interface VisitHandoffPackV1 {
  /** Contract schema version — always `"1.0"`. */
  schemaVersion: VisitHandoffPackV1SchemaVersion;
  /** ISO-8601 timestamp of when this pack was created. */
  createdAt: string;
  /** The app that produced this pack — always `"mind_pwa"`. */
  sourceApp: 'mind_pwa';
  /** The app intended to consume this pack — always `"scan_ios"`. */
  targetApp: 'scan_ios';
  /** The visit identity this pack belongs to. */
  visit: AtlasVisitV1;
  /**
   * Optional list of visit-scoped hardware patches.
   *
   * When provided, the Scan app uses these specifications in preference to
   * the baseline registry for the duration of this visit.  Patches may
   * represent fully custom appliances or adjusted dimensions for known models.
   */
  hardwarePatches?: HardwarePatchV1[];
}
