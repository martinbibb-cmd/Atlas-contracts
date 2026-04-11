/**
 * fieldValue.ts
 *
 * Provenance-aware field wrapper for AtlasPropertyV1.
 *
 * Any field whose origin matters — measured dimension, customer-stated
 * preference, transcribed voice note, derived calculation — should be
 * wrapped in FieldValue<T> so consumers always know:
 *
 *   - what was captured or inferred (`value`)
 *   - where that value came from (`source`)
 *   - how confident we are (`confidence`)
 *   - when and by whom it was observed (`observedAt`, `observedBy`)
 */

// ─── Provenance source ────────────────────────────────────────────────────────

/**
 * Origin of a field value.
 *
 * measured        — taken from sensor / instrument reading (e.g. laser measure, scanner)
 * scanned         — extracted from a RoomPlan / LiDAR scan bundle
 * observed        — recorded by the engineer through visual inspection
 * engineer_entered — manually typed or selected by the engineer in-app
 * customer_stated — provided verbally or via self-service by the occupant
 * transcribed     — extracted from a voice note transcript
 * derived         — calculated from other captured fields (e.g. heat-loss formula)
 * imported        — ingested from an external dataset (e.g. EPC register, UPRN lookup)
 * defaulted       — assumed from a known default (e.g. standard pipe size, U-value table)
 * unknown         — origin not recorded
 */
export type ProvenanceSource =
  | 'measured'
  | 'scanned'
  | 'observed'
  | 'engineer_entered'
  | 'customer_stated'
  | 'transcribed'
  | 'derived'
  | 'imported'
  | 'defaulted'
  | 'unknown';

// ─── Confidence band ──────────────────────────────────────────────────────────

/**
 * Banded confidence rating for a field value.
 *
 * high    — directly measured or independently verified
 * medium  — observed or stated, single source of truth
 * low     — estimated, inferred, or derived with significant uncertainty
 * unknown — confidence not assessed
 */
export type ConfidenceBand = 'high' | 'medium' | 'low' | 'unknown';

// ─── FieldValue wrapper ───────────────────────────────────────────────────────

/**
 * A provenance-aware wrapper for a single field value.
 *
 * Use this type for any field where the origin of the data matters to
 * downstream consumers (scan, recommendation engine, portal, reports).
 *
 * @template T — the underlying value type (e.g. number, string, union literal)
 */
export interface FieldValue<T> {
  /** The captured or derived value, or null if not yet known. */
  value: T | null;
  /** Where the value came from. */
  source: ProvenanceSource;
  /** How confident we are in this value. */
  confidence: ConfidenceBand;
  /** ISO-8601 timestamp of when the value was observed / measured. */
  observedAt?: string;
  /** Identifier of the engineer or system that produced this value. */
  observedBy?: string;
  /** Optional free-text annotation about this specific field. */
  notes?: string;
}
