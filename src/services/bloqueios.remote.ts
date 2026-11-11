/** Datas bloqueadas com banco compartilhado: todos leem (o calendário precisa), só a administração altera. */
import type { Bloqueio, BloqueioInput } from "../types";
import { getAccessToken, expireSession } from "./auth.remote";
import { ReservationError } from "./errors";
import { ApiError, NetworkError, api } from "./supabase";

interface BloqueioRow {
  id: string;
  data: string;
  data_fim: string;
  motivo: string;
}

function translate(error: unknown): ReservationError {
  if (error instanceof ReservationError) return error;
  if (error instanceof NetworkError) return new ReservationError("Sem conexão com o servidor. Confira a internet e tente de novo.");
  if (error instanceof ApiError) {
    if (error.status === 401) {
      expireSession();
      return new ReservationError("Sua sessão expirou. Entre novamente na área administrativa.");
    }
    if (error.status === 403) return new ReservationError("Você não tem permissão para fazer isso.");
  }
  return new ReservationError("O servidor não respondeu como esperado. Tente novamente em instantes.");
}

export async function getBloqueios(): Promise<Bloqueio[]> {
  try {
    const hoje = new Date().toISOString().slice(0, 10);
    const rows = await api<BloqueioRow[]>(`/rest/v1/bloqueios?select=id,data,data_fim,motivo&data_fim=gte.${hoje}&order=data.asc&limit=200`);
    return rows.map((r) => ({ id: r.id, data: r.data, dataFim: r.data_fim, motivo: r.motivo }));
  } catch (error) {
    throw translate(error);
  }
}

export async function addBloqueio(input: BloqueioInput): Promise<void> {
  try {
    const token = await getAccessToken();
    if (!token) throw new ReservationError("Sua sessão expirou. Entre novamente na área administrativa.");
    await api("/rest/v1/bloqueios", { method: "POST", token, body: { data: input.data, data_fim: input.dataFim, motivo: input.motivo.trim() } });
  } catch (error) {
    throw translate(error);
  }
}

export async function removeBloqueio(id: string): Promise<void> {
  try {
    const token = await getAccessToken();
    if (!token) throw new ReservationError("Sua sessão expirou. Entre novamente na área administrativa.");
    await api(`/rest/v1/bloqueios?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", token });
  } catch (error) {
    throw translate(error);
  }
}
