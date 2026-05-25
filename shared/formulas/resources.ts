/**
 * Analytisches Ressourcenmodell (#009): Ressourcen werden nicht getickt,
 * sondern aus (amount, rate, cap, verstrichene Zeit) berechnet.
 * Siehe ARCHITECTURE.md §4.1. Reine Funktion — der Server materialisiert
 * (schreibt zurück) nur bei Ratenänderung/Verbrauch.
 */

export interface DeriveOpts {
  /** Zuletzt materialisierter Betrag. */
  amount: number;
  /** Produktion pro Stunde. */
  ratePerH: number;
  /** Lager-Obergrenze. */
  cap: number;
  /** Vergangene Zeit seit `as_of` in Millisekunden. */
  elapsedMs: number;
}

const MS_PER_HOUR = 3_600_000;

/** Aktueller (ganzzahliger, gedeckelter) Ressourcenbetrag. */
export function deriveAmount(opts: DeriveOpts): number {
  const hours = Math.max(0, opts.elapsedMs) / MS_PER_HOUR;
  const raw = opts.amount + opts.ratePerH * hours;
  return Math.min(opts.cap, Math.floor(raw));
}

/** Sekunden, bis das Lager voll ist (oder null, wenn nie: Rate ≤ 0 oder bereits voll). */
export function secondsUntilFull(opts: Omit<DeriveOpts, 'elapsedMs'>): number | null {
  if (opts.ratePerH <= 0 || opts.amount >= opts.cap) return null;
  return ((opts.cap - opts.amount) / opts.ratePerH) * 3600;
}
