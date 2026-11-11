import { useState } from "react";
import { useReservations } from "../hooks/useReservations";
import type { Reservation, ReservationStatus } from "../types";
import { formatDuration, formatRelative, timeToMinutes } from "../utils/date";
import { friendlyError } from "../utils/errors";
import { mensagemAviso, primeiroNome } from "../utils/mensagens";
import { phoneLink, whatsappLink } from "../utils/phone";
import { coversDay, describeDates, describeDatesShort, describeTime, isMultiDay } from "../utils/rules";
import { EsperaLista } from "./EsperaLista";
import { Icon } from "./Icon";
import { StatusBadge } from "./StatusBadge";
import { useToast } from "./Toast";

const SUCCESS_TEXT: Record<Exclude<ReservationStatus, "pendente">, string> = {
  aprovada: "Reserva aprovada.",
  rejeitada: "Reserva rejeitada.",
  cancelada: "Reserva cancelada.",
};

/** Conteúdo do modal de detalhes, com as ações do administrador. */
export function ReservationDetails({
  reserva,
  onClose,
  avisarInicial = null,
}: {
  reserva: Reservation;
  onClose: () => void;
  avisarInicial?: Exclude<ReservationStatus, "pendente"> | null;
}) {
  const { setStatus, remove, espera } = useReservations();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  /** Ação recém-feita: mostra o convite para avisar o morador. */
  const [avisar, setAvisar] = useState<Exclude<ReservationStatus, "pendente"> | null>(avisarInicial);

  const run = async (action: () => Promise<void>, success: string, closeAfter = false) => {
    setBusy(true);
    try {
      await action();
      toast("success", success);
      if (closeAfter) onClose();
    } catch (error) {
      toast("error", friendlyError(error, "Não foi possível concluir a ação. Tente novamente."));
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (status: Exclude<ReservationStatus, "pendente">) => {
    setAvisar(null);
    setBusy(true);
    try {
      await setStatus(reserva.id, status);
      toast("success", SUCCESS_TEXT[status]);
      setAvisar(status);
    } catch (error) {
      toast("error", friendlyError(error, "Não foi possível concluir a ação. Tente novamente."));
    } finally {
      setBusy(false);
    }
  };

  const copiarMensagem = async (texto: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      toast("success", "Mensagem copiada.");
    } catch {
      toast("error", "Não foi possível copiar. Use o botão do WhatsApp.");
    }
  };

  // Se o dia liberou (cancelada/rejeitada), mostra quem estava esperando.
  const aguardando = reserva.status === "cancelada" || reserva.status === "rejeitada" ? espera.filter((e) => coversDay(reserva, e.data)) : [];

  const duracao = timeToMinutes(reserva.fim) - timeToMinutes(reserva.inicio);

  return (
    <div className="details">
      <div className="details__status">
        <StatusBadge status={reserva.status} />
        <span className="muted">Solicitada {formatRelative(reserva.criadaEm)}</span>
      </div>

      {avisar && (
        <div className="notice notice--info aviso" role="status">
          <Icon name="message" size={18} />
          <div>
            <p className="notice__title">Avise {primeiroNome(reserva.nome)} agora</p>
            <p className="aviso__texto">{mensagemAviso(reserva, avisar)}</p>
            <div className="button-row">
              <a
                className="button button--primary"
                href={whatsappLink(reserva.telefone, mensagemAviso(reserva, avisar))}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="message" size={18} /> Enviar no WhatsApp
              </a>
              <button type="button" className="button button--secondary" onClick={() => copiarMensagem(mensagemAviso(reserva, avisar))}>
                Copiar mensagem
              </button>
              <button type="button" className="button button--secondary" onClick={() => setAvisar(null)}>
                Agora não
              </button>
            </div>
          </div>
        </div>
      )}

      <EsperaLista itens={aguardando} titulo="Na lista de espera para este dia" />

      <dl className="summary">
        <dt>Responsável</dt>
        <dd>{reserva.nome}</dd>
        <dt>Unidade</dt>
        <dd>
          Apto {reserva.apartamento}, {reserva.bloco}
        </dd>
        <dt>Data</dt>
        <dd>{describeDates(reserva, true)}</dd>
        <dt>Horário</dt>
        <dd>
          {isMultiDay(reserva)
            ? `Dia todo, das ${reserva.inicio} às ${reserva.fim} em cada dia`
            : `${describeTime(reserva)} (${formatDuration(duracao)})`}
        </dd>
        <dt>Telefone</dt>
        <dd>
          <a className="link" href={phoneLink(reserva.telefone)}>
            {reserva.telefone}
          </a>
        </dd>
        {reserva.observacoes && (
          <>
            <dt>Observações</dt>
            <dd>{reserva.observacoes}</dd>
          </>
        )}
      </dl>

      {confirmDelete ? (
        <div className="notice notice--danger" role="alert">
          <Icon name="alert" size={18} />
          <div>
            <p className="notice__title">Excluir esta reserva?</p>
            <p>
              A reserva de {reserva.nome} para {describeDatesShort(reserva)} será removida
              permanentemente.
            </p>
            <div className="button-row">
              <button
                type="button"
                className="button button--danger"
                disabled={busy}
                onClick={() => run(() => remove(reserva.id), "Reserva excluída.", true)}
              >
                Sim, excluir
              </button>
              <button type="button" className="button button--secondary" onClick={() => setConfirmDelete(false)}>
                Voltar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="details__actions">
          <a className="button button--secondary" href={phoneLink(reserva.telefone)}>
            <Icon name="phone" size={18} /> Ligar
          </a>
          <a
            className="button button--secondary"
            href={whatsappLink(reserva.telefone, mensagemAviso(reserva))}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="message" size={18} /> WhatsApp
          </a>
          {(reserva.status === "pendente" || reserva.status === "rejeitada") && (
            <button type="button" className="button button--success" disabled={busy} onClick={() => changeStatus("aprovada")}>
              <Icon name="check" size={18} /> Aprovar
            </button>
          )}
          {reserva.status === "pendente" && (
            <button type="button" className="button button--secondary" disabled={busy} onClick={() => changeStatus("rejeitada")}>
              <Icon name="x" size={18} /> Rejeitar
            </button>
          )}
          {reserva.status === "aprovada" && (
            <button type="button" className="button button--secondary" disabled={busy} onClick={() => changeStatus("cancelada")}>
              <Icon name="ban" size={18} /> Cancelar reserva
            </button>
          )}
          <button type="button" className="button button--ghost-danger" disabled={busy} onClick={() => setConfirmDelete(true)}>
            <Icon name="trash" size={18} /> Excluir
          </button>
        </div>
      )}
    </div>
  );
}
