/**
 * versions.ts
 *
 * Supported scan bundle contract versions and version-check helpers.
 *
 * Bump the minor version for backwards-compatible additions.
 * Bump the major version for breaking changes — old importers must reject
 * bundles whose major version they do not recognise.
 */

// ─── Supported versions ───────────────────────────────────────────────────────

/**
 * The complete set of scan bundle versions that this package can validate.
 * Any bundle whose `version` field is not in this tuple will be rejected with
 * a distinct `rejected_unsupported_version` result so callers can surface a
 * useful error to the user.
 */
export const SUPPORTED_SCAN_BUNDLE_VERSIONS = ['1.0'] as const;

export type ScanBundleVersion = (typeof SUPPORTED_SCAN_BUNDLE_VERSIONS)[number];

// ─── Version helpers ──────────────────────────────────────────────────────────

/**
 * isSupportedVersion — returns true when `version` is one of
 * SUPPORTED_SCAN_BUNDLE_VERSIONS.
 */
export function isSupportedVersion(version: unknown): version is ScanBundleVersion {
  return (SUPPORTED_SCAN_BUNDLE_VERSIONS as readonly string[]).includes(version as string);
}

/**
 * isUnsupportedVersion — returns true when the input object has a `version`
 * field whose value is a non-empty string but is not in
 * SUPPORTED_SCAN_BUNDLE_VERSIONS.
 *
 * Useful so an importer can distinguish between a structurally invalid bundle
 * and one that simply comes from a newer (unsupported) contract version.
 */
export function isUnsupportedVersion(input: unknown): boolean {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return false;
  const v = (input as Record<string, unknown>)['version'];
  if (typeof v !== 'string' || v.length === 0) return false;
  return !isSupportedVersion(v);
}
