import { describe, it, expect } from 'vitest';
import { CITY_GRID_SIZE } from '../constants/game';
import { generateCityTiles, HALL_SLOT, type NodeType } from './terrain';

const VALID: ReadonlySet<NodeType> = new Set(['wood', 'stone', 'iron', 'grain', 'lake', 'empty']);

describe('generateCityTiles', () => {
  it('ist deterministisch (gleicher Seed → gleiches Layout)', () => {
    expect(generateCityTiles(42)).toEqual(generateCityTiles(42));
  });

  it('füllt das gesamte 9×9-Raster', () => {
    expect(generateCityTiles(7)).toHaveLength(CITY_GRID_SIZE * CITY_GRID_SIZE);
  });

  it('reserviert das Zentrum für die Hall (empty)', () => {
    const center = generateCityTiles(7).find((t) => t.slotX === HALL_SLOT && t.slotY === HALL_SLOT);
    expect(center?.nodeType).toBe('empty');
  });

  it('erzeugt nur gültige Knotentypen', () => {
    for (const t of generateCityTiles(123)) {
      expect(VALID.has(t.nodeType)).toBe(true);
    }
  });

  it('unterschiedliche Seeds ergeben i. d. R. unterschiedliche Layouts', () => {
    const a = JSON.stringify(generateCityTiles(1));
    const b = JSON.stringify(generateCityTiles(2));
    expect(a).not.toBe(b);
  });
});
