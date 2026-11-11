/**
 * Serviço de reservas com banco compartilhado (Supabase).
 *
 * Tem as mesmas funções de reservations.local.ts. As regras de negócio são
 * conferidas aqui (para dar mensagens rápidas) e de novo no banco (que é quem
 * garante que dois horários nunca se sobreponham).
 *
 * - Visitantes: leem só a disponibilidade (datas, horários e status, sem dados pessoais).
 * - Administrador logado: lê tudo e altera status ou exclui.
 */
import type { Activity, ActivityType, Reservation, ReservationInput, ReservationStatus } from "../types";
import { MSG_CONFLITO, byDateTime, resolveTimes, validateReservation } from "../utils/rules";
import { expireSession, getAccessToken } from "./auth.remote";
import { bloqueioComoReserva } from "../utils/bloqueios";
import * as bloqueiosService from "./bloqueios.remote";
import { ReservationError } from "./errors";
import { ApiError, NetworkError, api } from "./supabase";

interface ReservaRow {
  id: string;
  nome: string;
  telefone: string;
  bloco: string;
  apartamento: string;
  data: string;
  data_fim: string;
  periodo: Reservation["periodo"];
  inicio: string;
  fim: string;
  observacoes: string;
  status: ReservationStatus;
  criada_em: string;
}

type DisponibilidadeRow = Pick<ReservaRow, "data" | "data_fim" | "periodo" | "inicio" | "fim" | "status">;

interface AtividadeRow {
  id: string;
  tipo: ActivityType;
  nome: string;
  data_reserva: string;
  em: string;
}

function fromRow(row: ReservaRow): Reservation {
  return {
    id: row.id,
    nome: row.nome,
    telefone: row.telefone,
    bloco: row.bloco,
    apartamento: row.apartamento,
    data: row.data,
    dataFim: row.data_fim,
    periodo: row.periodo,
    inicio: row.inicio,
    fim: row.fim,
    observacoes: row.observacoes,
    status: row.status,
    criadaEm: row.criada_em,
  };
}

/** Visitantes não recebem dados pessoais: os campos de identificação ficam vazios. */
function fromDisponibilidade(row: DisponibilidadeRow, index: number): Reservation {
  return {
    id: `publica-${index}`,
    nome: "",
    telefone: "",
    bloco: "",
    apartamento: "",
    data: row.data,
    dataFim: row.data_fim,
    periodo: row.periodo,
    inicio: row.inicio,
    fim: row.fim,
    observacoes: "",
    status: row.status,
    criadaEm: "",
  };
}

/** Transforma qualquer falha em uma mensagem clara para o usuário. */
function translate(error: unknown): ReservationError {
  if (error instanceof ReservationError) return error;
  if (error instanceof NetworkError) {
    return new ReservationError("Sem conexão com o servidor. Confira a internet e tente de novo.");
  }
  if (error instanceof ApiError) {
    if (error.code === "23P01") return new ReservationError(MSG_CONFLITO);
    if (error.code === "P0001") return new ReservationError(error.message);
    if (error.status === 401) {
      expireSession();
      return new ReservationError("Sua sessão expirou. Entre novamente na área administrativa.");
    }
    if (error.status === 403) return new ReservationError("Você não tem permissão para fazer isso.");
  }
  return new ReservationError("O servidor não respondeu como esperado. Tente novamente em instantes.");
}

async function fetchAvailability(): Promise<Reservation[]> {
  const rows = await api<DisponibilidadeRow[]>("/rest/v1/rpc/disponibilidade", { method: "POST", body: {} });
  return rows.map(fromDisponibilidade);
}

async function requireToken(): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new ReservationError("Sua sessão expirou. Entre novamente na área administrativa.");
  return token;
}

/** Um ano atrás, para a lista do administrador não crescer para sempre. */
function oneYearAgo(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export async function getReservations(): Promise<Reservation[]> {
  try {
    const token = await getAccessToken();
    if (!token) return await fetchAvailability();
    const rows = await api<ReservaRow[]>(
      `/rest/v1/reservas?select=*&data_fim=gte.${oneYearAgo()}&order=data.asc,inicio_min.asc&limit=1000`,
      { token },
    );
    return rows.map(fromRow).sort(byDateTime);
  } catch (error) {
    throw translate(error);
  }
}

export async function getActivities(): Promise<Activity[]> {
  try {
    const token = await getAccessToken();
    if (!token) return [];
    const rows = await api<AtividadeRow[]>("/rest/v1/atividades?select=*&order=em.desc&limit=30", { token });
    return rows.map((r) => ({ id: r.id, tipo: r.tipo, nome: r.nome, dataReserva: r.data_reserva, em: r.em }));
  } catch (error) {
    throw translate(error);
  }
}

export async function createReservation(input: ReservationInput): Promise<Reservation> {
  try {
    // Confere contra a disponibilidade mais recente (alguém pode ter reservado agora há pouco).
    const bloqueios = await bloqueiosService.getBloqueios().catch(() => []);
    const errors = validateReservation(input, [...(await fetchAvailability()), ...bloqueios.map(bloqueioComoReserva)]);
    const primeiroErro = Object.values(errors)[0];
    if (primeiroErro) throw new ReservationError(primeiroErro);

    const { periodo, inicio, fim } = resolveTimes(input);
    const criada = await api<{ id: string; criada_em: string; status: ReservationStatus }>(
      "/rest/v1/rpc/criar_reserva",
      {
        method: "POST",
        body: {
          p_nome: input.nome.trim(),
          p_telefone: input.telefone,
          p_bloco: input.bloco,
          p_apartamento: input.apartamento.trim(),
          p_data: input.data,
          p_data_fim: input.dataFim,
          p_periodo: periodo,
          p_inicio: inicio,
          p_fim: fim,
          p_observacoes: input.observacoes.trim(),
        },
      },
    );

    return {
      id: criada.id,
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
      status: criada.status,
      criadaEm: criada.criada_em,
    };
  } catch (error) {
    throw translate(error);
  }
}

export async function updateReservationStatus(id: string, status: ReservationStatus): Promise<void> {
  try {
    const token = await requireToken();
    const rows = await api<{ id: string }[]>(`/rest/v1/reservas?id=eq.${encodeURIComponent(id)}&select=id`, {
      method: "PATCH",
      body: { status },
      token,
      headers: { Prefer: "return=representation" },
    });
    if (rows.length === 0) throw new ReservationError("Essa reserva não existe mais. Atualize a página.");
  } catch (error) {
    throw translate(error);
  }
}

export async function deleteReservation(id: string): Promise<void> {
  try {
    const token = await requireToken();
    await api(`/rest/v1/reservas?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", token });
  } catch (error) {
    throw translate(error);
  }
}
