import { createContext, useContext, useState, type ReactNode } from "react";
import * as service from "../services/moradores";
import { readJSON, removeItem, writeJSON } from "../services/storage";
import type { Morador, MoradorInput } from "../types";

const KEY = "morador-sessao";

interface MoradorContextValue {
  /** Cadastro de quem está identificado neste aparelho (ou null). */
  morador: Morador | null;
  cadastrar: (input: MoradorInput) => Promise<void>;
  entrar: (bloco: string, apartamento: string, pin: string) => Promise<void>;
  atualizar: (pin: string, dados: { nome: string; telefone: string }) => Promise<void>;
  sair: () => void;
}

const MoradorContext = createContext<MoradorContextValue | null>(null);

function lerSessao(): Morador | null {
  try {
    const m = readJSON<Morador>(KEY);
    return m && m.nome && m.bloco && m.apartamento ? m : null;
  } catch {
    return null;
  }
}

/** Guarda, neste aparelho, quem é o morador identificado (nunca a senha). */
export function MoradorProvider({ children }: { children: ReactNode }) {
  const [morador, setMorador] = useState<Morador | null>(lerSessao);

  const guardar = (m: Morador) => {
    writeJSON(KEY, m);
    setMorador(m);
  };

  const value: MoradorContextValue = {
    morador,
    cadastrar: async (input) => guardar(await service.cadastrarMorador(input)),
    entrar: async (bloco, apartamento, pin) => guardar(await service.entrarMorador(bloco, apartamento, pin)),
    atualizar: async (pin, dados) => {
      if (!morador) return;
      guardar(await service.atualizarMorador(morador.bloco, morador.apartamento, pin, dados));
    },
    sair: () => {
      removeItem(KEY);
      setMorador(null);
    },
  };

  return <MoradorContext.Provider value={value}>{children}</MoradorContext.Provider>;
}

export function useMorador() {
  const context = useContext(MoradorContext);
  if (!context) throw new Error("useMorador precisa estar dentro de <MoradorProvider>");
  return context;
}
