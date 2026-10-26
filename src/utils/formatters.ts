import { Participant, RankedParticipant } from '../types/index.ts';

/**
 * Formats integer Indonesian Rupiah according to Black Owl's custom LED convention.
 * Formula: LED amount = actual Rupiah / 1,000,000, followed by "K".
 * Examples verified:
 * - 2.000.000 -> 2K
 * - 2.500.000 -> 2.5K
 * - 25.000.000 -> 25K
 * - 230.000.000 -> 230K
 * - 230.500.000 -> 230.5K
 * - 1.000.000.000 -> 1000K
 * - 0 -> 0K
 */
export function formatLedSpending(rupiah: number): string {
  if (!Number.isFinite(rupiah) || rupiah <= 0) return '0K';
  const val = rupiah / 1_000_000;
  // Round to at most 2 decimal places
  const rounded = Math.round(val * 100) / 100;
  return `${rounded}K`;
}

/**
 * Formats a number with Indonesian thousand separators (dot).
 * Example: 230000000 -> "230.000.000"
 */
export function formatThousands(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '0';
  const intVal = Math.floor(value);
  return intVal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Formats full Rupiah display string for admin.
 * Example: 230000000 -> "Rp230.000.000"
 */
export function formatRupiah(value: number): string {
  return `Rp${formatThousands(value)}`;
}

/**
 * Parses raw text input into clean integer Rupiah, rejecting negatives and non-numeric chars.
 * Example: "230.000.000" -> 230000000
 */
export function parseRupiahInput(raw: string): number {
  if (!raw) return 0;
  // Strip everything that isn't a digit
  const digitsOnly = raw.replace(/\D/g, '');
  if (!digitsOnly) return 0;
  const num = parseInt(digitsOnly, 10);
  return Number.isSafeInteger(num) && num >= 0 ? num : 0;
}

/**
 * Ranks participants authoritatively by actual spending descending.
 * Preserves stable ordering on equal spending using stored tieBreakOrder.
 * Never sorts using formatted display strings.
 */
export function rankParticipants(participants: Participant[]): RankedParticipant[] {
  const sorted = [...participants].sort((a, b) => {
    // Primary: spending descending
    if (b.spending !== a.spending) {
      return b.spending - a.spending;
    }
    // Tie-break: tieBreakOrder ascending (earliest created / set first)
    return (a.tieBreakOrder || 0) - (b.tieBreakOrder || 0);
  });

  return sorted.map((p, idx) => ({
    ...p,
    rank: idx + 1,
  }));
}
