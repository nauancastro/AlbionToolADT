import { suggestMount } from '../data/cities.data';
import { CartWeightSummary } from '../models/calculation.model';

export function summarizeWeight(totalWeightKg: number): CartWeightSummary {
  return {
    totalWeightKg,
    mountSuggestion: suggestMount(totalWeightKg),
  };
}
