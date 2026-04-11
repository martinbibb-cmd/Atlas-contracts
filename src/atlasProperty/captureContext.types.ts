/**
 * captureContext.types.ts
 *
 * CaptureContextV1 — session-level metadata for the capture visit.
 *
 * This layer records who captured the property, with which app and device, and
 * the walkthrough state.  It sits above the raw scan geometry (ScanBundleV1) and
 * the structured survey data (BuildingModelV1 etc.) without duplicating them.
 *
 * Design note: CaptureContextV1 is deliberately narrow — it is the session
 * envelope, not the content.  App-layer concerns (navigation state, upload
 * queues, recorder state) must not appear here.
 */

// ─── CaptureContextV1 ─────────────────────────────────────────────────────────

/**
 * Session-level metadata for a property capture visit.
 *
 * Reflects the whole-property session model in Atlas Scan iOS where a
 * session is the root, workflow state is tracked separately from content,
 * and operator + device provenance are first-class.
 */
export interface CaptureContextV1 {
  /**
   * Unique identifier for this capture session.
   * Should be stable across partial syncs; typically a UUID string.
   */
  sessionId: string;

  /** ISO-8601 timestamp of when the session was started. */
  startedAt?: string;

  /** ISO-8601 timestamp of when the session was completed (if complete). */
  completedAt?: string;

  /** The engineer who conducted the visit. */
  operator?: {
    /** Atlas engineer / user identifier. */
    engineerId?: string;
    /** Display name of the engineer. */
    engineerName?: string;
  };

  /** Device and app context for the capture session. */
  device?: {
    /** Which Atlas app performed the capture. */
    app: 'atlas_scan' | 'atlas_mind';
    /** Semantic version string of the app (e.g. "2.1.0"). */
    appVersion?: string;
    /** Hardware model string (e.g. "iPhone 15 Pro"). */
    deviceModel?: string;
  };

  /**
   * Walkthrough state: whether the engineer performed a structured
   * room-by-room walkthrough and whether it was completed.
   */
  walkthrough?: {
    /** Whether a structured walkthrough was started. */
    started?: boolean;
    /** Whether the walkthrough was fully completed. */
    completed?: boolean;
    /** Any walkthrough notes recorded by the engineer. */
    notes?: string;
  };
}
