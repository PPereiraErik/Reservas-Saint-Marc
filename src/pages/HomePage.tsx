import { BuildingIllustration } from "../components/BuildingIllustration";
import { Calendar } from "../components/Calendar";
import { EventoArte, EventoDecor } from "../components/Evento";
import { LoadingState } from "../components/Feedback";
import { RegrasSalao } from "../components/RegrasSalao";
import { CONDOMINIO, FOTO_CREDITO, FOTO_DESTAQUE, MAX_DIAS_SEGUIDOS } from "../config";
import { useReservations } from "../hooks/useReservations";
import { navigate } from "../hooks/useRoute";
import { addDays, formatDateCompact, todayKey } from "../utils/date";
import { dayAvailability } from "../utils/rules";
import type { Reservation } from "../types";

/** Próximos dias sem nenhuma reserva ativa. */
function nextFreeDays(reservas: Reservation[], amount: number): string[] {
  const livres: string[] = [];
  let dia = addDays(todayKey(), 1);
  for (let i = 0; i < 60 && livres.length < amount; i++) {
    if (dayAvailability(reservas, dia) === "livre") livres.push(dia);
    dia = addDays(dia, 1);
  }
  return livres;
}

export function HomePage() {
  const { ocupacao: reservas, state } = useReservations();
  const livres = state === "ready" ? nextFreeDays(reservas, 4) : [];

  return (
    <div className="home">
      <section className="hero">
        <div className="hero__text">
          <EventoArte lado="esq" />
          <h1 className="hero__title">
            Reserve o salão de festas do {CONDOMINIO.nome}
            <EventoArte lado="esq" ancora="titulo" />
          </h1>
          <p className="hero__lead">Escolha o dia e o período. Leva menos de dois minutos.</p>

          <a href="#/reservar" className="button button--primary button--lg">
            Reservar o salão
            <EventoArte lado="esq" ancora="botao" />
          </a>

          <div className="quick-dates">
            <p className="quick-dates__label">Próximos dias livres</p>
            {state === "loading" ? (
              <p className="muted small">Carregando...</p>
            ) : (
              <div className="quick-dates__box">
                <EventoArte lado="esq" ancora="datas" />
              <ul className="quick-dates__list">
                {livres.map((dia) => (
                  <li key={dia}>
                    <a href={`#/reservar?data=${dia}`} className="date-pill">
                      {formatDateCompact(dia)}
                    </a>
                  </li>
                ))}
              </ul>
              </div>
            )}
          </div>
        </div>

        <div className="hero__mediabox">
        <figure className="hero__media">
          {FOTO_DESTAQUE ? (
            <img src={FOTO_DESTAQUE} alt={`Salão de festas do ${CONDOMINIO.nome}`} className="hero__photo" />
          ) : (
            <BuildingIllustration />
          )}
          <EventoDecor />
          {FOTO_DESTAQUE && FOTO_CREDITO && <figcaption className="hero__credit">{FOTO_CREDITO}</figcaption>}
        </figure>
        <EventoArte lado="dir" />
        </div>
      </section>

      <section id="disponibilidade" className="section" aria-labelledby="titulo-disponibilidade">
        <h2 id="titulo-disponibilidade" className="section__title">
          Disponibilidade
        </h2>
        <p className="section__text">
          Dias com um ponto já têm parte do horário reservada. Toque em um dia para ver os detalhes e reservar.
        </p>
        <div className="card">
          {state === "loading" ? (
            <LoadingState />
          ) : (
            <Calendar
              compact
              mode="public"
              reservas={reservas}
              onSelectDate={(data) => navigate("/reservar", { data })}
            />
          )}
        </div>
      </section>

      <p className="home__note">
        Para moradores do {CONDOMINIO.blocos.join(" e ")}. Até {MAX_DIAS_SEGUIDOS} dias seguidos. O calendário mostra só a
        disponibilidade, nunca nomes ou telefones.
      </p>

      <details className="card regras-home">
        <summary>Regras do salão</summary>
        <RegrasSalao />
      </details>
    </div>
  );
}
