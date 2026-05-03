/**
 * quoteInstallationPlanV1.test.ts
 *
 * Contract shape tests for QuoteInstallationPlanV1 and related types.
 *
 * Because these are pure contracts with no runtime validator, tests assert
 * that well-formed objects satisfy the TypeScript types and that key runtime
 * properties are present and correctly shaped.  JSON round-trips confirm
 * serialisation safety.
 *
 * Coverage:
 *   1. Like-for-like combi swap plan — fixture round-trip and required fields
 *   2. Combi relocation plan — gas and condensate routes present and valid
 *   3. Flue route — generic estimated 90-degree and 45-degree equivalent lengths
 *   4. Partial draft plan — all optional fields may be omitted
 *   5. Unknown / assumed states — are valid and do not cause assertion errors
 */

import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
import type {
  QuoteInstallationPlanV1,
  QuoteInstallLocationV1,
  QuoteInstallRouteV1,
  QuoteFlueRouteV1,
  QuoteFlueSegmentV1,
  QuoteJobClassificationV1,
  QuoteSystemSelectionV1,
  QuoteGeneratedScopeItemV1,
  QuotePlanConfidenceSummaryV1,
} from '../src/session/quoteInstallationPlanV1.types';

// ─── Load canonical fixture ───────────────────────────────────────────────────

const require = createRequire(import.meta.url);
const fixture = require('../fixtures/quoteInstallationPlanV1.example.json') as QuoteInstallationPlanV1;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

function isIsoLike(v: unknown): v is string {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v);
}

function roundTrip<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ─── 1. Like-for-like combi swap plan ─────────────────────────────────────────

describe('QuoteInstallationPlanV1 — like-for-like combi swap (fixture)', () => {
  it('1a. fixture has required top-level fields', () => {
    expect(isNonEmptyString(fixture.id)).toBe(true);
    expect(isIsoLike(fixture.createdAt)).toBe(true);
    expect(isIsoLike(fixture.updatedAt)).toBe(true);
    expect(fixture.currentSystem).toBeDefined();
    expect(fixture.proposedSystem).toBeDefined();
    expect(fixture.jobClassification).toBeDefined();
    expect(Array.isArray(fixture.locations)).toBe(true);
    expect(Array.isArray(fixture.routes)).toBe(true);
    expect(Array.isArray(fixture.flueRoutes)).toBe(true);
    expect(Array.isArray(fixture.generatedScope)).toBe(true);
  });

  it('1b. current and proposed systems are both combi', () => {
    expect(fixture.currentSystem.systemType).toBe('combi');
    expect(fixture.proposedSystem.systemType).toBe('combi');
  });

  it('1c. job classification is like_for_like at same_location', () => {
    const jc = fixture.jobClassification;
    expect(jc.systemChange).toBe('like_for_like');
    expect(jc.locationChange).toBe('same_location');
    expect(jc.complexityBand).toBe('low');
  });

  it('1d. locations all have required fields', () => {
    for (const loc of fixture.locations) {
      expect(isNonEmptyString(loc.id)).toBe(true);
      expect(isNonEmptyString(loc.kind)).toBe(true);
      expect(isNonEmptyString(loc.label)).toBe(true);
      expect(isNonEmptyString(loc.provenance)).toBe(true);
      expect(isNonEmptyString(loc.confidence)).toBe(true);
    }
  });

  it('1e. fixture survives JSON round-trip without data loss', () => {
    const copy = roundTrip(fixture);
    expect(copy.id).toBe(fixture.id);
    expect(copy.currentSystem.systemType).toBe(fixture.currentSystem.systemType);
    expect(copy.locations.length).toBe(fixture.locations.length);
    expect(copy.flueRoutes.length).toBe(fixture.flueRoutes.length);
  });

  it('1f. generatedScope items have required fields', () => {
    for (const item of fixture.generatedScope) {
      expect(isNonEmptyString(item.id)).toBe(true);
      expect(isNonEmptyString(item.category)).toBe(true);
      expect(isNonEmptyString(item.label)).toBe(true);
      expect(isNonEmptyString(item.source)).toBe(true);
      expect(isNonEmptyString(item.confidence)).toBe(true);
      expect(typeof item.includedByDefault).toBe('boolean');
    }
  });
});

// ─── 2. Combi relocation with gas and condensate routes ───────────────────────

describe('QuoteInstallationPlanV1 — combi relocation with routes', () => {
  const relocationPlan: QuoteInstallationPlanV1 = {
    id: 'plan-002-relocation',
    sourceSessionId: 'session-def-002',
    createdAt: '2025-08-01T10:00:00Z',
    updatedAt: '2025-08-01T14:00:00Z',
    currentSystem: {
      systemType: 'combi',
      heatSourceLocationId: 'loc-old-boiler',
    },
    proposedSystem: {
      systemType: 'combi',
      heatSourceLocationId: 'loc-new-boiler',
      modelRef: { manufacturer: 'Vaillant', model: 'ecoTEC plus 30kW', outputKw: 30, source: 'manual' },
    },
    jobClassification: {
      systemChange: 'like_for_like',
      locationChange: 'nearby_move',
      complexityBand: 'medium',
      derivedFrom: 'atlas_rule',
      reasons: ['Boiler moving from kitchen to utility room', 'New gas run required'],
    },
    locations: [
      {
        id: 'loc-old-boiler',
        kind: 'existing_boiler',
        label: 'Old boiler (kitchen)',
        provenance: 'confirmed_from_scan',
        confidence: 'confirmed',
      },
      {
        id: 'loc-new-boiler',
        kind: 'proposed_boiler',
        label: 'New boiler position (utility room)',
        provenance: 'drawn_on_plan',
        confidence: 'estimated',
      },
      {
        id: 'loc-gas-meter',
        kind: 'gas_meter',
        label: 'Gas meter (hallway)',
        provenance: 'confirmed_from_scan',
        confidence: 'confirmed',
      },
      {
        id: 'loc-internal-waste',
        kind: 'internal_waste',
        label: 'Utility sink waste',
        provenance: 'confirmed_from_scan',
        confidence: 'confirmed',
      },
    ],
    routes: [
      {
        id: 'route-gas-001',
        routeType: 'gas',
        status: 'proposed',
        startLocationId: 'loc-gas-meter',
        endLocationId: 'loc-new-boiler',
        points: [
          { coordinates: { floorPlan: { x: 100, y: 200, unit: 'px' } }, kind: 'start' },
          { coordinates: { floorPlan: { x: 200, y: 200, unit: 'px' } }, kind: 'bend', bendAngleDeg: 90 },
          { coordinates: { floorPlan: { x: 200, y: 350, unit: 'px' } }, kind: 'end' },
        ],
        diameterMm: 22,
        installMethod: 'surface',
        provenance: 'drawn_on_plan',
        confidence: 'estimated',
        calculated: {
          physicalLengthM: 4.5,
          bendCount: 1,
          wallPenetrations: 1,
          floorPenetrations: 0,
          roomsCrossed: ['room-hallway', 'room-utility'],
          complexityBand: 'medium',
          calculationMode: 'estimated',
        },
      },
      {
        id: 'route-condensate-002',
        routeType: 'condensate',
        status: 'proposed',
        startLocationId: 'loc-new-boiler',
        endLocationId: 'loc-internal-waste',
        points: [
          { coordinates: { floorPlan: { x: 200, y: 350, unit: 'px' } }, kind: 'start' },
          { coordinates: { floorPlan: { x: 200, y: 420, unit: 'px' } }, kind: 'end' },
        ],
        diameterMm: 22,
        installMethod: 'surface',
        insulationRequired: false,
        provenance: 'drawn_on_plan',
        confidence: 'estimated',
        calculated: {
          physicalLengthM: 0.7,
          bendCount: 0,
          complexityBand: 'low',
          calculationMode: 'estimated',
        },
      },
    ],
    flueRoutes: [],
    generatedScope: [
      {
        id: 'scope-gas-route',
        category: 'gas',
        label: 'New gas run from meter to utility room',
        source: 'generated_from_route',
        relatedRouteIds: ['route-gas-001'],
        confidence: 'estimated',
        includedByDefault: true,
        needsVerification: true,
      },
      {
        id: 'scope-condensate',
        category: 'condensate',
        label: 'Run condensate to utility sink',
        source: 'generated_from_route',
        relatedRouteIds: ['route-condensate-002'],
        confidence: 'estimated',
        includedByDefault: true,
      },
    ],
  };

  it('2a. plan has a gas route and a condensate route', () => {
    const routeTypes = relocationPlan.routes.map((r) => r.routeType);
    expect(routeTypes).toContain('gas');
    expect(routeTypes).toContain('condensate');
  });

  it('2b. gas route has start and end location refs', () => {
    const gasRoute = relocationPlan.routes.find((r) => r.routeType === 'gas');
    expect(gasRoute).toBeDefined();
    expect(gasRoute!.startLocationId).toBe('loc-gas-meter');
    expect(gasRoute!.endLocationId).toBe('loc-new-boiler');
  });

  it('2c. gas route calculated fields are populated', () => {
    const gasRoute = relocationPlan.routes.find((r) => r.routeType === 'gas');
    expect(gasRoute!.calculated?.physicalLengthM).toBe(4.5);
    expect(gasRoute!.calculated?.bendCount).toBe(1);
    expect(gasRoute!.calculated?.wallPenetrations).toBe(1);
  });

  it('2d. job classification reflects nearby_move medium complexity', () => {
    expect(relocationPlan.jobClassification.locationChange).toBe('nearby_move');
    expect(relocationPlan.jobClassification.complexityBand).toBe('medium');
  });

  it('2e. plan round-trips through JSON cleanly', () => {
    const copy = roundTrip(relocationPlan);
    expect(copy.routes.length).toBe(2);
    expect(copy.jobClassification.reasons).toEqual(relocationPlan.jobClassification.reasons);
  });
});

// ─── 3. Flue route equivalent-length calculation ──────────────────────────────

describe('QuoteFlueRouteV1 — generic estimated equivalent lengths', () => {
  const straightSegment: QuoteFlueSegmentV1 = {
    id: 'seg-straight',
    kind: 'straight',
    physicalLengthM: 1.0,
    equivalentLengthM: 1.0,
    quantity: 1,
  };

  const elbow90: QuoteFlueSegmentV1 = {
    id: 'seg-elbow-90',
    kind: 'elbow_90',
    equivalentLengthM: 1.0,
    quantity: 2,
    notes: 'Generic 90-degree elbow equivalent length',
  };

  const elbow45: QuoteFlueSegmentV1 = {
    id: 'seg-elbow-45',
    kind: 'elbow_45',
    equivalentLengthM: 0.5,
    quantity: 1,
    notes: 'Generic 45-degree elbow equivalent length',
  };

  const terminal: QuoteFlueSegmentV1 = {
    id: 'seg-terminal',
    kind: 'terminal',
    equivalentLengthM: 0.0,
    quantity: 1,
  };

  const flueRoute: QuoteFlueRouteV1 = {
    id: 'flue-route-generic-test',
    boilerLocationId: 'loc-boiler',
    terminalLocationId: 'loc-terminal',
    flueFamily: 'vertical_with_offsets',
    segments: [straightSegment, elbow90, elbow45, terminal],
    calculation: {
      physicalLengthM: 1.0,
      // 1.0 + (2 × 1.0) + (1 × 0.5) = 3.5 m
      equivalentLengthM: 3.5,
      maxEquivalentLengthM: 10.0,
      remainingAllowanceM: 6.5,
      result: 'within_allowance',
      calculationMode: 'generic_estimate',
      assumptions: [
        '90-degree elbow penalty: 1.0 m (generic estimate)',
        '45-degree elbow penalty: 0.5 m (generic estimate)',
        'Terminal carries no equivalent length penalty',
        'Maximum equivalent length sourced from generic combi guidance',
      ],
    },
    ruleSource: 'generic_estimate',
    provenance: 'drawn_on_plan',
    confidence: 'estimated',
  };

  it('3a. route has one 90-degree and one 45-degree elbow segment', () => {
    const kinds = flueRoute.segments.map((s) => s.kind);
    expect(kinds).toContain('elbow_90');
    expect(kinds).toContain('elbow_45');
  });

  it('3b. equivalent length calculation is within allowance', () => {
    expect(flueRoute.calculation.result).toBe('within_allowance');
    expect(flueRoute.calculation.equivalentLengthM).toBe(3.5);
  });

  it('3c. remaining allowance equals max minus equivalent', () => {
    const { equivalentLengthM, maxEquivalentLengthM, remainingAllowanceM } = flueRoute.calculation;
    expect(remainingAllowanceM).toBe((maxEquivalentLengthM ?? 0) - (equivalentLengthM ?? 0));
  });

  it('3d. ruleSource is generic_estimate and calculationMode matches', () => {
    expect(flueRoute.ruleSource).toBe('generic_estimate');
    expect(flueRoute.calculation.calculationMode).toBe('generic_estimate');
  });

  it('3e. assumptions array is non-empty', () => {
    expect(Array.isArray(flueRoute.calculation.assumptions)).toBe(true);
    expect(flueRoute.calculation.assumptions!.length).toBeGreaterThan(0);
  });
});

// ─── 4. Partial draft plan — all optional fields omitted ──────────────────────

describe('QuoteInstallationPlanV1 — partial draft (minimal required fields only)', () => {
  const draft: QuoteInstallationPlanV1 = {
    id: 'plan-draft-003',
    createdAt: '2025-09-01T08:00:00Z',
    updatedAt: '2025-09-01T08:00:00Z',
    currentSystem: { systemType: 'unknown' },
    proposedSystem: { systemType: 'unknown' },
    jobClassification: {
      systemChange: 'unknown',
      locationChange: 'unknown',
      complexityBand: 'needs_review',
      derivedFrom: 'manual',
    },
    locations: [],
    routes: [],
    flueRoutes: [],
    generatedScope: [],
  };

  it('4a. draft is valid without optional top-level fields', () => {
    expect(draft.sourceSessionId).toBeUndefined();
    expect(draft.sourceRecommendationId).toBeUndefined();
    expect(draft.confidenceSummary).toBeUndefined();
    expect(draft.notes).toBeUndefined();
  });

  it('4b. draft has empty arrays for locations, routes, flueRoutes, generatedScope', () => {
    expect(draft.locations).toEqual([]);
    expect(draft.routes).toEqual([]);
    expect(draft.flueRoutes).toEqual([]);
    expect(draft.generatedScope).toEqual([]);
  });

  it('4c. system selections without optional fields are valid', () => {
    expect(draft.currentSystem.heatSourceLocationId).toBeUndefined();
    expect(draft.currentSystem.cylinderLocationId).toBeUndefined();
    expect(draft.currentSystem.modelRef).toBeUndefined();
    expect(draft.currentSystem.notes).toBeUndefined();
  });

  it('4d. job classification without reasons is valid', () => {
    expect(draft.jobClassification.reasons).toBeUndefined();
  });

  it('4e. draft round-trips through JSON', () => {
    const copy = roundTrip(draft);
    expect(copy.id).toBe(draft.id);
    expect(copy.currentSystem.systemType).toBe('unknown');
  });
});

// ─── 5. Unknown / assumed states ─────────────────────────────────────────────

describe('QuoteInstallationPlanV1 — unknown and assumed states', () => {
  it('5a. location with assumed provenance and confidence is valid', () => {
    const loc: QuoteInstallLocationV1 = {
      id: 'loc-assumed-001',
      kind: 'other',
      label: 'Assumed location',
      provenance: 'assumed',
      confidence: 'assumed',
    };
    expect(loc.provenance).toBe('assumed');
    expect(loc.confidence).toBe('assumed');
  });

  it('5b. route with assumed status is valid', () => {
    const route: QuoteInstallRouteV1 = {
      id: 'route-assumed-001',
      routeType: 'other',
      status: 'assumed',
      points: [],
      provenance: 'assumed',
      confidence: 'assumed',
    };
    expect(route.status).toBe('assumed');
  });

  it('5c. job classification with all unknown values is valid', () => {
    const jc: QuoteJobClassificationV1 = {
      systemChange: 'unknown',
      locationChange: 'unknown',
      complexityBand: 'needs_review',
      derivedFrom: 'manual',
    };
    expect(jc.systemChange).toBe('unknown');
    expect(jc.locationChange).toBe('unknown');
    expect(jc.complexityBand).toBe('needs_review');
  });

  it('5d. system selection with unknown systemType is valid', () => {
    const sys: QuoteSystemSelectionV1 = { systemType: 'unknown' };
    expect(sys.systemType).toBe('unknown');
  });

  it('5e. flue route with unknown family and ruleSource is valid', () => {
    const flueRoute: QuoteFlueRouteV1 = {
      id: 'flue-unknown-001',
      flueFamily: 'unknown',
      segments: [],
      calculation: {
        result: 'not_calculated',
        calculationMode: 'generic_estimate',
      },
      ruleSource: 'unknown',
      provenance: 'assumed',
      confidence: 'assumed',
    };
    expect(flueRoute.flueFamily).toBe('unknown');
    expect(flueRoute.calculation.result).toBe('not_calculated');
  });

  it('5f. scope item with needs_verification flag set is valid', () => {
    const item: QuoteGeneratedScopeItemV1 = {
      id: 'scope-check-001',
      category: 'other',
      label: 'Item requiring verification',
      source: 'manual',
      confidence: 'needs_verification',
      includedByDefault: false,
      needsVerification: true,
    };
    expect(item.needsVerification).toBe(true);
    expect(item.confidence).toBe('needs_verification');
  });

  it('5g. confidence summary with all-zero counts is valid', () => {
    const summary: QuotePlanConfidenceSummaryV1 = {
      confirmedCount: 0,
      measuredCount: 0,
      estimatedCount: 0,
      needsVerificationCount: 0,
      assumedCount: 0,
    };
    expect(summary.confirmedCount).toBe(0);
  });
});
