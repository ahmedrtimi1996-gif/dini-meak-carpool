/** Morocco-local date helpers. Trip dates/times are stored as local wall-clock values. */
export const MA_TZ = "Africa/Casablanca";

/** Today's date in Morocco as YYYY-MM-DD (never UTC-shifted). */
export function todayMA(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Current Morocco time as HH:mm. */
export function nowTimeMA(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: MA_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d! + days));
  return dt.toISOString().slice(0, 10);
}

const LOCALES = { fr: "fr-FR", en: "en-GB", ar: "ar-MA" } as const;

/** "lundi 19 octobre 2026" — formats a plain YYYY-MM-DD without timezone drift. */
export function longDate(iso: string, lang: string = "fr"): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!, 12));
  const s = new Intl.DateTimeFormat(LOCALES[lang as keyof typeof LOCALES] ?? "fr-FR", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(dt);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Minutes between two local date+time pairs. */
export function minutesBetween(d1: string, t1: string, d2: string, t2: string): number {
  const a = Date.parse(`${d1}T${t1.slice(0, 5)}:00Z`);
  const b = Date.parse(`${d2}T${t2.slice(0, 5)}:00Z`);
  return Math.round((b - a) / 60000);
}

export function humanDuration(minutes: number | null | undefined): string | null {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}
