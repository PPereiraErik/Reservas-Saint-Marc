import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useToast } from "../components/Toast";
import type { AdminUser } from "../types";
import * as authService from "../services/auth";

interface AuthContextValue {
  user: AdminUser | null;
  login: (email: string, senha: string) => Promise<void>;
  /** Só no modo local: cria a conta do administrador e já entra. */
  criarConta: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [user, setUser] = useState<AdminUser | null>(authService.getSession);

  // Com banco real, a sessão pode vencer. Nesse caso volta para a tela de login.
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      toast("error", "Sua sessão expirou.", "Entre novamente para continuar.");
    };
    window.addEventListener(authService.SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(authService.SESSION_EXPIRED_EVENT, onExpired);
  }, [toast]);

  const login = async (email: string, senha: string) => {
    setUser(await authService.login(email, senha));
  };

  const criarConta = async (email: string, senha: string) => {
    setUser(await authService.criarAdmin(email, senha));
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, criarConta, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return context;
}
