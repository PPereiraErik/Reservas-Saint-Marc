import { AVISO_EXTRA, CONDOMINIO } from "../config";
import type { Reservation, ReservationStatus } from "../types";
import { googleAgendaLink } from "./agenda";
import { describeDatesShort, describeTime } from "./rules";

/** Primeiro nome do responsável, para a mensagem soar pessoal. */
export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] || nome;
}

/**
 * Mensagem pronta para o administrador avisar o morador (WhatsApp ou copiada).
 * `status` permite montar o texto logo após a ação, antes da tela atualizar.
 */
export function mensagemAviso(reserva: Reservation, status: ReservationStatus = reserva.status): string {
  const quando = `${describeDatesShort(reserva)} (${describeTime(reserva)})`;
  const abertura = `Olá, ${primeiroNome(reserva.nome)}! Aqui é a administração do ${CONDOMINIO.nome}.`;
  const assunto = `Sua reserva do salão de festas em ${quando}`;
  const extra = AVISO_EXTRA ? ` ${AVISO_EXTRA}` : "";
  switch (status) {
    case "aprovada":
      return `${abertura} ${assunto} foi aprovada.${extra} Para guardar na agenda: ${googleAgendaLink({ ...reserva, status })}`;
    case "rejeitada":
      return `${abertura} ${assunto} não pôde ser aprovada. Podemos combinar outra data?`;
    case "cancelada":
      return `${abertura} ${assunto} foi cancelada. Qualquer dúvida, é só responder esta mensagem.`;
    default:
      return `${abertura} Recebemos o pedido de reserva do salão de festas em ${quando} e estamos analisando.`;
  }
}
