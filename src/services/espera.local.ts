/** Lista de espera no modo demonstração (localStorage). */
import type { Espera, EsperaInput } from "../types";
import { createId } from "../utils/id";
import { MAX_ESPERAS_POR_TELEFONE, validateEspera } from "../utils/espera";
import { ReservationError } from "./errors";
import { readJSON, writeJSON } from "./storage";

const KEY = "espera";

function ler(): Espera[] {
  const salvas = readJSON<Espera[]>(KEY);
  return Array.isArray(salvas) ? salvas : [];
}

/**
 * Limpa a lista de espera. Com `somenteExemplo`, remove apenas a entrada fictícia que
 * versões antigas criavam (Helena Duarte) e mantém o resto.
 */
export function limparEsperaSync(somenteExemplo: boolean): void {
  writeJSON(KEY, somenteExemplo ? ler().filter((e) => !(e.nome === "Helena Duarte" && e.telefone === "(47) 99111-2020")) : []);
}

export async function getEspera(): Promise<Espera[]> {
  return ler().sort((a, b) => a.data.localeCompare(b.data) || a.criadaEm.localeCompare(b.criadaEm));
}

export async function joinWaitlist(input: EsperaInput): Promise<void> {
  const atuais = ler();
  const erro = Object.values(validateEspera(input, atuais))[0];
  if (erro) throw new ReservationError(erro);
  const hoje = new Date().toISOString().slice(0, 10);
  if (atuais.filter((e) => e.telefone === input.telefone && e.data >= hoje).length >= MAX_ESPERAS_POR_TELEFONE) {
    throw new ReservationError(`Cada telefone pode esperar até ${MAX_ESPERAS_POR_TELEFONE} dias ao mesmo tempo.`);
  }
  writeJSON(KEY, [...atuais, { ...input, nome: input.nome.trim(), apartamento: input.apartamento.trim(), id: createId(), criadaEm: new Date().toISOString() }]);
}

export async function removeEspera(id: string): Promise<void> {
  writeJSON(KEY, ler().filter((e) => e.id !== id));
}
