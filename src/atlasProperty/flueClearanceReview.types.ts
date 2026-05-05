/**
 * flueClearanceReview.types.ts
 *
 * FlueClearanceReviewV1 — engineer review layer for external flue evidence.
 *
 * Represents a reviewed engineer judgement record linking an external area scan
 * and a flue terminal pin to a human review outcome.  This is not automatic
 * compliance — no calculated pass/fail is produced here.  Compliance decisions
 * require a qualified engineer acting on the structured evidence.
 *
 * Design principles:
 *   - Engineer review evidence only; no automatic compliance outcome.
 *   - No calculated pass/fail.
 *   - Customer-facing outputs receive a summary only unless
 *     customerDetailEnabled is explicitly set to true.
 *   - Intended to sit between capture (ExternalClearanceSceneV1) and any
 *     future regulation-check layer: captured → reviewed → install concern.
 */

// ─── Flue clearance review status ────────────────────────────────────────────

/**
 * Engineer-assigned status for a flue clearance review record.
 *
 * not_reviewed — captured but not yet examined by an engineer
 * needs_review — flagged for attention; engineer has not yet concluded
 * acceptable   — engineer judges the clearance evidence is acceptable
 * concern      — engineer has identified a concern requiring follow-up
 * blocked      — engineer judges the clearance situation blocks install
 */
export type FlueClearanceReviewStatus =
  | 'not_reviewed'
  | 'needs_review'
  | 'acceptable'
  | 'concern'
  | 'blocked';

// ─── Review submission status ─────────────────────────────────────────────────

/**
 * Lifecycle status of the review record itself.
 *
 * draft     — review started but not yet submitted
 * submitted — review submitted for consideration
 * finalised — review outcome is confirmed and locked
 */
export type FlueClearanceReviewSubmissionStatus =
  | 'draft'
  | 'submitted'
  | 'finalised';

// ─── FlueClearanceReviewV1 ────────────────────────────────────────────────────

/**
 * FlueClearanceReviewV1 — engineer review record for external flue evidence.
 *
 * Links an external area scan and a flue terminal pin to an engineer's review
 * judgement.  This is a review evidence record, not an automatic compliance
 * decision.  The `status` field reflects the engineer's assessment; it is NOT
 * a regulatory pass/fail.
 *
 * Rules:
 *   - No compliance calculation is performed on this type.
 *   - No pass/fail field is present.
 *   - Customer outputs receive a summary only unless customerDetailEnabled
 *     is explicitly true.
 */
export interface FlueClearanceReviewV1 {
  /** Unique identifier for this review record (UUID string). */
  reviewId: string;

  /** ID of the property visit this review belongs to. */
  visitId: string;

  /**
   * ID of the external area scan this review is based on
   * (ExternalClearanceSceneV1.id).
   */
  externalAreaScanId: string;

  /**
   * ID of the flue terminal object pin this review is based on
   * (ObjectPinV2.pinId from the session capture).
   */
  terminalPinId: string;

  /**
   * IDs of the measurement lines used as evidence in this review.
   * References structured measurements in the associated
   * ExternalClearanceSceneV1.measurements array.
   */
  measurementLineIds: string[];

  /**
   * Engineer-assigned review status.
   *
   * This is an engineering judgement, not an automatic compliance outcome.
   * No regulatory pass/fail should be inferred from this field alone.
   */
  status: FlueClearanceReviewStatus;

  /** Free-text notes from the reviewing engineer. */
  notes?: string;

  /**
   * Identifier of the engineer who performed this review.
   * May be a user ID, email, or other system identifier.
   */
  reviewedByUserId?: string;

  /** ISO-8601 timestamp of when the review was completed. */
  reviewedAt?: string;

  /**
   * Lifecycle status of the review record.
   *
   * draft     — started but not yet submitted
   * submitted — submitted for consideration
   * finalised — outcome confirmed and locked
   */
  reviewStatus: FlueClearanceReviewSubmissionStatus;

  /**
   * Whether full review detail is enabled for customer-facing outputs.
   *
   * Defaults to false.  When false, customer outputs must show only a
   * summary of the review outcome, not the full detail.  Set to true only
   * when explicitly agreed with the customer.
   */
  customerDetailEnabled?: boolean;
}
