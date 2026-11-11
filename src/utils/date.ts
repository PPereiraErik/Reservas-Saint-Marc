const WEEKDAYS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/** Date -> "YYYY-MM-DD" no fuso local (não usa UTC). */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "YYYY-MM-DD" -> Date no fuso local. */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function addDays(key: string, days: number): string {
  const date = parseDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export function isValidDateKey(key: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  return toDateKey(parseDateKey(key)) === key;
}

/** "HH:MM" -> minutos desde 00:00 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** minutos -> "HH:MM" */
export function minutesToTime(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "Sábado, 3 de outubro" (ou com o ano) */
export function formatDateLong(key: string, withYear = false): string {
  const date = parseDateKey(key);
  const base = `${WEEKDAYS[date.getDay()]}, ${date.getDate()} de ${MONTHS[date.getMonth()]}`;
  return capitalize(withYear ? `${base} de ${date.getFullYear()}` : base);
}

/** "03/10/2026" */
export function formatDateShort(key: string): string {
  const [y, m, d] = key.split("-");
  return `${d}/${m}/${y}`;
}

/** "Outubro de 2026" */
export function formatMonthYear(date: Date): string {
  return `${capitalize(MONTHS[date.getMonth()])} de ${date.getFullYear()}`;
}

/** "out" */
export function formatMonthShort(key: string): string {
  return MONTHS[parseDateKey(key).getMonth()].slice(0, 3);
}

/** "30 min", "2 h", "1 h 30 min" */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** "agora", "há 5 min", "há 3 h", "ontem", "há 2 dias" */
export function formatRelative(iso: string, now = new Date()): string {
  const diffMin = Math.round((now.getTime() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `há ${diffH} h`;
  const diffD = Math.round(diffH / 24);
  return diffD === 1 ? "ontem" : `há ${diffD} dias`;
}

/** Quantidade de dias entre duas datas, contando as duas pontas (14 a 16 = 3). */
export function countDays(inicio: string, fim: string): number {
  const ms = parseDateKey(fim).getTime() - parseDateKey(inicio).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

/** Lista de todas as datas de `inicio` até `fim`, inclusive. */
export function eachDay(inicio: string, fim: string): string[] {
  const dias: string[] = [];
  for (let dia = inicio; dia <= fim; dia = addDays(dia, 1)) dias.push(dia);
  return dias;
}

/** "sáb., 3 de out." */
export function formatDateCompact(key: string): string {
  const date = parseDateKey(key);
  return `${WEEKDAYS[date.getDay()].slice(0, 3)}., ${date.getDate()} de ${MONTHS[date.getMonth()].slice(0, 3)}.`;
}

/** "14 a 16 de out.", "30 de out. a 2 de nov." ou, entre anos, com o ano. */
export function formatDateRange(inicio: string, fim: string): string {
  const a = parseDateKey(inicio);
  const b = parseDateKey(fim);
  const mes = (d: Date) => `${MONTHS[d.getMonth()].slice(0, 3)}.`;
  if (inicio === fim) return `${a.getDate()} de ${mes(a)}`;
  if (a.getFullYear() !== b.getFullYear()) {
    return `${a.getDate()} de ${mes(a)} de ${a.getFullYear()} a ${b.getDate()} de ${mes(b)} de ${b.getFullYear()}`;
  }
  if (a.getMonth() === b.getMonth()) return `${a.getDate()} a ${b.getDate()} de ${mes(b)}`;
  return `${a.getDate()} de ${mes(a)} a ${b.getDate()} de ${mes(b)}`;
}
