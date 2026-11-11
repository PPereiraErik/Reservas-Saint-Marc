/**
 * Login do administrador usado pelo resto do app.
 *
 * Com Supabase configurado, o login é real (auth.remote.ts) e a conta é criada no painel do Supabase.
 * Sem ele, a conta é criada no primeiro acesso e fica neste navegador (auth.local.ts).
 */
import { MODO_DEMO } from "../config";
import * as local from "./auth.local";
import * as remote from "./auth.remote";

export { SESSION_EXPIRED_EVENT } from "./auth.remote";
export { SENHA_MIN } from "./auth.local";

const impl = MODO_DEMO ? local : remote;

export const getSession = impl.getSession;
export const login = impl.login;
export const logout = impl.logout;

/** Modo local: a conta é criada na tela de login. Modo conectado: a conta já existe no Supabase. */
export const existeAdmin = (): boolean => (MODO_DEMO ? local.existeAdmin() : true);

export const criarAdmin = async (email: string, senha: string) => {
  if (!MODO_DEMO) throw new Error("No modo conectado, a conta do administrador é criada no Supabase.");
  return local.criarAdmin(email, senha);
};
