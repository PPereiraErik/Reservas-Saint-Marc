import type { Reservation } from "../types";
import { baixarIcs, googleAgendaLink } from "../utils/agenda";
import { Icon } from "./Icon";

/** Botões para guardar a data da reserva na agenda do celular. */
export function AgendaBotoes({ reserva }: { reserva: Reservation }) {
  return (
    <div className="agenda">
      <p className="agenda__titulo">Guardar na agenda</p>
      <div className="agenda__botoes">
        <button type="button" className="button button--secondary" onClick={() => baixarIcs(reserva)}>
          <Icon name="calendarCheck" size={18} /> Agenda do celular
        </button>
        <a className="button button--secondary" href={googleAgendaLink(reserva)} target="_blank" rel="noopener noreferrer">
          <Icon name="calendar" size={18} /> Google Agenda
        </a>
      </div>
    </div>
  );
}
