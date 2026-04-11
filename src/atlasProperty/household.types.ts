/**
 * household.types.ts
 *
 * HouseholdModelV1 — occupant composition, behaviour, preferences, and
 * constraints captured during the survey visit.
 *
 * This model is where voice-first survey data extracted from Atlas Scan should
 * ultimately land, giving Atlas Mind a structured, provenance-aware view of
 * household context without coupling to UI-specific survey state.
 */

import type { FieldValue } from './fieldValue';

// ─── Hot water usage ──────────────────────────────────────────────────────────

/**
 * Hot-water usage pattern for the household.
 *
 * Used by the recommendation engine to size cylinders and heat pumps correctly
 * and to model legionella risk.
 */
export interface HotWaterUsageModelV1 {
  /** Estimated daily hot-water usage in litres. */
  dailyLitres?: FieldValue<number>;
  /** Peak demand pattern. */
  peakDemand?: FieldValue<'morning_only' | 'morning_and_evening' | 'spread' | 'unknown'>;
  /** Whether there is a bath in the property. */
  bathPresent?: FieldValue<boolean>;
  /** Number of showers. */
  showerCount?: FieldValue<number>;
  /** Whether an electric shower is present (affects sizing). */
  electricShowerPresent?: FieldValue<boolean>;
}

// ─── Heating pattern ─────────────────────────────────────────────────────────

/**
 * Space-heating usage pattern for the household.
 */
export interface HeatingPatternModelV1 {
  /**
   * Typical daily heating hours.
   * Provenance-aware: may be customer-stated or engineer-estimated.
   */
  hoursPerDay?: FieldValue<number>;
  /** Whether the heating is on all day during cold weather. */
  continuousHeating?: FieldValue<boolean>;
  /** Comfort temperature preference in °C. */
  comfortTempC?: FieldValue<number>;
  /** Whether the household heats all rooms or zones only. */
  zoningApproach?: FieldValue<'whole_house' | 'zoned' | 'single_zone' | 'unknown'>;
}

// ─── Preferences ─────────────────────────────────────────────────────────────

/**
 * Customer technology and upgrade preferences captured during the visit.
 */
export interface PreferencesModelV1 {
  /** Interest level in a heat pump upgrade. */
  heatPumpInterest?: FieldValue<'high' | 'medium' | 'low' | 'none' | 'unknown'>;
  /** Interest in a solar PV or solar thermal addition. */
  solarInterest?: FieldValue<'high' | 'medium' | 'low' | 'none' | 'unknown'>;
  /** Preference for smart controls / thermostat. */
  smartControlsInterest?: FieldValue<'high' | 'medium' | 'low' | 'none' | 'unknown'>;
  /** Willingness to consider removing the gas connection entirely. */
  gasFreeWillingness?: FieldValue<'willing' | 'uncertain' | 'unwilling' | 'unknown'>;
  /** Budget range preference for the installation. */
  budgetBand?: FieldValue<'budget' | 'mid' | 'premium' | 'unknown'>;
  /** Free-text summary of customer preferences from the survey. */
  notes?: string;
}

// ─── Customer constraint ─────────────────────────────────────────────────────

/**
 * A customer-stated or engineer-observed constraint that limits the scope
 * of the installation (e.g. listed building, no loft access, landlord approval
 * required).
 */
export interface CustomerConstraintV1 {
  /** Machine-readable constraint code. */
  code: string;
  /** Human-readable description. */
  description: string;
  /** How the constraint was identified. */
  source: FieldValue<'customer_stated' | 'engineer_observed' | 'imported'>;
}

// ─── HouseholdModelV1 ────────────────────────────────────────────────────────

/**
 * Occupant composition, behaviour, preferences, and constraints.
 *
 * Composition is split by age band so that occupancy profiles can be used
 * for SAP domestic hot-water calculations and demand-side modelling.
 * All counts are provenance-aware FieldValue<number> because they are
 * typically stated by the customer rather than measured.
 */
export interface HouseholdModelV1 {
  /** Household composition by age band. */
  composition: {
    /** Number of adults (26–65) in the household. */
    adultCount: FieldValue<number>;
    /** Number of children aged 0–4. */
    childCount0to4: FieldValue<number>;
    /** Number of children aged 5–10. */
    childCount5to10: FieldValue<number>;
    /** Number of children aged 11–17. */
    childCount11to17: FieldValue<number>;
    /** Number of young adults aged 18–25 living at home. */
    youngAdultCount18to25AtHome: FieldValue<number>;
  };
  /**
   * Typical weekday occupancy pattern.
   * Informs heating schedule optimisation and demand-side modelling.
   */
  occupancyPattern?: FieldValue<
    'usually_out' | 'steady_home' | 'mixed' | 'unknown'
  >;
  /** Hot-water usage profile. */
  hotWaterUsage?: HotWaterUsageModelV1;
  /** Space-heating usage pattern. */
  heatingPattern?: HeatingPatternModelV1;
  /** Technology and upgrade preferences. */
  preferences?: PreferencesModelV1;
  /** Customer or property constraints affecting the installation scope. */
  constraints?: CustomerConstraintV1[];
}
