/** Lista de espera com banco compartilhado (Supabase). Moradores só entram na fila; a administração lê e remove. */
import type { Espera, EsperaInput } from "../types";
import { getAccessToken, expireSession } from "./auth.remote";
import { ReservationError } from "./errors";
import { ApiError, NetworkError, api } from "./supabase";

interface EsperaRow {
  id: string;
  nome: string;
  telefone: string;
  bloco: string;
  apartamento: string;
  data: string;
  criada_em: string;
}

function translate(error: unknown): ReservationError {
  if (error instanceof ReservationError) return error;
  if (error instanceof NetworkError) return new ReservationError("Sem conexão com o servidor. Confira a internet e tente de novo.");
  if (error instanceof ApiError) {
    if (error.code === "P0001") return new ReservationError(error.message);
    if (error.status === 401) {
      expireSession();
      return new ReservationError("Sua sessão expirou. Entre novamente na área administrativa.");
    }
    if (error.status === 403) return new ReservationError("Você não tem permissão para fazer isso.");
  }
  return new ReservationError("O servidor não respondeu como esperado. Tente novamente em instantes.");
}

export async function getEspera(): Promise<Espera[]> {
  try {
    const token = await getAccessToken();
    if (!token) return [];
    const hoje = new Date().toISOString().slice(0, 10);
    const rows = await api<EsperaRow[]>(`/rest/v1/lista_espera?select=*&data=gte.${hoje}&order=data.asc,criada_em.asc&limit=500`, { token });
    return rows.map((r) => ({ id: r.id, nome: r.nome, telefone: r.telefone, bloco: r.bloco, apartamento: r.apartamento, data: r.data, criadaEm: r.criada_em }));
  } catch (error) {
    throw translate(error);
  }
}

export async function joinWaitlist(input: EsperaInput): Promise<void> {
  try {
    await api("/rest/v1/rpc/entrar_lista_espera", {
      method: "POST",
      body: { p_nome: input.nome.trim(), p_telefone: input.telefone, p_bloco: input.bloco, p_apartamento: input.apartamento.trim(), p_data: input.data },
    });
  } catch (error) {
    throw translate(error);
  }
}

export async function removeEspera(id: string): Promise<void> {
  try {
    const token = await getAccessToken();
    if (!token) throw new ReservationError("Sua sessão expirou. Entre novamente na área administrativa.");
    await api(`/rest/v1/lista_espera?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", token });
  } catch (error) {
    throw translate(error);
  }
}
