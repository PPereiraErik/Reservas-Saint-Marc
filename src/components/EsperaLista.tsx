import { useState } from "react";
import { useReservations } from "../hooks/useReservations";
import type { Espera } from "../types";
import { formatDateShort } from "../utils/date";
import { friendlyError } from "../utils/errors";
import { mensagemEspera } from "../utils/espera";
import { whatsappLink } from "../utils/phone";
import { Icon } from "./Icon";
import { useToast } from "./Toast";

/** Pessoas esperando um dia liberar: o administrador avisa pelo WhatsApp e tira da fila. */
export function EsperaLista({ itens, titulo }: { itens: Espera[]; titulo: string }) {
  const { removeEspera } = useReservations();
  const toast = useToast();
  const [ocupado, setOcupado] = useState<string | null>(null);
  if (itens.length === 0) return null;

  const remover = async (id: string) => {
    setOcupado(id);
    try {
      await removeEspera(id);
      toast("success", "Removido da lista de espera.");
    } catch (error) {
      toast("error", friendlyError(error, "Não foi possível remover. Tente novamente."));
    } finally {
      setOcupado(null);
    }
  };

  return (
    <section className="espera" aria-label={titulo}>
      <h3 className="espera__titulo">{titulo}</h3>
      <ul className="espera__lista">
        {itens.map((e) => (
          <li key={e.id} className="espera__item">
            <div className="espera__info">
              <strong>{e.nome}</strong>
              <span className="muted">
                Apto {e.apartamento}, {e.bloco} · {formatDateShort(e.data)}
              </span>
            </div>
            <div className="espera__acoes">
              <a className="button button--secondary button--sm" href={whatsappLink(e.telefone, mensagemEspera(e))} target="_blank" rel="noopener noreferrer">
                <Icon name="message" size={16} /> Avisar que liberou
              </a>
              <button type="button" className="button button--ghost button--sm" disabled={ocupado === e.id} onClick={() => remover(e.id)}>
                <Icon name="x" size={16} /> Remover
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
