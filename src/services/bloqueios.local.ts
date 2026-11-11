/** Datas bloqueadas no modo demonstração (localStorage). */
import type { Bloqueio, BloqueioInput } from "../types";
import { createId } from "../utils/id";
import { validateBloqueio } from "../utils/bloqueios";
import { ReservationError } from "./errors";
import { readJSON, writeJSON } from "./storage";

const KEY = "bloqueios";

export function lerBloqueiosSync(): Bloqueio[] {
  const salvos = readJSON<Bloqueio[]>(KEY);
  return Array.isArray(salvos) ? salvos : [];
}

export function resetBloqueiosSync(): void {
  writeJSON(KEY, []);
}

export async function getBloqueios(): Promise<Bloqueio[]> {
  const hoje = new Date().toISOString().slice(0, 10);
  return lerBloqueiosSync().filter((b) => b.dataFim >= hoje).sort((a, b) => a.data.localeCompare(b.data));
}

export async function addBloqueio(input: BloqueioInput): Promise<void> {
  const erro = validateBloqueio(input);
  if (erro) throw new ReservationError(erro);
  writeJSON(KEY, [...lerBloqueiosSync(), { ...input, motivo: input.motivo.trim(), id: createId() }]);
}

export async function removeBloqueio(id: string): Promise<void> {
  writeJSON(KEY, lerBloqueiosSync().filter((b) => b.id !== id));
}
