// Validation.swift
//
// Runtime validation for incoming scan bundles.
//
// All incoming scan data must pass through this module before it reaches any
// other Atlas code.  The validator:
//   1. Confirms the input is valid JSON data.
//   2. Checks the version field is present and supported.
//   3. Attempts to decode the bundle into the correct versioned type.
//
// The validator does NOT attempt to parse or normalise coordinates — that is
// the importer's responsibility.

import Foundation

// MARK: - Validation result types

/// The result of validating a scan bundle.
public enum ScanValidationResult: Sendable {
    /// The bundle passed all structural checks.
    case success(ScanBundle)
    /// The bundle failed validation with one or more error messages.
    case failure([String])

    /// Returns `true` when validation succeeded.
    public var isValid: Bool {
        if case .success = self { return true }
        return false
    }

    /// Returns the validated bundle, or `nil` if validation failed.
    public var bundle: ScanBundle? {
        if case .success(let b) = self { return b }
        return nil
    }

    /// Returns the error messages, or an empty array if validation succeeded.
    public var errors: [String] {
        if case .failure(let e) = self { return e }
        return []
    }
}

// MARK: - Public API

/// Entry-point validator for raw JSON `Data` representing a scan bundle.
///
/// Returns `.success(bundle)` when the bundle passes all structural checks,
/// or `.failure(errors)` with a list of human-readable error strings.
///
/// Usage:
/// ```swift
/// let result = validateScanBundle(jsonData)
/// switch result {
/// case .success(let bundle):
///     // use bundle
/// case .failure(let errors):
///     // handle errors
/// }
/// ```
public func validateScanBundle(_ data: Data) -> ScanValidationResult {
    // Step 1: Parse as generic JSON to inspect the version field.
    let jsonObject: Any
    do {
        jsonObject = try JSONSerialization.jsonObject(with: data, options: [])
    } catch {
        return .failure(["Scan bundle must be valid JSON: \(error.localizedDescription)"])
    }

    guard let dict = jsonObject as? [String: Any] else {
        return .failure(["Scan bundle must be a non-null JSON object"])
    }

    // Step 2: Version check — produces a structured rejection before deeper
    // structural validation so callers can distinguish between
    // 'invalid shape' and 'unsupported version'.
    guard let version = dict["version"] as? String else {
        return .failure(["version: must be a string"])
    }

    if !isSupportedVersion(version) {
        return .failure([
            "version '\(version)' is not supported. " +
            "Supported versions: \(supportedScanBundleVersions.joined(separator: ", "))"
        ])
    }

    // Step 3: Full decode into the versioned type.
    do {
        let decoder = JSONDecoder()
        let bundle = try decoder.decode(ScanBundleV1.self, from: data)
        return .success(bundle)
    } catch let decodingError {
        return .failure(["Failed to decode ScanBundleV1: \(decodingError.localizedDescription)"])
    }
}

/// Convenience overload that accepts a JSON string.
public func validateScanBundle(_ jsonString: String) -> ScanValidationResult {
    guard let data = jsonString.data(using: .utf8) else {
        return .failure(["Input string is not valid UTF-8"])
    }
    return validateScanBundle(data)
}
