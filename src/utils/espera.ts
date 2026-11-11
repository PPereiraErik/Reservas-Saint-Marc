import { CONDOMINIO, SITE_URL } from "../config";
import type { Espera, EsperaInput } from "../types";
import { formatDateShort, todayKey } from "./date";
import { isValidPhone } from "./phone";
import { BLOCOS, type FieldErrors } from "./rules";

export const MAX_ESPERAS_POR_TELEFONE = 3;

export function validateEspera(input: EsperaInput, atuais: Espera[] = []): FieldErrors {
  const errors: FieldErrors = {};
  if (input.nome.trim().length < 3) errors.nome = "Informe seu nome completo.";
  else if (input.nome.trim().length > 100) errors.nome = "Use no máximo 100 caracteres.";
  if (!isValidPhone(input.telefone)) errors.telefone = "Informe um telefone com DDD, por exemplo (47) 99999-9999.";
  if (!BLOCOS.includes(input.bloco)) errors.bloco = "Selecione o bloco.";
  if (!/^\d{1,4}$/.test(input.apartamento.trim())) errors.apartamento = "Informe o número do apartamento (somente números).";
  if (input.data < todayKey()) errors.data = "Escolha uma data a partir de hoje.";
  else if (atuais.some((e) => e.telefone === input.telefone && e.data === input.data)) {
    errors.data = "Você já está na lista de espera desse dia.";
  }
  return errors;
}

/** Mensagem para o administrador avisar que o dia ficou livre. */
export function mensagemEspera(e: Espera): string {
  const nome = e.nome.trim().split(/\s+/)[0] || e.nome;
  const link = SITE_URL ? ` Para reservar: ${SITE_URL}` : "";
  return `Olá, ${nome}! Aqui é a administração do ${CONDOMINIO.nome}. O salão de festas ficou livre em ${formatDateShort(e.data)}, o dia que você queria.${link} Quem reservar primeiro garante a data.`;
}
