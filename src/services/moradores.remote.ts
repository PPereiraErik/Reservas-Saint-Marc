/** Cadastro de moradores com banco compartilhado (Supabase). Visitantes só usam as funções do banco; a administração lê e remove. */
import type { Morador, MoradorCadastrado, MoradorInput } from "../types";
import { MSG_BLOQUEADO, MSG_SENHA_INCORRETA } from "../utils/moradores";
import { expireSession, getAccessToken } from "./auth.remote";
import { ReservationError } from "./errors";
import { ApiError, NetworkError, api } from "./supabase";

interface Resposta {
  ok: boolean;
  motivo?: "incorreto" | "bloqueado";
  nome?: string;
  telefone?: string;
}

interface Linha {
  id: string;
  nome: string;
  telefone: string;
  bloco: string;
  apartamento: string;
  criado_em: string;
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

function ler(resposta: Resposta, bloco: string, apartamento: string): Morador {
  if (!resposta.ok) throw new ReservationError(resposta.motivo === "bloqueado" ? MSG_BLOQUEADO : MSG_SENHA_INCORRETA);
  return { nome: resposta.nome ?? "", telefone: resposta.telefone ?? "", bloco, apartamento: apartamento.trim() };
}

export async function cadastrarMorador(input: MoradorInput): Promise<Morador> {
  try {
    await api("/rest/v1/rpc/cadastrar_morador", {
      method: "POST",
      body: { p_nome: input.nome.trim(), p_telefone: input.telefone, p_bloco: input.bloco, p_apartamento: input.apartamento.trim(), p_pin: input.pin },
    });
    return { nome: input.nome.trim(), telefone: input.telefone, bloco: input.bloco, apartamento: input.apartamento.trim() };
  } catch (error) {
    throw translate(error);
  }
}

export async function entrarMorador(bloco: string, apartamento: string, pin: string): Promise<Morador> {
  try {
    const r = await api<Resposta>("/rest/v1/rpc/entrar_morador", { method: "POST", body: { p_bloco: bloco, p_apartamento: apartamento.trim(), p_pin: pin } });
    return ler(r, bloco, apartamento);
  } catch (error) {
    throw translate(error);
  }
}

export async function atualizarMorador(bloco: string, apartamento: string, pin: string, dados: { nome: string; telefone: string }): Promise<Morador> {
  try {
    const r = await api<Resposta>("/rest/v1/rpc/atualizar_morador", {
      method: "POST",
      body: { p_bloco: bloco, p_apartamento: apartamento.trim(), p_pin: pin, p_nome: dados.nome.trim(), p_telefone: dados.telefone },
    });
    return ler(r, bloco, apartamento);
  } catch (error) {
    throw translate(error);
  }
}

export async function listarMoradores(): Promise<MoradorCadastrado[]> {
  try {
    const token = await getAccessToken();
    if (!token) return [];
    const rows = await api<Linha[]>("/rest/v1/moradores?select=id,nome,telefone,bloco,apartamento,criado_em&order=bloco.asc,apartamento.asc&limit=1000", { token });
    return rows.map((r) => ({ id: r.id, nome: r.nome, telefone: r.telefone, bloco: r.bloco, apartamento: r.apartamento, criadoEm: r.criado_em }));
  } catch (error) {
    throw translate(error);
  }
}

export async function removerMorador(id: string): Promise<void> {
  try {
    const token = await getAccessToken();
    if (!token) throw new ReservationError("Sua sessão expirou. Entre novamente na área administrativa.");
    await api(`/rest/v1/moradores?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", token });
  } catch (error) {
    throw translate(error);
  }
}
