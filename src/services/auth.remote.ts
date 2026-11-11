/**
 * Login real do administrador (Supabase Auth, e-mail e senha).
 *
 * Quem tem conta mas NÃO está na tabela "admins" é recusado aqui e, mesmo que
 * burlasse o app, o banco bloquearia a leitura (regras RLS em supabase/schema.sql).
 */
import type { AdminUser } from "../types";
import { ApiError, NetworkError, api } from "./supabase";
import { readJSON, removeItem, writeJSON } from "./storage";

const SESSION_KEY = "sessao-supabase";

/** Disparado quando a sessão não pode mais ser renovada. */
export const SESSION_EXPIRED_EVENT = "reservas:sessao-expirada";

interface StoredSession {
  access_token: string;
  refresh_token: string;
  /** Segundos desde 1970. */
  expires_at: number;
  email: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  user?: { email?: string };
}

function readStored(): StoredSession | null {
  try {
    const stored = readJSON<StoredSession>(SESSION_KEY);
    return stored && stored.access_token && stored.refresh_token ? stored : null;
  } catch {
    return null;
  }
}

function toStored(tokens: TokenResponse, fallbackEmail: string): StoredSession {
  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: tokens.expires_at ?? Math.floor(Date.now() / 1000) + tokens.expires_in,
    email: tokens.user?.email ?? fallbackEmail,
  };
}

function asAdmin(session: StoredSession): AdminUser {
  return { nome: "Administração", email: session.email };
}

export function getSession(): AdminUser | null {
  const stored = readStored();
  return stored ? asAdmin(stored) : null;
}

function loginMessage(error: unknown): string {
  if (error instanceof NetworkError) return "Sem conexão com o servidor. Confira a internet e tente de novo.";
  if (error instanceof ApiError) {
    if (error.code === "email_not_confirmed") return "Este e-mail ainda não foi confirmado no Supabase.";
    if (error.status === 429) return "Muitas tentativas. Aguarde alguns minutos e tente de novo.";
    if (error.status === 400 || error.status === 401) return "E-mail ou senha incorretos.";
  }
  return "Não foi possível entrar. Tente novamente.";
}

export async function login(email: string, senha: string): Promise<AdminUser> {
  let tokens: TokenResponse;
  try {
    tokens = await api<TokenResponse>("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: { email: email.trim(), password: senha },
    });
  } catch (error) {
    throw new Error(loginMessage(error));
  }

  let isAdmin = false;
  try {
    isAdmin = (await api<boolean>("/rest/v1/rpc/is_admin", { method: "POST", body: {}, token: tokens.access_token })) === true;
  } catch (error) {
    throw new Error(loginMessage(error));
  }
  if (!isAdmin) {
    void api("/auth/v1/logout?scope=local", { method: "POST", token: tokens.access_token }).catch(() => undefined);
    throw new Error("Esta conta não tem permissão de administrador.");
  }

  const session = toStored(tokens, email.trim().toLowerCase());
  writeJSON(SESSION_KEY, session);
  return asAdmin(session);
}

export async function logout(): Promise<void> {
  const stored = readStored();
  removeItem(SESSION_KEY);
  // Encerra só esta sessão no servidor (scope=local), sem derrubar o login em outros aparelhos
  // e sem fazer o usuário esperar.
  if (stored) void api("/auth/v1/logout?scope=local", { method: "POST", token: stored.access_token }).catch(() => undefined);
}

/** Apaga a sessão local e avisa a interface para voltar à tela de login. */
export function expireSession(): void {
  removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

let refreshing: Promise<string | null> | null = null;

async function refresh(stored: StoredSession): Promise<string | null> {
  try {
    const tokens = await api<TokenResponse>("/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      body: { refresh_token: stored.refresh_token },
    });
    const novo = toStored(tokens, stored.email);
    writeJSON(SESSION_KEY, novo);
    return novo.access_token;
  } catch (error) {
    // Token recusado: a sessão acabou. Falha de rede ou 429: tenta de novo depois.
    if (error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 429) {
      expireSession();
      return null;
    }
    throw error;
  }
}

/** Token válido do administrador logado (renova se estiver perto de vencer) ou null. */
export async function getAccessToken(): Promise<string | null> {
  const stored = readStored();
  if (!stored) return null;
  if (stored.expires_at - Date.now() / 1000 > 60) return stored.access_token;
  if (!refreshing) {
    refreshing = refresh(stored).finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}
