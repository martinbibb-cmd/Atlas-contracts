/**
 * hardwareRegistry.applianceDefinitionV1.test.ts
 *
 * Tests for the HardwareRegistryV1 contract — types, constants, validators,
 * and the MasterRegistry fixture.
 *
 * Coverage:
 *
 * Constants:
 *   1.  HARDWARE_REGISTRY_V1_SCHEMA_VERSION is '1.0'
 *
 * validateApplianceDefinitionV1 — happy path:
 *   2.  Minimal valid appliance passes
 *   3.  Full appliance with optional fields passes
 *
 * validateApplianceDefinitionV1 — rejection cases:
 *   4.  Non-object (null) rejected
 *   5.  Non-object (array) rejected
 *   6.  Wrong schemaVersion rejected
 *   7.  Missing modelId rejected
 *   8.  Empty modelId rejected
 *   9.  Missing brand rejected
 *   10. Missing modelName rejected
 *   11. Invalid category rejected
 *   12. Missing dimensions rejected
 *   13. dimensions.widthMm zero rejected
 *   14. dimensions.widthMm negative rejected
 *   15. dimensions.depthMm missing rejected
 *   16. dimensions.heightMm non-number rejected
 *   17. Missing clearanceRules rejected
 *   18. clearanceRules.frontMm negative rejected
 *   19. clearanceRules.sideMm missing rejected
 *   20. clearanceRules.topMm non-number rejected
 *   21. clearanceRules.bottomMm missing rejected
 *   22. outputKw zero rejected
 *   23. outputKw negative rejected
 *   24. notes non-string rejected
 *   25. Extra unknown fields are tolerated
 *   26. TypeScript narrowing: appliance typed after ok: true
 *
 * validateMasterRegistryV1 — happy path:
 *   27. Valid fixture passes
 *
 * validateMasterRegistryV1 — rejection cases:
 *   28. Non-object input rejected
 *   29. Wrong schemaVersion rejected
 *   30. Missing updatedAt rejected
 *   31. Invalid updatedAt (non-ISO) rejected
 *   32. appliances not an array rejected
 *   33. Empty appliances array rejected
 *   34. Invalid entry in appliances reports index
 *   35. TypeScript narrowing: registry typed after ok: true
 *
 * Fixture assertions:
 *   36. Fixture: schemaVersion is '1.0'
 *   37. Fixture: appliances is non-empty
 *   38. Fixture: first entry modelId is 'worcester_greenstar_4000_30kw'
 *   39. Fixture: first entry category is 'boiler'
 *   40. Fixture: first entry dimensions are all positive numbers
 *   41. Fixture: first entry clearanceRules are all non-negative numbers
 *   42. Fixture: all entries pass validateApplianceDefinitionV1
 *
 * All known categories are accepted:
 *   43. category 'boiler' accepted
 *   44. category 'heat_pump' accepted
 *   45. category 'cylinder' accepted
 *   46. category 'other' accepted
 */

import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
import {
  HARDWARE_REGISTRY_V1_SCHEMA_VERSION,
  validateApplianceDefinitionV1,
  validateMasterRegistryV1,
} from '../src/hardwareRegistry/index';
import type {
  ApplianceDefinitionV1,
  MasterRegistryV1,
} from '../src/hardwareRegistry/index';

// ─── Load fixture ─────────────────────────────────────────────────────────────

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const registryFixture: Record<string, unknown> = require('../fixtures/hardware_registry_v1_master_example.json') as Record<string, unknown>;

// ─── Helper: minimal valid appliance ─────────────────────────────────────────

function minimalAppliance(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: '1.0',
    modelId: 'test_boiler_20kw',
    brand: 'Test Brand',
    modelName: 'Test Boiler 20kW',
    category: 'boiler',
    dimensions: { widthMm: 400, depthMm: 300, heightMm: 700 },
    clearanceRules: { frontMm: 600, sideMm: 5, topMm: 200, bottomMm: 200 },
    ...overrides,
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

describe('HardwareRegistryV1 constants', () => {
  it('1. HARDWARE_REGISTRY_V1_SCHEMA_VERSION is "1.0"', () => {
    expect(HARDWARE_REGISTRY_V1_SCHEMA_VERSION).toBe('1.0');
  });
});

// ─── validateApplianceDefinitionV1 ───────────────────────────────────────────

describe('validateApplianceDefinitionV1 — happy path', () => {
  it('2. Minimal valid appliance passes', () => {
    const result = validateApplianceDefinitionV1(minimalAppliance());
    expect(result.ok).toBe(true);
  });

  it('3. Full appliance with optional fields passes', () => {
    const result = validateApplianceDefinitionV1(
      minimalAppliance({ outputKw: 20, notes: 'Data sheet ref: ABC-123' }),
    );
    expect(result.ok).toBe(true);
  });
});

describe('validateApplianceDefinitionV1 — rejection cases', () => {
  it('4. Non-object (null) rejected', () => {
    const result = validateApplianceDefinitionV1(null);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/non-null object/i);
  });

  it('5. Non-object (array) rejected', () => {
    const result = validateApplianceDefinitionV1([]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/non-null object/i);
  });

  it('6. Wrong schemaVersion rejected', () => {
    const result = validateApplianceDefinitionV1(minimalAppliance({ schemaVersion: '2.0' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/schemaVersion/i);
  });

  it('7. Missing modelId rejected', () => {
    const { modelId: _m, ...rest } = minimalAppliance();
    const result = validateApplianceDefinitionV1(rest);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/modelId/i);
  });

  it('8. Empty modelId rejected', () => {
    const result = validateApplianceDefinitionV1(minimalAppliance({ modelId: '' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/modelId/i);
  });

  it('9. Missing brand rejected', () => {
    const { brand: _b, ...rest } = minimalAppliance();
    const result = validateApplianceDefinitionV1(rest);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/brand/i);
  });

  it('10. Missing modelName rejected', () => {
    const { modelName: _n, ...rest } = minimalAppliance();
    const result = validateApplianceDefinitionV1(rest);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/modelName/i);
  });

  it('11. Invalid category rejected', () => {
    const result = validateApplianceDefinitionV1(minimalAppliance({ category: 'furnace' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/category/i);
  });

  it('12. Missing dimensions rejected', () => {
    const { dimensions: _d, ...rest } = minimalAppliance();
    const result = validateApplianceDefinitionV1(rest);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/dimensions/i);
  });

  it('13. dimensions.widthMm zero rejected', () => {
    const result = validateApplianceDefinitionV1(
      minimalAppliance({ dimensions: { widthMm: 0, depthMm: 300, heightMm: 700 } }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/widthMm/i);
  });

  it('14. dimensions.widthMm negative rejected', () => {
    const result = validateApplianceDefinitionV1(
      minimalAppliance({ dimensions: { widthMm: -100, depthMm: 300, heightMm: 700 } }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/widthMm/i);
  });

  it('15. dimensions.depthMm missing rejected', () => {
    const result = validateApplianceDefinitionV1(
      minimalAppliance({ dimensions: { widthMm: 400, heightMm: 700 } }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/depthMm/i);
  });

  it('16. dimensions.heightMm non-number rejected', () => {
    const result = validateApplianceDefinitionV1(
      minimalAppliance({ dimensions: { widthMm: 400, depthMm: 300, heightMm: 'tall' } }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/heightMm/i);
  });

  it('17. Missing clearanceRules rejected', () => {
    const { clearanceRules: _cr, ...rest } = minimalAppliance();
    const result = validateApplianceDefinitionV1(rest);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/clearanceRules/i);
  });

  it('18. clearanceRules.frontMm negative rejected', () => {
    const result = validateApplianceDefinitionV1(
      minimalAppliance({ clearanceRules: { frontMm: -1, sideMm: 5, topMm: 200, bottomMm: 200 } }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/frontMm/i);
  });

  it('19. clearanceRules.sideMm missing rejected', () => {
    const result = validateApplianceDefinitionV1(
      minimalAppliance({ clearanceRules: { frontMm: 600, topMm: 200, bottomMm: 200 } }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/sideMm/i);
  });

  it('20. clearanceRules.topMm non-number rejected', () => {
    const result = validateApplianceDefinitionV1(
      minimalAppliance({
        clearanceRules: { frontMm: 600, sideMm: 5, topMm: 'high', bottomMm: 200 },
      }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/topMm/i);
  });

  it('21. clearanceRules.bottomMm missing rejected', () => {
    const result = validateApplianceDefinitionV1(
      minimalAppliance({ clearanceRules: { frontMm: 600, sideMm: 5, topMm: 200 } }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/bottomMm/i);
  });

  it('22. outputKw zero rejected', () => {
    const result = validateApplianceDefinitionV1(minimalAppliance({ outputKw: 0 }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/outputKw/i);
  });

  it('23. outputKw negative rejected', () => {
    const result = validateApplianceDefinitionV1(minimalAppliance({ outputKw: -5 }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/outputKw/i);
  });

  it('24. notes non-string rejected', () => {
    const result = validateApplianceDefinitionV1(minimalAppliance({ notes: 42 }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/notes/i);
  });

  it('25. Extra unknown fields are tolerated', () => {
    const result = validateApplianceDefinitionV1(
      minimalAppliance({ futureField: 'value', anotherExtra: true }),
    );
    expect(result.ok).toBe(true);
  });

  it('26. TypeScript narrowing: appliance typed as ApplianceDefinitionV1 after ok: true', () => {
    const result = validateApplianceDefinitionV1(minimalAppliance());
    if (result.ok) {
      const appliance: ApplianceDefinitionV1 = result.appliance;
      expect(appliance.modelId).toBe('test_boiler_20kw');
    } else {
      throw new Error('Expected ok: true');
    }
  });
});

// ─── validateMasterRegistryV1 ────────────────────────────────────────────────

describe('validateMasterRegistryV1 — happy path', () => {
  it('27. Valid fixture passes', () => {
    const result = validateMasterRegistryV1(registryFixture);
    expect(result.ok).toBe(true);
  });
});

describe('validateMasterRegistryV1 — rejection cases', () => {
  function cloneRegistry(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return { ...registryFixture, ...overrides };
  }

  it('28. Non-object input rejected', () => {
    const result = validateMasterRegistryV1(null);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/non-null object/i);
  });

  it('29. Wrong schemaVersion rejected', () => {
    const result = validateMasterRegistryV1(cloneRegistry({ schemaVersion: '2.0' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/schemaVersion/i);
  });

  it('30. Missing updatedAt rejected', () => {
    const { updatedAt: _u, ...rest } = registryFixture;
    const result = validateMasterRegistryV1(rest);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/updatedAt/i);
  });

  it('31. Invalid updatedAt (non-ISO) rejected', () => {
    const result = validateMasterRegistryV1(cloneRegistry({ updatedAt: 'yesterday' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/updatedAt/i);
  });

  it('32. appliances not an array rejected', () => {
    const result = validateMasterRegistryV1(cloneRegistry({ appliances: {} }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/appliances/i);
  });

  it('33. Empty appliances array rejected', () => {
    const result = validateMasterRegistryV1(cloneRegistry({ appliances: [] }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/appliances/i);
  });

  it('34. Invalid entry in appliances reports index', () => {
    const badEntry = { schemaVersion: '1.0', modelId: '', brand: 'X', modelName: 'Y', category: 'boiler', dimensions: { widthMm: 400, depthMm: 300, heightMm: 700 }, clearanceRules: { frontMm: 600, sideMm: 5, topMm: 200, bottomMm: 200 } };
    const result = validateMasterRegistryV1(cloneRegistry({ appliances: [badEntry] }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/appliances\[0\]/);
      expect(result.error).toMatch(/modelId/i);
    }
  });

  it('35. TypeScript narrowing: registry typed as MasterRegistryV1 after ok: true', () => {
    const result = validateMasterRegistryV1(registryFixture);
    if (result.ok) {
      const registry: MasterRegistryV1 = result.registry;
      expect(registry.schemaVersion).toBe('1.0');
    } else {
      throw new Error('Expected ok: true');
    }
  });
});

// ─── Fixture assertions ───────────────────────────────────────────────────────

describe('MasterRegistryV1 fixture', () => {
  it('36. Fixture: schemaVersion is "1.0"', () => {
    expect(registryFixture['schemaVersion']).toBe('1.0');
  });

  it('37. Fixture: appliances is non-empty', () => {
    expect(Array.isArray(registryFixture['appliances'])).toBe(true);
    expect((registryFixture['appliances'] as unknown[]).length).toBeGreaterThan(0);
  });

  it('38. Fixture: first entry modelId is "worcester_greenstar_4000_30kw"', () => {
    const first = (registryFixture['appliances'] as Record<string, unknown>[])[0];
    expect(first['modelId']).toBe('worcester_greenstar_4000_30kw');
  });

  it('39. Fixture: first entry category is "boiler"', () => {
    const first = (registryFixture['appliances'] as Record<string, unknown>[])[0];
    expect(first['category']).toBe('boiler');
  });

  it('40. Fixture: first entry dimensions are all positive numbers', () => {
    const first = (registryFixture['appliances'] as Record<string, unknown>[])[0];
    const dims = first['dimensions'] as Record<string, unknown>;
    expect(typeof dims['widthMm']).toBe('number');
    expect(typeof dims['depthMm']).toBe('number');
    expect(typeof dims['heightMm']).toBe('number');
    expect(dims['widthMm'] as number).toBeGreaterThan(0);
    expect(dims['depthMm'] as number).toBeGreaterThan(0);
    expect(dims['heightMm'] as number).toBeGreaterThan(0);
  });

  it('41. Fixture: first entry clearanceRules are all non-negative numbers', () => {
    const first = (registryFixture['appliances'] as Record<string, unknown>[])[0];
    const cr = first['clearanceRules'] as Record<string, unknown>;
    expect(typeof cr['frontMm']).toBe('number');
    expect(typeof cr['sideMm']).toBe('number');
    expect(typeof cr['topMm']).toBe('number');
    expect(typeof cr['bottomMm']).toBe('number');
    expect(cr['frontMm'] as number).toBeGreaterThanOrEqual(0);
    expect(cr['sideMm'] as number).toBeGreaterThanOrEqual(0);
    expect(cr['topMm'] as number).toBeGreaterThanOrEqual(0);
    expect(cr['bottomMm'] as number).toBeGreaterThanOrEqual(0);
  });

  it('42. Fixture: all entries pass validateApplianceDefinitionV1', () => {
    const appliances = registryFixture['appliances'] as unknown[];
    for (let i = 0; i < appliances.length; i++) {
      const result = validateApplianceDefinitionV1(appliances[i]);
      expect(result.ok, `entry ${i} failed: ${!result.ok ? result.error : ''}`).toBe(true);
    }
  });
});

// ─── All known categories ─────────────────────────────────────────────────────

describe('All known ApplianceCategory values are accepted', () => {
  it('43. category "boiler" accepted', () => {
    const result = validateApplianceDefinitionV1(minimalAppliance({ category: 'boiler' }));
    expect(result.ok).toBe(true);
  });

  it('44. category "heat_pump" accepted', () => {
    const result = validateApplianceDefinitionV1(minimalAppliance({ category: 'heat_pump' }));
    expect(result.ok).toBe(true);
  });

  it('45. category "cylinder" accepted', () => {
    const result = validateApplianceDefinitionV1(minimalAppliance({ category: 'cylinder' }));
    expect(result.ok).toBe(true);
  });

  it('46. category "other" accepted', () => {
    const result = validateApplianceDefinitionV1(minimalAppliance({ category: 'other' }));
    expect(result.ok).toBe(true);
  });
});
