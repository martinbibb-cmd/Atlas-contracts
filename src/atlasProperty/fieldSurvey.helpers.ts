/**
 * fieldSurvey.helpers.ts
 *
 * Pure helper functions derived from the minimal field survey payload.
 *
 * These helpers operate on AtlasFieldSurveyV1 data only — they are
 * side-effect-free and have no dependencies on external state.
 */

import type { AtlasFieldSurveyV1 } from './fieldSurvey.types';
import type { AtlasVisitReadiness } from './visitLifecycle.types';
import type { AtlasPropertyV1 } from './atlasProperty.types';

/**
 * Derives an AtlasVisitReadiness summary from the minimal field survey payload.
 *
 * All flags are boolean facts about what data is present — not scores or gates.
 *
 * @param property - A partial AtlasPropertyV1 containing the fieldSurvey field.
 * @returns A fully populated AtlasVisitReadiness object.
 */
export function deriveVisitReadinessFromFieldSurvey(
  property: Pick<AtlasPropertyV1, 'fieldSurvey'>,
): AtlasVisitReadiness {
  const survey: AtlasFieldSurveyV1 = property.fieldSurvey ?? {};

  const hasRooms = (survey.rooms?.length ?? 0) > 0;

  const hasPhotos = (survey.photos?.length ?? 0) > 0;

  const hasHeatingSystem =
    survey.systemPresence?.heatingSystemPresent === true ||
    (survey.keyObjects?.some(
      (o) => o.type === 'boiler',
    ) ?? false);

  const hasHotWaterSystem =
    survey.systemPresence?.hotWaterSystemPresent === true ||
    (survey.keyObjects?.some(
      (o) => o.type === 'cylinder' || o.type === 'hot_water_tank',
    ) ?? false);

  const hasKeyObjectBoiler =
    survey.keyObjects?.some((o) => o.type === 'boiler') ?? false;

  const hasKeyObjectFlue =
    survey.keyObjects?.some((o) => o.type === 'flue') ?? false;

  const hasAnyNotes =
    !!survey.notes?.rawTranscript ||
    !!survey.notes?.summary ||
    (survey.notes?.textNotes?.length ?? 0) > 0;

  return {
    hasRooms,
    hasPhotos,
    hasHeatingSystem,
    hasHotWaterSystem,
    hasKeyObjectBoiler,
    hasKeyObjectFlue,
    hasAnyNotes,
  };
}
