<script lang="ts">
  /**
   * Eigene Inline-SVG-Icon-Registry (IP-sauber, keine Fremd-Assets).
   * Symbole sind geometrisch + token-gefärbt; `fill: currentColor` erbt die Farbe.
   * 24×24-viewBox. Nutzung: <Icon name="citadel" /> bzw. <Icon name={iconForBuilding(key)} />.
   */
  interface Props {
    name: string;
    size?: number;
  }
  let { name, size = 18 }: Props = $props();

  const ICONS: Record<string, string> = {
    // --- Ressourcen ---
    timber:
      '<polygon points="12,3 8,9 16,9"/><polygon points="9.5,9 7,14 17,14 14.5,9"/><polygon points="8,14 5.5,19 18.5,19 16,14"/><rect x="11" y="19" width="2" height="3"/>',
    stone: '<polygon points="12,4 18,8 18.5,15 12,20 5.5,15 6,8"/>',
    iron: '<polygon points="4,13 7,8 17,8 20,13 16,18 8,18"/>',
    grain:
      '<ellipse cx="12" cy="6.5" rx="2" ry="3.6"/><ellipse cx="8.3" cy="9.6" rx="1.7" ry="3"/><ellipse cx="15.7" cy="9.6" rx="1.7" ry="3"/><rect x="11.2" y="9" width="1.6" height="12"/>',
    gold: '<circle cx="12" cy="12" r="8"/>',

    // --- Gebäude (Kategorien + markante Einzel-Icons) ---
    hall: '<rect x="11.3" y="1.5" width="1" height="3"/><polygon points="12,3.5 4,9.5 20,9.5"/><rect x="6" y="9.5" width="12" height="10.5"/><rect x="10.3" y="14" width="3.4" height="6"/>',
    enhancer: '<polygon points="12,4 18.5,12 14.5,12 14.5,20 9.5,20 9.5,12 5.5,12"/>',
    cottage: '<polygon points="12,5 5,11 19,11"/><rect x="7" y="11" width="10" height="8"/><rect x="10.3" y="14" width="3.4" height="5"/>',
    storage: '<polygon points="5,9 12,5 19,9"/><rect x="5" y="9" width="14" height="11"/>',
    coin: '<circle cx="12" cy="12" r="8"/>',
    market:
      '<rect x="5" y="10" width="14" height="6" rx="1"/><circle cx="8.5" cy="18" r="1.8"/><circle cx="15.5" cy="18" r="1.8"/><rect x="8" y="6.5" width="2" height="3.5"/>',
    military: '<path d="M12 3 L19 6 V11.5 C19 16 16 19 12 21 C8 19 5 16 5 11.5 V6 Z"/>',
    wall: '<path d="M3 10 H5.5 V8 H8.5 V10 H11 V8 H14 V10 H16.5 V8 H19.5 V10 H21 V20 H3 Z"/>',
    citadel:
      '<path d="M4 21 V10 H6.5 V8 H9 V10 H11 V8 H13.5 V10 H15.5 V8 H18 V10 H20 V21 Z"/><rect x="10" y="15" width="4" height="6" fill="#0d0f12"/>',
    sanctuary:
      '<polygon points="12,3 3.5,8.5 20.5,8.5"/><rect x="4.5" y="9" width="2.2" height="9.5"/><rect x="8.5" y="9" width="2.2" height="9.5"/><rect x="13.3" y="9" width="2.2" height="9.5"/><rect x="17.3" y="9" width="2.2" height="9.5"/><rect x="3.5" y="18.5" width="17" height="2"/>',
    tower: '<polygon points="8,21 8,9 6.5,9 6.5,7 9.5,7 9.5,9 14.5,9 14.5,7 17.5,7 17.5,9 16,9 16,21"/>',
    trap: '<polygon points="4,8 8,16 12,8 16,16 20,8"/><rect x="4" y="16" width="16" height="2"/>',
    mage_tower:
      '<polygon points="8,21 8,9 12,4 16,9 16,21"/><polygon points="12,10 12.8,12.1 15,12.1 13.2,13.5 13.9,15.6 12,14.3 10.1,15.6 10.8,13.5 9,12.1 11.2,12.1"/>',

    // --- Einheiten-Typen ---
    infantry: '<polygon points="11,2 13,2 13,14 12,16.5 11,14"/><rect x="7.5" y="13.3" width="9" height="1.8"/><rect x="11" y="15.5" width="2" height="4.5"/>',
    cavalry: '<path d="M6 16 a6 6 0 0 1 12 0 Z"/><rect x="5.3" y="16" width="13.4" height="2"/><polygon points="12,3 13.5,9 10.5,9"/>',
    caster:
      '<rect x="5.5" y="13.5" width="13" height="2" transform="rotate(-42 12 14.5)"/><polygon points="17,3 17.9,6 21,6 18.5,7.9 19.4,11 17,9.1 14.6,11 15.5,7.9 13,6 16.1,6"/>',
    siege: '<circle cx="7.5" cy="18" r="2"/><circle cx="16" cy="18" r="2"/><polygon points="5,17 7.5,9 18.5,9 16.5,17"/>',
    naval: '<path d="M5 13 H19 L16.5 19 H7.5 Z"/><rect x="11" y="4" width="1.8" height="9"/><polygon points="12.8,4.5 18,8 12.8,9.5"/>',
    scout: '<path d="M3 12 C6.5 7 17.5 7 21 12 C17.5 17 6.5 17 3 12 Z"/><circle cx="12" cy="12" r="2.6" fill="#0d0f12"/>',
    marshal: '<polygon points="4,17 3,7 8.5,11 12,5 15.5,11 21,7 20,17"/><rect x="4" y="17" width="16" height="2.2"/>',

    // --- Terrain ---
    'node-lake':
      '<path d="M3 9 q3 -2.5 6 0 t6 0 t6 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M3 14 q3 -2.5 6 0 t6 0 t6 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    'node-empty': '<circle cx="12" cy="12" r="2.4"/>',

    // --- Karten-Glyphen ---
    shrine:
      '<polygon points="12,2 14.2,8.5 21,8.5 15.5,12.7 17.6,19.5 12,15.3 6.4,19.5 8.5,12.7 3,8.5 9.8,8.5"/>',
    dungeon: '<path d="M5 20 V12 a7 7 0 0 1 14 0 V20 H14.5 V13 a2.5 2.5 0 0 0 -5 0 V20 Z"/>',
    flag: '<rect x="5" y="3" width="1.6" height="18"/><polygon points="6.6,3.5 19,3.5 16,7.5 19,11.5 6.6,11.5"/>',
    dot: '<circle cx="12" cy="12" r="3"/>',
  };

  const markup = $derived(ICONS[name] ?? ICONS.dot);
</script>

<svg
  viewBox="0 0 24 24"
  width={size}
  height={size}
  fill="currentColor"
  class="icon"
  aria-hidden="true"
  role="presentation">
  <!-- eslint-disable-next-line svelte/no-at-html-tags -- statische, eigene SVG-Pfade (kein User-Input) -->
  {@html markup}
</svg>

<style>
  .icon {
    display: inline-block;
    vertical-align: -0.15em;
    flex-shrink: 0;
  }
</style>
