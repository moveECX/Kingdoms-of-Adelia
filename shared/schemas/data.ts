/**
 * Zod-Schemas für die `data/*.yaml`-Balance-Dateien (GAME-DATA-SCHEMA.md §3).
 * Der Loader (Server) liest YAML und validiert es hiergegen beim Boot.
 * Unbekannte Keys, NaN und falsche Array-Längen werden abgewiesen; Cross-Refs
 * (z. B. Verstärker → existierender Produzent) prüft `validateCrossRefs`.
 */
import { z } from 'zod';
import { MAX_BUILDING_LEVEL, RESOURCES } from '../constants/game';

const int = z.number().int();
const nonNeg = int.nonnegative();
const pct = int; // Prozentwerte dürfen > 100 sein (z. B. Bautempo)

/** [timber, stone] pro Stufe. */
const costEntry = z.tuple([nonNeg, nonNeg]);

const buildingCategory = z.enum([
  'core',
  'producer',
  'enhancer',
  'civic',
  'storage',
  'gold',
  'trade',
  'military',
  'defense',
  'special',
]);

const buildingDef = z
  .object({
    name: z.string().min(1),
    category: buildingCategory,
    maxLevel: int.min(1).max(MAX_BUILDING_LEVEL).default(MAX_BUILDING_LEVEL),
    prereq: z.object({ hall: int.min(1) }).partial().optional(),
    onePerCity: z.boolean().optional(),
    indestructible: z.boolean().optional(),
    cost: z.array(costEntry).optional(),
    buildTimeSec: z.array(nonNeg).optional(),
    // producer
    produces: z.enum(RESOURCES).optional(),
    outputPerH: z.array(nonNeg).optional(),
    // enhancer
    boosts: z.string().optional(),
    efficiencyPct: z.array(pct).optional(),
    storagePct: z.array(pct).optional(),
    // cottage
    buildSpeedPct: z.array(pct).optional(),
    manpowerPct: z.array(pct).optional(),
    // storage / hall
    storage: z.array(nonNeg).optional(),
    baseTimberPerH: nonNeg.optional(),
    buildSlotsPerLevel: nonNeg.optional(),
    // gold
    goldPerH: z.array(nonNeg).optional(),
    // defense
    combatBonusPct: z.array(pct).optional(),
  })
  .strict()
  .superRefine((b, ctx) => {
    // Alle vorhandenen Stufen-Arrays müssen exakt maxLevel lang sein.
    const arrays: Array<readonly [string, readonly unknown[] | undefined]> = [
      ['cost', b.cost],
      ['buildTimeSec', b.buildTimeSec],
      ['outputPerH', b.outputPerH],
      ['efficiencyPct', b.efficiencyPct],
      ['storagePct', b.storagePct],
      ['buildSpeedPct', b.buildSpeedPct],
      ['manpowerPct', b.manpowerPct],
      ['storage', b.storage],
      ['goldPerH', b.goldPerH],
      ['combatBonusPct', b.combatBonusPct],
    ];
    for (const [key, arr] of arrays) {
      if (arr !== undefined && arr.length !== b.maxLevel) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${key}: Länge ${arr.length} ≠ maxLevel ${b.maxLevel}`,
          path: [key],
        });
      }
    }
  });

export const buildingsFileSchema = z
  .object({
    schemaVersion: int.min(1),
    buildings: z.record(z.string(), buildingDef),
  })
  .strict();

const unitDef = z
  .object({
    name: z.string().min(1),
    type: z.enum(['infantry', 'cavalry', 'caster', 'siege', 'naval', 'scout', 'special', 'epic']),
    role: z.enum(['offensive', 'defensive']),
    attack: nonNeg,
    defense: z
      .object({ infantry: nonNeg, cavalry: nonNeg, magic: nonNeg, artillery: nonNeg })
      .strict(),
    upkeepGrain: nonNeg,
    carry: nonNeg,
    trainer: z.object({ building: z.string(), level: int.min(1) }).strict(),
    cost: z
      .object({ timber: nonNeg, stone: nonNeg, iron: nonNeg, gold: nonNeg })
      .strict(),
  })
  .strict();

export const unitsFileSchema = z
  .object({
    schemaVersion: int.min(1),
    units: z.record(z.string(), unitDef),
    combat: z
      .object({
        intensity: z.record(z.string(), z.number().min(0).max(1)),
        defenseColumns: z.array(z.string()),
        wallBonusPct: z.array(pct),
        nightProtection: z
          .object({ fromHour: int, toHour: int, attackerPenaltyPct: pct })
          .strict(),
      })
      .strict(),
  })
  .strict();

export const resourcesFileSchema = z
  .object({
    schemaVersion: int.min(1),
    resources: z.record(
      z.enum(RESOURCES),
      z
        .object({
          kind: z.enum(['harvested', 'pooled']),
          producer: z.string().optional(),
          enhancer: z.string().optional(),
          capped: z.boolean().optional(),
        })
        .strict(),
    ),
    adjacency: z
      .object({
        model: z.enum(['additive_then_enhancer', 'separate_multiplicative']),
        nodeFirstPct: pct,
        nodeAdditionalPct: pct,
        lakeForFarmPct: pct,
        maxEnhancersPerProducer: int.min(1),
      })
      .strict(),
  })
  .strict();

export const titlesFileSchema = z
  .object({
    schemaVersion: int.min(1),
    titles: z.array(
      z
        .object({
          key: z.string(),
          maxCities: int.min(1),
          citadelsRequired: nonNeg,
          mana: nonNeg,
          manaRegenPerH: nonNeg,
        })
        .strict(),
    ),
  })
  .strict();

export type BuildingsFile = z.infer<typeof buildingsFileSchema>;
export type UnitsFile = z.infer<typeof unitsFileSchema>;
export type ResourcesFile = z.infer<typeof resourcesFileSchema>;
export type TitlesFile = z.infer<typeof titlesFileSchema>;
export type BuildingDef = z.infer<typeof buildingDef>;
export type UnitDef = z.infer<typeof unitDef>;

export interface GameData {
  buildings: BuildingsFile;
  units: UnitsFile;
  resources: ResourcesFile;
  titles: TitlesFile;
}

/**
 * Cross-Datei-Validierung: Referenzen zwischen den Dateien müssen aufgehen.
 * Wirft `Error` mit allen gesammelten Problemen, sonst nichts.
 */
export function validateCrossRefs(data: GameData): void {
  const problems: string[] = [];
  const buildingKeys = new Set(Object.keys(data.buildings.buildings));

  for (const [key, b] of Object.entries(data.buildings.buildings)) {
    if (b.category === 'enhancer' && b.boosts !== undefined && !buildingKeys.has(b.boosts)) {
      problems.push(`Gebäude "${key}": boosts -> unbekanntes Gebäude "${b.boosts}"`);
    }
  }
  for (const [res, def] of Object.entries(data.resources.resources)) {
    if (def.producer !== undefined && !buildingKeys.has(def.producer)) {
      problems.push(`Ressource "${res}": producer -> unbekanntes Gebäude "${def.producer}"`);
    }
    if (def.enhancer !== undefined && !buildingKeys.has(def.enhancer)) {
      problems.push(`Ressource "${res}": enhancer -> unbekanntes Gebäude "${def.enhancer}"`);
    }
  }
  for (const [key, u] of Object.entries(data.units.units)) {
    if (!buildingKeys.has(u.trainer.building)) {
      problems.push(`Einheit "${key}": trainer -> unbekanntes Gebäude "${u.trainer.building}"`);
    }
  }
  if (problems.length > 0) {
    throw new Error(`Ungültige Spieldaten (Cross-Refs):\n- ${problems.join('\n- ')}`);
  }
}
