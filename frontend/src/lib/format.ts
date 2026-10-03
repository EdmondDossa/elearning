export function formatDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h} h ${String(m).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];

// Fonction pure : "now" est fourni par l'appelant, ce qui la rend aussi testable
export function formatRelative(iso: string, now: number): string {
  const diffSec = Math.round((new Date(iso).getTime() - now) / 1000);
  for (const [unit, seconds] of UNITS) {
    if (Math.abs(diffSec) >= seconds)
      return rtf.format(Math.round(diffSec / seconds), unit);
  }
  return "à l'instant";
}
