/**
 * Conta de administrador no modo local.
 *
 * Não existe conta padrão: no primeiro acesso a pessoa cria o e-mail e a senha do administrador,
 * e só essa conta entra depois disso. A senha é guardada como hash com sal, neste navegador.
 * Isso protege contra uso casual, mas não é segurança de servidor: quem tem acesso ao aparelho
 * pode apagar os dados do site. Para uso real, use o modo conectado (Supabase).
 */
import type { AdminUser } from "../types";
import { hashSenha, novoSal } from "../utils/moradores";
import { readJSON, removeItem, writeJSON } from "./storage";

const SESSION_KEY = "sessao";
const CONTA_KEY = "admin";
export const SENHA_MIN = 8;

interface Conta {
  email: string;
  sal: string;
  hash: string;
}

function lerConta(): Conta | null {
  try {
    const c = readJSON<Conta>(CONTA_KEY);
    return c && c.email && c.sal && c.hash ? c : null;
  } catch {
    return null;
  }
}

export function existeAdmin(): boolean {
  return lerConta() !== null;
}

export function getSession(): AdminUser | null {
  try {
    return readJSON<AdminUser>(SESSION_KEY);
  } catch {
    return null;
  }
}

function abrirSessao(email: string): AdminUser {
  const user: AdminUser = { nome: "Administração", email };
  writeJSON(SESSION_KEY, user);
  return user;
}

/** Cria a conta do administrador. Só é permitido enquanto não existir uma. */
export async function criarAdmin(email: string, senha: string): Promise<AdminUser> {
  if (existeAdmin()) throw new Error("Já existe uma conta de administrador neste navegador.");
  const limpo = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpo)) throw new Error("Informe um e-mail válido.");
  if (senha.length < SENHA_MIN) throw new Error(`A senha deve ter pelo menos ${SENHA_MIN} caracteres.`);
  const sal = novoSal();
  writeJSON(CONTA_KEY, { email: limpo, sal, hash: hashSenha(senha, sal) } satisfies Conta);
  return abrirSessao(limpo);
}

export async function login(email: string, senha: string): Promise<AdminUser> {
  const conta = lerConta();
  if (!conta) throw new Error("Ainda não existe conta de administrador. Crie a conta para continuar.");
  if (email.trim().toLowerCase() !== conta.email || hashSenha(senha, conta.sal) !== conta.hash) {
    throw new Error("E-mail ou senha incorretos.");
  }
  return abrirSessao(conta.email);
}

export async function logout(): Promise<void> {
  removeItem(SESSION_KEY);
}
