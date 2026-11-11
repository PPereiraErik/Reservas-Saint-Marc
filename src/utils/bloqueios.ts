import type { Bloqueio, BloqueioInput, Reservation } from "../types";
import { todayKey } from "./date";

export const PREFIXO_BLOQUEIO = "bloqueio:";
export const MOTIVO_PADRAO = "Salão fechado";

export function ehBloqueio(r: Pick<Reservation, "id">): boolean {
  return r.id.startsWith(PREFIXO_BLOQUEIO);
}

/**
 * Um bloqueio entra nas contas de disponibilidade como uma reserva de dia todo já aprovada,
 * assim o calendário e as regras de conflito funcionam sem nenhuma exceção.
 */
export function bloqueioComoReserva(b: Bloqueio): Reservation {
  return {
    id: `${PREFIXO_BLOQUEIO}${b.id}`,
    nome: b.motivo || MOTIVO_PADRAO,
    telefone: "",
    bloco: "",
    apartamento: "",
    data: b.data,
    dataFim: b.dataFim,
    periodo: "dia-todo",
    inicio: "08:00",
    fim: "23:00",
    observacoes: "",
    status: "aprovada",
    criadaEm: "",
  };
}

export function validateBloqueio(input: BloqueioInput): string | null {
  if (!input.data) return "Escolha o primeiro dia.";
  if (!input.dataFim || input.dataFim < input.data) return "O último dia não pode ser antes do primeiro.";
  if (input.dataFim < todayKey()) return "Escolha uma data a partir de hoje.";
  if (input.motivo.length > 80) return "Use no máximo 80 caracteres no motivo.";
  return null;
}
