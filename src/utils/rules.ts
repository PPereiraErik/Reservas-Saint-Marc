/**
 * Regras de negócio das reservas.
 *
 * Como uma reserva ocupa o salão:
 * - Reserva de um dia: ocupa o horário do período escolhido (ou o personalizado).
 * - Reserva de vários dias seguidos: ocupa o dia todo em todas as datas.
 * Um período personalizado das 12:00 às 15:00, por exemplo, bloqueia a Tarde
 * (13:00 às 18:00), porque os horários se sobrepõem.
 */
import {
  ABERTURA,
  CONDOMINIO,
  FECHAMENTO,
  MAX_DIAS_SEGUIDOS,
  PASSO_HORARIO_MIN,
  PERIODOS,
  type Periodo,
  type PeriodoFixo,
} from "../config";
import type { Reservation, ReservationInput, ReservationStatus } from "../types";
import {
  countDays,
  eachDay,
  formatDateLong,
  formatDateRange,
  formatDateShort,
  isValidDateKey,
  minutesToTime,
  timeToMinutes,
  todayKey,
} from "./date";
import { isValidPhone } from "./phone";

export const BLOCOS = CONDOMINIO.blocos;

export const PERIODO_LABEL: Record<Periodo, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
  "dia-todo": "Dia todo",
  personalizado: "Personalizado",
};

const DIA_TODO = PERIODOS.find((p) => p.id === "dia-todo")!;

/** Horários do personalizado: de ABERTURA a FECHAMENTO, a cada PASSO_HORARIO_MIN. */
export const HORARIOS: string[] = (() => {
  const list: string[] = [];
  for (let m = timeToMinutes(ABERTURA); m <= timeToMinutes(FECHAMENTO); m += PASSO_HORARIO_MIN) {
    list.push(minutesToTime(m));
  }
  return list;
})();

export const STATUS_LABEL: Record<ReservationStatus, string> = {
  pendente: "Pendente",
  aprovada: "Aprovada",
  rejeitada: "Rejeitada",
  cancelada: "Cancelada",
};

export const MSG_CONFLITO = "Esse horário já está ocupado. Escolha outro período ou outra data.";

/** Reservas rejeitadas ou canceladas não ocupam o salão. */
export function blocksSlot(status: ReservationStatus): boolean {
  return status === "pendente" || status === "aprovada";
}

export function isMultiDay(r: { data: string; dataFim: string }): boolean {
  return r.dataFim > r.data;
}

/** A reserva acontece neste dia? */
export function coversDay(r: { data: string; dataFim: string }, dia: string): boolean {
  return r.data <= dia && dia <= r.dataFim;
}

export function overlaps(
  a: { inicio: string; fim: string },
  b: { inicio: string; fim: string },
): boolean {
  return timeToMinutes(a.inicio) < timeToMinutes(b.fim) && timeToMinutes(a.fim) > timeToMinutes(b.inicio);
}

/** Horário real ocupado a partir do que o morador escolheu. */
export function resolveTimes(
  input: Pick<ReservationInput, "data" | "dataFim" | "periodo" | "inicio" | "fim">,
): { periodo: Periodo; inicio: string; fim: string } {
  if (isMultiDay(input)) return { periodo: "dia-todo", inicio: DIA_TODO.inicio, fim: DIA_TODO.fim };
  if (input.periodo === "personalizado") return { periodo: "personalizado", inicio: input.inicio, fim: input.fim };
  const fixo = PERIODOS.find((p) => p.id === input.periodo);
  return fixo ? { periodo: fixo.id, inicio: fixo.inicio, fim: fixo.fim } : { periodo: input.periodo, inicio: "", fim: "" };
}

/** Reservas ativas (pendentes ou aprovadas) que acontecem no dia. */
export function activeOnDay(reservas: Reservation[], dia: string): Reservation[] {
  return reservas.filter((r) => blocksSlot(r.status) && coversDay(r, dia)).sort(byDateTime);
}

/** Retorna a reserva que conflita com o pedido, se existir. */
export function findConflict(
  reservas: Reservation[],
  alvo: { id?: string; data: string; dataFim: string; inicio: string; fim: string },
): Reservation | undefined {
  return reservas.find(
    (r) =>
      r.id !== alvo.id &&
      blocksSlot(r.status) &&
      r.data <= alvo.dataFim &&
      alvo.data <= r.dataFim &&
      overlaps(r, alvo),
  );
}

/** Minutos de agora, para comparar com os horários de hoje. */
function nowMinutes(now: Date): number {
  return now.getHours() * 60 + now.getMinutes();
}

export type PeriodState = "livre" | "ocupado" | "encerrado";

/** Situação de cada período fixo em um dia. */
export function periodStates(
  reservas: Reservation[],
  dia: string,
  now: Date = new Date(),
): Record<PeriodoFixo, PeriodState> {
  const doDia = activeOnDay(reservas, dia);
  const isToday = dia === todayKey();
  const result = {} as Record<PeriodoFixo, PeriodState>;
  for (const p of PERIODOS) {
    if (isToday && timeToMinutes(p.inicio) <= nowMinutes(now)) result[p.id] = "encerrado";
    else result[p.id] = doDia.some((r) => overlaps(r, p)) ? "ocupado" : "livre";
  }
  return result;
}

export type DayAvailability = "livre" | "parcial" | "lotado";

/** "livre": nenhuma reserva. "lotado": todos os horários de funcionamento ocupados. */
export function dayAvailability(reservas: Reservation[], dia: string): DayAvailability {
  const doDia = activeOnDay(reservas, dia);
  if (doDia.length === 0) return "livre";
  const ocupaTudo = HORARIOS.slice(0, -1).every((h, i) => {
    const bloco = { inicio: h, fim: HORARIOS[i + 1] };
    return doDia.some((r) => overlaps(r, bloco));
  });
  return ocupaTudo ? "lotado" : "parcial";
}

export type FieldErrors = Partial<Record<keyof ReservationInput, string>>;

/**
 * Valida os dados do formulário.
 * Retorna um objeto vazio quando está tudo certo.
 */
export function validateReservation(
  input: ReservationInput,
  reservas: Reservation[],
  now: Date = new Date(),
): FieldErrors {
  const errors: FieldErrors = {};

  if (input.nome.trim().length < 3) errors.nome = "Informe seu nome completo.";
  else if (input.nome.trim().length > 100) errors.nome = "Use no máximo 100 caracteres.";

  if (!isValidPhone(input.telefone)) {
    errors.telefone = "Informe um telefone com DDD, por exemplo (47) 99999-9999.";
  }

  if (!BLOCOS.includes(input.bloco)) errors.bloco = "Selecione o bloco.";

  if (!/^\d{1,4}$/.test(input.apartamento.trim())) {
    errors.apartamento = "Informe o número do apartamento (somente números).";
  }

  if (input.observacoes.length > 500) errors.observacoes = "Use no máximo 500 caracteres.";

  return { ...errors, ...validateSchedule(input, reservas, now) };
}

export type ScheduleInput = Pick<ReservationInput, "data" | "dataFim" | "periodo" | "inicio" | "fim">;

/** Valida só a data e o horário (usado no painel de reserva e no envio). */
export function validateSchedule(
  input: ScheduleInput,
  reservas: Reservation[],
  now: Date = new Date(),
): FieldErrors {
  const errors: FieldErrors = {};
  // ----- Datas -----
  const hoje = todayKey();
  if (!isValidDateKey(input.data) || !isValidDateKey(input.dataFim) || input.dataFim < input.data) {
    errors.data = "Escolha a data no calendário.";
    return errors;
  }
  if (input.data < hoje) {
    errors.data = "Não é possível reservar uma data que já passou.";
    return errors;
  }
  if (countDays(input.data, input.dataFim) > MAX_DIAS_SEGUIDOS) {
    errors.data = `É possível reservar no máximo ${MAX_DIAS_SEGUIDOS} dias seguidos.`;
    return errors;
  }

  // ----- Vários dias: precisa de todos os dias inteiros livres -----
  if (isMultiDay(input)) {
    if (input.data === hoje && timeToMinutes(DIA_TODO.inicio) <= nowMinutes(now)) {
      errors.data = "O salão já abriu hoje. Para reservar vários dias, comece a partir de amanhã.";
      return errors;
    }
    const diaOcupado = eachDay(input.data, input.dataFim).find((dia) => activeOnDay(reservas, dia).length > 0);
    if (diaOcupado) {
      errors.data = `${formatDateLong(diaOcupado)} já tem reserva. Para vários dias, todas as datas precisam estar livres.`;
    }
    return errors;
  }

  // ----- Um dia: período ou horário personalizado -----
  const { periodo, inicio, fim } = resolveTimes(input);
  if (!(periodo in PERIODO_LABEL) || !inicio) {
    errors.periodo = "Escolha um período.";
    return errors;
  }

  if (periodo === "personalizado") {
    if (!HORARIOS.includes(inicio)) {
      errors.inicio = `Escolha um início entre ${ABERTURA} e ${FECHAMENTO}.`;
      return errors;
    }
    if (!HORARIOS.includes(fim) || timeToMinutes(fim) <= timeToMinutes(inicio)) {
      errors.fim = "O término precisa ser depois do início.";
      return errors;
    }
  }

  if (input.data === hoje && timeToMinutes(inicio) <= nowMinutes(now)) {
    const msg = "Esse horário de hoje já começou. Escolha um horário mais tarde ou outra data.";
    if (periodo === "personalizado") errors.inicio = msg;
    else errors.periodo = msg;
    return errors;
  }

  const conflito = findConflict(reservas, { data: input.data, dataFim: input.dataFim, inicio, fim });
  if (conflito) {
    const msg = isMultiDay(conflito)
      ? `${MSG_CONFLITO} Esse dia faz parte de uma reserva de vários dias.`
      : `${MSG_CONFLITO} Já existe uma reserva das ${conflito.inicio} às ${conflito.fim}.`;
    if (periodo === "personalizado") errors.inicio = msg;
    else errors.periodo = msg;
  }

  return errors;
}

/** Dá para reservar de `inicio` até `fim` como vários dias seguidos? */
export function canReserveRange(reservas: Reservation[], inicio: string, fim: string, now: Date = new Date()): boolean {
  const errors = validateSchedule({ data: inicio, dataFim: fim, periodo: "dia-todo", inicio: "", fim: "" }, reservas, now);
  return Object.keys(errors).length === 0;
}

/** "Tarde, das 13:00 às 18:00" ou "Dia todo" (vários dias). */
export function describeTime(r: Pick<Reservation, "data" | "dataFim" | "periodo" | "inicio" | "fim">): string {
  if (isMultiDay(r)) return "Dia todo";
  return `${PERIODO_LABEL[r.periodo]}, das ${r.inicio} às ${r.fim}`;
}

/** Texto curto para listas: "Tarde (13:00–18:00)" ou "Dia todo". */
export function describeTimeShort(r: Pick<Reservation, "data" | "dataFim" | "periodo" | "inicio" | "fim">): string {
  if (isMultiDay(r)) return "Dia todo";
  return `${PERIODO_LABEL[r.periodo]} (${r.inicio}–${r.fim})`;
}

/** Datas da reserva: "Sábado, 3 de outubro" ou "14 a 16 de out. (3 dias)". */
export function describeDates(r: Pick<Reservation, "data" | "dataFim">, withYear = false): string {
  if (!isMultiDay(r)) return formatDateLong(r.data, withYear);
  return `${formatDateRange(r.data, r.dataFim)} (${countDays(r.data, r.dataFim)} dias)`;
}

/** "03/10/2026" ou "14/10/2026 a 16/10/2026". */
export function describeDatesShort(r: Pick<Reservation, "data" | "dataFim">): string {
  return isMultiDay(r) ? `${formatDateShort(r.data)} a ${formatDateShort(r.dataFim)}` : formatDateShort(r.data);
}

/** Ordena por data e horário de início. */
export function byDateTime(a: Reservation, b: Reservation): number {
  return a.data.localeCompare(b.data) || a.inicio.localeCompare(b.inicio);
}

/**
 * Completa reservas salvas antes da mudança para períodos (sem `dataFim`/`periodo`).
 * Assim, dados antigos do navegador continuam funcionando.
 */
export function normalizeReservation(r: Reservation): Reservation {
  const dataFim = typeof r.dataFim === "string" && r.dataFim >= r.data ? r.dataFim : r.data;
  let periodo = r.periodo;
  if (!(periodo in PERIODO_LABEL)) {
    const igual = PERIODOS.find((p) => p.inicio === r.inicio && p.fim === r.fim);
    periodo = igual ? igual.id : "personalizado";
  }
  return { ...r, dataFim, periodo };
}
