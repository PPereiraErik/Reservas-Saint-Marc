/**
 * Convenção de nomes do projeto:
 * - Campos e valores do domínio (reservas) em português, iguais aos textos da interface.
 * - Nomes técnicos (funções, componentes, hooks) em inglês.
 */

import type { Periodo } from "../config";

export type { Periodo };

export type ReservationStatus = "pendente" | "aprovada" | "rejeitada" | "cancelada";

export interface Reservation {
  id: string;
  nome: string;
  telefone: string;
  bloco: string;
  apartamento: string;
  /** Primeiro dia da reserva (YYYY-MM-DD). */
  data: string;
  /** Último dia da reserva (YYYY-MM-DD). Igual a `data` na reserva de um dia. */
  dataFim: string;
  /** Período escolhido. Reservas de vários dias são sempre "dia-todo". */
  periodo: Periodo;
  /** Horário ocupado em cada dia, no formato HH:MM. */
  inicio: string;
  fim: string;
  observacoes: string;
  status: ReservationStatus;
  /** Data e hora de criação (ISO) */
  criadaEm: string;
}

/** Dados preenchidos pelo morador no formulário. */
export interface ReservationInput {
  nome: string;
  telefone: string;
  bloco: string;
  apartamento: string;
  data: string;
  /** Último dia. Quando for depois de `data`, a reserva vale o dia todo. */
  dataFim: string;
  periodo: Periodo;
  /** Usados apenas no período "personalizado". */
  inicio: string;
  fim: string;
  observacoes: string;
}

export type ActivityType = "criada" | "aprovada" | "rejeitada" | "cancelada" | "excluida";

export interface Activity {
  id: string;
  tipo: ActivityType;
  nome: string;
  dataReserva: string;
  em: string;
}

export interface AdminUser {
  nome: string;
  email: string;
}

/** Pessoa que quer ser avisada caso um dia ocupado seja liberado. */
export interface Espera {
  id: string;
  nome: string;
  telefone: string;
  bloco: string;
  apartamento: string;
  /** Dia desejado (YYYY-MM-DD). */
  data: string;
  criadaEm: string;
}

export type EsperaInput = Omit<Espera, "id" | "criadaEm">;

/** Período em que o salão fica fechado (manutenção, assembleia, obra...). */
export interface Bloqueio {
  id: string;
  data: string;
  dataFim: string;
  motivo: string;
}

export type BloqueioInput = Omit<Bloqueio, "id">;

/** Dados guardados no cadastro de um apartamento (sem a senha). */
export interface Morador {
  nome: string;
  telefone: string;
  bloco: string;
  apartamento: string;
}

/** Linha da lista de cadastros vista pela administração. */
export interface MoradorCadastrado extends Morador {
  id: string;
  criadoEm: string;
}

export interface MoradorInput extends Morador {
  /** Senha numérica de 4 a 6 dígitos. */
  pin: string;
}
