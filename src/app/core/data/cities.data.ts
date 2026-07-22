import { ALL_MARKET_LOCATIONS, City, TRADABLE_CITIES } from '../models/enums';

export const CITY_OPTIONS: City[] = TRADABLE_CITIES;
export const MARKET_LOCATION_OPTIONS: City[] = ALL_MARKET_LOCATIONS;

/** Mamute de Transporte / Boi têm capacidades de carga distintas — usado para sugerir montaria. */
export const MOUNT_CAPACITY_KG: { name: string; capacityKg: number }[] = [
  { name: 'Cavalo de Transporte', capacityKg: 700 },
  { name: 'Boi de Transporte', capacityKg: 1000 },
  { name: 'Mamute de Transporte (Carga)', capacityKg: 1500 },
  { name: 'Mamute de Transporte (Espectral)', capacityKg: 2100 },
];

export function suggestMount(totalWeightKg: number): string {
  const fit = MOUNT_CAPACITY_KG.find((m) => totalWeightKg <= m.capacityKg);
  if (fit) return fit.name;
  return `Carga acima de ${MOUNT_CAPACITY_KG[MOUNT_CAPACITY_KG.length - 1].capacityKg}kg — divida o transporte`;
}
