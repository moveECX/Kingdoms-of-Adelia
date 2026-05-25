import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import {
  buildingsFileSchema,
  resourcesFileSchema,
  titlesFileSchema,
  unitsFileSchema,
  validateCrossRefs,
} from '@adelia/shared/schemas/data';
import type { GameData } from '@adelia/shared/schemas/data';

/** `data/` liegt im Repo-Root; diese Datei: server/src/data/load-game-data.ts. */
const DEFAULT_DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../../data');

function readYaml(dir: string, file: string): unknown {
  return parseYaml(readFileSync(join(dir, file), 'utf8'));
}

/**
 * Lädt + validiert alle `data/*.yaml` beim Boot. Wirft bei Schema-Verstößen
 * (unbekannte Keys, NaN, falsche Array-Längen) oder hängenden Cross-Refs.
 */
export function loadGameData(dataDir: string = DEFAULT_DATA_DIR): GameData {
  const data: GameData = {
    resources: resourcesFileSchema.parse(readYaml(dataDir, 'resources.yaml')),
    buildings: buildingsFileSchema.parse(readYaml(dataDir, 'buildings.yaml')),
    units: unitsFileSchema.parse(readYaml(dataDir, 'units.yaml')),
    titles: titlesFileSchema.parse(readYaml(dataDir, 'titles.yaml')),
  };
  validateCrossRefs(data);
  return data;
}
