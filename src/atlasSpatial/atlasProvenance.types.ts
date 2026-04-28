/**
 * atlasProvenance.types.ts
 *
 * AtlasProvenanceEntryV1 — an immutable audit-trail entry for a spatial model.
 *
 * Each time the model is created, imported, or patched, a provenance entry is
 * appended.  The provenance log is append-only: entries are never modified or
 * deleted.
 */

// ─── Provenance actor ─────────────────────────────────────────────────────────

/**
 * The actor responsible for a provenance event.
 */
export interface AtlasProvenanceActor {
  /** Whether the change was made by a human user or by an automated system. */
  type: 'user' | 'system';
  /** Identifier of the user or system (e.g. user ID, service name). */
  id?: string;
}

// ─── Provenance event kinds ───────────────────────────────────────────────────

/**
 * The kind of event recorded in a provenance entry.
 *
 * model_created     — the model was created from scratch or via import
 * patch_applied     — an AtlasSpatialPatchV1 was applied to the model
 * import_from_scan  — the model was (re-)imported from a SessionCapture
 * manual_edit       — a free-form manual edit outside the patch system
 */
export type AtlasProvenanceEventKind =
  | 'model_created'
  | 'patch_applied'
  | 'import_from_scan'
  | 'manual_edit';

// ─── Provenance entry ─────────────────────────────────────────────────────────

/**
 * AtlasProvenanceEntryV1 — a single immutable audit-trail entry.
 *
 * Appended to `AtlasSpatialModelV1.provenance` whenever the model is created
 * or modified.
 */
export interface AtlasProvenanceEntryV1 {
  /** Unique identifier for this entry (UUID string). */
  id: string;
  /** Kind of event this entry records. */
  eventKind: AtlasProvenanceEventKind;
  /** The actor who triggered this event. */
  actor: AtlasProvenanceActor;
  /** ISO-8601 timestamp of the event. */
  occurredAt: string;
  /** Optional reference to the patch that caused this entry (if applicable). */
  patchId?: string;
  /** Optional reference to the source session (if applicable). */
  sourceSessionId?: string;
  /** Optional free-text description of what changed. */
  description?: string;
}
