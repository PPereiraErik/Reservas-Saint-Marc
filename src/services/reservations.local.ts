/**
 * Serviço de reservas (modo demonstração com localStorage).
 *
 * As funções são assíncronas de propósito: para usar um backend real
 * (Supabase, API própria...), basta reimplementar este arquivo mantendo
 * as mesmas assinaturas. O restante da aplicação não precisa mudar.
 */
import type { Activity, ActivityType, Reservation, ReservationInput, ReservationStatus } from "../types";
import { bloqueioComoReserva } from "../utils/bloqueios";
import { createId } from "../utils/id";
import {
  MSG_CONFLITO,
  blocksSlot,
  byDateTime,
  findConflict,
  normalizeReservation,
  resolveTimes,
  validateReservation,
} from "../utils/rules";
import { ReservationError } from "./errors";
import { lerBloqueiosSync, resetBloqueiosSync } from "./bloqueios.local";
import { limparEsperaSync } from "./espera.local";
import { limparMoradoresSync } from "./moradores.local";
import { readJSON, writeJSON } from "./storage";

const RESERVAS_KEY = "reservas";
const ATIVIDADES_KEY = "atividades";
const MAX_ATIVIDADES = 30;

function saveReservations(reservas: Reservation[]) {
  writeJSON(RESERVAS_KEY, reservas);
}

function readReservations(): Reservation[] {
  const salvas = readJSON<Reservation[]>(RESERVAS_KEY);
  if (Array.isArray(salvas)) {
    // Versões antigas criavam reservas de exemplo ("demo-N"); elas são removidas uma única vez.
    const reais = salvas.filter((r) => !String(r.id).startsWith("demo-"));
    if (reais.length !== salvas.length) {
      saveReservations(reais);
      limparExemplosAntigos();
    }
    return reais.map(normalizeReservation);
  }
  if (salvas !== null) throw new ReservationError("Os dados salvos estão em um formato inválido.");
  return [];
}

function readActivities(): Activity[] {
  const salvas = readJSON<Activity[]>(ATIVIDADES_KEY);
  return Array.isArray(salvas) ? salvas.filter((a) => !String(a.id).startsWith("demo-")) : [];
}

function limparExemplosAntigos() {
  writeJSON(ATIVIDADES_KEY, readActivities());
  limparEsperaSync(true);
}

function logActivity(tipo: ActivityType, reserva: Reservation) {
  const nova: Activity = {
    id: createId(),
    tipo,
    nome: reserva.nome,
    dataReserva: reserva.data,
    em: new Date().toISOString(),
  };
  writeJSON(ATIVIDADES_KEY, [nova, ...readActivities()].slice(0, MAX_ATIVIDADES));
}

function apagarTudoSync(): void {
  saveReservations([]);
  writeJSON(ATIVIDADES_KEY, []);
  limparEsperaSync(false);
  resetBloqueiosSync();
  limparMoradoresSync();
}

export async function getReservations(): Promise<Reservation[]> {
  return readReservations().sort(byDateTime);
}

export async function getActivities(): Promise<Activity[]> {
  return readActivities();
}

export async function createReservation(input: ReservationInput): Promise<Reservation> {
  const reservas = readReservations();
  const errors = validateReservation(input, [...reservas, ...lerBloqueiosSync().map(bloqueioComoReserva)]);
  const primeiroErro = Object.values(errors)[0];
  if (primeiroErro) throw new ReservationError(primeiroErro);

  const { periodo, inicio, fim } = resolveTimes(input);
  const nova: Reservation = {
    id: createId(),
    nome: input.nome.trim(),
    telefone: input.telefone,
    bloco: input.bloco,
    apartamento: input.apartamento.trim(),
    data: input.data,
    dataFim: input.dataFim,
    periodo,
    inicio,
    fim,
    observacoes: input.observacoes.trim(),
    status: "pendente",
    criadaEm: new Date().toISOString(),
  };

  saveReservations([...reservas, nova]);
  logActivity("criada", nova);
  return nova;
}

export async function updateReservationStatus(id: string, status: ReservationStatus): Promise<void> {
  const reservas = readReservations();
  const reserva = reservas.find((r) => r.id === id);
  if (!reserva) throw new ReservationError("Essa reserva não existe mais. Atualize a página.");

  if (blocksSlot(status) && findConflict(reservas, reserva)) {
    throw new ReservationError(MSG_CONFLITO);
  }

  const atualizada = { ...reserva, status };
  saveReservations(reservas.map((r) => (r.id === id ? atualizada : r)));
  if (status !== "pendente") logActivity(status, atualizada);
}

export async function deleteReservation(id: string): Promise<void> {
  const reservas = readReservations();
  const reserva = reservas.find((r) => r.id === id);
  if (!reserva) return;
  saveReservations(reservas.filter((r) => r.id !== id));
  logActivity("excluida", reserva);
}

/** Apaga todas as reservas, esperas, bloqueios e o histórico guardados neste navegador. */
export async function resetDemoData(): Promise<void> {
  apagarTudoSync();
}
