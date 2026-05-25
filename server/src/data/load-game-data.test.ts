import { describe, it, expect } from 'vitest';
import { loadGameData } from './load-game-data';

describe('loadGameData', () => {
  const data = loadGameData();

  it('lädt und validiert die echten data/*.yaml ohne Fehler', () => {
    expect(data.buildings.buildings.hall).toBeDefined();
    expect(data.resources.adjacency.nodeFirstPct).toBe(50);
    expect(data.titles.titles[0]?.key).toBe('sir');
    expect(Object.keys(data.units.units).length).toBeGreaterThan(0);
  });

  it('Produzenten-Tabellen haben exakt 10 Stufen', () => {
    expect(data.buildings.buildings.woodcutter_lodge?.outputPerH).toHaveLength(10);
    expect(data.buildings.buildings.woodcutter_lodge?.cost).toHaveLength(10);
  });

  it('Cross-Refs sind gültig (Verstärker → existierender Produzent)', () => {
    expect(data.buildings.buildings.sawmill?.boosts).toBe('woodcutter_lodge');
    expect(data.resources.resources.timber?.producer).toBe('woodcutter_lodge');
  });
});
