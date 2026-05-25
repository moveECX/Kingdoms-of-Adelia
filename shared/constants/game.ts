/** Zentrale Spielkonstanten — von Server und Client genutzt. */

export const PROJECT_NAME = 'Kingdoms of Adelia';
export const WORLD_NAME = 'Adelia';

/** Die fünf Ressourcen. */
export const RESOURCES = ['timber', 'stone', 'iron', 'grain', 'gold'] as const;
export type Resource = (typeof RESOURCES)[number];

/** Geerntete (stadt-lokale, gedeckelte) Ressourcen — Gold ist gepoolt/ungedeckelt. */
export const HARVESTED_RESOURCES = ['timber', 'stone', 'iron', 'grain'] as const;
export type HarvestedResource = (typeof HARVESTED_RESOURCES)[number];

export const MAX_BUILDING_LEVEL = 10;

/** Stadtraster: 9×9 mit der Hall im Zentrum. */
export const CITY_GRID_SIZE = 9;
export const SLOTS_PER_HALL_LEVEL = 10;
/** Maximale Gebäudezahl bei Hall-Stufe 10. */
export const MAX_BUILDINGS = SLOTS_PER_HALL_LEVEL * MAX_BUILDING_LEVEL;

/** Takt des Server-Schedulers. */
export const TICK_INTERVAL_MS = 1000;
