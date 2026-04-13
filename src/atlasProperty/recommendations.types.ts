/**
 * recommendations.types.ts
 *
 * RecommendationWorkspaceV1 — a lightweight workspace stub that holds the
 * recommendation engine's outputs without making them canonical property truth.
 *
 * Design constraint (per Atlas-contracts scope):
 *   - This type must NOT become a full recommendation-engine contract.
 *   - Its purpose is to give the recommendation engine a defined place to
 *     attach its outputs to the property root WITHOUT spreading raw engine
 *     types across other apps.
 *   - The detailed recommendation-engine types (draft entities, simulation
 *     results, etc.) belong to Atlas Recommendation, not to Atlas-contracts.
 *
 * Only high-level summary fields and cross-app identifiers live here.
 */

// ─── Why-not reason ───────────────────────────────────────────────────────────

/**
 * A structured explanation for why a system or measure was not recommended,
 * or was given a cautionary status.
 *
 * Linking each reason to an `educationalExplainerRef` allows the UI to surface
 * a deep link to the relevant explainer article in the Educational Library
 * (e.g. "Pipe Capacity" for a hydraulic failure), giving customers and
 * engineers actionable context rather than a bare rejection code.
 */
export interface WhyNotReasonV1 {
  /**
   * Machine-readable reason code (e.g. 'hydraulic_capacity_insufficient',
   * 'flue_clearance_violation', 'budget_exceeded').
   */
  code: string;
  /**
   * Human-readable plain-English explanation of the reason.
   * Should be concise enough to display in a summary card.
   */
  explanation: string;
  /**
   * Reference ID for the Educational Explainer article that provides
   * deeper context for this reason.  Absent if no explainer is available.
   */
  educationalExplainerRef?: string;
}

// ─── Recommendation item summary ─────────────────────────────────────────────

/**
 * A minimal summary of a single recommended measure.
 *
 * Enough context for the portal and scan app to show a card or badge without
 * needing to import full engine types.
 */
export interface RecommendationItemSummaryV1 {
  /** Recommendation engine internal ID for this item. */
  itemId: string;
  /**
   * Technology category code.
   * Non-exhaustive; the union is intentionally open via `string` fallback.
   */
  category:
    | 'air_source_heat_pump'
    | 'ground_source_heat_pump'
    | 'hybrid_heat_pump'
    | 'replacement_boiler'
    | 'solar_pv'
    | 'solar_thermal'
    | 'hot_water_cylinder'
    | 'radiator_upgrade'
    | 'insulation'
    | 'controls_upgrade'
    | 'other'
    | string;
  /** Short human-readable label for this recommendation. */
  label: string;
  /** Priority rank among all recommendations for this property (1 = highest). */
  rank?: number;
  /** Estimated installed cost in GBP (net of any grants modelled). */
  estimatedCostGbp?: number;
  /** Estimated annual carbon saving in kg CO₂e. */
  estimatedCarbonSavingKgCo2e?: number;
  /** Estimated annual energy bill saving in GBP. */
  estimatedBillSavingGbp?: number;
  /**
   * Engine readiness status.
   *
   * draft        — generated but not reviewed
   * under_review — currently being reviewed by an engineer or the customer
   * accepted     — customer has accepted this recommendation
   * rejected     — customer has rejected this recommendation
   * superseded   — replaced by a later recommendation
   */
  status:
    | 'draft'
    | 'under_review'
    | 'accepted'
    | 'rejected'
    | 'superseded';
  /**
   * Structured reasons why this measure was rejected or flagged with caution.
   *
   * Populated when `status` is `'rejected'` or the measure carries a cautionary
   * flag.  Each entry links the reason code to a plain-English explanation and,
   * where available, to an Educational Explainer article for deeper context.
   * Absent for accepted or draft items.
   */
  whyNotReasons?: WhyNotReasonV1[];
}

// ─── RecommendationWorkspaceV1 ───────────────────────────────────────────────

/**
 * A lightweight workspace that attaches recommendation outputs to an
 * AtlasPropertyV1 without making the full engine model canonical.
 *
 * Consumers that only need to know "what was recommended and at what status"
 * can read from here.  Consumers that need the full simulation detail should
 * resolve `engineRef` against Atlas Recommendation.
 */
export interface RecommendationWorkspaceV1 {
  /**
   * Reference ID within Atlas Recommendation for the full engine workspace
   * that produced these outputs.  Use this to resolve deep details.
   */
  engineRef?: string;

  /** ISO-8601 timestamp of the last engine run that produced these outputs. */
  lastRunAt?: string;

  /**
   * High-level readiness status of the recommendation set.
   *
   * pending         — no engine run has been completed yet
   * draft           — run complete, outputs not yet reviewed
   * ready_for_review — ready for engineer or customer review
   * accepted        — customer has accepted the recommended package
   * archived        — superseded by a newer run
   */
  status:
    | 'pending'
    | 'draft'
    | 'ready_for_review'
    | 'accepted'
    | 'archived';

  /** Summary items for each recommended measure. */
  items: RecommendationItemSummaryV1[];

  /**
   * Opaque metadata for the recommendation engine's own use.
   * Atlas-contracts consumers must treat this as a black box.
   */
  engineMeta?: Record<string, unknown>;
}
